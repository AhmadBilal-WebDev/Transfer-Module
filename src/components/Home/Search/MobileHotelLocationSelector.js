'use client'
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaMapMarkerAlt, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';
import {
    useLockBodyScroll,
    isIOSDevice,
    waitForKeyboardClose,
} from '@/util/useLockBodyScroll';
import styles from './MobileHotelLocationSelector.module.css';

export default function MobileHotelLocationSelector({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedValue,
    recentSearches = [],
    title = "Select Location",
    searchPlaceholder = "Search by hotel, city or country...",
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const listRef = useRef(null);

    useLockBodyScroll(isOpen, { allowScrollRef: listRef });

    const searchPlaces = async (query) => {
        if (!query || query.length < 2) {
            setPredictions([]);
            setIsLoading(false);
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
                setPredictions(data.predictions.slice(0, 8));
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error('Error fetching places:', error);
            setIsLoading(false);
            setPredictions([]);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery) {
                searchPlaces(searchQuery);
            } else {
                setPredictions([]);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const dismissThen = async (action) => {
        if (typeof document !== 'undefined' && document.activeElement?.blur) {
            document.activeElement.blur();
        }
        if (isIOSDevice()) {
            await waitForKeyboardClose(750);
        } else {
            await new Promise((r) => setTimeout(r, 60));
        }
        action();
    };

    const handleSelect = (location) => {
        setSearchQuery('');
        setPredictions([]);
        dismissThen(() => onSelect(location));
    };

    const handleClose = () => {
        setSearchQuery('');
        setPredictions([]);
        dismissThen(() => onClose());
    };

    if (!isOpen) return null;
    if (typeof window === 'undefined') return null;

    const modalContent = (
        <div className={styles.mobileLocationSelector}>
            <div className={styles.header}>
                <button 
                    className={styles.closeButton} 
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
                <h2 className={styles.title}>{title}</h2>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        enterKeyHint="search"
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearSearchButton}
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.locationListContainer} ref={listRef}>
                {searchQuery && predictions.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaSearch className={styles.sectionIcon} />
                            Search Results
                        </div>
                        {predictions
                            .sort((a, b) => {
                                const mainTextA = a.structured_formatting?.main_text || a.description;
                                const mainTextB = b.structured_formatting?.main_text || b.description;
                                const isSelectedA = selectedValue && mainTextA === selectedValue;
                                const isSelectedB = selectedValue && mainTextB === selectedValue;
                                if (isSelectedA && !isSelectedB) return -1;
                                if (!isSelectedA && isSelectedB) return 1;
                                return 0;
                            })
                            .map((prediction) => {
                            const mainText = prediction.structured_formatting?.main_text || prediction.description;
                            const secondaryText = prediction.structured_formatting?.secondary_text || '';
                            const isSelected = selectedValue && mainText === selectedValue;
                            
                            return (
                                <div
                                    key={prediction.place_id}
                                    className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                    onClick={() => handleSelect({
                                        type: 'prediction',
                                        prediction,
                                        mainText,
                                        secondaryText
                                    })}
                                >
                                    <div className={styles.locationIconWrapper}>
                                        <FaMapMarkerAlt className={styles.locationIcon} />
                                    </div>
                                    <div className={styles.locationDetails}>
                                        <div className={styles.locationName}>
                                            {mainText}
                                        </div>
                                        <div className={styles.locationCountry}>
                                            {secondaryText}
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
                        <div className='placeholder-glow p-3'>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="placeholder col-12 mb-2 rounded" style={{ height: '60px' }}></div>
                            ))}
                        </div>
                    </div>
                )}

                {searchQuery && !isLoading && predictions.length === 0 && (
                    <div className={styles.emptyState}>
                        <FaMapMarkerAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No locations found</p>
                    </div>
                )}

                {!searchQuery && recentSearches.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaSearch className={styles.sectionIcon} />
                            Recent Searches
                        </div>
                        {recentSearches
                            .sort((a, b) => {
                                const isSelectedA = selectedValue && a.name === selectedValue;
                                const isSelectedB = selectedValue && b.name === selectedValue;
                                if (isSelectedA && !isSelectedB) return -1;
                                if (!isSelectedA && isSelectedB) return 1;
                                return 0;
                            })
                            .map((location, index) => {
                            const isSelected = selectedValue && location.name === selectedValue;
                            return (
                                <div
                                    key={`recent-${index}`}
                                    className={`${styles.locationOption} ${isSelected ? styles.selectedLocation : ''}`}
                                    onClick={() => handleSelect({
                                        type: 'recent',
                                        location
                                    })}
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
                    <div className={styles.emptyState}>
                        <FaMapMarkerAlt className={styles.emptyIcon} />
                        <p className={styles.emptyText}>Start typing to search for locations</p>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
