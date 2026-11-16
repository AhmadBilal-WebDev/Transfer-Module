'use client'
import React, { useEffect, useState, useRef } from 'react'
import { MdFilterListAlt, MdEdit, MdLocationOn, MdPeople } from "react-icons/md";
import FlightCard from '@/components/Flights/FlightCard';
import moment from 'moment';
import SortOption from '@/components/Flights/Filters/SortOption';
import FilterPanelContent from '@/components/Flights/Filters/FilterPanelContent';
import filterStyles from '@/components/Flights/Filters/FlightFilters.module.css';
import { useSearchParams } from 'next/navigation';
import FlightListingFullLoader from '@/components/Loader/FlightListingFullLoader';
import { FlightProvider, useFlightList } from '@/components/Flights/FlightListingContext';
import FlightListingPaginations from '@/components/Flights/FlightListingPaginations';
// import MapView from '@/components/Flights/MapView/MapView';
import FlightSearch from '../Home/Search/FlightSearch';
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import { PackageModeBanner } from '../Store/PackageModeHelper';
import { useHolidayPackageStore } from '../Store/HolidayPackageStore';
import GeneralPackages from '../Home/Search/GeneralPackages';
import { FaPlane } from 'react-icons/fa';

function FlightResultCount() {
    const { totalFlights, allFlights } = useFlightList();
    const searchParams = useSearchParams();
    const total = allFlights.length;
    const isFiltered = totalFlights !== total;

    const guestParts = [];
    const adults = Number(searchParams.get('adult')) || 0;
    const children = Number(searchParams.get('child')) || 0;
    const infants = Number(searchParams.get('infant')) || 0;
    const guestTotal = adults + children + infants;
    if (guestTotal) guestParts.push(`${guestTotal} Guest${guestTotal !== 1 ? 's' : ''}`);

    const dateLabel = searchParams.get('DepartureDate')
        ? moment(searchParams.get('DepartureDate')).format('MMM D, YYYY')
        : null;

    const metaParts = [dateLabel ? `Select dates` : null, guestParts[0]].filter(Boolean);

    return (
        <div className="flight-results-header flight-results-header--full" aria-live="polite">
            <h2 className="flight-results-header__title">
                {totalFlights === 0 ? (
                    'No flights match your filters'
                ) : isFiltered ? (
                    <>Showing {totalFlights} of {total} available flights</>
                ) : (
                    <>Showing {totalFlights} available flight{totalFlights !== 1 ? 's' : ''}</>
                )}
            </h2>
            {metaParts.length > 0 && (
                <p className="flight-results-header__meta">{metaParts.join(' • ')}</p>
            )}
        </div>
    );
}

