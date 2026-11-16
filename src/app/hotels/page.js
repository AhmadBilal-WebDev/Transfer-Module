'use client'
import { useEffect, useState } from "react";
import { MdFilterListAlt, MdEdit, MdLocationOn, MdPeople } from "react-icons/md";
import SearchBar from '@/components/Hotels/HotelListing/Filters/SearchBar';
import HotelCard from '@/components/Hotels/HotelListing/HotelCard';
import PriceRange from '@/components/Hotels/HotelListing/Filters/PriceRange';
import SortOption from '@/components/Hotels/HotelListing/Filters/SortOption';
import StarFilter from '@/components/Hotels/HotelListing/Filters/StarFilter';
import MealType from '@/components/Hotels/HotelListing/Filters/MealType';
import ResetFilter from "@/components/Hotels/HotelListing/Filters/ResetFilter";
import { HotelListProvider } from '@/components/Hotels/HotelListing/HotelListingContext';
import HotelListingPaginations from '@/components/Hotels/HotelListing/HotelListingPaginations';
import { useSearchParams } from "next/navigation";
import HotelCardLoader from "@/components/Loader/HotelCardLoader";
import HotelModify from "@/components/Home/Search/ModifySearch/HotelModify";
import { useQuery } from '@tanstack/react-query';
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import moment from "moment";
import { FaHotel } from "react-icons/fa";
export default function Page() {
    const [progress, setProgress] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const searchParams = useSearchParams();
    const city = searchParams.get("city");
    const countryCode = searchParams.get("code");
    const currency = searchParams.get("currency");
    const check_in = searchParams.get("checkIn");
    const check_out = searchParams.get("checkOut");
    const clientNationality = searchParams.get("nationality");
    const lat = searchParams.get("lat");
    const long = searchParams.get("lng");
    const location = searchParams.get("location");
    const country = searchParams.get("country");
    const place = searchParams.get("place");
    const rooms = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('searchRoomSelection')) || [] : [];
    const totalAdults = rooms.reduce((acc, room) => acc + (room.adults || 0), 0);
    const totalChildren = rooms.reduce((acc, room) => acc + (room.children?.length || 0), 0);
    const queryParams = { city, countryCode, currency, check_in, check_out, lat, long, rooms, location, country, clientNationality };
    const { data: hotelsList = [], isLoading, isError, error } = useQuery({
        queryKey: ['hotels', queryParams],
        queryFn: fetchHotelsFn,
        enabled: !!city && !!check_in && !!check_out,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        cacheTime: 1000 * 60 * 20,
        staleTime: 20 * 60 * 1000
    });

    useEffect(() => {
        // Check screen size on mount and resize
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 600);
            return () => clearInterval(interval);
        } else {
            setProgress(100);
        }
    }, [isLoading]);
    
    return (
        <div>
            <HotelListProvider hotels={hotelsList} place={place}>
                {/* Desktop: hero + floating search */}
                <div className="hotel-search-modify d-none d-md-block">
                    <div className="container hotel-listing-hero-inner">
                        <div className="hotel-listing-hero-intro">
                            <span className="hotel-listing-hero-badge">
                                <FaHotel size={12} aria-hidden="true" />
                                Curate Your Stay
                            </span>
                            <h1 className="hotel-listing-hero-title">
                                Curate Your Luxury Suite in Minutes
                            </h1>
                            <p className="hotel-listing-hero-subtitle">
                                Discover a modern, high-end escape tailored to your exact tastes. Exceptional architecture, intuitive spaces, and seamless booking await.
                            </p>
                        </div>
                        <div className="hotel-listing-hero-search">
                            <HotelModify />
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
                            {/* Icon */}
                            <div className='msb-icon'>
                                <MdLocationOn size={20} color="#0F63BD" />
                            </div>

                            {/* Info */}
                            <div className='flex-grow-1' style={{ minWidth: 0 }}>
                                <div className='msb-title'>
                                    {location || city || 'Search Hotels'}
                                </div>
                                <div className='msb-subtitle'>
                                    <MdPeople size={12} className='msb-subtitle-icon' />
                                    {totalAdults > 0
                                        ? `${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}${totalChildren > 0 ? `, ${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}` : ''}`
                                        : 'Tap to search'}
                                    {check_in && check_out && (
                                        <span className='msb-subtitle-date'>· {moment(check_in).format('DD-MM-YYYY')} → {moment(check_out).format('DD-MM-YYYY')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Modify button */}
                            <button
                                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                                className='msb-modify-btn'
                            >
                                <MdEdit size={13} />
                                Modify
                            </button>
                        </div>
                    </div>

                    {/* Smooth collapsible search panel */}
                    <div
                        className='msb-collapse'
                        style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
                    >
                        <div className='msb-collapse-inner'>
                            <HotelModify onSearch={() => setShowMobileSearch(false)} />
                        </div>
                    </div>
                </div>

                <div className='container mb-5 hotel-listing-results'>
                    <div className='row'>
                        <div className='col-md-3 col-sm-12 col-12'>
                            {/* Mobile: Filter Pills */}
                            <div className="filter-scroll d-flex gap-2 d-md-none mb-1 hotel-filter-mobile-pills">
                                <button onClick={() => setActiveDrawer('name')} className="filter-pill hotel-filter-pill">
                                    Name <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('sort')} className="filter-pill hotel-filter-pill">
                                    Sort By <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('price')} className="filter-pill hotel-filter-pill">
                                    Price <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('rating')} className="filter-pill hotel-filter-pill">
                                    Rating <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>

                                <button onClick={() => setActiveDrawer('meal')} className="filter-pill hotel-filter-pill">
                                    Meal Type <span className="arrow"><LiaAngleDownSolid /></span>
                                </button>
                            </div>

                            {/* Desktop: Sidebar Filters */}
                            <aside className='filter_box hotel-filter-sidebar d-none d-md-block'>
                                <div className="hotel-filter-sidebar__header">
                                    <p className="hotel-filter-sidebar__title">Filter By</p>
                                    <MdFilterListAlt className="hotel-filter-sidebar__icon" size={20} />
                                </div>
                                <div className="hotel-filter-sidebar__section">
                                    <PriceRange />
                                </div>
                                <div className="hotel-filter-sidebar__section">
                                    <SearchBar />
                                </div>
                                <div className="hotel-filter-sidebar__section">
                                    <SortOption />
                                </div>
                                <div className="hotel-filter-sidebar__section">
                                    <StarFilter />
                                </div>
                                <div className="hotel-filter-sidebar__section">
                                    <MealType />
                                </div>
                                <div className="hotel-filter-sidebar__footer">
                                    <ResetFilter setActiveDrawer={setActiveDrawer} variant="apply" />
                                </div>
                            </aside>

                            {/* Mobile: Individual Filter Drawers */}
                            <Drawer
                                opened={activeDrawer === 'name'}
                                onClose={() => setActiveDrawer(null)}
                                title="Search By Name"
                                position="bottom"
                                size="auto"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                transitionProps={{ duration: 200 }}
                                withinPortal={true}
                                lockScroll={true}
                                trapFocus={false}
                                classNames={{ content: 'hotel-filter-drawer' }}
                                styles={{
                                    title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
                                    header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
                                    body: { paddingTop: '1rem' },
                                }}
                            >
                                <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
                                    <SearchBar />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} variant="drawer-apply" />
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'sort'}
                                onClose={() => setActiveDrawer(null)}
                                title="Order By"
                                position="bottom"
                                size="auto"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                                styles={{
                                    title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
                                    header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
                                    body: { paddingTop: '1rem' },
                                }}
                            >
                                <div className="mb-2">
                                    <SortOption />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} variant="drawer-apply" />
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'price'}
                                onClose={() => setActiveDrawer(null)}
                                title="Your Budget"
                                position="bottom"
                                size="auto"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                                styles={{
                                    title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
                                    header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
                                    body: { paddingTop: '1rem' },
                                }}
                            >
                                <div className="mb-2">
                                    <PriceRange />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} variant="drawer-apply" />
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'rating'}
                                onClose={() => setActiveDrawer(null)}
                                title="Property Rating"
                                position="bottom"
                                size="auto"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                                styles={{
                                    title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
                                    header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
                                    body: { paddingTop: '1rem' },
                                }}
                            >
                                <div className="mb-2">
                                    <StarFilter />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} variant="drawer-apply" />
                            </Drawer>

                            <Drawer
                                opened={activeDrawer === 'meal'}
                                onClose={() => setActiveDrawer(null)}
                                title="Meal Type"
                                position="bottom"
                                size="auto"
                                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                                classNames={{ content: 'hotel-filter-drawer' }}
                                styles={{
                                    title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
                                    header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
                                    body: { paddingTop: '1rem' },
                                }}
                            >
                                <div className="mb-2">
                                    <MealType />
                                </div>
                                <ResetFilter setActiveDrawer={setActiveDrawer} variant="drawer-apply" />
                            </Drawer>
                        </div>
                        <div className='col-md-9 col-sm-12 col-12'>
                            {isLoading && (
                                <div className="hotel-search-loader mb-3">
                                    <div className="hotel-search-loader__header">
                                        <div className="hotel-search-loader__spinner" role="status" aria-label="Loading">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="hotel-search-loader__text">
                                            <p className="hotel-search-loader__title">Searching Hotels</p>
                                            <p className="hotel-search-loader__subtitle">Finding the best stays for you…</p>
                                        </div>
                                        <span className="hotel-search-loader__percent">{progress}%</span>
                                    </div>
                                    <div className="hotel-search-loader__track">
                                        <div
                                            className="hotel-search-loader__bar"
                                            role="progressbar"
                                            aria-valuenow={progress}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {isLoading && <HotelCardLoader />}
                            <HotelCard isLoading={isLoading} />
                            <HotelListingPaginations />
                        </div>
                    </div>
                </div>
            </HotelListProvider>
        </div>
    )
}

async function fetchHotelsFn({ queryKey }) {
    const [, params] = queryKey; // queryKey = ['hotels', { ...params }]
    const { city, countryCode, currency, check_in, check_out, lat, long, rooms, location, country , clientNationality } = params;
    const searchData = { city, countryCode, currency, check_in, check_out, lat, long, location, country, clientNationality };
    localStorage.setItem('HotelSearchData', JSON.stringify(searchData));
    const request = {
        "checkIn": check_in,
        "checkOut": check_out,
        "destination": {
            "city": city,
            "latitude": lat,
            "longitude": long,
            "countryCode": countryCode,
            "clientNationality": clientNationality
        },
        "currency": currency,
        "rooms": rooms
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/search`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            // 'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        throw new Error('Failed to fetch hotels');
    }

    const data = await res.json();
    if (!data.success) {
        return [];
    }
    return data.data?.hotels || [];
}
