'use client';
import React from 'react'
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function ResetFilter({ setActiveDrawer }) {
    const { resetFilters } = useFlightList();
    const handleReset = () => {
        if (setActiveDrawer) setActiveDrawer(null);
        resetFilters();
    };
    return (
        <button type="button" onClick={handleReset} className={filterStyles.resetLink}>
            Reset filter?
        </button>
    )
}
