'use client'
import React from 'react'
import DepartureTimes from '@/components/Flights/Filters/DepartureTimes';
import Stops from '@/components/Flights/Filters/Stops';
import AirlineFilter from '@/components/Flights/Filters/AirlineFilter';
import JourneyDuration from '@/components/Flights/Filters/JourneyDuration';
import LayoverTime from '@/components/Flights/Filters/Layovertime';
import ResetFilter from '@/components/Flights/Filters/ResetFilter';
import filterStyles from './FlightFilters.module.css';

export default function FilterPanelContent({ setActiveDrawer, showApply = false, onApply }) {
    return (
        <div className={filterStyles.filterPanel}>
            <DepartureTimes />
            <Stops />
            <AirlineFilter />
            <JourneyDuration />
            <LayoverTime />
            {showApply && (
                <button type="button" className={filterStyles.applyBtn} onClick={onApply}>
                    Apply Filters
                </button>
            )}
            <ResetFilter setActiveDrawer={setActiveDrawer} />
        </div>
    );
}
