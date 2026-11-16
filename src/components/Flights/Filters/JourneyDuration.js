'use client'
import React from 'react'
import { RangeSlider } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function JourneyDuration() {
    const { durationRange, setDurationRange, minDuration, maxDuration, setCurrentPage } = useFlightList();

    const handleDurationChange = (value) => {
        setDurationRange(value);
        setCurrentPage(1);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Journey Duration</p>
            <span className={filterStyles.filterSliderMeta}>
                {formatDuration(durationRange[0])} – {formatDuration(durationRange[1])}
            </span>
            <RangeSlider
                className={filterStyles.filterSlider}
                value={durationRange}
                onChange={handleDurationChange}
                color="#e31c23"
                min={minDuration}
                max={maxDuration}
                step={1}
                minRange={1}
                label={formatDuration}
            />
        </div>
    )
}
