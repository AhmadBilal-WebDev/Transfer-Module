'use client'
import React, { useEffect, useState } from "react";
import { Select, Popover } from "@mantine/core";
import { DateInput, DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaMinus, FaPlus, FaTimes, FaPlane, FaCheck, FaBuilding, FaSearch } from "react-icons/fa";
import { AirportList } from "@/util/AirportList";
import { notifications } from "@mantine/notifications";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import moment from "moment";
import { IoIosSwap, IoMdPerson } from "react-icons/io";
import styles from './FlightSearch.module.css';
import listingStyles from './FlightSearchListing.module.css';
import MobileAirportSelector from './MobileAirportSelector';
export default function FlightSearch({ onSearch, variant = 'home' }) {
    const isListing = variant === 'listing';
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [popoverOpened, setPopoverOpened] = useState(false);
    const [breakPoint, setBreakPoint] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile airport selector states
    const [mobileFromSelectorOpen, setMobileFromSelectorOpen] = useState(false);
    const [mobileToSelectorOpen, setMobileToSelectorOpen] = useState(false);

    // Airport dropdown states
    const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
    const [toDropdownOpen, setToDropdownOpen] = useState(false);
    const [fromSearchQuery, setFromSearchQuery] = useState('');
    const [toSearchQuery, setToSearchQuery] = useState('');

    // Multi-city dropdown states
    const [multiCityDropdowns, setMultiCityDropdowns] = useState({});
    const [multiCitySearchQueries, setMultiCitySearchQueries] = useState({});

    // Recent airports state
    const [recentFromAirports, setRecentFromAirports] = useState([]);
    const [recentToAirports, setRecentToAirports] = useState([]);

    const [formData, setFormData] = useState({
        flightType: "OneWay",
        from: "",
        to: "",
        departureDate: null,
        returnDate: null,
        dateRange: [null, null],
        adults: 1,
        children: 0,
        infants: 0,
        cabinClass: "Y",
        cabinClassTitle: "Economy",
    });

    const [multiCityFlights, setMultiCityFlights] = useState([
        { from: "", to: "", departureDate: null },
        { from: "", to: "", departureDate: null }
    ]);

    useEffect(() => {
        setBreakPoint(window.innerWidth <= 700);
        setIsMobile(window.innerWidth <= 768);

        // Load recent airports from localStorage
        const savedRecentFrom = localStorage.getItem('recentFromAirports');
        const savedRecentTo = localStorage.getItem('recentToAirports');
        if (savedRecentFrom) {
            setRecentFromAirports(JSON.parse(savedRecentFrom));
        }
        if (savedRecentTo) {
            setRecentToAirports(JSON.parse(savedRecentTo));
        }

        const handleResize = () => {
            setBreakPoint(window.innerWidth <= 700);
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Keep search fields in sync with URL (browser back/forward, modify search)
    useEffect(() => {
        if (pathname !== '/flights') return;

        const DepartureCode = searchParams.get('DepartureCode');
        const ArrivalCode = searchParams.get('ArrivalCode');
        const DepartureDate = searchParams.get('DepartureDate');
        const adult = Number(searchParams.get('adult'));
        const child = Number(searchParams.get('child'));
        const infant = Number(searchParams.get('infant'));
        const CabinType = searchParams.get('CabinType');
        const AirTripType = searchParams.get('AirTripType');
        const depDate = DepartureDate ? new Date(DepartureDate) : null;
        const retDate = AirTripType === 'Return' && searchParams.get('ReturnDate')
            ? new Date(searchParams.get('ReturnDate'))
            : null;

        setFormData({
            flightType: AirTripType || "OneWay",
            from: DepartureCode || "",
            to: ArrivalCode || "",
            departureDate: AirTripType === 'OneWay' ? depDate : null,
            returnDate: null,
            dateRange: AirTripType === 'Return' ? [depDate, retDate] : [null, null],
            adults: adult || 1,
            children: child || 0,
            infants: infant || 0,
            cabinClass: CabinType || "All",
            cabinClassTitle: CabinType === 'Y' ? 'Economy' :
                CabinType === 'C' ? 'Business' :
                    CabinType === 'F' ? 'First' :
                        CabinType === 'S' ? 'Premium Economy' : 'All',
        });

        setFromSearchQuery('');
        setToSearchQuery('');

        if (AirTripType === 'MultiCity') {
            const legs = [];
            let index = 1;
            while (searchParams.get(`flight${index}_from`)) {
                legs.push({
                    from: searchParams.get(`flight${index}_from`),
                    to: searchParams.get(`flight${index}_to`),
                    departureDate: searchParams.get(`flight${index}_date`)
                        ? new Date(searchParams.get(`flight${index}_date`))
                        : null,
                });
                index++;
            }
            if (legs.length > 0) {
                setMultiCityFlights(legs);
            }
        }
    }, [pathname, searchParams]);
    const router = useRouter();
    const cabinClassOptions = [
        { title: "Economy", value: "Y" },
        { title: "Business", value: "C" },
        { title: "First", value: "F" },
        { title: "Premium Economy", value: "S" }
    ];
    
    // Filter airports based on search query and organize by country
    const filterAirports = (airports, query, selectedCode = null) => {
        let filtered = airports;

        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = airports.filter(airport =>
                airport.airportName.toLowerCase().includes(lowerQuery) ||
                airport.airportCode.toLowerCase().includes(lowerQuery) ||
                airport.cityName.toLowerCase().includes(lowerQuery) ||
                airport.countryName.toLowerCase().includes(lowerQuery)
            );
        }

        // Move selected airport to top if it exists in filtered results
        if (selectedCode) {
            const selectedIndex = filtered.findIndex(a => a.airportCode === selectedCode);
            if (selectedIndex > -1) {
                const selectedAirport = filtered.splice(selectedIndex, 1)[0];
                filtered.unshift(selectedAirport);
            }
        }

        // Group by country
        const groupedByCountry = filtered.reduce((acc, airport) => {
            const country = airport.countryName;
            if (!acc[country]) {
                acc[country] = [];
            }
            acc[country].push(airport);
            return acc;
        }, {});

        // Convert to array of countries with their airports, limit total to 150 airports
        const countriesArray = Object.entries(groupedByCountry)
            .map(([country, airports]) => ({
                country,
                airports: airports.slice(0, 20) // Max 20 airports per country
            }))
            .slice(0, 10); // Max 10 countries

        return countriesArray;
    };

    // Get selected airport details
    const getAirportLabel = (code) => {
        const airport = AirportList.find(a => a.airportCode === code);
        return airport ? `${airport.cityName} (${airport.airportCode})` : '';
    };

    // Add airport to recent list
    const addToRecentAirports = (airportCode, type) => {
        if (!airportCode) return;

        const isFromType = type === 'from';
        const recentList = isFromType ? recentFromAirports : recentToAirports;
        const setRecentList = isFromType ? setRecentFromAirports : setRecentToAirports;
        const storageKey = isFromType ? 'recentFromAirports' : 'recentToAirports';

        // Remove if already exists
        const filteredList = recentList.filter(code => code !== airportCode);
        // Add to beginning
        const newList = [airportCode, ...filteredList].slice(0, 2);

        setRecentList(newList);
        localStorage.setItem(storageKey, JSON.stringify(newList));
    };

    // Custom Airport Dropdown Component
    const AirportDropdown = ({ value, onChange, excludeCode, placeholder, dropdownOpen, setDropdownOpen, searchQuery, setSearchQuery, label, type, withLeftIcon = false }) => {
        const inputPadLeft = withLeftIcon ? '42px' : '14px';
        // Only show recent airports if no search query, otherwise show filtered results
        const getAirportsToDisplay = () => {
            if (searchQuery) {
                // Show filtered results when user is typing
                return filterAirports(
                    excludeCode ? AirportList.filter(a => a.airportCode !== excludeCode) : AirportList,
                    searchQuery,
                    value
                );
            } else {
                // Show recent airports when no search query
                const recentCodes = type === 'from' ? recentFromAirports : recentToAirports;
                if (recentCodes.length > 0) {
                    const recentAirports = recentCodes
                        .map(code => AirportList.find(a => a.airportCode === code))
                        .filter(Boolean)
                        .filter(airport => !excludeCode || airport.airportCode !== excludeCode);

                    if (recentAirports.length > 0) {
                        // Group recent airports by country
                        const groupedByCountry = recentAirports.reduce((acc, airport) => {
                            const country = airport.countryName;
                            if (!acc[country]) {
                                acc[country] = [];
                            }
                            acc[country].push(airport);
                            return acc;
                        }, {});

                        return Object.entries(groupedByCountry).map(([country, airports]) => ({
                            country,
                            airports
                        }));
                    }
                }
                return [];
            }
        };

        const groupedAirports = getAirportsToDisplay();

        // // Lock body scroll on mobile when dropdown is open
        // useEffect(() => {
        //     if (isMobile && dropdownOpen) {
        //         document.body.style.overflow = 'hidden';
        //     } else {
        //         document.body.style.overflow = '';
        //     }

        //     return () => {
        //         document.body.style.overflow = '';
        //     };
        // }, [dropdownOpen]);

        const handleSelect = (airportCode) => {
            onChange(airportCode);
            addToRecentAirports(airportCode, type);
            setDropdownOpen(false);
            setSearchQuery('');
        };

        const handleClear = (e) => {
            e.stopPropagation();
            onChange('');
            setSearchQuery('');
        };

        const handleDropdownOpen = () => {
            setSearchQuery(''); // Clear search when opening dropdown
            setDropdownOpen(true);
        };

        const searchchange = (e) => {
            setSearchQuery(e.target.value);
        }
        const totalAirports = groupedAirports.reduce((sum, group) => sum + group.airports.length, 0);

        // Mobile view - Use fullscreen selector
        if (isMobile) {
            if (isListing) {
                return (
                    <>
                        <div
                            className={`${listingStyles.listingField} ${type === 'from' ? listingStyles.fromField : ''}`}
                            onClick={() => setDropdownOpen(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setDropdownOpen(true);
                                }
                            }}
                        >
                            <div className={listingStyles.fieldIcon}><FaMapMarkerAlt /></div>
                            <div className={listingStyles.fieldBody}>
                                <span className={listingStyles.fieldLabel}>{type === 'from' ? 'LEAVING FROM' : 'GOING TO'}</span>
                                <div className={listingStyles.fieldValue} style={{ position: 'relative', paddingRight: value ? '22px' : 0 }}>
                                    <span className={!value ? listingStyles.fieldValuePlaceholder : ''}>
                                        {value ? getAirportLabel(value) : 'Select airport'}
                                    </span>
                                    {value && (
                                        <button
                                            className={listingStyles.clearButton}
                                            onClick={handleClear}
                                            type="button"
                                            aria-label="Clear selection"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <MobileAirportSelector
                            isOpen={dropdownOpen}
                            onClose={() => setDropdownOpen(false)}
                            onSelect={handleSelect}
                            selectedValue={value}
                            excludeCode={excludeCode}
                            label={label}
                            type={type}
                            recentAirports={type === 'from' ? recentFromAirports : recentToAirports}
                        />
                    </>
                );
            }

            return (
                <>
                    <div className={`form-floating w-100 position-relative ${withLeftIcon ? styles.fieldWithLeftIcon : ''}`}>
                        <input
                            type="text"
                            id="floatingInput"
                            style={{ paddingLeft: inputPadLeft, paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                            className="form-control hotel-date-range"
                            placeholder=" "
                            value={getAirportLabel(value)}
                            onClick={() => setDropdownOpen(true)}
                            readOnly
                        />
                        {value && (
                            <button
                                className={styles.clearButton}
                                onClick={handleClear}
                                type="button"
                                aria-label="Clear selection"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <label style={{ paddingLeft: inputPadLeft }} htmlFor="floatingInput">{label}</label>
                    </div>

                    <MobileAirportSelector
                        isOpen={dropdownOpen}
                        onClose={() => setDropdownOpen(false)}
                        onSelect={handleSelect}
                        selectedValue={value}
                        excludeCode={excludeCode}
                        label={label}
                        type={type}
                        recentAirports={type === 'from' ? recentFromAirports : recentToAirports}
                    />
                </>
            );
        }

        // Desktop popover view
        if (isListing) {
            return (
                <Popover
                    opened={dropdownOpen}
                    onChange={setDropdownOpen}
                    position="bottom-start"
                    width="target"
                    shadow="md"
                    offset={8}
                    withinPortal
                    trapFocus={false}
                    returnFocus={false}
                    clickOutsideEvents={["mouseup", "touchend"]}
                    middlewares={{ flip: false, shift: false }}
                >
                    <Popover.Target>
                        <div
                            className={`${listingStyles.listingField} ${type === 'from' ? listingStyles.fromField : ''}`}
                            onClick={handleDropdownOpen}
                        >
                            <div className={listingStyles.fieldIcon}><FaMapMarkerAlt /></div>
                            <div className={listingStyles.fieldBody}>
                                <span className={listingStyles.fieldLabel}>{type === 'from' ? 'LEAVING FROM' : 'GOING TO'}</span>
                                <div className={listingStyles.fieldValue} style={{ position: 'relative', paddingRight: value ? '22px' : 0 }}>
                                    <span className={!value ? listingStyles.fieldValuePlaceholder : ''}>
                                        {value ? getAirportLabel(value) : 'Select airport'}
                                    </span>
                                    {value && (
                                        <button
                                            className={listingStyles.clearButton}
                                            onClick={handleClear}
                                            type="button"
                                            aria-label="Clear selection"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Popover.Target>
                    <Popover.Dropdown className={styles.customDropdown}>
                        <div className={styles.searchWrapper}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search airports..."
                                value={searchQuery}
                                onChange={searchchange}
                                ref={(node) => {
                                    if (node && dropdownOpen) {
                                        requestAnimationFrame(() => {
                                            node.focus({ preventScroll: true });
                                        });
                                    }
                                }}
                            />
                        </div>
                        <div className={styles.airportList}>
                            {totalAirports > 0 ? (
                                groupedAirports.map((group, groupIndex) => (
                                    <React.Fragment key={group.country}>
                                        <div className={styles.countryHeader}>
                                            {!searchQuery ? (groupIndex === 0 ? 'Recent Searches' : '') : group.country}
                                            {value && group.airports.find(a => a.airportCode === value) && (
                                                <span className={styles.selectedBadge}>Current</span>
                                            )}
                                        </div>
                                        {group.airports.map((airport) => (
                                            <div
                                                key={airport.airportCode}
                                                className={`${styles.airportOption} ${value === airport.airportCode ? styles.selected : ''}`}
                                                onClick={() => handleSelect(airport.airportCode)}
                                            >
                                                <div className={styles.airportIconWrapper}>
                                                    <FaPlane className={styles.airportIcon} />
                                                </div>
                                                <div className={styles.airportDetails}>
                                                    <div className={styles.airportMainInfo}>
                                                        <span className={styles.airportName}>{airport.airportName}</span>
                                                        <span className={styles.airportCode}>({airport.airportCode})</span>
                                                    </div>
                                                    <div className={styles.airportLocation}>
                                                        {airport.cityName}
                                                    </div>
                                                </div>
                                                {value === airport.airportCode && (
                                                    <div className={styles.checkmarkWrapper}>
                                                        <FaCheck className={styles.checkmark} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    {searchQuery ? 'No airports found' : (type === 'from' ? 'Start typing to search leaving airports...' : 'Start typing to search destination airports...')}
                                </div>
                            )}
                        </div>
                    </Popover.Dropdown>
                </Popover>
            );
        }

        return (
            <Popover
                opened={dropdownOpen}
                onChange={setDropdownOpen}
                position="bottom-start"
                width="target"
                shadow="md"
                offset={8}
                withinPortal
                trapFocus={false}
                returnFocus={false}
                clickOutsideEvents={["mouseup", "touchend"]}
                middlewares={{ flip: false, shift: false }}
            >
                <Popover.Target>
                    <div className={`form-floating w-100 position-relative ${withLeftIcon ? styles.fieldWithLeftIcon : ''}`}>
                        <input
                            type="text"
                            id="floatingInput"
                            style={{ paddingLeft: inputPadLeft, paddingRight: value ? '40px' : '12px', cursor: 'pointer' }}
                            className="form-control hotel-date-range"
                            placeholder=" "
                            value={getAirportLabel(value)}
                            onClick={handleDropdownOpen}
                            readOnly
                        />
                        {value && (
                            <button
                                className={styles.clearButton}
                                onClick={handleClear}
                                type="button"
                                aria-label="Clear selection"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <label style={{ paddingLeft: inputPadLeft }} htmlFor="floatingInput">{label}</label>
                    </div>
                </Popover.Target>
                <Popover.Dropdown className={styles.customDropdown}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search airports..."
                            value={searchQuery}
                            onChange={searchchange}
                            ref={(node) => {
                                if (node && dropdownOpen) {
                                    requestAnimationFrame(() => {
                                        node.focus({ preventScroll: true });
                                    });
                                }
                            }}
                        />
                    </div>
                    <div className={styles.airportList}>
                        {totalAirports > 0 ? (
                            groupedAirports.map((group, groupIndex) => (
                                <React.Fragment key={group.country}>
                                    <div className={styles.countryHeader}>
                                        {!searchQuery ? (groupIndex === 0 ? 'Recent Searches' : '') : group.country}
                                        {value && group.airports.find(a => a.airportCode === value) && (
                                            <span className={styles.selectedBadge}>Current</span>
                                        )}
                                    </div>
                                    {group.airports.map((airport) => (
                                        <div
                                            key={airport.airportCode}
                                            className={`${styles.airportOption} ${value === airport.airportCode ? styles.selected : ''}`}
                                            onClick={() => handleSelect(airport.airportCode)}
                                        >
                                            <div className={styles.airportIconWrapper}>
                                                <FaPlane className={styles.airportIcon} />
                                            </div>
                                            <div className={styles.airportDetails}>
                                                <div className={styles.airportMainInfo}>
                                                    <span className={styles.airportName}>{airport.airportName}</span>
                                                    <span className={styles.airportCode}>({airport.airportCode})</span>
                                                </div>
                                                <div className={styles.airportLocation}>
                                                    {airport.cityName}
                                                </div>
                                            </div>
                                            {value === airport.airportCode && (
                                                <div className={styles.checkmarkWrapper}>
                                                    <FaCheck className={styles.checkmark} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                {searchQuery ? 'No airports found' : (type === 'from' ? 'Start typing to search leaving airports...' : 'Start typing to search destination airports...')}
                            </div>
                        )}
                    </div>
                </Popover.Dropdown>
            </Popover>
        );
    };

    const handleChange = (field, value) => {
        if (field === "cabinClass") {
            const selectedOption = cabinClassOptions.find(option => option.title === value);
            if (selectedOption) {
                setFormData((prev) => ({
                    ...prev,
                    cabinClass: selectedOption.value,
                    cabinClassTitle: value,
                }));
            }
        } else if (field === "flightType") {
            // Reset dates when flight type changes
            setFormData((prev) => ({
                ...prev,
                flightType: value,
                departureDate: value === "OneWay" ? null : prev.departureDate,
                dateRange: value === "Return" ? [null, null] : prev.dateRange,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        }

    };

    const handleCountChange = (type, increment = true) => {
        setFormData((prev) => {
            let newValue;
            if (type === 'adults') {
                newValue = increment ? prev.adults + 1 : Math.max(1, prev.adults - 1);
            } else {
                newValue = increment ? prev[type] + 1 : Math.max(0, prev[type] - 1);
            }
            return { ...prev, [type]: newValue };
        });
    };

    // Multi-city handlers
    const getMultiCityMinDate = (index) => {
        if (index <= 0) return new Date();
        const prevDate = multiCityFlights[index - 1]?.departureDate;
        if (!prevDate) return new Date();
        return moment(prevDate).add(1, 'day').startOf('day').toDate();
    };

    const handleMultiCityChange = (index, field, value) => {
        const updatedFlights = multiCityFlights.map((flight) => ({ ...flight }));
        const previousTo = field === 'to' ? updatedFlights[index].to : null;
        updatedFlights[index][field] = value;

        // Chain arrival → next leg departure (user can still change it manually)
        if (field === 'to' && index + 1 < updatedFlights.length) {
            const nextFrom = updatedFlights[index + 1].from;
            if (!nextFrom || nextFrom === previousTo) {
                updatedFlights[index + 1].from = value || '';
            }
        }

        // Later legs must depart after earlier legs — clear invalid subsequent dates
        if (field === 'departureDate') {
            for (let i = index + 1; i < updatedFlights.length; i++) {
                const prevDate = updatedFlights[i - 1]?.departureDate;
                const legDate = updatedFlights[i]?.departureDate;
                if (
                    prevDate &&
                    legDate &&
                    !moment(legDate).startOf('day').isAfter(moment(prevDate).startOf('day'))
                ) {
                    updatedFlights[i].departureDate = null;
                }
            }
        }

        setMultiCityFlights(updatedFlights);
    };

    const addMultiCityFlight = () => {
        if (multiCityFlights.length < 5) {
            const lastFlight = multiCityFlights[multiCityFlights.length - 1];
            setMultiCityFlights([
                ...multiCityFlights,
                { from: lastFlight?.to || '', to: '', departureDate: null },
            ]);
        } else {
            notifications.show({
                title: 'Limit Reached',
                message: 'Maximum 5 flights allowed.',
                autoClose: 2000,
                color: 'orange'
            });
        }
    };

    const removeMultiCityFlight = (index) => {
        if (multiCityFlights.length > 2) {
            const updatedFlights = multiCityFlights.filter((_, i) => i !== index);
            setMultiCityFlights(updatedFlights);
        }
    };

    // Swap function for regular flights
    const handleSwap = () => {
        setFormData((prev) => ({
            ...prev,
            from: prev.to,
            to: prev.from,
        }));
    };

    // Swap function for multi-city flights
    const handleMultiCitySwap = (index) => {
        const updatedFlights = [...multiCityFlights];
        const temp = updatedFlights[index].from;
        updatedFlights[index].from = updatedFlights[index].to;
        updatedFlights[index].to = temp;
        setMultiCityFlights(updatedFlights);
    };

    // Validation logic
    const validateForm = () => {
        if (formData.flightType === "MultiCity") {
            // Validate multi-city flights
            for (let i = 0; i < multiCityFlights.length; i++) {
                const flight = multiCityFlights[i];
                if (!flight.from) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select departure airport for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (!flight.to) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select destination airport for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (flight.from === flight.to) {
                    notifications.show({
                        title: 'Error',
                        message: `Departure and destination airports cannot be the same for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (!flight.departureDate) {
                    notifications.show({
                        title: 'Error',
                        message: `Please select departure date for Flight ${i + 1}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
                if (
                    i > 0 &&
                    multiCityFlights[i - 1].departureDate &&
                    !moment(flight.departureDate).startOf('day').isAfter(
                        moment(multiCityFlights[i - 1].departureDate).startOf('day'),
                    )
                ) {
                    notifications.show({
                        title: 'Error',
                        message: `Flight ${i + 1} must depart after Flight ${i}.`,
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
            }
        } else {
            // Original validation for one-way and return
            if (!formData.from) {
                notifications.show({
                    title: 'Error',
                    message: 'Please select departure airport.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (!formData.to) {
                notifications.show({
                    title: 'Error',
                    message: 'Please select destination airport.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (formData.from === formData.to) {
                notifications.show({
                    title: 'Error',
                    message: 'Departure and destination airports cannot be the same.',
                    autoClose: 2000,
                    color: 'red'
                });
                return false;
            }
            if (formData.flightType === "OneWay") {
                if (!formData.departureDate) {
                    notifications.show({
                        title: 'Error',
                        message: 'Please select departure date.',
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
            } else if (formData.flightType === "Return") {
                if (!formData.dateRange[0] || !formData.dateRange[1]) {
                    notifications.show({
                        title: 'Error',
                        message: 'Please select both departure and return dates.',
                        autoClose: 2000,
                        color: 'red'
                    });
                    return false;
                }
            }
        }

        if (formData.adults < 1) {
            notifications.show({
                title: 'Error',
                message: 'At least one adult required.',
                autoClose: 2000,
                color: 'red'
            });
            return false;
        }
        return true;
    };
    // Handle search button click
    const handleSearch = () => {
        if (validateForm()) {
            if (formData.flightType === "MultiCity") {
                // Build multi-city search params
                const params = new URLSearchParams({
                    adult: formData.adults,
                    child: formData.children,
                    infant: formData.infants,
                    CabinType: formData.cabinClass,
                    AirTripType: formData.flightType,
                });

                // Add each flight segment
                multiCityFlights.forEach((flight, index) => {
                    params.append(`flight${index + 1}_from`, flight.from);
                    params.append(`flight${index + 1}_to`, flight.to);
                    params.append(`flight${index + 1}_date`, moment(flight.departureDate).format("YYYY-MM-DD"));
                });

                if (onSearch) onSearch();
                router.push(`/flights?${params.toString()}`);
            } else {
                const depDate = formData.flightType === "OneWay"
                    ? moment(formData.departureDate).format("YYYY-MM-DD")
                    : moment(formData.dateRange[0]).format("YYYY-MM-DD");

                const retDate = formData.flightType === "Return" && formData.dateRange[1]
                    ? moment(formData.dateRange[1]).format("YYYY-MM-DD")
                    : '';

                const params = new URLSearchParams({
                    DepartureCode: formData.from,
                    ArrivalCode: formData.to,
                    DepartureDate: depDate,
                    ReturnDate: retDate,
                    adult: formData.adults,
                    child: formData.children,
                    infant: formData.infants,
                    CabinType: formData.cabinClass,
                    AirTripType: formData.flightType,
                });
                if (onSearch) onSearch();
                router.push(`/flights?${params.toString()}`);
            }
        }
    };

    const travelersPopoverContent = (
        <div className="p-2">
            <div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Adults</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('adults', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.adults}</span>
                            <button onClick={() => handleCountChange('adults', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Children</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('children', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.children}</span>
                            <button onClick={() => handleCountChange('children', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="e484bb5b7a mt-2">
                    <div className="c5aae0350e">
                        <label className="small">Infant</label>
                    </div>
                    <div className="e301a14002">
                        <div className="e301a14002">
                            <button onClick={() => handleCountChange('infants', false)} className="adult-modal-btn"><FaMinus /></button>
                            <span className="mx-2" aria-hidden="true">{formData.infants}</span>
                            <button onClick={() => handleCountChange('infants', true)} className="adult-modal-btn"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <hr />
                <p className="fw-bold small">Cabin Class</p>
                <select onChange={(e) => handleChange("cabinClass", e.target.value)} value={formData.cabinClassTitle} className="height-25 form-select">
                    {cabinClassOptions.map(option => (
                        <option key={option.value} value={option.title}>{option.title}</option>
                    ))}
                </select>
            </div>
            <button onClick={() => setPopoverOpened(false)} type="button" className="btn mt-3 w-100 btn-outline-success">Done</button>
        </div>
    );

    const travelersLabel = `${formData.adults + formData.children + formData.infants} traveler${formData.adults + formData.children + formData.infants !== 1 ? 's' : ''}, ${formData.cabinClassTitle}`;

    const renderListingTravelers = () => (
        <Popover
            width={300}
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-start"
            withArrow
            shadow="md"
            clickOutsideEvents={["mouseup", "touchend"]}
        >
            <Popover.Target>
                <div className={listingStyles.listingField} onClick={() => setPopoverOpened((o) => !o)}>
                    <div className={listingStyles.fieldIcon}><IoMdPerson /></div>
                    <div className={listingStyles.fieldBody}>
                        <span className={listingStyles.fieldLabel}>PASSENGERS & CLASS</span>
                        <button type="button" className={listingStyles.travelersBtn}>{travelersLabel}</button>
                    </div>
                </div>
            </Popover.Target>
            <Popover.Dropdown>{travelersPopoverContent}</Popover.Dropdown>
        </Popover>
    );

    const renderListingDateField = () => (
        <div className={listingStyles.listingField}>
            <div className={listingStyles.fieldIcon}><FaCalendarAlt /></div>
            <div className={listingStyles.fieldBody}>
                <span className={listingStyles.fieldLabel}>DATES</span>
                <div className={listingStyles.fieldValue}>
                    {formData.flightType === "OneWay" ? (
                        <DateInput
                            variant="unstyled"
                            placeholder="Select date"
                            valueFormat="DD MMM YYYY"
                            value={formData.departureDate}
                            onFocus={(e) => e.target.select()}
                            onChange={(date) => handleChange("departureDate", date)}
                            minDate={new Date()}
                        />
                    ) : (
                        <DatePickerInput
                            variant="unstyled"
                            placeholder="Select dates"
                            valueFormat="DD MMM YYYY"
                            value={formData.dateRange}
                            onChange={(dates) => handleChange("dateRange", dates)}
                            minDate={new Date()}
                            numberOfColumns={breakPoint ? 1 : 2}
                            type="range"
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const renderListingToggle = () => (
        <div className={listingStyles.toggleGroup}>
            <div
                onClick={() => handleChange("flightType", "OneWay")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'OneWay' ? listingStyles.toggleActive : ''}`}
            >
                One-Way
            </div>
            <div
                onClick={() => handleChange("flightType", "Return")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'Return' ? listingStyles.toggleActive : ''}`}
            >
                Return
            </div>
            <div
                onClick={() => handleChange("flightType", "MultiCity")}
                className={`${listingStyles.toggleItem} ${formData.flightType === 'MultiCity' ? listingStyles.toggleActive : ''}`}
            >
                Multi-City
            </div>
        </div>
    );

    if (isListing) {
        if (formData.flightType === "MultiCity") {
            return (
                <div className={listingStyles.wrapper}>
                    {renderListingToggle()}
                    <div className={listingStyles.multiCityCard}>
                        {multiCityFlights.map((flight, index) => (
                            <div key={index} className={listingStyles.multiCityLeg}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="small fw-bold text-muted">Flight {index + 1}</span>
                                    {multiCityFlights.length > 2 && (
                                        <button type="button" className={listingStyles.removeBtn} onClick={() => removeMultiCityFlight(index)}>
                                            <FaTimes /> Remove
                                        </button>
                                    )}
                                </div>
                                <div className={listingStyles.multiCityRow}>
                                    <div style={{ position: 'relative' }}>
                                        <AirportDropdown
                                            value={flight.from}
                                            onChange={(value) => handleMultiCityChange(index, "from", value)}
                                            placeholder="Search airport..."
                                            label="From?"
                                            type="from"
                                            dropdownOpen={multiCityDropdowns[`${index}-from`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-from`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-from`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-from`]: query }))}
                                        />
                                        <div className={listingStyles.swapBtn} onClick={() => handleMultiCitySwap(index)} style={{ cursor: 'pointer' }}>
                                            <IoIosSwap />
                                        </div>
                                    </div>
                                    <AirportDropdown
                                        value={flight.to}
                                        onChange={(value) => handleMultiCityChange(index, "to", value)}
                                        excludeCode={flight.from}
                                        placeholder="Search airport..."
                                        label="To?"
                                        type="to"
                                        dropdownOpen={multiCityDropdowns[`${index}-to`] || false}
                                        setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-to`]: open }))}
                                        searchQuery={multiCitySearchQueries[`${index}-to`] || ''}
                                        setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-to`]: query }))}
                                    />
                                    <div className={listingStyles.listingField}>
                                        <div className={listingStyles.fieldIcon}><FaCalendarAlt /></div>
                                        <div className={listingStyles.fieldBody}>
                                            <span className={listingStyles.fieldLabel}>DATE</span>
                                            <div className={listingStyles.fieldValue}>
                                                <DateInput
                                                    variant="unstyled"
                                                    placeholder="Select date"
                                                    valueFormat="DD MMM YYYY"
                                                    value={flight.departureDate}
                                                    onFocus={(e) => e.target.select()}
                                                    minDate={getMultiCityMinDate(index)}
                                                    onChange={(date) => handleMultiCityChange(index, "departureDate", date)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className={listingStyles.multiCityActions}>
                            <button
                                type="button"
                                className={listingStyles.addFlightBtn}
                                onClick={addMultiCityFlight}
                                disabled={multiCityFlights.length >= 5}
                            >
                                <FaPlus /> Add Another Flight
                            </button>
                            <button className={listingStyles.searchBtn} onClick={handleSearch} type="button" style={{ borderRadius: '999px', padding: '10px 28px' }}>
                                <FaSearch /> Search Flights
                            </button>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            {renderListingTravelers()}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={listingStyles.wrapper}>
                {renderListingToggle()}
                <div className={listingStyles.searchBar}>
                    <div className={listingStyles.fieldsRow}>
                        <div className={listingStyles.routePair}>
                            <AirportDropdown
                                value={formData.from}
                                onChange={(value) => handleChange("from", value)}
                                placeholder="Search airport..."
                                label="Leaving From?"
                                type="from"
                                dropdownOpen={fromDropdownOpen}
                                setDropdownOpen={setFromDropdownOpen}
                                searchQuery={fromSearchQuery}
                                setSearchQuery={setFromSearchQuery}
                            />
                            <button
                                type="button"
                                className={listingStyles.swapBtn}
                                onClick={handleSwap}
                                aria-label="Swap airports"
                            >
                                <IoIosSwap />
                            </button>
                            <AirportDropdown
                                value={formData.to}
                                onChange={(value) => handleChange("to", value)}
                                excludeCode={formData.from}
                                placeholder="Search airport..."
                                label="Going To?"
                                type="to"
                                dropdownOpen={toDropdownOpen}
                                setDropdownOpen={setToDropdownOpen}
                                searchQuery={toSearchQuery}
                                setSearchQuery={setToSearchQuery}
                            />
                        </div>
                        {renderListingDateField()}
                        {renderListingTravelers()}
                    </div>
                    <button className={listingStyles.searchBtn} onClick={handleSearch} type="button">
                        <FaSearch /> Search Flights
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2">
            <div className="d-flex flex-wrap mb-1 gap-3 md-mb-3 justify-content-between align-items-center">
                <div className="flight-type gap-1 gap-md-2 d-flex search-radio-butons align-items-center text-start">
                    <div onClick={(e) => handleChange("flightType", "OneWay")} className={`${formData.flightType === 'OneWay' ? 'active' : ''} small`}>
                        <span>One Way</span>
                    </div>
                    <div onClick={(e) => handleChange("flightType", "Return")} className={`${formData.flightType === 'Return' ? 'active' : ''} small`}>
                        <span>Return</span>
                    </div>
                    <div onClick={(e) => handleChange("flightType", "MultiCity")} className={`${formData.flightType === 'MultiCity' ? 'active' : ''} small`}>
                        <span>Multi-City</span>
                    </div>
                </div>
                {formData.flightType === "MultiCity" && (
                    <div className="traveller ">
                        <Popover
                            width={300}
                            opened={popoverOpened}
                            onChange={setPopoverOpened}
                            position="bottom-start"
                            withArrow
                            shadow="md"
                            clickOutsideEvents={["mouseup", "touchend"]}
                        >
                            <Popover.Target>
                                <div>
                                    <div className="d-flex align-items-center position-relative">
                                        <div className="position-absolute" style={{ left: '12px', zIndex: 10, color: '#222020bb' }}>
                                            <IoMdPerson size={20} />
                                        </div>
                                        <div className="form-floating w-100">
                                            <button id="floatingInput" style={{ paddingLeft: '40px' }} className="btn-sm form-control text-start" onClick={() => setPopoverOpened((o) => !o)}>
                                                {formData.adults + formData.children + formData.infants} traveler{formData.adults + formData.children + formData.infants !== 1 ? 's' : ''}, {formData.cabinClassTitle}
                                            </button>
                                            <label style={{ paddingLeft: '40px' }} htmlFor="floatingInput">Travelers, Cabin class</label>
                                        </div>
                                    </div>
                                    {/* <div className="small flight-traveller-label mt-3 mt-md-0">Travelers, Cabin class</div>
                                <button className="btn-sm text-start" onClick={() => setPopoverOpened((o) => !o)}>
                                    {formData.adults + formData.children + formData.infants} traveler{formData.adults + formData.children + formData.infants !== 1 ? 's' : ''}, {formData.cabinClassTitle}
                                </button> */}
                                </div>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <div className="p-2">
                                    <div>
                                        <div className="e484bb5b7a mt-2">
                                            <div className="c5aae0350e">
                                                <label className="small " >
                                                    Adults
                                                </label>
                                            </div>
                                            <div className="e301a14002">
                                                <div className="e301a14002">
                                                    <button onClick={() => handleCountChange('adults', false)} className="adult-modal-btn" >
                                                        <FaMinus />
                                                    </button>
                                                    <span className="mx-2" aria-hidden="true">
                                                        {formData.adults}
                                                    </span>
                                                    <button onClick={() => handleCountChange('adults', true)} className="adult-modal-btn" >
                                                        <FaPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="e484bb5b7a mt-2">
                                            <div className="c5aae0350e">
                                                <label className="small " >
                                                    Children
                                                </label>
                                            </div>
                                            <div className="e301a14002">
                                                <div className="e301a14002">
                                                    <button onClick={() => handleCountChange('children', false)} className="adult-modal-btn" >
                                                        <FaMinus />
                                                    </button>
                                                    <span className="mx-2" aria-hidden="true">
                                                        {formData.children}
                                                    </span>
                                                    <button onClick={() => handleCountChange('children', true)} className="adult-modal-btn" >
                                                        <FaPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="e484bb5b7a mt-2">
                                            <div className="c5aae0350e">
                                                <label className="small " >
                                                    Infant
                                                </label>
                                            </div>
                                            <div className="e301a14002">
                                                <div className="e301a14002">
                                                    <button onClick={() => handleCountChange('infants', false)} className="adult-modal-btn" >
                                                        <FaMinus />
                                                    </button>
                                                    <span className="mx-2" aria-hidden="true">
                                                        {formData.infants}
                                                    </span>
                                                    <button onClick={() => handleCountChange('infants', true)} className="adult-modal-btn" >
                                                        <FaPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <hr />
                                        <p className="fw-bold small">Cabin Class</p>
                                        <select onChange={(e) => handleChange("cabinClass", e.target.value)} value={formData.cabinClassTitle} className="height-25 form-select">
                                            {cabinClassOptions.map(option => (
                                                <option key={option.value} value={option.title}>{option.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={() => setPopoverOpened(false)} type="button" className="btn mt-3 w-100 btn-outline-success">Done</button>
                                </div>
                            </Popover.Dropdown>
                        </Popover>
                    </div>
                )}
            </div>

            {/* Conditional rendering based on flight type */}
            {formData.flightType === "MultiCity" ? (
                // Multi-City Flight Form
                <div className="mt-1 multiity-flight-search">
                    {multiCityFlights.map((flight, index) => (
                        <div key={index} className="mb-1 position-relative">
                            <div className="d-flex justify-content-end align-items-center mb-2">
                                {/* <h6 className="mb-0 text-success">Flight {index + 1}</h6> */}
                                {multiCityFlights.length > 2 && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger multiity-flight-remove-btn"
                                        onClick={() => removeMultiCityFlight(index)}
                                    >
                                        <FaTimes /> Remove
                                    </button>
                                )}
                            </div>
                            <div className="row gy-2 gx-lg-2 gx-3">
                                <div className="col-lg-4 col-md-6 position-relative">
                                    <div className={`d-flex align-items-center position-relative ${styles.fieldWithLeftIcon}`}>
                                        <span className={styles.leftFieldIcon} aria-hidden="true">
                                            <FaMapMarkerAlt size={16} />
                                        </span>
                                        <AirportDropdown
                                            value={flight.from}
                                            onChange={(value) => handleMultiCityChange(index, "from", value)}
                                            placeholder="Search airport..."
                                            label="From?"
                                            type="from"
                                            withLeftIcon
                                            dropdownOpen={multiCityDropdowns[`${index}-from`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-from`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-from`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-from`]: query }))}
                                        />
                                    </div>
                                    <div className="flight-swap-btn" onClick={() => handleMultiCitySwap(index)} style={{ cursor: 'pointer' }}>
                                        <IoIosSwap />
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 ">
                                    <div className={`d-flex align-items-center position-relative ${styles.fieldWithLeftIcon}`}>
                                        <span className={styles.leftFieldIcon} aria-hidden="true">
                                            <FaMapMarkerAlt size={16} />
                                        </span>
                                        <AirportDropdown
                                            value={flight.to}
                                            onChange={(value) => handleMultiCityChange(index, "to", value)}
                                            excludeCode={flight.from}
                                            placeholder="Search airport..."
                                            label="To?"
                                            type="to"
                                            withLeftIcon
                                            dropdownOpen={multiCityDropdowns[`${index}-to`] || false}
                                            setDropdownOpen={(open) => setMultiCityDropdowns(prev => ({ ...prev, [`${index}-to`]: open }))}
                                            searchQuery={multiCitySearchQueries[`${index}-to`] || ''}
                                            setSearchQuery={(query) => setMultiCitySearchQueries(prev => ({ ...prev, [`${index}-to`]: query }))}
                                        />
                                    </div>

                                </div>
                                <div className="col-lg-4 col-md-6">
                                    <div className={`d-flex align-items-center position-relative ${styles.fieldWithLeftIcon}`}>
                                        <span className={styles.leftFieldIcon} aria-hidden="true">
                                            <FaCalendarAlt size={16} />
                                        </span>
                                        <div className="form-floating w-100">
                                            <DateInput
                                                variant="unstyled"
                                                id="floatingInput"
                                                className="form-control hotel-date-range"
                                                placeholder="Departure Date"
                                                value={flight.departureDate}
                                                onFocus={(e) => e.target.select()}
                                                minDate={getMultiCityMinDate(index)}
                                                onChange={(date) => handleMultiCityChange(index, "departureDate", date)}
                                            />
                                            <label htmlFor="floatingInput">Date</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="d-flex flex-wrap gap-2 justify-content-between multiity-flight-actions">
                        <button
                            type="button"
                            className="btn btn-outline-success"
                            onClick={addMultiCityFlight}
                            disabled={multiCityFlights.length >= 5}
                        >
                            <FaPlus /> Add Another Flight
                        </button>
                        <button className="btn btn-success px-5 bg-color " onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>
            ) : (
                // One-Way and Return Flight Form — Royalane 2-row layout
                <div className="royalaneGrid">
                    <div className="royalaneRow royalaneRowTop">
                        <div className="royalaneField position-relative">
                            <div className="d-flex align-items-center position-relative">
                                <AirportDropdown
                                    value={formData.from}
                                    onChange={(value) => handleChange("from", value)}
                                    placeholder="Search airport..."
                                    label="From"
                                    type="from"
                                    dropdownOpen={fromDropdownOpen}
                                    setDropdownOpen={setFromDropdownOpen}
                                    searchQuery={fromSearchQuery}
                                    setSearchQuery={setFromSearchQuery}
                                />
                            </div>
                            <div className="flight-swap-btn" onClick={handleSwap} style={{ cursor: 'pointer' }} aria-label="Swap airports">
                                <IoIosSwap />
                            </div>
                        </div>
                        <div className="royalaneField position-relative">
                            <div className="d-flex align-items-center position-relative">
                                <AirportDropdown
                                    value={formData.to}
                                    onChange={(value) => handleChange("to", value)}
                                    excludeCode={formData.from}
                                    placeholder="Search airport..."
                                    label="To"
                                    type="to"
                                    dropdownOpen={toDropdownOpen}
                                    setDropdownOpen={setToDropdownOpen}
                                    searchQuery={toSearchQuery}
                                    setSearchQuery={setToSearchQuery}
                                />
                            </div>
                        </div>
                        <div className="royalaneField position-relative">
                            <div className="d-flex align-items-center position-relative">
                                <div className="form-floating w-100">
                                    {formData.flightType === "OneWay" ? (
                                        <DateInput
                                            variant="unstyled"
                                            id="floatingDeparture"
                                            className="form-control hotel-date-range"
                                            placeholder="Date"
                                            valueFormat="DD MMM YYYY"
                                            style={{ paddingLeft: '14px', paddingRight: '40px' }}
                                            value={formData.departureDate}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(date) => handleChange("departureDate", date)}
                                            minDate={new Date()}
                                        />
                                    ) : (
                                        <DateInput
                                            variant="unstyled"
                                            id="floatingDeparture"
                                            className="form-control hotel-date-range"
                                            placeholder="Date"
                                            valueFormat="DD MMM YYYY"
                                            style={{ paddingLeft: '14px', paddingRight: '40px' }}
                                            value={formData.dateRange?.[0] || null}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(date) => handleChange("dateRange", [date, formData.dateRange?.[1] || null])}
                                            minDate={new Date()}
                                        />
                                    )}
                                    <label style={{ paddingLeft: '14px' }} htmlFor="floatingDeparture">Departure</label>
                                </div>
                                <div className="royalaneFieldIconRight" aria-hidden="true">
                                    <FaCalendarAlt size={15} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`royalaneRow ${formData.flightType === "Return" ? "royalaneRowBottom" : "royalaneRowBottomOneWay"}`}>
                        {formData.flightType === "Return" && (
                            <div className="royalaneField position-relative">
                                <div className="d-flex align-items-center position-relative">
                                    <div className="form-floating w-100">
                                        <DateInput
                                            variant="unstyled"
                                            id="floatingReturn"
                                            className="form-control hotel-date-range"
                                            placeholder="Date"
                                            valueFormat="DD MMM YYYY"
                                            style={{ paddingLeft: '14px', paddingRight: '40px' }}
                                            value={formData.dateRange?.[1] || null}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(date) => handleChange("dateRange", [formData.dateRange?.[0] || null, date])}
                                            minDate={formData.dateRange?.[0] || new Date()}
                                        />
                                        <label style={{ paddingLeft: '14px' }} htmlFor="floatingReturn">Return</label>
                                    </div>
                                    <div className="royalaneFieldIconRight" aria-hidden="true">
                                        <FaCalendarAlt size={15} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="royalaneField">
                            <div className="traveller">
                                <Popover
                                    width={300}
                                    opened={popoverOpened}
                                    onChange={setPopoverOpened}
                                    position="bottom-start"
                                    withArrow
                                    shadow="md"
                                    clickOutsideEvents={["mouseup", "touchend"]}
                                >
                                    <Popover.Target>
                                        <div>
                                            <div className="d-flex align-items-center position-relative">
                                                <div className="form-floating w-100">
                                                    <button id="floatingTravelers" type="button" style={{ paddingLeft: '14px', paddingRight: '40px' }} className="btn-sm flight-traveler-btn-size form-control text-start" onClick={() => setPopoverOpened((o) => !o)}>
                                                        {formData.adults + formData.children + formData.infants} traveler{formData.adults + formData.children + formData.infants !== 1 ? 's' : ''}, {formData.cabinClassTitle}
                                                    </button>
                                                    <label style={{ paddingLeft: '14px' }} htmlFor="floatingTravelers">Travelers</label>
                                                </div>
                                                <div className="royalaneFieldIconRight" aria-hidden="true">
                                                    <IoMdPerson size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </Popover.Target>
                                    <Popover.Dropdown>
                                        <div className="p-2">
                                            <div>
                                                <div className="e484bb5b7a mt-2">
                                                    <div className="c5aae0350e">
                                                        <label className="small">Adults</label>
                                                    </div>
                                                    <div className="e301a14002">
                                                        <div className="e301a14002">
                                                            <button onClick={() => handleCountChange('adults', false)} className="adult-modal-btn" type="button">
                                                                <FaMinus />
                                                            </button>
                                                            <span className="mx-2" aria-hidden="true">{formData.adults}</span>
                                                            <button onClick={() => handleCountChange('adults', true)} className="adult-modal-btn" type="button">
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="e484bb5b7a mt-2">
                                                    <div className="c5aae0350e">
                                                        <label className="small">Children</label>
                                                    </div>
                                                    <div className="e301a14002">
                                                        <div className="e301a14002">
                                                            <button onClick={() => handleCountChange('children', false)} className="adult-modal-btn" type="button">
                                                                <FaMinus />
                                                            </button>
                                                            <span className="mx-2" aria-hidden="true">{formData.children}</span>
                                                            <button onClick={() => handleCountChange('children', true)} className="adult-modal-btn" type="button">
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="e484bb5b7a mt-2">
                                                    <div className="c5aae0350e">
                                                        <label className="small">Infant</label>
                                                    </div>
                                                    <div className="e301a14002">
                                                        <div className="e301a14002">
                                                            <button onClick={() => handleCountChange('infants', false)} className="adult-modal-btn" type="button">
                                                                <FaMinus />
                                                            </button>
                                                            <span className="mx-2" aria-hidden="true">{formData.infants}</span>
                                                            <button onClick={() => handleCountChange('infants', true)} className="adult-modal-btn" type="button">
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <hr />
                                                <p className="fw-bold small">Cabin Class</p>
                                                <select onChange={(e) => handleChange("cabinClass", e.target.value)} value={formData.cabinClassTitle} className="height-25 form-select">
                                                    {cabinClassOptions.map(option => (
                                                        <option key={option.value} value={option.title}>{option.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button onClick={() => setPopoverOpened(false)} type="button" className="btn mt-3 w-100 btn-outline-success">Done</button>
                                        </div>
                                    </Popover.Dropdown>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <div className="royalaneSearchBtnWrap">
                        <button className="btn btn-success search-btn-styling-home royalaneSearchBtn bg-color w-100" onClick={handleSearch} type="button">
                            <FaSearch /> Search Flights
                        </button>
                    </div>
                </div>
            )
            }

        </div >
    );
}
