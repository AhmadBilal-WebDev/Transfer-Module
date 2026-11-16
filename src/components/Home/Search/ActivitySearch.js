'use client'
import React, { useEffect, useState, useRef, useCallback } from "react";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import moment from "moment";
import { FaCalendarAlt, FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import styles from "@/components/Activities/Listing/Activities.module.css";

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
};

export default function ActivitySearch() {
  const router = useRouter();
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const [formData, setFormData] = useState({ name: null, date: null });
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [googlePredictions, setGooglePredictions] = useState([]);
  const [photoCache, setPhotoCache] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const latestQueryRef = useRef('');
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const fetchedPhotosRef = useRef(new Set());

  const isActivelyTyping = searchQuery.trim() && searchQuery !== selectedLocation?.label;

  const handleDateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      date: value,
    }))
  }

  const handleSearchSelect = (destination) => {
    setSearchQuery(destination.label);
    setSelectedLocation(destination);
    setFormData((prev) => ({
      ...prev,
      name: destination.value,
    }))
    setShowSearchDropdown(false);
    setGooglePredictions([]);
  }

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
      setFormData((prev) => ({ ...prev, name: null }));
    }
    setShowSearchDropdown(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredDestinations = isActivelyTyping
    ? destinations.filter(destination =>
      destination.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (destination.country && destination.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : destinations;

  const hasGoogleResults = isActivelyTyping && googlePredictions.length > 0;
  const hasLocalResults = filteredDestinations.length > 0;
  const showNoResults = isActivelyTyping && !isGoogleLoading && !hasGoogleResults && !hasLocalResults;

  const HandleSubmit = () => {
    if (formData.name === null) {
      notifications.show({
        title: 'Error',
        message: 'Please select a city',
        color: 'red',
      });
      return;
    }
    if (formData.date === null) {
      notifications.show({
        title: 'Error',
        message: 'Please select a date',
        color: 'red',
      });
      return;
    }
    const queryParams = new URLSearchParams();
    queryParams.append('city', formData.name);
    queryParams.append('date', moment(formData.date).format('YYYY-MM-DD'));
    if (selectedLocation?.country) {
      queryParams.append('country', selectedLocation.country);
    }
    router.push(`/activities?${queryParams.toString()}`);
  }

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

  return (
    <div className="royalaneGrid">
      <div className="royalaneRow royalaneRowTransfer">
        <div className="royalaneField">
          <div className={`form-floating w-100 ${styles.searchInputWrapper}`} ref={searchRef}>
            <input
              type="text"
              className="form-control hotel-date-range"
              id="activityLocation"
              placeholder=" "
              value={searchQuery}
              autoComplete="off"
              onChange={handleSearchInputChange}
              onFocus={() => setShowSearchDropdown(true)}
              style={{ paddingLeft: '14px', paddingRight: '40px' }}
            />
            <label htmlFor="activityLocation" style={{ paddingLeft: '14px' }}>Location</label>
            {!selectedLocation && (
              <div className="royalaneFieldIconRight" aria-hidden="true">
                <FaSearch size={15} />
              </div>
            )}
            {selectedLocation && (
              <button
                className={styles.clearButton}
                onClick={() => {
                  setSelectedLocation(null);
                  setSearchQuery('');
                  setFormData((prev) => ({ ...prev, name: null }));
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

        <div className="royalaneField position-relative">
          <div className="d-flex align-items-center position-relative">
            <div className="form-floating w-100">
              <DateInput
                variant="unstyled"
                id="activityDate"
                onChange={handleDateChange}
                value={formData.date}
                onFocus={(e) => e.target.select()}
                className="form-control hotel-date-range"
                placeholder="Select Date"
                style={{ paddingLeft: '14px', paddingRight: '40px' }}
                minDate={new Date()}
              />
              <label htmlFor="activityDate" style={{ paddingLeft: '14px' }}>Date</label>
            </div>
            <div className="royalaneFieldIconRight" aria-hidden="true">
              <FaCalendarAlt size={15} />
            </div>
          </div>
        </div>
      </div>

      <div className="royalaneSearchBtnWrap">
        <button
          className="btn btn-success cursor-pointer search-btn-styling-home royalaneSearchBtn bg-color w-100"
          onClick={HandleSubmit}
          type="button"
        >
          <FaSearch /> Search Activities
        </button>
      </div>
    </div>
  );
}
