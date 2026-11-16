'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function AirlineFilter() {
    const { selectedAirlines, setSelectedAirlines, airlinesWithCounts, setCurrentPage } = useFlightList();

    const handleAirlineChange = (airlineCode) => {
        setSelectedAirlines(prev => {
            if (prev.includes(airlineCode)) {
                return prev.filter(a => a !== airlineCode);
            }
            return [...prev, airlineCode];
        });
        setCurrentPage(1);
    };

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Airlines</p>
            <div className={filterStyles.filterOptionList}>
                {airlinesWithCounts.map((airline) => (
                    <Checkbox
                        key={airline.code}
                        className={filterStyles.filterCheckbox}
                        label={airline.name}
                        checked={selectedAirlines.includes(airline.code)}
                        onChange={() => handleAirlineChange(airline.code)}
                        color="#e31c23"
                    />
                ))}
            </div>
        </div>
    )
}
