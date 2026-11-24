'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { FaMapMarkerAlt, FaTimes, FaSearch, FaGlobeAmericas, FaCheck } from 'react-icons/fa';
import styles from './HotelLocationSelector.module.css';
import compactStyles from './TransferLocationSelector.module.css';
import MobileTransferLocationSelector from './MobileTransferLocationSelector';
import { getScrollY, setScrollY } from '@/util/useLockBodyScroll';

export default function TransferLocationSelector({
    value,
    onChange,
    onPlaceSelected,
    detailLoader,
    isMobile,
    label = "Location",
    placeholder = "Enter location",
    inputName = "transferLocation",
    compact = false,
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileModalOpen, setMobileModalOpen] = useState(false);
    const [confirmedSelection, setConfirmedSelection] = useState(null);
    const [lockScrollY, setLockScrollY] = useState(null);
    const inputRef = useRef(null);
    const searchTimeout = useRef(null);
    const touchScrollYRef = useRef(null);

    // Popular destinations for transfers
    const popularDestinations = [
        { name: 'Jeddah Airport', country: 'Saudi Arabia', icon: '✈️', placeId: 'ChIJm0kSHuldwxURNFByRg7r-Dg' },
        { name: 'Makkah', country: 'Saudi Arabia', icon: '🕋', placeId: 'ChIJqVPl4WdmwxURkq3mVvmZ8Ak' },
        { name: 'Madinah', country: 'Saudi Arabia', icon: '🕌', placeId: 'ChIJ4VIcbGeDxhURFEz7tq5z4Vc' },
        { name: 'Dubai Airport', country: 'United Arab Emirates', icon: '✈️', placeId: 'ChIJvRKfbfVDXz4R-9nf8tN1RRA' },
        { name: 'Riyadh Airport', country: 'Saudi Arabia', icon: '✈️', placeId: 'ChIJp5PeVdaEXz4R9Y4gvUdI5zE' },
        { name: 'Istanbul Airport', country: 'Turkey', icon: '✈️', placeId: 'ChIJ_UnBV0CzyhQRWh5tDp-0PrQ' },
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        const savedRecent = localStorage.getItem(`recentTransferSearches_${inputName}`);
        if (savedRecent) {
            setRecentSearches(JSON.parse(savedRecent));
        }
    }, [inputName]);

    useEffect(() => {
        if (!value) {
            setConfirmedSelection(null);
            return;
        }

        setConfirmedSelection((prev) => {
            if (prev?.placeId) {
                return { ...prev, name: value };
            }
            if (searchQuery) {
                return prev;
            }
            return prev ?? { name: value };
        });
    }, [value, searchQuery]);

    const isLocationSelected = (name, placeId) => {
        if (!confirmedSelection) return false;
        if (placeId && confirmedSelection.placeId) {
            return confirmedSelection.placeId === placeId;
        }
        return !searchQuery && confirmedSelection.name === name;
    };

    const markLocationSelected = (name, placeId = null) => {
        setConfirmedSelection({ name, placeId });
    };

    // Search Google Places API via REST
    const searchPlaces = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/places/autocomplete?input=${encodeURIComponent(query)}`
            );
            const data = await response.json();

            setIsLoading(false);

            if (data.status === 'OK' && data.predictions) {
                setPredictions(data.predictions.slice(0, 8)); // Limit to 8 results
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error('Error fetching places:', error);
            setIsLoading(false);
            setPredictions([]);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery) {
            searchTimeout.current = setTimeout(() => {
                searchPlaces(searchQuery);
            }, 300);
        } else {
            setPredictions([]);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, searchPlaces]);

    // Search for location and get fresh Place ID
    const searchAndGetPlaceId = useCallback(async (locationName) => {
        try {
            const response = await fetch(
                `/api/places/autocomplete?input=${encodeURIComponent(locationName)}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
                // Get the first (best) match
                const firstMatch = data.predictions[0];
                return firstMatch.place_id;
            } else {
                console.error('No results found for:', locationName);
                notifications.show({
                    title: 'Location Not Found',
                    message: 'Could not find this location. Please search again.',
                    color: 'orange',
                });
                return null;
            }
        } catch (error) {
            console.error('Error searching for place:', error);
            return null;
        }
    }, []);

    // Persist lat/lng on a recent entry once place details resolve
    const updateRecentSearchWithDetails = useCallback((locationName, details) => {
        const storageKey = `recentTransferSearches_${inputName}`;
        const recent = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const index = recent.findIndex((item) => item.name === locationName);

        if (index === -1) return;

        recent[index] = {
            ...recent[index],
            lat: details.lat,
            lng: details.lng,
            city: details.city || recent[index].city,
            country: details.country || recent[index].country,
            placeId: details.placeId || recent[index].placeId,
        };
        setRecentSearches(recent);
        localStorage.setItem(storageKey, JSON.stringify(recent));
    }, [inputName]);

    // Get place details via REST API
    const getPlaceDetails = useCallback(async (placeId, displayName = null) => {
        if (!placeId) {
            console.warn('No placeId provided to getPlaceDetails');
            return false;
        }
        detailLoader?.(true);
        try {
            const response = await fetch(
                `/api/places/details?place_id=${placeId}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.result) {
                const place = data.result;
                const placeWithDisplayName = {
                    ...place,
                    displayName: displayName || place.name
                };
                onPlaceSelected(placeWithDisplayName);

                if (displayName) {
                    const lat = place.geometry?.location?.lat;
                    const lng = place.geometry?.location?.lng;
                    let city = '';
                    let country = '';

                    place.address_components?.forEach((component) => {
                        if (component.types.includes('locality')) {
                            city = component.long_name;
                        } else if (component.types.includes('postal_town') && !city) {
                            city = component.long_name;
                        }
                        if (component.types.includes('country')) {
                            country = component.long_name;
                        }
                    });

                    if (lat != null && lng != null) {
                        updateRecentSearchWithDetails(displayName, {
                            lat,
                            lng,
                            city,
                            country,
                            placeId,
                        });
                    }
                }
                return true;
            }

            console.error('Place details API error:', data.status, data.error_message);
            notifications.show({
                title: 'Location Error',
                message: 'Could not load location details. Please try searching again.',
                color: 'red',
            });
            return false;
        } catch (error) {
            console.error('Error fetching place details:', error);
            notifications.show({
                title: 'Location Error',
                message: 'Could not load location details. Please try searching again.',
                color: 'red',
            });
            return false;
        } finally {
            detailLoader?.(false);
        }
    }, [onPlaceSelected, detailLoader, updateRecentSearchWithDetails]);

    // Add to recent searches (merge/update existing by name so lat/lng can be filled later)
    const addToRecentSearches = (location) => {
        if (!location.name) return;

        const filtered = recentSearches.filter((item) => item.name !== location.name);
        const existing = recentSearches.find((item) => item.name === location.name);
        const merged = {
            ...existing,
            ...location,
            lat: location.lat ?? existing?.lat ?? null,
            lng: location.lng ?? existing?.lng ?? null,
            city: location.city || existing?.city || '',
            country: location.country || existing?.country || '',
            placeId: location.placeId || existing?.placeId || null,
        };
        const newList = [merged, ...filtered].slice(0, 5);

        setRecentSearches(newList);
        localStorage.setItem(`recentTransferSearches_${inputName}`, JSON.stringify(newList));
    };

    const buildPlaceFromStoredLocation = (location) => ({
        geometry: {
            location: {
                lat: location.lat,
                lng: location.lng,
            },
        },
        place_id: location.placeId || '',
        address_components: [
            ...(location.city
                ? [{ types: ['locality'], long_name: location.city }]
                : []),
            ...(location.country
                ? [{ types: ['country'], long_name: location.country }]
                : []),
        ],
        displayName: location.name,
        formatted_address: location.country
            ? `${location.name}, ${location.country}`
            : location.name,
        name: location.name,
    });

    const hasValidCoords = (location) => {
        // Number(null) === 0 — must reject null/empty before coercing
        if (
            location?.lat == null ||
            location?.lng == null ||
            location?.lat === '' ||
            location?.lng === ''
        ) {
            return false;
        }
        const lat = Number(location.lat);
        const lng = Number(location.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        // Stored 0,0 means unresolved — force Places details lookup
        if (lat === 0 && lng === 0) return false;
        return true;
    };

    // Resolve coords for recent/popular: prefer stored lat/lng, then placeId, then name lookup
    const resolveLocationDetails = async (location) => {
        if (hasValidCoords(location)) {
            onPlaceSelected(buildPlaceFromStoredLocation(location));
            return;
        }

        detailLoader?.(true);
        try {
            let placeId = location.placeId || null;
            if (!placeId) {
                placeId = await searchAndGetPlaceId(location.name);
            }
            if (placeId) {
                markLocationSelected(location.name, placeId);
                await getPlaceDetails(placeId, location.name);
            } else {
                detailLoader?.(false);
            }
        } catch (error) {
            detailLoader?.(false);
            console.error('Error resolving location details:', error);
        }
    };

    const handlePredictionSelect = (prediction) => {
        const mainText = prediction.structured_formatting?.main_text || '';
        const secondaryText = prediction.structured_formatting?.secondary_text || '';

        if (inputRef.current) {
            inputRef.current.value = mainText;
            onChange({ target: { value: mainText } });
        }

        const locationData = {
            name: mainText,
            country: secondaryText,
            icon: '📍',
            placeId: prediction.place_id
        };
        addToRecentSearches(locationData);

        markLocationSelected(mainText, prediction.place_id);
        getPlaceDetails(prediction.place_id, mainText);

        setDropdownOpen(false);
        setSearchQuery('');
        setPredictions([]);
    };

    const handleLocationSelect = (location) => {
        if (inputRef.current) {
            inputRef.current.value = location.name;
            onChange({ target: { value: location.name } });
        }

        setDropdownOpen(false);
        setSearchQuery('');
        setPredictions([]);

        addToRecentSearches(location);
        markLocationSelected(location.name, location.placeId || null);
        resolveLocationDetails(location);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (inputRef.current) {
            inputRef.current.value = '';
            onChange({ target: { value: '' } });
        }
        setSearchQuery('');
        setPredictions([]);
        setConfirmedSelection(null);
        setMobileModalOpen(false);
    };

    const handleDropdownOpen = () => {
        setDropdownOpen(true);
    };

    const handleInputChange = (e) => {
        const nextValue = e.target.value;
        setSearchQuery(nextValue);
        setConfirmedSelection(null);
        onChange(e);
        if (!dropdownOpen) {
            setDropdownOpen(true);
        }
    };

    // Handle mobile selection
    const handleMobileSelect = (selection) => {
        if (selection.type === 'prediction') {
            const name = selection.mainText;
            onChange({ target: { value: name } });

            // Close modal — scroll restore happens in modal unlock (single sync restore)
            setMobileModalOpen(false);

            const locationData = {
                name,
                country: selection.secondaryText,
                icon: '📍',
                placeId: selection.prediction.place_id
            };
            addToRecentSearches(locationData);
            markLocationSelected(name, selection.prediction.place_id);
            getPlaceDetails(selection.prediction.place_id, name);
        } else if (selection.type === 'recent' || selection.type === 'popular') {
            const location = selection.location;
            onChange({ target: { value: location.name } });
            setMobileModalOpen(false);

            addToRecentSearches(location);
            markLocationSelected(location.name, location.placeId || null);
            resolveLocationDetails(location);
        }
    };

    // Desktop view
    if (!isMobile) {
        return (
            <Popover
                opened={dropdownOpen}
                onChange={setDropdownOpen}
                position="bottom-start"
                width="target"
                shadow="md"
                offset={8}
                clickOutsideEvents={["mouseup", "touchend"]}
                middlewares={{ flip: false, shift: false }}
            >
                <Popover.Target>
                    <div className={`${compact ? '' : 'form-floating '}w-100 position-relative`}>
                        <input
                            type="text"
                            id={inputName}
                            name={inputName}
                            className={compact ? compactStyles.compactInput : 'form-control'}
                            style={compact
                                ? { cursor: 'text', paddingRight: value ? '26px' : 0 }
                                : { paddingLeft: '14px', paddingRight: value ? '40px' : '12px', cursor: 'text' }}
                            placeholder={compact ? placeholder : ' '}
                            value={value}
                            onChange={handleInputChange}
                            onFocus={(e) => {
                                e.target.select();
                                handleDropdownOpen();
                            }}
                            onClick={handleDropdownOpen}
                            ref={inputRef}
                            autoComplete="off"
                            aria-label={label}
                        />
                        {value && (
                            <button
                                className={compact ? compactStyles.compactClear : styles.clearButton}
                                onClick={handleClear}
                                type="button"
                                aria-label="Clear selection"
                            >
                                <FaTimes />
                            </button>
                        )}
                        {!compact && (
                            <label htmlFor={inputName} style={{ paddingLeft: '14px' }}>{label}</label>
                        )}
                    </div>
                </Popover.Target>
                <Popover.Dropdown className={compact ? compactStyles.compactDropdown : styles.customDropdown}>
                    {compact ? (
                        <div className={compactStyles.compactContent}>
                            {searchQuery && predictions.length > 0 && (
                                <div className={compactStyles.compactSection}>
                                    <div className={compactStyles.compactSectionHeader}>
                                        <FaSearch className={compactStyles.compactSectionIcon} />
                                        Search Results
                                    </div>
                                    {predictions.map((prediction) => {
                                        const mainText = prediction.structured_formatting?.main_text || prediction.description;
                                        const isSelected = isLocationSelected(mainText, prediction.place_id);
                                        return (
                                            <div
                                                key={prediction.place_id}
                                                className={`${compactStyles.compactOption} ${isSelected ? compactStyles.compactOptionSelected : ''}`}
                                                onClick={() => handlePredictionSelect(prediction)}
                                            >
                                                <div className={compactStyles.compactIconWrap}>
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <div className={compactStyles.compactDetails}>
                                                    <div className={compactStyles.compactName}>{mainText}</div>
                                                    <div className={compactStyles.compactMeta}>
                                                        {prediction.structured_formatting?.secondary_text || ''}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className={compactStyles.compactCheck}>
                                                        <FaCheck />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {searchQuery && isLoading && (
                                <div className={compactStyles.compactLoading}>
                                    <div className={compactStyles.compactSkeleton} />
                                    <div className={compactStyles.compactSkeleton} />
                                    <div className={compactStyles.compactSkeleton} />
                                </div>
                            )}

                            {searchQuery && !isLoading && predictions.length === 0 && (
                                <div className={compactStyles.compactEmpty}>
                                    <div className={compactStyles.compactEmptyIcon}>
                                        <FaMapMarkerAlt />
                                    </div>
                                    No locations found
                                </div>
                            )}

                            {!searchQuery && recentSearches.length > 0 && (
                                <div className={compactStyles.compactSection}>
                                    <div className={compactStyles.compactSectionHeader}>
                                        <FaSearch className={compactStyles.compactSectionIcon} />
                                        Recent Searches
                                    </div>
                                    {recentSearches.map((location, index) => {
                                        const isSelected = isLocationSelected(location.name, location.placeId);
                                        return (
                                            <div
                                                key={`recent-${index}`}
                                                className={`${compactStyles.compactOption} ${isSelected ? compactStyles.compactOptionSelected : ''}`}
                                                onClick={() => handleLocationSelect(location)}
                                            >
                                                <div className={compactStyles.compactIconWrap}>
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <div className={compactStyles.compactDetails}>
                                                    <div className={compactStyles.compactName}>{location.name}</div>
                                                    <div className={compactStyles.compactMeta}>{location.country}</div>
                                                </div>
                                                {isSelected && (
                                                    <div className={compactStyles.compactCheck}>
                                                        <FaCheck />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!searchQuery && recentSearches.length === 0 && (
                                <div className={compactStyles.compactEmpty}>
                                    <div className={compactStyles.compactEmptyIcon}>
                                        <FaMapMarkerAlt />
                                    </div>
                                    Start typing to search locations
                                </div>
                            )}
                        </div>
                    ) : (
                    <div className={styles.dropdownContent}>
                        {searchQuery && predictions.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FaSearch className={styles.sectionIcon} />
                                    Search Results
                                </div>
                                {predictions.map((prediction) => {
                                    const mainText = prediction.structured_formatting?.main_text || prediction.description;
                                    const isSelected = isLocationSelected(mainText, prediction.place_id);
                                    return (
                                        <div
                                            key={prediction.place_id}
                                            className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                            onClick={() => handlePredictionSelect(prediction)}
                                        >
                                            <div className={styles.locationIconWrapper}>
                                                <FaMapMarkerAlt className={styles.locationIcon} />
                                            </div>
                                            <div className={styles.locationDetails}>
                                                <div className={styles.locationName}>
                                                    {mainText}
                                                </div>
                                                <div className={styles.locationCountry}>
                                                    {prediction.structured_formatting?.secondary_text || ''}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={styles.checkIcon}>
                                                    <FaCheck />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {searchQuery && isLoading && (
                            <div className={styles.section}>
                                <div className='placeholder-glow p-2'>
                                    <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                    <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                    <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                    <span className="placeholder col-12 mb-1 rounded" style={{ height: '36px' }}></span>
                                </div>
                            </div>
                        )}

                        {searchQuery && !isLoading && predictions.length === 0 && (
                            <div className={styles.section}>
                                <div className={styles.emptyState}>
                                    No locations found
                                </div>
                            </div>
                        )}

                        {!searchQuery && recentSearches.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FaSearch className={styles.sectionIcon} />
                                    Recent Searches
                                </div>
                                {recentSearches.map((location, index) => {
                                    const isSelected = isLocationSelected(location.name, location.placeId);
                                    return (
                                        <div
                                            key={`recent-${index}`}
                                            className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                            onClick={() => handleLocationSelect(location)}
                                        >
                                            <div className={styles.locationIconWrapper}>
                                                <FaMapMarkerAlt className={styles.locationIcon} />
                                            </div>
                                            <div className={styles.locationDetails}>
                                                <div className={styles.locationName}>{location.name}</div>
                                                <div className={styles.locationCountry}>{location.country}</div>
                                            </div>
                                            {isSelected && (
                                                <div className={styles.checkIcon}>
                                                    <FaCheck />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {!searchQuery && recentSearches.length === 0 && (
                            <div className={styles.section}>
                                <div className={styles.emptyState}>
                                    <FaMapMarkerAlt size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                    <div>Start typing to search for locations</div>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </Popover.Dropdown>
            </Popover>
        );
    }

    // Mobile view — match hotel field: readOnly trigger only (no keyboard on the page field)
    return (
        <>
            <div
                className={`${compact ? '' : 'form-floating '}w-100 position-relative`}
                onTouchStart={() => {
                    // Capture before iOS scrolls the field into view
                    touchScrollYRef.current = getScrollY();
                }}
                onClick={() => {
                    // Blur any focused control (date pickers, etc.) so iOS does not scroll the sheet
                    if (typeof document !== 'undefined' && document.activeElement?.blur) {
                        document.activeElement.blur();
                    }
                    const y = touchScrollYRef.current ?? getScrollY();
                    touchScrollYRef.current = null;
                    setLockScrollY(y);
                    setScrollY(y);
                    setMobileModalOpen(true);
                }}
            >
                <input
                    type="text"
                    id={inputName}
                    name={inputName}
                    className={compact ? compactStyles.compactInput : 'form-control'}
                    style={compact
                        ? { cursor: 'pointer', paddingRight: value ? '26px' : 0 }
                        : { paddingLeft: '14px', paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                    placeholder={compact ? placeholder : ' '}
                    value={value}
                    ref={inputRef}
                    autoComplete="off"
                    readOnly
                    inputMode="none"
                    aria-label={label}
                />
                {value && (
                    <button
                        className={compact ? compactStyles.compactClear : styles.clearButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear(e);
                        }}
                        type="button"
                        aria-label="Clear selection"
                    >
                        <FaTimes />
                    </button>
                )}
                {!compact && (
                    <label htmlFor={inputName} style={{ paddingLeft: '14px' }}>{label}</label>
                )}
            </div>

            <MobileTransferLocationSelector
                isOpen={mobileModalOpen}
                onClose={() => setMobileModalOpen(false)}
                onSelect={handleMobileSelect}
                selectedValue={value}
                recentSearches={recentSearches}
                label={placeholder || label}
                lockScrollY={lockScrollY}
            />
        </>
    );
}
