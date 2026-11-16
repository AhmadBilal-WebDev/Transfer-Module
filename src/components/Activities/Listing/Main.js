'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaMapMarkerAlt, FaStar, FaCalendarAlt, FaCompass, FaCheck, FaUsers } from "react-icons/fa";
import { useJsApiLoader } from "@react-google-maps/api";
import { IoLocationSharp, IoTimeOutline } from "react-icons/io5";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import moment from "moment";
import {
  buildActivityDetailHref,
  getListingParamsFromSearchParams,
} from "@/util/activityListingParams";
import { DatePicker } from '@mantine/dates';
import { notifications } from "@mantine/notifications";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";
import FilterSection from "./FilterSection";
import styles from "./Activities.module.css";
import ActivityLoader from "./ActivityLoader";

const GOOGLE_MAPS_LIBRARIES = ['places'];

const slugifyCity = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

const parseCountryFromSecondary = (secondaryText) => {
  if (!secondaryText) return '';
  const parts = secondaryText.split(',');
  return parts[parts.length - 1].trim();
};

const humanizeSlug = (slug) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatActivityType = (type) =>
  type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Experience';

const getGroupSizeLabel = (item) => {
  const max =
    item?.max_pax ||
    item?.group_size ||
    item?.max_participants ||
    item?.capacity ||
    item?.max_guests;
  if (!max) return null;
  const n = Number(max);
  if (!n || Number.isNaN(n)) return null;
  return `Up to ${n} guest${n !== 1 ? 's' : ''}`;
};

const parseCancellationPolicy = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  return { plainText: trimmed };
};

