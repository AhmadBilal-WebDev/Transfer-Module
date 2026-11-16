'use client'
import React from 'react'
import { RangeSlider } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function LayoverTime() {
    const { layoverRange, setLayoverRange, minLayover, maxLayover, setCurrentPage } = useFlightList();

    const handleDurationChange = (value) => {
        setLayoverRange(value);
        setCurrentPage(1);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Layover Time</p>
            <span className={filterStyles.filterSliderMeta}>
                {formatDuration(layoverRange[0])} – {formatDuration(layoverRange[1])}
            </span>
            <RangeSlider
                className={filterStyles.filterSlider}
                value={layoverRange}
                onChange={handleDurationChange}
                min={minLayover}
                max={maxLayover}
                step={1}
                color="#e31c23"
                minRange={1}
                label={formatDuration}
            />
        </div>
    )
}
