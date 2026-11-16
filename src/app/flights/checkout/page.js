'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { IoArrowBack } from 'react-icons/io5'
import { useFlightStore } from '@/components/Store/FlightStore';
import Form from '@/components/Flights/Checkout/Form';
import FlightSummary from '@/components/Flights/Checkout/FlightSummary';
import './checkout.css';

export const dynamic = 'force-dynamic';

export default function page() {
    const { selectedFlight } = useFlightStore();
    const [flightDetails, setFlightDetails] = useState({});

    useEffect(() => {
        setFlightDetails(selectedFlight);
    }, [selectedFlight])

    if (!flightDetails || !flightDetails.segments) {
        return (
            <div className='flight-checkout-container'>
                <div className='container my-4'>
                    <div className="alert alert-warning" role="alert">
                        No flight selected. Please go back and select a flight.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flight-checkout-container'>
            <div className='container'>
                <Link href="/flights" className='flight-checkout-back-link'>
                    <IoArrowBack aria-hidden="true" />
                    Back to Flights
                </Link>

                <div className='row g-4 flight-checkout-row'>
                    <div className='col-lg-4 col-12'>
                        <div className='flight-checkout-sidebar'>
                            <FlightSummary flightDetails={flightDetails} />
                        </div>
                    </div>
                    <div className='col-lg-8 col-12'>
                        <Form flightdata={flightDetails} />
                    </div>
                </div>
            </div>
        </div>
    )
}
