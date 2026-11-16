'use client';
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Select } from '@mantine/core';
import { IoAirplaneOutline, IoArrowForwardCircleOutline } from 'react-icons/io5';
import { MdFilterListAlt, MdOutlineChangeCircle } from 'react-icons/md';
import { Drawer } from '@mantine/core';
import { FlightProvider } from '@/components/Flights/FlightListingContext';
import DepartureTimes from '@/components/Flights/Filters/DepartureTimes';
import JourneyDuration from '@/components/Flights/Filters/JourneyDuration';
import AirlineFilter from '@/components/Flights/Filters/AirlineFilter';
import FlightClass from '@/components/Flights/Filters/FlightClass';
import Stops from '@/components/Flights/Filters/Stops';
import FlightCard from './FlightCard';
import FlightCompareModal from './FlightCompareModal';
import PackageFilterLoader from '@/components/Loader/PackageFilterLoader';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { notifications } from '@mantine/notifications';
import { FaAngleDown, FaPlane } from 'react-icons/fa';
import style from '../Detail/CustomizeFlight.module.css';
import localStyle from './Index.module.css';

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'price_asc', label: 'Price: Low to High' },
];

export default function UpdateFlightModal({ opened, onClose, pkg, flight, onFlightUpdated }) {
    const [isLoading, setIsLoading] = useState(true);
    const [flightList, setFlightList] = useState([]);
    const [returnAirport, setReturnAirport] = useState('MED');
    const [sortBy, setSortBy] = useState('recommended');
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmFlight, setConfirmFlight] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const sortedFlightList = useMemo(() => {
        const list = [...flightList];
        if (sortBy === 'price_asc') {
            return list.sort((a, b) => parseFloat(a.pricing?.total_amount || 0) - parseFloat(b.pricing?.total_amount || 0));
        }
        if (sortBy === 'price_desc') {
            return list.sort((a, b) => parseFloat(b.pricing?.total_amount || 0) - parseFloat(a.pricing?.total_amount || 0));
        }
        return list;
    }, [flightList, sortBy]);

    useEffect(() => {
        if (!opened || !pkg) return;

        let airport;
        if (flight?.search_criteria?.legs?.length >= 2) {
            airport = flight.search_criteria.legs[1].origin;
        } else if (flight?.segments?.length) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            airport = flight.segments[midpoint]?.departure?.airport_code;
        } else {
            airport = pkg?.details_request_info?.journey_type === 'makkahFirst' ? 'MED' : 'JED';
        }
        setReturnAirport(airport);
    }, [opened, pkg, flight]);

    useEffect(() => {
        async function getFlights() {
            if (!pkg?.details_request_info) return;
            setIsLoading(true);
            const params = {
                "legs": [
                    {
                        "origin": pkg?.details_request_info?.departure_city,
                        "destination": pkg?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED',
                        "departure_date": pkg?.details_request_info?.departure_date
                    },
                    {
                        "origin": returnAirport,
                        "destination": pkg?.details_request_info?.departure_city,
                        "departure_date": pkg?.details_request_info?.journey_type === 'makkahFirst' ? pkg?.details_request_info?.madinah_check_out : pkg?.details_request_info?.makkah_check_out
                    }
                ],
                "adult": pkg?.original_request?.adult || 1,
                "child": pkg?.original_request?.child || 0,
                "infant": 0,
                "CabinType": "no",
                "MaxStopsQuantity": "All",
                "PricingSourceType": "All",
                "IsRefundable": false,
                "RequestOptions": "fifty",
                "NearByAirports": false,
                "AirTripType": "Return",
                "Target": "Test",
                "ConversationId": "395923377895446"
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params)
                });
                const response = await res.json();
                setIsLoading(false);
                if (response.success) {
                    setFlightList(response?.data?.flights || []);
                }
            } catch (error) {
                setIsLoading(false);
                console.log(error);
            }
        }
        getFlights();
        setSortBy('recommended');
    }, [pkg, returnAirport]); // Re-fetch when returnAirport changes

    // Handler to toggle return airport
    const handleReturnAirportChange = (airport) => {
        if (airport !== returnAirport) {
            setReturnAirport(airport);
        }
    };

    const handleSelectFlight = (selectedFlight) => {
        setConfirmFlight(selectedFlight);
        setConfirmOpen(true);
    };

    const fetchRates = async () => {
        try {
            const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_CURRENCY_KEY}/latest/GBP`);
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            return data.conversion_rates;
        } catch (error) {
            console.error('Failed to fetch exchange rates', error);
            return null;
        }
    };

    const handleUpdateFlight = async () => {
        if (!confirmFlight || !pkg?.package_id) return;

        setIsUpdating(true);
        try {
            const totalPax =
                Number(pkg?.original_request?.adult || 0) +
                Number(pkg?.original_request?.child || 0) +
                Number(pkg?.original_request?.infant || 0);

            const oldFlightPrice = Number(pkg?.pricing?.flight_price ?? flight?.pricing?.total_amount ?? 0);
            const pkgCurrency = pkg?.pricing?.currency || pkg?.currency;
            const flightCurrency = confirmFlight?.pricing?.currency;
            let newFlightPrice = Number(confirmFlight?.pricing?.total_amount ?? 0);

            if (flightCurrency && pkgCurrency && flightCurrency !== pkgCurrency) {
                const ratesMap = await fetchRates();
                if (ratesMap) {
                    const converted = ConvertPrice(newFlightPrice, flightCurrency, pkgCurrency, ratesMap);
                    newFlightPrice = Number(converted.newprice || 0);
                }
            }

            try {
                pkg.flight = JSON.parse(JSON.stringify(confirmFlight));
            } catch {
                pkg.flight = { ...confirmFlight };
            }

            if (!pkg.pricing) pkg.pricing = {};

            pkg.pricing.flight_price = newFlightPrice;
            const currentTotal = Number(pkg.pricing.total_price ?? pkg.total_price ?? 0);
            const updatedTotal = currentTotal - oldFlightPrice + newFlightPrice;

            pkg.pricing.total_price = updatedTotal;
            pkg.total_price = updatedTotal;

            if (totalPax > 0) {
                pkg.pricing.price_per_person = updatedTotal / totalPax;
                pkg.price_per_person = pkg.pricing.price_per_person;
            }

            onFlightUpdated?.(pkg);
            setConfirmOpen(false);
            setConfirmFlight(null);
            onClose();

            notifications.show({
                title: 'Flight Updated',
                message: 'Your package flight has been updated successfully.',
                color: 'green',
            });
        } catch (error) {
            console.error('Flight update error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to update flight. Please try again.',
                color: 'red',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const renderFilters = () => (
        isLoading ? (
            <PackageFilterLoader />
        ) : (
            <>
                <hr />
                <Stops />
                <hr />
                <DepartureTimes />
                <hr />
                <JourneyDuration />
                <hr />
                <AirlineFilter />
                <hr />
                <FlightClass />
            </>
        )
    );

    const mobileFilterButton = (
        <button
            type="button"
            className={`d-md-none ${style.mobileFilterBtn}`}
            onClick={() => setFilterDrawerOpen(true)}
            aria-label="Open filters"
        >
            <MdFilterListAlt size={20} />
        </button>
    );

    const altReturnAirport  = pkg?.details_request_info?.journey_type === 'makkahFirst' ? 'MED' : 'JED';
    const primaryReturnAirport = pkg?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED';
    return (
        <>
            <FlightCompareModal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                originalFlight={flight}
                newFlight={confirmFlight}
                pkg={pkg}
                onUpdateFlight={handleUpdateFlight}
                isUpdating={isUpdating}
            />

            <Modal
                opened={opened}
                onClose={onClose}
                fullScreen
                radius={0}
                title="Customize Your Flights"
                transitionProps={{ transition: 'fade', duration: 200 }}
            >
                <div>
                    <FlightProvider flights={sortedFlightList}>
                        <div className={style.pageWrapper}>
                            <div className={style.modifyheader}>
                                <h5 className={style.sectionTitle}>Customize Your Flights</h5>
                                <div className={style.flightRouteHeader}>
                                    <div className={style.routeBlock}>
                                        <p className={style.routeLabel}>Departure</p>
                                        <p className={style.routeValue}>
                                            {pkg?.details_request_info?.departure_city}
                                            <IoAirplaneOutline size={15} />
                                            {pkg?.details_request_info?.journey_type === 'makkahFirst' ? 'JED' : 'MED'}
                                        </p>
                                    </div>
                                    <IoArrowForwardCircleOutline size={24} className={style.routeArrow} />
                                    <div className={style.routeBlock}>
                                        <p className={style.routeLabel}>Return</p>
                                        <div className={style.returnOptions}>
                                            <span
                                                className={`cursor-pointer ${style.returnOption} ${returnAirport === altReturnAirport ? style.returnOptionActive : ''}`}
                                                onClick={() => handleReturnAirportChange(altReturnAirport)}
                                            >
                                                {altReturnAirport}
                                                <IoAirplaneOutline size={15} />
                                                {pkg?.details_request_info?.departure_city}
                                            </span>
                                            <MdOutlineChangeCircle size={16} className={style.swapIcon} />
                                            <span
                                                className={`cursor-pointer ${style.returnOption} ${returnAirport === primaryReturnAirport ? style.returnOptionActive : ''}`}
                                                onClick={() => handleReturnAirportChange(primaryReturnAirport)}
                                            >
                                                {primaryReturnAirport}
                                                <IoAirplaneOutline size={15} />
                                                {pkg?.details_request_info?.departure_city}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {isLoading ? (
                                <div className={style.layoutRow}>
                                    <div className={`${style.filterCol} d-none d-md-block`}>
                                        <div className={style.filterwrapper}>
                                            <div className={style.filterHeader}>
                                                Filters
                                                <MdFilterListAlt />
                                            </div>
                                            <div className={style.filterBody}>
                                                <PackageFilterLoader />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={style.resultsCol}>
                                        <div className={`${style.resultsHeader} ${localStyle.resultsHeader}`}>
                                            <p className={`${style.resultsCount} ${localStyle.resultsCount}`}><FaPlane /> Loading flights...</p>
                                            <div className={localStyle.headerActions}>
                                                {mobileFilterButton}
                                            </div>
                                        </div>
                                        <div className='row mb-3'>
                                            <div className='col-md-3'>
                                                <div
                                                    className="bg-light rounded w-100 placeholder-glow"
                                                    style={{ height: "60px" }}
                                                >
                                                    <span className="placeholder col-12 h-100 rounded"></span>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div
                                                    className="bg-light rounded w-100 placeholder-glow"
                                                    style={{ height: "60px" }}
                                                >
                                                    <span className="placeholder col-12 h-100 rounded"></span>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div
                                                    className="bg-light rounded w-100 placeholder-glow"
                                                    style={{ height: "60px" }}
                                                >
                                                    <span className="placeholder col-12 h-100 rounded"></span>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div
                                                    className="bg-light rounded w-100 placeholder-glow"
                                                    style={{ height: "60px" }}
                                                >
                                                    <span className="placeholder col-12 h-100 rounded"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="bg-light mb-3 rounded w-100 placeholder-glow"
                                            style={{ height: "150px" }}
                                        >
                                            <span className="placeholder col-12 h-100 rounded"></span>
                                        </div>
                                        <div
                                            className="bg-light mb-3 rounded w-100 placeholder-glow"
                                            style={{ height: "150px" }}
                                        >
                                            <span className="placeholder col-12 h-100 rounded"></span>
                                        </div>
                                        <div
                                            className="bg-light mb-3 rounded w-100 placeholder-glow"
                                            style={{ height: "150px" }}
                                        >
                                            <span className="placeholder col-12 h-100 rounded"></span>
                                        </div>
                                        <div
                                            className="bg-light mb-3 rounded w-100 placeholder-glow"
                                            style={{ height: "150px" }}
                                        >
                                            <span className="placeholder col-12 h-100 rounded"></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={style.layoutRow}>
                                    <div className={`${style.filterCol} d-none d-md-block`}>
                                        <div className={style.filterwrapper}>
                                            <div className={style.filterHeader}>
                                                Filters
                                                <MdFilterListAlt />
                                            </div>
                                            <div className={style.filterBody}>
                                                {renderFilters()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={style.resultsCol}>
                                        <div className={`${style.resultsHeader} ${localStyle.resultsHeader}`}>
                                            <p className={`${style.resultsCount} ${localStyle.resultsCount}`}>
                                                <FaPlane />
                                                <span className={style.resultsCountNum}>{flightList.length}</span>
                                                Flights Found
                                            </p>
                                            <div className={localStyle.headerActions}>
                                                <div className={localStyle.sortSelect}>
                                                    <Select
                                                        value={sortBy}
                                                        onChange={setSortBy}
                                                        data={SORT_OPTIONS}
                                                        allowDeselect={false}
                                                        size="sm"
                                                        rightSection={<FaAngleDown />}
                                                        comboboxProps={{ withinPortal: true, position: 'bottom-end' }}
                                                    />
                                                </div>
                                                {mobileFilterButton}
                                            </div>
                                        </div>
                                        <FlightCard originalFlight={flight} onSelectFlight={handleSelectFlight} />
                                    </div>
                                </div>
                            )}

                            <Drawer
                                opened={filterDrawerOpen}
                                onClose={() => setFilterDrawerOpen(false)}
                                title="Filters"
                                position="bottom"
                                size="85%"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                transitionProps={{ duration: 200 }}
                                withinPortal={true}
                                lockScroll={true}
                                classNames={{ content: style.mobileFilterDrawer }}
                            >
                                {renderFilters()}
                                <div className="border-top pt-3 mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-success w-100"
                                        onClick={() => setFilterDrawerOpen(false)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </Drawer>
                        </div>
                    </FlightProvider>
                </div>
            </Modal>

        </>
    );
}