export default function FlightListingPage() {
    const { isActive, packageConfig } = useHolidayPackageStore();
    const searchParams = useSearchParams();
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [flightList, setFlightList] = useState([]);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [packageSearch, setPackageSearch] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterStuck, setIsFilterStuck] = useState(false);
    const filterSentinelRef = useRef(null);
    useEffect(() => {
        async function getFlights() {
            setIsLoading(true);
            const airTripType = searchParams.get('AirTripType');
            const isPackageMode = searchParams.get("packageMode");
            const isEditMode = searchParams.get("edit");
            if(!isPackageMode || !isEditMode){
                setPackageSearch(true);
            }
            // Build legs array for all flight types
            const legs = [];

            if (airTripType === 'MultiCity') {
                // Build multi-city request with legs array 
                let index = 1;
                while (searchParams.get(`flight${index}_from`)) {
                    legs.push({
                        origin: searchParams.get(`flight${index}_from`),
                        destination: searchParams.get(`flight${index}_to`),
                        departure_date: searchParams.get(`flight${index}_date`)
                    });
                    index++;
                }
            } else if (airTripType === 'Return') {
                // Return trip - 2 legs
                legs.push({
                    origin: searchParams.get('DepartureCode'),
                    destination: searchParams.get('ArrivalCode'),
                    departure_date: searchParams.get('DepartureDate')
                });
                legs.push({
                    origin: searchParams.get('ArrivalCode'),
                    destination: searchParams.get('DepartureCode'),
                    departure_date: searchParams.get('ReturnDate')
                });
            } else {
                // One-way trip - 1 leg
                legs.push({
                    origin: searchParams.get('DepartureCode'),
                    destination: searchParams.get('ArrivalCode'),
                    departure_date: searchParams.get('DepartureDate')
                });
            }

            // Unified params for all flight types
            const params = {
                "legs": legs,
                "adult": Number(searchParams.get('adult')) || 1,
                "child": Number(searchParams.get('child')) || 0,
                "infant": Number(searchParams.get('infant')) || 0,
                "CabinType": searchParams.get('CabinType') || "Y",
                "MaxStopsQuantity": "All",
                "PricingSourceType": "All",
                "IsRefundable": false,
                "RequestOptions": "fifty",
                "NearByAirports": false,
                "AirTripType": airTripType,
                "Target": "Test",
                "ConversationId": "395923377895446"
            };
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search`,
                    {
                        method: 'POST',
                        // cache: 'no-store',
                        headers: {
                            'Content-Type': 'application/json',
                            // 'ngrok-skip-browser-warning': '69420',
                        },
                        body: JSON.stringify(params)
                    });
                const response = await res.json();
                setIsLoading(false)
                // console.log("Flight search response:", response);
                if (response.success) {
                    // Use Duffel response directly
                    setFlightList(response?.data?.flights || []);
                }
            } catch (error) {
                setIsLoading(false)
                console.log(error)
            }
        }
        getFlights();
    }, [searchParams]);

    useEffect(() => {
        const sentinel = filterSentinelRef.current;
        if (!sentinel || isLoading) return;

        let ticking = false;
        const updateStuck = () => {
            setIsFilterStuck(sentinel.getBoundingClientRect().bottom <= 0);
            ticking = false;
        };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateStuck);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        updateStuck();
        return () => window.removeEventListener('scroll', onScroll);
    }, [isLoading]);
    return (
        <div className="flight-listing-page">
            <PackageModeBanner serviceName="flight" />
            <FlightProvider flights={flightList} infiniteScroll>
                {/* Desktop: always visible */}
                <div className='flight-modify-search-wrapper d-none d-md-block'>
                    <div className='container flight-listing-hero-inner'>
                        {packageSearch && (
                            <div className='flight-listing-hero-intro'>
                                <span className='flight-listing-hero-badge'>
                                    <FaPlane size={12} aria-hidden="true" />
                                    Smart Flight Search
                                </span>
                                <h1 className='flight-listing-hero-title'>
                                    Curate Your Perfect Journey in Minutes
                                </h1>
                                <p className='flight-listing-hero-subtitle'>
                                    Discover seamless routes, real-time pricing, and premium flight options tailored to your travel schedule.
                                </p>
                            </div>
                        )}
                        <div className='flight-listing-hero-search'>
                            {!packageSearch ? (
                                <div className='flight-modify-search__card'>
                                    <GeneralPackages packageConfig={packageConfig} isActive={isActive} />
                                </div>
                            ) : (
                                <FlightSearch variant="listing" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile: compact summary + collapsible search */}
                <div className='d-block d-md-none'>
                    <div className='msb-bar'>
                        <div
                            className='d-flex align-items-center gap-3 cursor-pointer'
                            onClick={() => setShowMobileSearch(prev => !prev)}
                        >
                            <div className='msb-icon'>
                                <MdLocationOn size={20} color="#e31c23" />
                            </div>
                            <div className='flex-grow-1' style={{ minWidth: 0 }}>
                                <div className='msb-title'>
                                    {searchParams.get('DepartureCode') || 'Search'}
                                    {searchParams.get('ArrivalCode') && (
                                        <span className='msb-title-secondary'> → {searchParams.get('ArrivalCode')}</span>
                                    )}
                                </div>
                                <div className='msb-subtitle'>
                                    {(() => {
                                        const tripType = searchParams.get('AirTripType');
                                        const label = tripType === 'Return' ? 'Return' : tripType === 'MultiCity' ? 'Multi-City' : 'One Way';
                                        return <span className='msb-subtitle-date' style={{ marginLeft: 0, marginRight: 6 }}>{label} ·</span>;
                                    })()}
                                    <MdPeople size={12} className='msb-subtitle-icon' />
                                    {(() => {
                                        const adults = Number(searchParams.get('adult')) || 0;
                                        const children = Number(searchParams.get('child')) || 0;
                                        const infants = Number(searchParams.get('infant')) || 0;
                                        const parts = [];
                                        if (adults) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
                                        if (children) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
                                        if (infants) parts.push(`${infants} Infant${infants !== 1 ? 's' : ''}`);
                                        return parts.length ? parts.join(', ') : 'Tap to search';
                                    })()}
                                    {searchParams.get('DepartureDate') && (
                                        <span className='msb-subtitle-date'>· {moment(searchParams.get('DepartureDate')).format('DD MMM YYYY')}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                                className='msb-modify-btn'
                            >
                                <MdEdit size={13} />
                                Modify
                            </button>
                        </div>
                    </div>
                    <div
                        className='msb-collapse'
                        style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
                    >
                        <div className='msb-collapse-inner'>
                            {!packageSearch ? (
                                <GeneralPackages packageConfig={packageConfig} isActive={isActive} />
                            ) : (
                                <FlightSearch
                                    variant="listing"
                                    onSearch={() => setShowMobileSearch(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
                {isLoading ? (
                    <div>
                        <FlightListingFullLoader />
                    </div>
                ) : (
                    <div className='container mb-5 flight-listing-results'>
                        <FlightResultCount />

                        <div ref={filterSentinelRef} className="filter-scroll-sentinel d-lg-none" aria-hidden="true" />
                        <div className={`filter-scroll d-flex gap-2 d-lg-none mb-3${isFilterStuck ? ' filter-scroll--stuck' : ''}`}>
                            <button onClick={() => setActiveDrawer('all')} className="filter-pill">
                                Filter By <span className="arrow"><LiaAngleDownSolid /></span>
                            </button>
                        </div>

                        <div className='row flight-listing-layout'>
                            <div className='col-lg-3 col-12'>
                                <div className='filter_box rounded d-none d-lg-block'>
                                    <div className="filter-box-header d-flex justify-content-between fw-bold align-items-center">
                                        Filter By
                                        <MdFilterListAlt />
                                    </div>
                                    <div className="filter-box-body">
                                        <FilterPanelContent showApply />
                                    </div>
                                </div>

                                <Drawer
                                    opened={activeDrawer === 'all'}
                                    onClose={() => setActiveDrawer(null)}
                                    title="Filter By"
                                    position="bottom"
                                    size="90%"
                                    radius="lg"
                                    overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                    classNames={{
                                        content: filterStyles.drawerContent,
                                        header: filterStyles.drawerHeader,
                                        title: filterStyles.drawerTitle,
                                        body: filterStyles.drawerBody,
                                        close: filterStyles.drawerClose,
                                    }}
                                >
                                    <FilterPanelContent
                                        setActiveDrawer={setActiveDrawer}
                                        showApply
                                        onApply={() => setActiveDrawer(null)}
                                    />
                                </Drawer>
                            </div>

                            <div className='col-lg-9 col-12'>
                                <div className='d-none'>
                                    <SortOption />
                                </div>
                                <FlightCard />
                                <FlightListingPaginations />
                            </div>
                        </div>
                    </div>
                )}
            </FlightProvider>
        </div>
    )
}
