'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

const STOP_OPTIONS = [
    { value: 0, label: 'Direct' },
    { value: 1, label: '1 Stop' },
    { value: 2, label: '2+ Stops' },
];

export default function Stops() {
    const { selectedStops, setSelectedStops, stopsWithCounts, setCurrentPage } = useFlightList();

    const handleStopChange = (stopValue) => {
        setSelectedStops(prev => {
            if (prev.includes(stopValue)) {
                return prev.filter(s => s !== stopValue);
            }
            return [...prev, stopValue];
        });
        setCurrentPage(1);
    };

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Stops</p>
            <div className={filterStyles.filterOptionList}>
                {STOP_OPTIONS.map(({ value, label }) => (
                    <Checkbox
                        key={value}
                        className={filterStyles.filterCheckbox}
                        label={label}
                        checked={selectedStops.includes(value)}
                        onChange={() => handleStopChange(value)}
                        color="#e31c23"
                    />
                ))}
            </div>
        </div>
    )
}
