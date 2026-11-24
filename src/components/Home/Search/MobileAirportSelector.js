'use client'
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaPlane, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';
import { AirportList } from "@/util/AirportList";
import {
    useLockBodyScroll,
    isIOSDevice,
    waitForKeyboardClose,
} from '@/util/useLockBodyScroll';
import styles from './MobileAirportSelector.module.css';

export default function MobileAirportSelector({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedValue, 
    excludeCode,
    label,
    type, // 'from' or 'to'
    recentAirports = []
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef(null);

    useLockBodyScroll(isOpen, { allowScrollRef: listRef });

    // Filter airports based on search query and organize by country
    const filterAirports = (airports, query, selectedCode = null) => {
        let filtered = airports;

        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = airports.filter(airport =>
                airport.airportName.toLowerCase().includes(lowerQuery) ||
                airport.airportCode.toLowerCase().includes(lowerQuery) ||
                airport.cityName.toLowerCase().includes(lowerQuery) ||
                airport.countryName.toLowerCase().includes(lowerQuery)
            );
        }

        // Move selected airport to top if it exists in filtered results
        if (selectedCode) {
            const selectedIndex = filtered.findIndex(a => a.airportCode === selectedCode);
            if (selectedIndex > -1) {
                const selectedAirport = filtered.splice(selectedIndex, 1)[0];
                filtered.unshift(selectedAirport);
            }
        }

        // Group by country
        const groupedByCountry = filtered.reduce((acc, airport) => {
            const country = airport.countryName;
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(airport);
            return acc;
        }, {});

        // Convert to array of countries with their airports
        const countriesArray = Object.entries(groupedByCountry)
            .map(([country, airports]) => ({
                country,
                airports: airports.slice(0, 20) // Max 20 airports per country
            }))
            .slice(0, 15); // Max 15 countries

        return countriesArray;
    };

    // Get airports to display
    const getAirportsToDisplay = () => {
        if (searchQuery) {
            // Show filtered results when user is typing
            return filterAirports(
                excludeCode ? AirportList.filter(a => a.airportCode !== excludeCode) : AirportList,
                searchQuery,
                selectedValue
            );
        } else {
            // Show recent airports when no search query
            if (recentAirports.length > 0) {
                const recentAirportsList = recentAirports
                    .map(code => AirportList.find(a => a.airportCode === code))
                    .filter(Boolean)
                    .filter(airport => !excludeCode || airport.airportCode !== excludeCode);

                if (recentAirportsList.length > 0) {
                    // Group recent airports by country
                    const groupedByCountry = recentAirportsList.reduce((acc, airport) => {
                        const country = airport.countryName;
                        if (!acc[country]) {
                            acc[country] = [];
                        }
                        acc[country].push(airport);
                        return acc;
                    }, {});

                    return Object.entries(groupedByCountry).map(([country, airports]) => ({
                        country,
                        airports
                    }));
                }
            }
            return [];
        }
    };

    const groupedAirports = getAirportsToDisplay();
    const totalAirports = groupedAirports.reduce((sum, group) => sum + group.airports.length, 0);

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

    const handleSelect = (airportCode) => {
        setSearchQuery('');
        dismissThen(() => onSelect(airportCode));
    };

    const handleClose = () => {
        setSearchQuery('');
        dismissThen(() => onClose());
    };

    if (!isOpen) return null;

    // Ensure we're in the browser before using createPortal
    if (typeof window === 'undefined') return null;

    const modalContent = (
        <div className={styles.mobileAirportSelector}>
            {/* Header */}
            <div className={styles.header}>
                <button 
                    className={styles.closeButton} 
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
                <h2 className={styles.title}>{label}</h2>
            </div>

            {/* Search Box */}
            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by airport, city or country..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
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

            {/* Airport List */}
            <div className={styles.airportListContainer} ref={listRef}>
                {totalAirports > 0 ? (
                    groupedAirports.map((group, groupIndex) => (
                        <div key={`${group.country}-${groupIndex}`} className={styles.countryGroup}>
                            <div className={styles.countryHeader}>
                                {!searchQuery ? 'Recent Searches' : group.country}
                                {selectedValue && group.airports.find(a => a.airportCode === selectedValue) && (
                                    <span className={styles.selectedBadge}>Current</span>
                                )}
                            </div>
                            {group.airports.map((airport) => (
                                <div
                                    key={airport.airportCode}
                                    className={`${styles.airportOption} ${selectedValue === airport.airportCode ? styles.selected : ''}`}
                                    onClick={() => handleSelect(airport.airportCode)}
                                >
                                    <div className={styles.airportIconWrapper}>
                                        <FaPlane className={styles.airportIcon} />
                                    </div>
                                    <div className={styles.airportDetails}>
                                        <div className={styles.airportMainInfo}>
                                            <span className={styles.airportName}>{airport.airportName}</span>
                                            <span className={styles.airportCode}>({airport.airportCode})</span>
                                        </div>
                                        <div className={styles.airportLocation}>
                                            {airport.cityName}, {airport.countryName}
                                        </div>
                                    </div>
                                    {selectedValue === airport.airportCode && (
                                        <div className={styles.checkmarkWrapper}>
                                            <FaCheck className={styles.checkmark} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <FaPlane className={styles.emptyIcon} />
                        <p className={styles.emptyText}>
                            {searchQuery 
                                ? 'No airports found' 
                                : type === 'from' 
                                    ? 'Start typing to search departure airports...' 
                                    : 'Start typing to search destination airports...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // Render using portal to ensure it's at the root level
    return createPortal(modalContent, document.body);
}