const formatPolicyHours = (hours) => {
  const value = Number(hours);
  if (!value || Number.isNaN(value)) return null;
  if (value >= 24 && value % 24 === 0) {
    const days = value / 24;
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  return `${value} hour${value !== 1 ? 's' : ''}`;
};

const getCancellationLabel = (item, travelDate) => {
  const structured =
    parseCancellationPolicy(item?.cancellation_policy) ||
    parseCancellationPolicy(item?.cancellation_policy_text);

  if (structured?.plainText) return structured.plainText;

  // Human-readable text only when there is no structured policy object
  if (
    !structured &&
    typeof item?.cancellation_policy_text === 'string' &&
    !item.cancellation_policy_text.trim().startsWith('{') &&
    !item.cancellation_policy_text.trim().startsWith('[')
  ) {
    return item.cancellation_policy_text;
  }

  if (!structured) {
    if (item?.is_refundable || item?.cancel_policy === 'refundable') {
      return 'Free cancellation';
    }
    return 'Non-refundable';
  }

  const cancelPolicy = structured.cancel_policy;
  const policies = Array.isArray(structured.cancellation_policies)
    ? structured.cancellation_policies
    : [];

  if (cancelPolicy === 'non-refundable') {
    return 'Non-refundable';
  }

  if (cancelPolicy !== 'refundable') {
    return 'Non-refundable';
  }

  // Refundable with no tier details
  if (policies.length === 0) {
    return 'Free cancellation';
  }

  const sorted = [...policies].sort(
    (a, b) => Number(b.time_duration || 0) - Number(a.time_duration || 0)
  );

  const formatChargeLabel = (policy) => {
    if (!policy) return 'Non-refundable';
    if (policy.type === 'percentage') {
      const pct = Number(policy.value);
      if (pct === 0) {
        const timeText = formatPolicyHours(policy.time_duration);
        return timeText
          ? `Free cancellation`
          : 'Free cancellation';
      }
      if (pct >= 100) return 'Non-refundable';
      return `${pct}% cancellation fee`;
    }
    if (policy.type === 'fixed') {
      return 'Cancellation fee applies';
    }
    return 'Non-refundable';
  };

  // Pick the policy that applies right now based on hours until the travel date
  const activityMoment = travelDate ? moment(travelDate).startOf('day') : null;
  if (activityMoment?.isValid()) {
    const hoursUntil = activityMoment.diff(moment(), 'hours', true);

    // Still inside a free-cancel window (0% and enough time left)
    const freePolicy = sorted.find(
      (p) => p.type === 'percentage' && Number(p.value) === 0
    );
    if (freePolicy && hoursUntil >= Number(freePolicy.time_duration || 0)) {
      return formatChargeLabel(freePolicy);
    }

    // Free window has ended (or never existed) — use the active charged tier
    const stillOpen = sorted.filter(
      (p) => hoursUntil >= Number(p.time_duration || 0)
    );
    const active =
      stillOpen.length > 0
        ? stillOpen[stillOpen.length - 1]
        : sorted[sorted.length - 1];

    return formatChargeLabel(active);
  }

  // No travel date yet — prefer free-cancel tier if backend provides one
  const freePolicy = sorted.find(
    (p) => p.type === 'percentage' && Number(p.value) === 0
  );
  if (freePolicy) {
    return formatChargeLabel(freePolicy);
  }

  return formatChargeLabel(sorted[0]);
};

function SuggestionThumbnail({ label, photoUrl }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={styles.suggestionThumbnailWrap}>
      <div className={styles.suggestionThumbnailFallback}>
        {label ? label.charAt(0) : <FaMapMarkerAlt size={16} />}
      </div>
      {photoUrl && !failed && (
        <img
          src={photoUrl}
          alt={label}
          className={`${styles.suggestionThumbnail} ${styles.suggestionThumbnailLoaded} ${loaded ? styles.suggestionThumbnailVisible : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Main() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const { currency, rates } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [activityList, setActivityList] = useState([]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const calendarRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const latestQueryRef = useRef('');
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const fetchedPhotosRef = useRef(new Set());
  const [googlePredictions, setGooglePredictions] = useState([]);
  const [photoCache, setPhotoCache] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Dynamic destinations from API
  const [destinations, setDestinations] = useState([]);

  // Fetch destinations from API
  useEffect(() => {
    GetDestinations();
  }, []);

  const GetDestinations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/destinations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.Success === true) {
        const NewList = data.Content.destinations
          .filter(item => item.city !== null)
          .map(item => ({
            id: item.id,
            value: item.city_slug,
            label: item.city,
            country: item.country,
            source: 'api',
          }));

        const uniqueList = [
          ...new Map(NewList.map((item) => [item.value, item])).values(),
        ];
        setDestinations(uniqueList);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      setDestinations([]);
    }
  }

  useEffect(() => {
    const citySlug = searchParams.get('city');
    const countryParam = searchParams.get('country');
    const dateParam = searchParams.get('date');

    if (dateParam) {
      const parsedDate = moment(dateParam, 'YYYY-MM-DD').toDate();
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setCalendarViewDate(parsedDate);
      }
    }

    if (citySlug) {
      const matchedDest = destinations.find((dest) => dest.value === citySlug);
      const locationFromParams = matchedDest || {
        value: citySlug,
        label: humanizeSlug(citySlug),
        country: countryParam || '',
        source: 'url',
      };

      setSelectedLocation(locationFromParams);
      setSearchQuery(locationFromParams.label);
    } else {
      setSelectedLocation(null);
      setSearchQuery('');
    }
  }, [pathname, searchParams, destinations]);

  const listingParams = getListingParamsFromSearchParams(searchParams);
  const activeTravelDate =
    listingParams.date || moment(selectedDate).format('YYYY-MM-DD');
  const activeListingCity = listingParams.city || selectedLocation?.value || '';
  const activeListingCountry =
    listingParams.country || selectedLocation?.country || '';

  // Close calendar and search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isGoogleLoaded || !window.google?.maps?.places) return;
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );
  }, [isGoogleLoaded]);

  const fetchPlacePhoto = useCallback((placeId, query) => {
    if (!placesServiceRef.current || fetchedPhotosRef.current.has(placeId)) return;
    fetchedPhotosRef.current.add(placeId);

    placesServiceRef.current.getDetails(
      { placeId, fields: ['photos'] },
      (place, status) => {
        if (latestQueryRef.current !== query) return;
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) return;

        const photoUrl = place?.photos?.[0]?.getUrl({ maxWidth: 96 });
        if (photoUrl) {
          setPhotoCache((prev) => ({ ...prev, [placeId]: photoUrl }));
        }
      }
    );
  }, []);

  const searchGooglePlaces = useCallback((query) => {
    if (!query || query.length < 2) {
      setGooglePredictions([]);
      return;
    }

    if (!isGoogleLoaded || !autocompleteServiceRef.current) return;

    latestQueryRef.current = query;
    setIsGoogleLoading(true);

    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, types: ['(regions)'] },
      (predictions, status) => {
        if (latestQueryRef.current !== query) return;

        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
          const limited = predictions.slice(0, 5);
          setGooglePredictions(limited);
          limited.slice(0, 4).forEach((prediction) => {
            fetchPlacePhoto(prediction.place_id, query);
          });
        } else {
          setGooglePredictions([]);
        }

        if (latestQueryRef.current === query) {
          setIsGoogleLoading(false);
        }
      }
    );
  }, [isGoogleLoaded, fetchPlacePhoto]);

  // Filter destinations based on search query (only filter when user is actively typing, not when a location is already selected)
  const isActivelyTyping = searchQuery.trim() && searchQuery !== selectedLocation?.label;
  const filteredDestinations = isActivelyTyping
    ? destinations.filter(destination =>
      destination.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (destination.country && destination.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : destinations;

  const hasGoogleResults = isActivelyTyping && googlePredictions.length > 0;
  const hasLocalResults = filteredDestinations.length > 0;
  const showNoResults = isActivelyTyping && !isGoogleLoading && !hasGoogleResults && !hasLocalResults;

  const handleSearchSelect = (destination) => {
    setSearchQuery(destination.label);
    setSelectedLocation(destination);
    setShowSearchDropdown(false);
    setGooglePredictions([]);
  };

  const handleGoogleSelect = (prediction) => {
    const mainText = prediction.structured_formatting?.main_text || prediction.description;
    const secondaryText = prediction.structured_formatting?.secondary_text || '';
    const country = parseCountryFromSecondary(secondaryText) || secondaryText;

    const matched = destinations.find(
      (d) => d.label.toLowerCase() === mainText.toLowerCase()
    );

    handleSearchSelect({
      id: prediction.place_id,
      value: matched?.value || slugifyCity(mainText),
      label: mainText,
      country,
      source: 'google',
      placeId: prediction.place_id,
      photoUrl: photoCache[prediction.place_id],
    });
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (selectedLocation && value !== selectedLocation.label) {
      setSelectedLocation(null);
    }
    setShowSearchDropdown(true);
  };

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (isActivelyTyping) {
      searchTimeout.current = setTimeout(() => {
        searchGooglePlaces(searchQuery);
      }, 150);
    } else {
      setGooglePredictions([]);
      setIsGoogleLoading(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, isActivelyTyping, searchGooglePlaces]);

  const renderDestinationItem = (destination, isSelected = false) => {
    if (selectedLocation && !isSelected && selectedLocation.value === destination.value) return null;

    return (
      <li
        key={`${destination.source || 'api'}-${destination.value}`}
        className={`${styles.suggestionItem} ${isSelected ? styles.selectedItem : ''}`}
        onClick={() => handleSearchSelect(destination)}
      >
        <SuggestionThumbnail label={destination.label} photoUrl={destination.photoUrl} />
        <div className={styles.suggestionContent}>
          <span className={styles.suggestionTitle}>{destination.label}</span>
          <span className={styles.suggestionCategory}>{destination.country}</span>
        </div>
        {isSelected && <span className={styles.selectedBadge}>Selected</span>}
      </li>
    );
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCalendarViewDate(date);
    setShowCalendar(false);
  };

  const handleFindActivities = () => {
    if (!selectedLocation) {
      notifications.show({
        title: 'Error',
        message: 'Please select a city',
        color: 'red',
      });
      setShowSearchDropdown(true);
      return;
    }
    if (!selectedDate) {
      notifications.show({
        title: 'Error',
        message: 'Please select a date',
        color: 'red',
      });
      setShowCalendar(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('city', selectedLocation.value);
    if (selectedLocation.country) {
      params.set('country', selectedLocation.country);
    } else {
      params.delete('country');
    }
    params.set('date', moment(selectedDate).format('YYYY-MM-DD'));
    router.push(`?${params.toString()}`);
  };



  useEffect(() => {
    async function getActivities() {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/search?${searchParams}`,
          {
            cache: 'no-store',
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        const response = await res.json();
        setIsLoading(false)
        if (response.Success) {
          setActivityList(response?.Content?.activities)
        }
      } catch (error) {
        setIsLoading(false)
        console.log(error)
      }
    }
    getActivities();
  }, [searchParams]);

  // Calculate min and max price dynamically from listing and convert to display currency
  const { minPrice, maxPrice, originalCurrency, displayCurrency } = React.useMemo(() => {
    if (!activityList || activityList.length === 0) {
      return { minPrice: 0, maxPrice: 1000, originalCurrency: 'GBP', displayCurrency: currency };
    }

    const prices = activityList.map(activity => Number(activity.sale_price || 0)).filter(p => p > 0);
    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 1000, originalCurrency: 'GBP', displayCurrency: currency };
    }

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    const activityCurrency = activityList[0]?.currency_code || 'GBP';

    // Try to convert to display currency
    try {
      // Skip conversion if selected currency is same as activity currency
      if (currency === activityCurrency) {
        return {
          minPrice: min,
          maxPrice: max,
          originalCurrency: activityCurrency,
          displayCurrency: activityCurrency
        };
      }

      const { newprice: convertedMin } = ConvertPrice(min, activityCurrency, currency, rates);
      const { newprice: convertedMax } = ConvertPrice(max, activityCurrency, currency, rates);

      // Check if conversion was successful and actually changed the value
      const minConverted = Number(convertedMin);
      const maxConverted = Number(convertedMax);

      // Conversion is valid if:
      // 1. Numbers are valid
      // 2. Both are positive
      // 3. Values actually changed (not same as original, allowing 1% difference)
      const minChanged = Math.abs(minConverted - min) > (min * 0.01);
      const maxChanged = Math.abs(maxConverted - max) > (max * 0.01);

      if (!isNaN(minConverted) && !isNaN(maxConverted) &&
        minConverted > 0 && maxConverted > 0 &&
        (minChanged || maxChanged)) {
        // Conversion successful and values changed
        return {
          minPrice: Math.floor(minConverted),
          maxPrice: Math.ceil(maxConverted),
          originalCurrency: activityCurrency,
          displayCurrency: currency
        };
      }
    } catch (error) {
      console.warn('Currency conversion failed, using original currency:', error);
    }

    // If conversion fails, use original currency
    return {
      minPrice: min,
      maxPrice: max,
      originalCurrency: activityCurrency,
      displayCurrency: activityCurrency
    };
  }, [activityList, currency, rates]);

  // Set initial price range when activities load or currency changes
  React.useEffect(() => {
    if (activityList.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [activityList, minPrice, maxPrice, displayCurrency]);

  const getDisplayPrice = React.useCallback((activity) => {
    const activityCurrency = activity.currency_code || 'GBP';
    const activityPrice = Number(activity.sale_price || 0);
    if (activityPrice <= 0) return 0;

    let price = activityPrice;
    try {
      if (displayCurrency !== activityCurrency) {
        const { newprice: convertedPrice } = ConvertPrice(activityPrice, activityCurrency, displayCurrency, rates);
        const converted = Number(convertedPrice);
        const valueChanged = Math.abs(converted - activityPrice) > (activityPrice * 0.01);

        if (!isNaN(converted) && converted > 0 && valueChanged) {
          price = converted;
        }
      }
    } catch (error) {
      console.warn('Price conversion failed:', error);
    }

    return price;
  }, [displayCurrency, rates]);

  // Apply filters to activity list
  const filteredActivities = React.useMemo(() => {
    if (!activityList || activityList.length === 0) return [];

    const filtered = activityList.filter(activity => {
      const price = getDisplayPrice(activity);

      // Price range filter - compare converted prices
      if (price > 0 && (price < priceRange[0] || price > priceRange[1])) {
        return false;
      }

      // Duration filters (dynamic values from API)
      if (activeFilters.length > 0) {
        const durationFilters = activeFilters
          .filter((filter) => filter.startsWith('duration_'))
          .map((filter) => filter.replace('duration_', ''));

        if (durationFilters.length > 0) {
          const activityDuration = activity.activity_duration?.trim() || '';
          if (!durationFilters.includes(activityDuration)) return false;
        }
      }

      return true;
    });

    if (sortBy === 'price_low') {
      return [...filtered].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
    }

    if (sortBy === 'price_high') {
      return [...filtered].sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
    }

    return filtered;
  }, [activityList, priceRange, activeFilters, sortBy, getDisplayPrice]);

  return (
    <>
      {/* Show loader while loading */}
      {isLoading && <ActivityLoader />}

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroIntro}>
            <span className={styles.heroBadge}>
              <FaCompass size={12} aria-hidden="true" />
              Immersive Excursions
            </span>
            <h1 className={styles.heroTitle}>Uncover Extraordinary Experiences</h1>
            <p className={styles.heroSubtitle}>
              Deepen your journey with private access, masterclasses, and hidden heritage trails tailored to your specific travel aesthetic.
            </p>
          </div>

          <div className={styles.heroSearch}>
            <div className={styles.searchBar}>
              <div className={styles.fieldsRow}>
                <div className={styles.listingField}>
                  <div className={styles.fieldIcon} aria-hidden="true">
                    <FaMapMarkerAlt />
                  </div>
                  <div className={styles.fieldBody} ref={searchRef}>
                    <span className={styles.fieldLabel}>Location</span>
                    <div className={styles.searchInputWrapper}>
                      <input
                        type="text"
                        placeholder="Where like to escape?"
                        className={styles.searchInput}
                        value={searchQuery}
                        autoComplete="off"
                        onChange={handleSearchInputChange}
                        onFocus={() => setShowSearchDropdown(true)}
                      />
                      {selectedLocation && (
                        <button
                          className={styles.clearButton}
                          onClick={() => {
                            setSelectedLocation(null);
                            setSearchQuery('');
                            setGooglePredictions([]);
                          }}
                          title="Clear selection"
                          type="button"
                        >
                          ✕
                        </button>
                      )}
                      {showSearchDropdown && (
                        <div className={`${styles.searchDropdown} activity-search-dropdown`}>
                          <div className={styles.searchDropdownHeader}>
                            <span>
                              {selectedLocation && !isActivelyTyping
                                ? 'Selected Location'
                                : isActivelyTyping
                                  ? (isGoogleLoading ? 'Searching...' : 'Search Results')
                                  : 'Popular Destinations'}
                            </span>
                          </div>
                          <ul className={styles.suggestionsList}>
                            {selectedLocation && !isActivelyTyping && (
                              <>
                                {renderDestinationItem(selectedLocation, true)}
                                {hasLocalResults && (
                                  <div className={styles.divider}>
                                    <span>Other Destinations</span>
                                  </div>
                                )}
                              </>
                            )}

                            {isActivelyTyping && hasLocalResults && (
                              <>
                                <li className={styles.searchSectionLabel}>Our Destinations</li>
                                {filteredDestinations.map((destination) =>
                                  renderDestinationItem(destination)
                                )}
                              </>
                            )}

                            {hasGoogleResults && (
                              <>
                                <li className={styles.searchSectionLabel}>
                                  {isGoogleLoading ? '...' : ''}
                                </li>
                                {googlePredictions.map((prediction) => {
                                  const mainText = prediction.structured_formatting?.main_text || prediction.description;
                                  const secondaryText = prediction.structured_formatting?.secondary_text || '';

                                  return (
                                    <li
                                      key={prediction.place_id}
                                      className={styles.suggestionItem}
                                      onClick={() => handleGoogleSelect(prediction)}
                                    >
                                      <SuggestionThumbnail
                                        label={mainText}
                                        photoUrl={photoCache[prediction.place_id]}
                                      />
                                      <div className={styles.suggestionContent}>
                                        <span className={styles.suggestionTitle}>{mainText}</span>
                                        <span className={styles.suggestionCategory}>{secondaryText}</span>
                                      </div>
                                    </li>
                                  );
                                })}
                              </>
                            )}

                            {isActivelyTyping && !hasLocalResults && isGoogleLoading && !hasGoogleResults && (
                              <li className={styles.loadingSuggestions}>Searching locations...</li>
                            )}

                            {showNoResults && (
                              <div className={styles.noResults}>
                                <p>No destinations found for &quot;{searchQuery}&quot;</p>
                                <small>Try a different city or country name</small>
                              </div>
                            )}

                            {!isActivelyTyping && filteredDestinations.map((destination) =>
                              renderDestinationItem(destination)
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.listingField}>
                  <div className={styles.fieldIcon} aria-hidden="true">
                    <FaCalendarAlt />
                  </div>
                  <div className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Travel Date</span>
                    <div className={styles.datePickerWrapper} ref={calendarRef}>
                      <button
                        type="button"
                        className={styles.datePickerButton}
                        onClick={() => {
                          if (!showCalendar) {
                            setCalendarViewDate(selectedDate);
                          }
                          setShowCalendar(!showCalendar);
                        }}
                      >
                        {moment(selectedDate).format('MMM DD, YYYY')}
                      </button>
                      {showCalendar && (
                        <div className={styles.calendarPopup}>
                          <div className={styles.calendarHeader}>
                            <h5 className={styles.calendarSelectedDate}>
                              WHEN ARE YOU GOING?
                            </h5>
                          </div>
                          <DatePicker
                            value={selectedDate}
                            date={calendarViewDate}
                            onDateChange={setCalendarViewDate}
                            onChange={(date) => {
                              handleDateChange(date);
                            }}
                            minDate={new Date()}
                            styles={{
                              calendarHeader: {
                                maxWidth: '100%',
                              },
                              day: {
                                borderRadius: '50%',
                                height: '40px',
                                fontSize: '14px',
                              },
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.searchBtn}
                onClick={handleFindActivities}
              >
                <FaSearch /> Find Activities
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className={`${styles.resultsSection} ${styles.listingResults}`}>
        <div className="container">
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderText}>
              <h2 className={styles.resultsTitle}>
                {selectedLocation?.label
                  ? `Activities in ${selectedLocation.label}`
                  : searchParams.get('city')
                    ? `Activities in ${humanizeSlug(searchParams.get('city'))}`
                    : 'Activities'}
              </h2>
              <p className={styles.resultsMeta}>
                {isLoading
                  ? 'Searching experiences…'
                  : (
                    <>
                      <strong>{filteredActivities.length}</strong> curated experience{filteredActivities.length !== 1 ? 's' : ''}
                      {filteredActivities.length !== activityList.length && (
                        <span className={styles.resultsMetaMuted}>
                          {' '}(from {activityList.length})
                        </span>
                      )}
                      {selectedDate && (
                        <span> · {moment(activeTravelDate).format('MMM DD, YYYY')}</span>
                      )}
                    </>
                  )}
              </p>
            </div>
          </div>

          <div className={styles.activitiesLayout}>
            {/* Filter Sidebar */}
            {!isLoading && (
              <FilterSection
                activityList={activityList}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                activeFilters={activeFilters}
                setActiveFilters={setActiveFilters}
                currency={displayCurrency}
                minPrice={minPrice}
                maxPrice={maxPrice}
                rates={rates}
                ConvertPrice={ConvertPrice}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            )}

            <div className={styles.activitiesMain}>
              {isLoading ? null : filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '16px' }}>
                    No experiences match your filters
                  </p>
                </div>
              ) : (
                <div className={styles.activitiesGrid}>
                  {filteredActivities.map((item, index) => {
                const locationText = [item.city, item.country].filter(Boolean).join(', ');
                const activityType = formatActivityType(item.type);
                const groupLabel = getGroupSizeLabel(item);
                const cancellationLabel = getCancellationLabel(item, activeTravelDate);
                const showFreeCancellation = cancellationLabel === 'Free cancellation';

                return (
                  <div className={styles.activityCard} key={item.id || item.slug || index}>
                    <div className={styles.cardImageWrap}>
                      <Image
                        src={item?.featured_image || item?.banner_image || '/images/placeholder.jpg'}
                        width={400}
                        height={300}
                        alt={item.title}
                        className={styles.cardImage}
                      />
                      {item.type && (
                        <span className={styles.cardTypeBadge}>{activityType}</span>
                      )}
                      {item.rating_stars && (
                        <span className={styles.cardRatingBadge}>
                          <FaStar />
                          {item.rating_stars}
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.cardActivityTitle} title={item.title}>{item.title}</h3>

                      {locationText && (
                        <div className={styles.locationRow} title={locationText}>
                          <IoLocationSharp className={styles.locationIcon} />
                          <span className={styles.locationText}>{locationText}</span>
                        </div>
                      )}

                      {(item.activity_duration || item.max_people) && (
                        <div className={styles.cardMetaRow}>
                          {item.activity_duration && (
                            <span className={styles.cardMetaItem}>
                              <IoTimeOutline className={styles.cardMetaIcon} />
                              {item.activity_duration}
                            </span>
                          )}
                          {item.max_people && (
                            <span className={styles.cardMetaItem}>
                              <FaUsers className={styles.cardMetaIcon} />
                              {item.max_people} guests
                            </span>
                          )}
                        </div>
                      )}

                      {showFreeCancellation && (
                        <p className={styles.cancellationRow}>
                          <FaCheck className={styles.cancellationIcon} aria-hidden="true" />
                          <span>Free cancellation</span>
                        </p>
                      )}

                      <div className={styles.cardFooter}>
                        <div className={styles.priceBlock}>
                          <span className={styles.cardPriceLabel}>From</span>
                          <p className={styles.cardPriceValue}>
                            <PriceDisplay price={item?.sale_price} currency={item?.currency_code} />
                            <span className={styles.cardPriceUnit}>/ guest</span>
                          </p>
                          <span className={styles.cardPriceNote}>Vat and Taxes included</span>
                        </div>

                        {item.provider && (
                          <Link
                            href={buildActivityDetailHref(item.slug, {
                              city: activeListingCity,
                              country: activeListingCountry,
                              date: activeTravelDate,
                            })}
                            className={styles.selectBtn}
                          >
                          View Details
                        </Link>
                        )}
                        {/* {item.provider !== 'hotelbeds' ? (
                          <Link href={`/activities/${item.slug}?from=${moment(selectedDate).format('YYYY-MM-DD')}&to=${moment(selectedDate).format('YYYY-MM-DD')}&language=en`} className={styles.selectBtn}>
                            View Details
                          </Link>
                        ) : (
                          <button disabled={true} className={styles.selectBtn}>
                            Coming Soon
                          </button>
                        )} */}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Main;