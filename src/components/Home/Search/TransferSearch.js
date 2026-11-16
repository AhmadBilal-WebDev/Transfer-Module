"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DateTimePicker, DatePicker } from "@mantine/dates";
import { Modal, Popover } from "@mantine/core";
import "@mantine/dates/styles.css";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import moment from "moment";
import { FaMinus, FaPlus, FaChevronDown, FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaPlaneDeparture, FaUsers, FaCheck } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { MdOutlineEventRepeat, MdSwapVert } from "react-icons/md";
import TransferLocationSelector from './TransferLocationSelector';
import { usePathname, useSearchParams } from "next/navigation";
import homeStyles from './TransferSearchHome.module.css';
import listingStyles from './TransferSearchListing.module.css';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';
import { geist } from '@/lib/fonts';
import { parseCoord as parseCoordValue } from '@/util/transferLocationRestrict';

const toPackageTransferLoc = (loc) => ({
    location: loc?.name || loc?.city || '',
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    city: loc?.city || loc?.name || '',
    country: loc?.country || '',
    code: loc?.code || '',
});

const emptyLocation = {
    id: "",
    name: "",
    lat: null,
    lng: null,
    city: "",
    country: ""
};

/** Google LatLng may expose lat/lng as functions; never coerce null → 0 (Number(null) === 0). */
const parseCoord = (value) => {
    if (typeof value === 'function') {
        try {
            return parseCoordValue(value());
        } catch {
            return null;
        }
    }
    return parseCoordValue(value);
};

const hasValidCoords = (loc) => {
    const lat = parseCoord(loc?.lat);
    const lng = parseCoord(loc?.lng);
    // 0,0 is never a real transfer city pick — treat as missing
    if (lat == null || lng == null) return false;
    if (lat === 0 && lng === 0) return false;
    return true;
};

const defaultPassengerState = {
    adults: 1,
    children: 0,
    infants: 0,
};

function getPassengerLabel(adults, children, infants) {
    const parts = [];
    const a = Number(adults) || 0;
    const c = Number(children) || 0;
    const i = Number(infants) || 0;
    if (a > 0) parts.push(`${a} Adult${a !== 1 ? 's' : ''}`);
    if (c > 0) parts.push(`${c} Child${c !== 1 ? 'ren' : ''}`);
    if (i > 0) parts.push(`${i} Infant${i !== 1 ? 's' : ''}`);
    return parts.length ? parts.join(', ') : 'Select passengers';
}

/** Keep DateTimePicker + its time spin inputs ≥16px so iOS won't zoom on focus */
const TRANSFER_DATETIME_DISPLAY = 'DD MMM YYYY, hh:mm A';

const transferDateTimeProps = {
    size: 'md',
    styles: {
        input: { fontSize: 16 },
    },
    timePickerProps: {
        format: '12h',
        styles: {
            field: { fontSize: 16 },
            fieldsRoot: { fontSize: 16 },
        },
    },
};

const normalizePickerDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toTwelveHourParts = (date) => ({
    hour: Number(moment(date).format('h')),
    minute: moment(date).minute(),
    period: moment(date).format('A'),
});

