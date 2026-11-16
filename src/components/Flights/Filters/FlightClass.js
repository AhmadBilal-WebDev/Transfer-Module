'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function FlightClass() {
    const { selectedCabinClass, setSelectedCabinClass, cabinClassesWithCounts, setCurrentPage } = useFlightList();

    const handleClassChange = (className) => {
        setSelectedCabinClass(prev => {
            if (prev.includes(className)) {
                return prev.filter(c => c !== className);
            }
            return [...prev, className];
        });
        setCurrentPage(1);
    };

    if (!cabinClassesWithCounts.length) return null;

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Cabin</p>
            <div className={filterStyles.filterOptionList}>
                {cabinClassesWithCounts.map((cabinClass) => (
                    <Checkbox
                        key={cabinClass.name}
                        className={filterStyles.filterCheckbox}
                        label={cabinClass.name}
                        checked={selectedCabinClass.includes(cabinClass.name)}
                        onChange={() => handleClassChange(cabinClass.name)}
                        color="#e31c23"
                    />
                ))}
            </div>
        </div>
    )
}
