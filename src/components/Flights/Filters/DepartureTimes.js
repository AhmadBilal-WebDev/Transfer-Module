'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

const DEPARTURE_LABELS = [
    { id: 0, label: 'Early Morning (12:00 AM – 6:00 AM)' },
    { id: 1, label: 'Morning (6:00 AM – 12:00 PM)' },
    { id: 2, label: 'Afternoon (12:00 PM – 6:00 PM)' },
    { id: 3, label: 'Evening (6:00 PM – 12:00 AM)' },
];

export default function DepartureTimes() {
    const {
        selectedDepartureSlots,
        setSelectedDepartureSlots,
        selectedArrivalSlots,
        setSelectedArrivalSlots,
        flightTimeSlotData,
        setCurrentPage,
    } = useFlightList();

    const toggleDeparture = (slotId) => {
        setSelectedDepartureSlots((prev) => (
            prev.includes(slotId)
                ? prev.filter((id) => id !== slotId)
                : [...prev, slotId]
        ));
        setCurrentPage(1);
    };

    const toggleArrival = (slotId) => {
        setSelectedArrivalSlots((prev) => (
            prev.includes(slotId)
                ? prev.filter((id) => id !== slotId)
                : [...prev, slotId]
        ));
        setCurrentPage(1);
    };

    const getDepartureCount = (slotId) => flightTimeSlotData?.departure?.[slotId]?.count || 0;
    const getArrivalCount = (slotId) => flightTimeSlotData?.arrival?.[slotId]?.count || 0;

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Departure Time</p>
            <div className={filterStyles.filterOptionList}>
                {DEPARTURE_LABELS.map(({ id, label }) => {
                    const count = getDepartureCount(id);
                    return (
                        <Checkbox
                            key={`dep-${id}`}
                            className={filterStyles.filterCheckbox}
                            label={label}
                            checked={selectedDepartureSlots.includes(id)}
                            onChange={() => toggleDeparture(id)}
                            disabled={count === 0 && !selectedDepartureSlots.includes(id)}
                            color="#e31c23"
                        />
                    );
                })}
            </div>

            <div className={`${filterStyles.filterSubSection} mt-3`}>
                <p className={filterStyles.filterRouteLabel}>Arrival Time</p>
                <div className={filterStyles.filterOptionList}>
                    {DEPARTURE_LABELS.map(({ id, label }) => {
                        const count = getArrivalCount(id);
                        return (
                            <Checkbox
                                key={`arr-${id}`}
                                className={filterStyles.filterCheckbox}
                                label={label}
                                checked={selectedArrivalSlots.includes(id)}
                                onChange={() => toggleArrival(id)}
                                disabled={count === 0 && !selectedArrivalSlots.includes(id)}
                                color="#e31c23"
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