const toTwentyFourHour = (hour12, minute, period) => {
    const normalizedHour = Number(hour12) || 12;
    const normalizedMinute = Number(minute) || 0;
    let hours24 = normalizedHour % 12;
    if (period === 'PM') {
        hours24 += 12;
    }
    return { hours: hours24, minutes: normalizedMinute };
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

function TransferDateTimeField({
    id,
    label,
    value,
    onChange,
    minDate = new Date(),
    disabled = false,
    isMobile,
    variant = 'home',
    className = '',
    style,
    defaultCalendarDate,
    placeholder = 'Select date & time',
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [draftDate, setDraftDate] = useState(null);
    const [calendarDate, setCalendarDate] = useState(null);
    const [draftHour, setDraftHour] = useState(12);
    const [draftMinute, setDraftMinute] = useState(0);
    const [draftPeriod, setDraftPeriod] = useState('AM');

    const openModal = () => {
        if (disabled) return;
        if (typeof document !== 'undefined' && document.activeElement?.blur) {
            document.activeElement.blur();
        }

        if (value) {
            const parts = toTwelveHourParts(value);
            const nextDate = moment(value).toDate();
            setDraftDate(nextDate);
            setCalendarDate(nextDate);
            setDraftHour(parts.hour);
            setDraftMinute(parts.minute);
            setDraftPeriod(parts.period);
        } else {
            const base = moment.max(
                moment(defaultCalendarDate || minDate),
                moment(),
            ).startOf('minute');
            const parts = toTwelveHourParts(base.toDate());
            setDraftDate(base.toDate());
            setCalendarDate(base.toDate());
            setDraftHour(parts.hour);
            setDraftMinute(parts.minute);
            setDraftPeriod(parts.period);
        }
        setModalOpen(true);
    };

    const applySelection = () => {
        if (!draftDate) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select both date and time.',
                color: 'red',
            });
            return;
        }

        const { hours, minutes } = toTwentyFourHour(draftHour, draftMinute, draftPeriod);
        const combined = moment(normalizePickerDate(draftDate))
            .hour(hours)
            .minute(minutes)
            .second(0)
            .millisecond(0)
            .toDate();

        if (combined < minDate) {
            notifications.show({
                title: 'Validation Error',
                message: 'Selected date and time cannot be in the past.',
                color: 'red',
            });
            return;
        }

        onChange(combined);
        setModalOpen(false);
    };

    const displayValue = value ? moment(value).format(TRANSFER_DATETIME_DISPLAY) : '';

    if (!isMobile) {
        const picker = (
            <DateTimePicker
                {...transferDateTimeProps}
                value={value}
                onChange={onChange}
                variant="unstyled"
                id={id}
                className={variant === 'home' ? 'form-control hotel-date-range' : className}
                placeholder={placeholder}
                minDate={minDate}
                date={defaultCalendarDate}
                readOnly={disabled}
                valueFormat={TRANSFER_DATETIME_DISPLAY}
                style={style}
                disabled={disabled}
            />
        );

        if (variant === 'home') {
            return (
                <>
                    {picker}
                    <label htmlFor={id} style={{ paddingLeft: '14px' }}>
                        {label}
                    </label>
                </>
            );
        }

        return picker;
    }

    const triggerClassName = [
        variant === 'home' ? 'form-control hotel-date-range transfer-mobile-datetime-trigger' : className,
        !displayValue ? 'transfer-mobile-datetime-empty' : '',
    ].filter(Boolean).join(' ');

    const trigger = variant === 'home' ? (
        <>
            <input
                type="text"
                id={id}
                name={id}
                className={triggerClassName}
                value={displayValue}
                readOnly
                inputMode="none"
                onClick={openModal}
                onFocus={(e) => e.target.blur()}
                placeholder=" "
                disabled={disabled}
                style={style}
                aria-label={label}
            />
            <label htmlFor={id} style={{ paddingLeft: '14px' }}>
                {label}
            </label>
        </>
    ) : (
        <button
            type="button"
            id={id}
            className={`${className} transfer-mobile-datetime-trigger transfer-mobile-datetime-listing${!displayValue ? ' transfer-mobile-datetime-empty' : ''}`}
            onClick={openModal}
            disabled={disabled}
            style={style}
        >
            {displayValue || placeholder}
        </button>
    );

    return (
        <>
            {trigger}
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={label || 'Select date & time'}
                centered
                lockScroll
                withinPortal
                size="auto"
                radius="lg"
                padding="md"
                zIndex={20000}
                overlayProps={{
                    backgroundOpacity: 0.45,
                    blur: 2,
                }}
                classNames={{
                    content: 'transfer-mobile-datetime-modal',
                    body: 'transfer-mobile-datetime-modal-body',
                    header: 'transfer-mobile-datetime-modal-header',
                    title: 'transfer-mobile-datetime-modal-title',
                }}
            >
                <div className="transfer-mobile-datetime-picker">
                    <DatePicker
                        value={draftDate}
                        onChange={(date) => {
                            const next = normalizePickerDate(date);
                            setDraftDate(next);
                            if (next) setCalendarDate(next);
                        }}
                        minDate={minDate}
                        date={calendarDate || draftDate || minDate}
                        onDateChange={setCalendarDate}
                        size="md"
                        styles={{
                            day: {
                                '--day-size': '40px',
                            },
                        }}
                    />
                </div>
                <label className="transfer-mobile-time-label" htmlFor={`${id}-hour`}>
                    Time
                </label>
                <div className="transfer-mobile-time-row">
                    <select
                        id={`${id}-hour`}
                        value={draftHour}
                        onChange={(e) => setDraftHour(Number(e.target.value))}
                        className="transfer-mobile-time-select"
                        aria-label="Hour"
                    >
                        {HOUR_OPTIONS.map((hour) => (
                            <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                    <span className="transfer-mobile-time-separator">:</span>
                    <select
                        id={`${id}-minute`}
                        value={draftMinute}
                        onChange={(e) => setDraftMinute(Number(e.target.value))}
                        className="transfer-mobile-time-select"
                        aria-label="Minute"
                    >
                        {MINUTE_OPTIONS.map((minute) => (
                            <option key={minute} value={minute}>
                                {String(minute).padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                    <select
                        id={`${id}-period`}
                        value={draftPeriod}
                        onChange={(e) => setDraftPeriod(e.target.value)}
                        className="transfer-mobile-time-select transfer-mobile-time-period"
                        aria-label="AM or PM"
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
                <button
                    type="button"
                    className="transfer-mobile-datetime-apply"
                    onClick={applySelection}
                >
                    Done
                </button>
            </Modal>
        </>
    );
}

export default function TransferSearch({ onSearch, variant }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isActive, updateServiceSearchData } = useHolidayPackageStore();
    const isListing = variant === 'listing';
    const [isMobile, setIsMobile] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [popoverOpened, setPopoverOpened] = useState(false);
    const [formData, setFormData] = useState({
        tripType: "one-way",
        from: { ...emptyLocation },
        to: { ...emptyLocation },
        pickupDateTime: null,
        dropoffDateTime: null,
        ...defaultPassengerState,
    });

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        if (pathname === '/transfers') {
            const transferType = searchParams.get('transferType');
            const pickupLatitude = searchParams.get('pickupLatitude') || searchParams.get('fromLat');
            const pickupLongitude = searchParams.get('pickupLongitude') || searchParams.get('fromLng');
            const pickupLocation = searchParams.get('pickupLocation');
            const fromCountry = searchParams.get('fromCountry');
            const dropoffLatitude = searchParams.get('dropoffLatitude') || searchParams.get('toLat');
            const dropoffLongitude = searchParams.get('dropoffLongitude') || searchParams.get('toLng');
            const dropoffLocation = searchParams.get('dropoffLocation');
            const toCountry = searchParams.get('toCountry');
            const pickupDate = searchParams.get('pickupDate');
            const pickupTime = searchParams.get('pickupTime');
            const dropoffDate = searchParams.get('dropoffDate');
            const dropoffTime = searchParams.get('dropoffTime');
            const passengers = searchParams.get('passengers');
            const adultsParam = searchParams.get('adults');
            const childrenParam = searchParams.get('children');
            const infantsParam = searchParams.get('infants');

            if (transferType || pickupLatitude || dropoffLatitude || pickupDate) {
                const adults = adultsParam != null
                    ? Math.max(1, Number(adultsParam) || 1)
                    : Math.max(1, Number(passengers) || 1);
                setFormData({
                    tripType: transferType || "one-way",
                    from: {
                        id: "",
                        name: pickupLocation || "",
                        lat: pickupLatitude ? parseFloat(pickupLatitude) : null,
                        lng: pickupLongitude ? parseFloat(pickupLongitude) : null,
                        city: pickupLocation || "",
                        country: fromCountry || ""
                    },
                    to: {
                        id: "",
                        name: dropoffLocation || "",
                        lat: dropoffLatitude ? parseFloat(dropoffLatitude) : null,
                        lng: dropoffLongitude ? parseFloat(dropoffLongitude) : null,
                        city: dropoffLocation || "",
                        country: toCountry || ""
                    },
                    pickupDateTime: pickupDate && pickupTime ? moment(`${pickupDate} ${pickupTime}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm']).toDate() : null,
                    dropoffDateTime: dropoffDate && dropoffTime ? moment(`${dropoffDate} ${dropoffTime}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm']).toDate() : null,
                    adults,
                    children: Math.max(0, Number(childrenParam) || 0),
                    infants: Math.max(0, Number(infantsParam) || 0),
                });
            } else {
                setFormData({
                    tripType: "one-way",
                    from: { ...emptyLocation },
                    to: { ...emptyLocation },
                    pickupDateTime: null,
                    dropoffDateTime: null,
                    ...defaultPassengerState,
                });
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pathname, searchParams]);

    const handleChange = (field, value) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'pickupDateTime') {
                next.dropoffDateTime = null;
            }
            if (field === 'tripType' && value === 'one-way') {
                next.dropoffDateTime = null;
            }
            return next;
        });
    };

    const handleSwapLocations = () => {
        setFormData((prev) => ({
            ...prev,
            from: prev.to,
            to: prev.from,
        }));
    };

    const handleCountChange = (type, increment) => {
        setFormData((prev) => {
            const next = { ...prev };
            if (type === 'adults') {
                next.adults = increment
                    ? Math.min(16, prev.adults + 1)
                    : Math.max(1, prev.adults - 1);
            } else if (type === 'children') {
                next.children = increment
                    ? Math.min(16, prev.children + 1)
                    : Math.max(0, prev.children - 1);
            } else if (type === 'infants') {
                next.infants = increment
                    ? Math.min(16, prev.infants + 1)
                    : Math.max(0, prev.infants - 1);
            }
            return next;
        });
    };

    const handleFromLocationChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            from: { ...emptyLocation, name },
        }));
    };

    const handleToLocationChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            to: { ...emptyLocation, name },
        }));
    };

    const handleFromPlaceSelected = useCallback((place) => {
        if (!place.geometry) {
            console.error('No geometry in place object');
            return;
        }

        const lat = parseCoord(place.geometry?.location?.lat);
        const lng = parseCoord(place.geometry?.location?.lng);
        if (lat == null || lng == null) {
            notifications.show({
                title: 'Location Error',
                message: 'Could not get coordinates for this pickup location. Please select again.',
                color: 'red',
            });
            return;
        }
        const placeId = place.place_id;
        const placeName = place.displayName || place.formatted_address || place.name;

        let city = "";
        let country = "";

        if (place.address_components) {
            place.address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('postal_town')) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            });
        }

        setFormData((prev) => ({
            ...prev,
            from: {
                id: placeId,
                name: placeName,
                lat,
                lng,
                city,
                country,
            },
        }));
    }, []);

    const handleToPlaceSelected = useCallback((place) => {
        if (!place.geometry) {
            console.error('No geometry in place object');
            return;
        }

        const lat = parseCoord(place.geometry?.location?.lat);
        const lng = parseCoord(place.geometry?.location?.lng);
        if (lat == null || lng == null) {
            notifications.show({
                title: 'Location Error',
                message: 'Could not get coordinates for this drop-off location. Please select again.',
                color: 'red',
            });
            return;
        }
        const placeId = place.place_id;
        const placeName = place.displayName || place.formatted_address || place.name;

        let city = "";
        let country = "";

        if (place.address_components) {
            place.address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('postal_town')) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            });
        }

        setFormData((prev) => ({
            ...prev,
            to: {
                id: placeId,
                name: placeName,
                lat,
                lng,
                city,
                country,
            },
        }));
    }, []);

    const validateForm = () => {
        if (!formData.from.name) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select a pickup location',
                color: 'red',
            });
            return false;
        }

        if (!hasValidCoords(formData.from)) {
            notifications.show({
                title: 'Validation Error',
                message: isLoadingDetail
                    ? 'Please wait while we load the pickup location details'
                    : 'Please select a pickup location from the list so we can get its coordinates',
                color: 'red',
            });
            return false;
        }

        if (!formData.to.name && formData.tripType !== 'all-round') {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select a drop-off location',
                color: 'red',
            });
            return false;
        }

        if (
            (formData.tripType !== 'all-round' || formData.to.name) &&
            !hasValidCoords(formData.to)
        ) {
            notifications.show({
                title: 'Validation Error',
                message: isLoadingDetail
                    ? 'Please wait while we load the drop-off location details'
                    : 'Please select a drop-off location from the list so we can get its coordinates',
                color: 'red',
            });
            return false;
        }

        if (!formData.adults || Number(formData.adults) < 1) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select at least 1 adult',
                color: 'red',
            });
            return false;
        }

        if (!formData.pickupDateTime) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select pickup date and time',
                color: 'red',
            });
            return false;
        }

        if (formData.tripType === 'return' && !formData.dropoffDateTime) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please select return date and time for return trip',
                color: 'red',
            });
            return false;
        }

        const now = new Date();
        if (formData.pickupDateTime < now) {
            notifications.show({
                title: 'Validation Error',
                message: 'Pickup date and time cannot be in the past',
                color: 'red',
            });
            return false;
        }

        if (formData.tripType === 'return' && formData.dropoffDateTime) {
            if (formData.dropoffDateTime <= formData.pickupDateTime) {
                notifications.show({
                    title: 'Validation Error',
                    message: 'Return date and time must be after pickup date and time',
                    color: 'red',
                });
                return false;
            }
        }

        return true;
    };

    const handleSearch = () => {
        if (!validateForm()) {
            return;
        }

        const adults = Number(formData.adults) || 1;
        const children = Number(formData.children) || 0;
        const infants = Number(formData.infants) || 0;
        const totalPassengers = adults + children + infants;

        const fromLat = parseCoord(formData.from.lat);
        const fromLng = parseCoord(formData.from.lng);
        const toLat = parseCoord(formData.to.lat);
        const toLng = parseCoord(formData.to.lng);

        if (fromLat == null || fromLng == null || (fromLat === 0 && fromLng === 0)) {
            notifications.show({
                title: 'Validation Error',
                message: 'Pickup coordinates are missing. Please select pickup from the list again.',
                color: 'red',
            });
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('transferType', formData.tripType);
        queryParams.append('pickupLatitude', String(fromLat));
        queryParams.append('pickupLongitude', String(fromLng));
        queryParams.append('fromLat', String(fromLat));
        queryParams.append('fromLng', String(fromLng));
        queryParams.append('pickupLocation', formData.from.name);
        if (formData.from.country) {
            queryParams.append('fromCountry', formData.from.country);
        }

        const includeDropoff =
            formData.tripType !== 'all-round' ||
            (Boolean(formData.to.name) && toLat != null && toLng != null);

        if (includeDropoff) {
            if (toLat == null || toLng == null || (toLat === 0 && toLng === 0)) {
                notifications.show({
                    title: 'Validation Error',
                    message: 'Drop-off coordinates are missing. Please select drop-off from the list again.',
                    color: 'red',
                });
                return;
            }
            queryParams.append('dropoffLatitude', String(toLat));
            queryParams.append('dropoffLongitude', String(toLng));
            queryParams.append('toLat', String(toLat));
            queryParams.append('toLng', String(toLng));
            queryParams.append('dropoffLocation', formData.to.name || '');
            if (formData.to.country) {
                queryParams.append('toCountry', formData.to.country);
            }
        }

        queryParams.append('pickupDate', moment(formData.pickupDateTime).format('YYYY-MM-DD'));
        queryParams.append('pickupTime', moment(formData.pickupDateTime).format('HH:mm'));
        if (formData.dropoffDateTime) {
            queryParams.append('dropoffDate', moment(formData.dropoffDateTime).format('YYYY-MM-DD'));
            queryParams.append('dropoffTime', moment(formData.dropoffDateTime).format('HH:mm'));
        }
        queryParams.append('adults', String(adults));
        queryParams.append('children', String(children));
        queryParams.append('infants', String(infants));
        queryParams.append('passengers', String(totalPassengers));
        queryParams.set('r', String(Date.now()));

        const isPackageContext =
            searchParams.get('packageMode') === 'true' ||
            searchParams.get('edit') === 'true';

        if (isPackageContext) {
            if (searchParams.get('packageMode') === 'true' || isActive) {
                queryParams.set('packageMode', 'true');
            }
            if (searchParams.get('edit') === 'true') {
                queryParams.set('edit', 'true');
            }

            const pickupDate = moment(formData.pickupDateTime).format('YYYY-MM-DD');
            const dropoffDate = formData.dropoffDateTime
                ? moment(formData.dropoffDateTime).format('YYYY-MM-DD')
                : pickupDate;

            updateServiceSearchData(
                'transfer',
                {
                    pickup: toPackageTransferLoc(formData.from),
                    dropoff: toPackageTransferLoc(formData.to),
                    sameAsPickup: false,
                    dates: {
                        pickup: pickupDate,
                        dropoff: dropoffDate,
                        check_in: pickupDate,
                        check_out: dropoffDate,
                    },
                    totalGuests: {
                        adults,
                        children,
                        infants,
                    },
                }
            );
        }

        if (onSearch) onSearch();
        router.push(`/transfers?${queryParams.toString()}`);
    };

    const passengerLabel = getPassengerLabel(formData.adults, formData.children, formData.infants);
    const showReturnDate = formData.tripType === 'return' || formData.tripType === 'all-round';
    const pickupFieldId = isListing ? 'transferListingPickup' : 'transferPickupDateTime';
    const returnFieldId = isListing ? 'transferListingReturn' : 'transferReturnDateTime';

    const travelersPopoverContent = (
        <div className="p-2" style={{ minWidth: 260 }}>
            <div className="e484bb5b7a mt-2">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Adults</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Age 12+</div>
                </div>
                <div className="e301a14002">
                    <button type="button" onClick={() => handleCountChange('adults', false)} className="adult-modal-btn"><FaMinus /></button>
                    <span className="mx-2" aria-hidden="true">{formData.adults}</span>
                    <button type="button" onClick={() => handleCountChange('adults', true)} className="adult-modal-btn"><FaPlus /></button>
                </div>
            </div>
            <div className="e484bb5b7a mt-3">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Children</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Age 2–11</div>
                </div>
                <div className="e301a14002">
                    <button type="button" onClick={() => handleCountChange('children', false)} className="adult-modal-btn"><FaMinus /></button>
                    <span className="mx-2" aria-hidden="true">{formData.children}</span>
                    <button type="button" onClick={() => handleCountChange('children', true)} className="adult-modal-btn"><FaPlus /></button>
                </div>
            </div>
            <div className="e484bb5b7a mt-3">
                <div className="c5aae0350e">
                    <label className="small mb-0 fw-semibold">Infants</label>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Under 2</div>
                </div>
                <div className="e301a14002">
                    <button type="button" onClick={() => handleCountChange('infants', false)} className="adult-modal-btn"><FaMinus /></button>
                    <span className="mx-2" aria-hidden="true">{formData.infants}</span>
                    <button type="button" onClick={() => handleCountChange('infants', true)} className="adult-modal-btn"><FaPlus /></button>
                </div>
            </div>
            <button
                onClick={() => setPopoverOpened(false)}
                type="button"
                className="btn mt-3 w-100 btn-outline-success"
            >
                Done
            </button>
        </div>
    );

    if (isListing) {
        return (
            <div className={`${listingStyles.card} ${geist.className}`}>
                <div className={listingStyles.toggleGroup} role="tablist" aria-label="Trip type">
                    <div
                        role="tab"
                        tabIndex={0}
                        onClick={() => handleChange("tripType", "one-way")}
                        onKeyDown={(e) => e.key === 'Enter' && handleChange("tripType", "one-way")}
                        className={`${listingStyles.toggleItem} ${formData.tripType === 'one-way' ? listingStyles.toggleActive : ''}`}
                    >
                        One-Way
                    </div>
                    <div
                        role="tab"
                        tabIndex={0}
                        onClick={() => handleChange("tripType", "return")}
                        onKeyDown={(e) => e.key === 'Enter' && handleChange("tripType", "return")}
                        className={`${listingStyles.toggleItem} ${formData.tripType === 'return' ? listingStyles.toggleActive : ''}`}
                    >
                        Return
                    </div>
                    <div
                        role="tab"
                        tabIndex={0}
                        onClick={() => handleChange("tripType", "all-round")}
                        onKeyDown={(e) => e.key === 'Enter' && handleChange("tripType", "all-round")}
                        className={`${listingStyles.toggleItem} ${formData.tripType === 'all-round' ? listingStyles.toggleActive : ''}`}
                    >
                        All-Round
                    </div>
                </div>

                <div className={listingStyles.fieldsRow}>
                    <div className={listingStyles.field}>
                        <span className={listingStyles.fieldIcon} aria-hidden="true">
                            <FaPlaneDeparture />
                        </span>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>Pickup</span>
                            <div className={listingStyles.fieldValue}>
                                <TransferLocationSelector
                                    value={formData.from.name}
                                    onChange={handleFromLocationChange}
                                    detailLoader={setIsLoadingDetail}
                                    onPlaceSelected={handleFromPlaceSelected}
                                    isMobile={isMobile}
                                    label="Pickup"
                                    placeholder="Address, airport, hotel..."
                                    inputName="pickupLocation"
                                    compact
                                />
                            </div>
                        </div>
                    </div>

                    <div className={listingStyles.field}>
                        <span className={listingStyles.fieldIcon} aria-hidden="true">
                            <FaMapMarkerAlt />
                        </span>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>Drop-off</span>
                            <div className={listingStyles.fieldValue}>
                                <TransferLocationSelector
                                    value={formData.to.name}
                                    onChange={handleToLocationChange}
                                    detailLoader={setIsLoadingDetail}
                                    onPlaceSelected={handleToPlaceSelected}
                                    isMobile={isMobile}
                                    label="Drop-off"
                                    placeholder="Address, airport, hotel..."
                                    inputName="dropoffLocation"
                                    compact
                                />
                            </div>
                        </div>
                    </div>

                    <div className={listingStyles.field}>
                        <span className={listingStyles.fieldIcon} aria-hidden="true">
                            <FaCalendarAlt />
                        </span>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>Pickup date</span>
                            <div className={listingStyles.fieldValue}>
                                <TransferDateTimeField
                                    id={pickupFieldId}
                                    label="Pickup date"
                                    value={formData.pickupDateTime}
                                    onChange={(date) => handleChange("pickupDateTime", date)}
                                    isMobile={isMobile}
                                    variant="listing"
                                    className="hotel-date-range"
                                    minDate={new Date()}
                                    placeholder="Select pickup date"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${listingStyles.field} ${!showReturnDate ? listingStyles.fieldDisabled : ''}`}>
                        <span className={listingStyles.fieldIcon} aria-hidden="true">
                            <MdOutlineEventRepeat />
                        </span>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>Return date</span>
                            <div className={listingStyles.fieldValue}>
                                <TransferDateTimeField
                                    id={returnFieldId}
                                    label="Return date"
                                    value={formData.dropoffDateTime}
                                    onChange={(date) => handleChange("dropoffDateTime", date)}
                                    isMobile={isMobile}
                                    variant="listing"
                                    className="hotel-date-range"
                                    minDate={formData.pickupDateTime || new Date()}
                                    defaultCalendarDate={formData.pickupDateTime || new Date()}
                                    placeholder="Select return date"
                                    disabled={!showReturnDate}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${listingStyles.field} ${listingStyles.fieldGuests}`}>
                        <span className={listingStyles.fieldIcon} aria-hidden="true">
                            <FaUsers />
                        </span>
                        <div className={listingStyles.fieldBody}>
                            <span className={listingStyles.fieldLabel}>Guests</span>
                            <Popover
                                width={300}
                                opened={popoverOpened}
                                onChange={setPopoverOpened}
                                position="bottom-end"
                                withArrow
                                shadow="md"
                                withinPortal
                                zIndex={20000}
                            >
                                <Popover.Target>
                                    <button
                                        type="button"
                                        className={listingStyles.guestsTrigger}
                                        onClick={() => setPopoverOpened((o) => !o)}
                                        aria-label="Select guests"
                                    >
                                        {passengerLabel}
                                    </button>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    {travelersPopoverContent}
                                </Popover.Dropdown>
                            </Popover>
                        </div>
                    </div>

                    <button
                        className={listingStyles.searchBtn}
                        onClick={handleSearch}
                        disabled={isLoadingDetail}
                        type="button"
                    >
                        <FaSearch className={listingStyles.searchBtnIcon} aria-hidden="true" />
                        Search
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${homeStyles.wrapper} ${geist.className}`}>
            <div className={homeStyles.card}>
                <div className={homeStyles.toolbar}>
                    <div className={homeStyles.toggleGroup} role="tablist" aria-label="Trip type">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={formData.tripType === 'one-way'}
                            onClick={() => handleChange("tripType", "one-way")}
                            className={`${homeStyles.toggleItem} ${formData.tripType === 'one-way' ? homeStyles.toggleActive : ''}`}
                        >
                            One-Way
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={formData.tripType === 'return'}
                            onClick={() => handleChange("tripType", "return")}
                            className={`${homeStyles.toggleItem} ${formData.tripType === 'return' ? homeStyles.toggleActive : ''}`}
                        >
                            Return
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={formData.tripType === 'all-round'}
                            onClick={() => handleChange("tripType", "all-round")}
                            className={`${homeStyles.toggleItem} ${formData.tripType === 'all-round' ? homeStyles.toggleActive : ''}`}
                        >
                            All-Round
                        </button>
                    </div>

                    <div className={homeStyles.toolbarPassengers}>
                        <Popover
                            width={300}
                            opened={popoverOpened}
                            onChange={setPopoverOpened}
                            position="bottom-end"
                            withArrow
                            shadow="md"
                        >
                            <Popover.Target>
                                <button
                                    type="button"
                                    className={homeStyles.passengersBtn}
                                    onClick={() => setPopoverOpened((o) => !o)}
                                    aria-label="Select passengers"
                                >
                                    <IoMdPerson className={homeStyles.passengersBtnIcon} aria-hidden="true" />
                                    <span className={homeStyles.passengersBtnText}>{passengerLabel}</span>
                                    <FaChevronDown className={homeStyles.passengersBtnChevron} aria-hidden="true" size={10} />
                                </button>
                            </Popover.Target>
                            <Popover.Dropdown>
                                {travelersPopoverContent}
                            </Popover.Dropdown>
                        </Popover>
                    </div>
                </div>

                <div className={homeStyles.searchBar}>
                    <div className={homeStyles.fieldsRow}>
                        <div className={`${homeStyles.field} ${homeStyles.fieldPickup}`}>
                            <span className={homeStyles.fieldIcon} aria-hidden="true">
                                <FaMapMarkerAlt />
                            </span>
                            <div className={homeStyles.fieldBody}>
                                <span className={homeStyles.fieldLabel}>Pickup</span>
                                <TransferLocationSelector
                                    value={formData.from.name}
                                    onChange={handleFromLocationChange}
                                    detailLoader={setIsLoadingDetail}
                                    onPlaceSelected={handleFromPlaceSelected}
                                    isMobile={isMobile}
                                    label="Pickup"
                                    placeholder="Pickup Location?"
                                    inputName="pickupLocation"
                                    compact
                                />
                            </div>
                        </div>

                        {/* <button
                            type="button"
                            className={homeStyles.swapBtn}
                            onClick={handleSwapLocations}
                            aria-label="Swap pickup and drop off"
                        >
                            <MdSwapVert />
                        </button> */}

                        <div className={`${homeStyles.field} ${homeStyles.fieldDrop}`}>
                            <span className={homeStyles.fieldIcon} aria-hidden="true">
                                <FaMapMarkerAlt />
                            </span>
                            <div className={homeStyles.fieldBody}>
                                <span className={homeStyles.fieldLabel}>Drop off</span>
                                <TransferLocationSelector
                                    value={formData.to.name}
                                    onChange={handleToLocationChange}
                                    detailLoader={setIsLoadingDetail}
                                    onPlaceSelected={handleToPlaceSelected}
                                    isMobile={isMobile}
                                    label="Drop off"
                                    placeholder="Drop off Location?"
                                    inputName="dropoffLocation"
                                    compact
                                />
                            </div>
                        </div>

                        <div className={`${homeStyles.field} ${homeStyles.fieldDate}`}>
                            <span className={homeStyles.fieldIcon} aria-hidden="true">
                                <FaCalendarAlt />
                            </span>
                            <div className={homeStyles.fieldBody}>
                                <span className={homeStyles.fieldLabel}>Pickup Date/Time</span>
                                <TransferDateTimeField
                                    id={pickupFieldId}
                                    label="Pickup Date/Time"
                                    value={formData.pickupDateTime}
                                    onChange={(date) => handleChange("pickupDateTime", date)}
                                    isMobile={isMobile}
                                    variant="listing"
                                    className="hotel-date-range"
                                    minDate={new Date()}
                                    placeholder="Pick up date and time"
                                />
                            </div>
                        </div>

                        {showReturnDate && (
                            <div className={`${homeStyles.field} ${homeStyles.fieldDate}`}>
                                <span className={homeStyles.fieldIcon} aria-hidden="true">
                                    <MdOutlineEventRepeat />
                                </span>
                                <div className={homeStyles.fieldBody}>
                                    <span className={homeStyles.fieldLabel}>Return Date/Time</span>
                                    <TransferDateTimeField
                                        id={returnFieldId}
                                        label="Return Date/Time"
                                        value={formData.dropoffDateTime}
                                        onChange={(date) => handleChange("dropoffDateTime", date)}
                                        isMobile={isMobile}
                                        variant="listing"
                                        className="hotel-date-range"
                                        minDate={formData.pickupDateTime || new Date()}
                                        defaultCalendarDate={formData.pickupDateTime || new Date()}
                                        placeholder="Return date and time"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        className={homeStyles.searchBtn}
                        onClick={handleSearch}
                        disabled={isLoadingDetail}
                        type="button"
                    >
                        <FaSearch className={homeStyles.searchBtnIcon} aria-hidden="true" />
                        Search
                    </button>
                </div>

                <div className={homeStyles.divider} aria-hidden="true" />

                <ul className={homeStyles.trustRow}>
                    <li><FaCheck aria-hidden="true" /> No surge pricing</li>
                    <li><FaCheck aria-hidden="true" /> Free cancellation up to 24h</li>
                    <li><FaCheck aria-hidden="true" /> 60 min free airport wait</li>
                </ul>
            </div>
        </div>
    );
}
