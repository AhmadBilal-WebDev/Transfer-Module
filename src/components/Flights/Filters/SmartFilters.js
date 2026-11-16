'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useFlightList } from '../FlightListingContext';
import filterStyles from './FlightFilters.module.css';

export default function SmartFilters() {
    const { freeCancellationOnly, setFreeCancellationOnly, setCurrentPage } = useFlightList();

    const toggleFreeCancellation = () => {
        setFreeCancellationOnly((prev) => !prev);
        setCurrentPage(1);
    };

    return (
        <div className={filterStyles.filterSection}>
            <p className={filterStyles.filterSectionTitle}>Smart Filters</p>
            <div className={filterStyles.filterOptionList}>
                <Checkbox
                    className={filterStyles.filterCheckbox}
                    label="Free Cancellation"
                    checked={freeCancellationOnly}
                    onChange={toggleFreeCancellation}
                    color="#e31c23"
                />
                <Checkbox
                    className={filterStyles.filterCheckbox}
                    label="Wi-Fi Included"
                    checked={false}
                    disabled
                    color="#e31c23"
                />
                <Checkbox
                    className={filterStyles.filterCheckbox}
                    label="Extra Legroom"
                    checked={false}
                    disabled
                    color="#e31c23"
                />
            </div>
        </div>
    );
}
