'use client'
import React from 'react'
import { useHotelList } from "../HotelListingContext";

export default function ResetFilter({ setActiveDrawer, variant = 'sidebar' }) {
    const { resetFilters } = useHotelList();

    const handleReset = () => {
        setActiveDrawer?.(null);
        resetFilters();
    };

    const handleApply = () => {
        setActiveDrawer?.(null);
    };

    if (variant === 'apply') {
        return (
            <div className='hotel-filter-reset'>
                <button type="button" onClick={handleApply} className='hotel-filter-apply__btn'>
                    Apply Filters
                </button>
                <button type="button" onClick={handleReset} className='hotel-filter-reset__link'>
                    Reset All Filters
                </button>
            </div>
        );
    }

    if (variant === 'drawer-apply') {
        return (
            <div className='hotel-filter-drawer-actions'>
                <button type="button" onClick={handleReset} className='hotel-filter-reset__link hotel-filter-reset__link--end'>
                    Reset filters
                </button>
                <button type="button" onClick={handleApply} className='hotel-filter-apply__btn'>
                    Apply Filters
                </button>
            </div>
        );
    }

    return (
        <div className='hotel-filter-reset'>
            <button type="button" onClick={handleReset} className='hotel-filter-reset__link'>
                Reset All Filters
            </button>
        </div>
    );
}
