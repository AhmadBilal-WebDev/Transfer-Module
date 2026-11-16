'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader, Modal, Text } from '@mantine/core';
import { FaMoon, FaStar, FaCalendarAlt, FaUtensils, FaUser, FaChild, FaCheck } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { FiCheckCircle } from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { GiCheckMark } from 'react-icons/gi';
import { MdErrorOutline } from 'react-icons/md';
import { CiTrash } from 'react-icons/ci';
import Image from 'next/image';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { useCurrency } from '@/util/currency';
import { notifications } from '@mantine/notifications';
import detailStyle from '@/components/UmrahGetAway/Detail/Detail.module.css';
import styles from '@/components/UmrahGetAway/UpdateHotel/UpdateHotel.module.css';
import reviseStyles from './ChangeHotelRoomModal.module.css';
import { applyHotelRevision } from './applyHotelRevision';
import { getReviseContext } from './revisionStorage';

const RATES_DEFAULT_COUNT = 3;
const FACILITIES_DEFAULT_COUNT = 6;

function getChildrenAges(rate, packageRooms = []) {
    const searchRoom = rate?.metadata?.search_request?.rooms?.[0];
    const packageRoom = packageRooms?.[0];
    const childrenFromSearch = searchRoom?.children;
    const childrenFromPackage = packageRoom?.children;
    if (Array.isArray(childrenFromSearch)) return childrenFromSearch;
    if (Array.isArray(childrenFromPackage)) return childrenFromPackage;
    if (Array.isArray(rate?.children)) return rate.children;
    return [];
}

function getActiveCancellationMessage(policies) {
    if (!Array.isArray(policies) || policies.length === 0) {
        return { message: 'Non-refundable', type: 'non-refundable' };
    }

    const sortedPolicies = [...policies].sort(
        (a, b) => moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
    );
    const now = moment.utc();
    const allDatesInFuture = sortedPolicies.every((policy) =>
        moment.utc(policy.from).isAfter(now)
    );
    const nearestPolicy = sortedPolicies[0];
    const nearestDate = moment.utc(nearestPolicy.from);

    if (allDatesInFuture) {
        return {
            message: `Free cancellation before ${nearestDate.format('DD MMM YYYY')}`,
            type: 'free',
        };
    }

    // Currently active policy = last policy whose 'from' date has already passed
    const passedPolicies = sortedPolicies.filter(
        (policy) => !moment.utc(policy.from).isAfter(now)
    );
    const currentPolicy = passedPolicies[passedPolicies.length - 1] || nearestPolicy;
    const amount = Number(currentPolicy?.amount || 0);

    if (!amount) {
        return {
            message: `Free cancellation until ${moment.utc(currentPolicy.from).format('DD MMM YYYY')}`,
            type: 'free',
        };
    }

    return {
        message: 'Cancellation fee now:',
        type: 'fee',
        amount,
    };
}

export default function ChangeHotelRoomModal({
    opened,
    onClose,
    selectedHotel,
    stayHotel,
    cityName,
    pkg,
    failedService = 'hotel',
    onConfirm,
}) {
    const router = useRouter();
    const { rates } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState(null);
    const [applyError, setApplyError] = useState(null);
    const [apiDetails, setApiDetails] = useState(null);
    const [hotelFullDetails, setHotelFullDetails] = useState({});
    const [reviseSummary, setReviseSummary] = useState(null);
    const [proceedPayload, setProceedPayload] = useState(null);
    const [retryingPayment, setRetryingPayment] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [descExpanded, setDescExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const [expandedAmenities, setExpandedAmenities] = useState({});
    const [facilitiesExpanded, setFacilitiesExpanded] = useState(false);
    const [expandedRoomRates, setExpandedRoomRates] = useState({});
    const descriptionContentRef = React.useRef(null);
    const summaryRef = React.useRef(null);

    const nights = stayHotel?.nights
        || Math.max(1, moment(stayHotel?.check_out).diff(moment(stayHotel?.check_in), 'days') || 1);

    const fetchHotelDetails = useCallback(async () => {
        console.log('fetchHotelDetails', selectedHotel);
        if (!selectedHotel?.id) return;

        setLoading(true);
        setError(null);
        setApiDetails(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/full/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedHotel.provider,
                    hotelId: selectedHotel.id,
                    checkIn: stayHotel?.check_in,
                    checkOut: stayHotel?.check_out,
                    roomList: selectedHotel.rooms,
                }),
            });
            const res = await response.json();
            const data = res?.data || {};
            setHotelFullDetails(data);
            setApiDetails({
                all_images: data?.all_images || [],
                address: data?.address || selectedHotel?.location?.address || '',
                facilities: data?.facilities || [],
                description: data?.description || '',
                star_rating: data?.star_rating ?? selectedHotel?.metadata?.stars,
                rooms: data?.rooms || [],
            });
        } catch (err) {
            console.error('Revision hotel detail error:', err);
            setError('Failed to load hotel details. You can still select a room.');
            setApiDetails({
                all_images: [],
                address: selectedHotel?.location?.address || '',
                facilities: [],
                description: '',
                star_rating: selectedHotel?.metadata?.stars,
                hotel_name: selectedHotel?.name,
                rooms: [],
            });
        } finally {
            setLoading(false);
        }
    }, [selectedHotel, stayHotel?.check_in, stayHotel?.check_out, pkg?.original_request?.rooms]);

    useEffect(() => {
        if (!opened || !selectedHotel) return;

        setSelectedRooms([]);
        setDescExpanded(false);
        setExpandedAmenities({});
        setFacilitiesExpanded(false);
        setExpandedRoomRates({});
        setApplyError(null);
        setApplying(false);
        setReviseSummary(null);
        setProceedPayload(null);
        fetchHotelDetails();
    }, [opened, selectedHotel?.id, fetchHotelDetails]);

    const detail = useMemo(() => {
        if (!selectedHotel) return null;
        return {
            ...selectedHotel,
            name: apiDetails?.hotel_name || selectedHotel?.name,
            nights,
            check_in: stayHotel?.check_in,
            check_out: stayHotel?.check_out,
            star_rating: apiDetails?.star_rating ?? selectedHotel?.metadata?.stars,
            location: {
                ...(selectedHotel?.location || {}),
                address: apiDetails?.address || selectedHotel?.location?.address || '',
            },
            all_images: apiDetails?.all_images || [],
            facilities: apiDetails?.facilities || [],
            description: apiDetails?.description || '',
            rooms: apiDetails?.rooms || [],
        };
    }, [selectedHotel, stayHotel, apiDetails, nights]);

    const description = detail?.description || '';
    const isHtmlDescription = useMemo(() => {
        if (!description || typeof description !== 'string') return false;
        return /<\/?[a-z][\s\S]*>/i.test(description);
    }, [description]);

    const plainDescription = useMemo(() => {
        if (!description) return '';
        if (isHtmlDescription) {
            return description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return description;
    }, [description, isHtmlDescription]);

    const normalizedHtmlDescription = useMemo(() => {
        if (!isHtmlDescription) return '';
        return description
            .replace(/<\s*h[1-6](\s[^>]*)?>/gi, '<h5$1>')
            .replace(/<\s*\/\s*h[1-6]\s*>/gi, '</h5>');
    }, [description, isHtmlDescription]);

    useEffect(() => {
        if (descExpanded) return;
        if (!plainDescription) {
            setShowReadMore(false);
            return;
        }

        const frame = requestAnimationFrame(() => {
            const contentElement = descriptionContentRef.current;
            if (!contentElement) {
                setShowReadMore(false);
                return;
            }
            setShowReadMore(contentElement.scrollHeight > contentElement.clientHeight + 1);
        });

        return () => cancelAnimationFrame(frame);
    }, [plainDescription, normalizedHtmlDescription, descExpanded, loading]);

    const roomsSource = useMemo(() => {
        if (apiDetails?.rooms?.length) return apiDetails.rooms;
        if (hotelFullDetails?.rooms?.length) return hotelFullDetails.rooms;
        return selectedHotel?.rooms || [];
    }, [apiDetails?.rooms, hotelFullDetails?.rooms, selectedHotel?.rooms]);

    const packageCurrency = pkg?.currency || pkg?.pricing?.currency || reviseSummary?.pricing?.currency;
    const requiredRoomCount = Math.max(1, Number(pkg?.original_request?.rooms?.length || 1));
    const selectedQtyTotal = selectedRooms.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const getVisibleRateIndices = (roomIndex, ratesList) => {
        const hasMoreRates = ratesList.length > RATES_DEFAULT_COUNT;
        if (!hasMoreRates || expandedRoomRates[roomIndex]) {
            return ratesList.map((_, index) => index);
        }

        const indices = Array.from({ length: RATES_DEFAULT_COUNT }, (_, index) => index);
        selectedRooms.forEach((selected) => {
            if (selected.roomIndex === roomIndex && selected.rateIndex >= RATES_DEFAULT_COUNT) {
                if (!indices.includes(selected.rateIndex)) indices.push(selected.rateIndex);
            }
        });
        return indices;
    };

    const findSelected = (roomIndex, rateIndex) =>
        selectedRooms.find((item) => item.roomIndex === roomIndex && item.rateIndex === rateIndex);

    const toggleRateSelection = (room, rate, roomIndex, rateIndex) => {
        const existing = findSelected(roomIndex, rateIndex);
        if (existing) {
            setSelectedRooms((prev) =>
                prev.filter((item) => !(item.roomIndex === roomIndex && item.rateIndex === rateIndex))
            );
            return;
        }
        const children = getChildrenAges(rate, pkg?.original_request?.rooms);
        setSelectedRooms((prev) => [
            ...prev,
            {
                roomId: room.id,
                ratekey: rate.rate_key,
                qty: 1,
                roomIndex,
                rateIndex,
                roomTypeId: rate?.metadata?.room_type_id || room?.id || '',
                boardTypeId: rate?.metadata?.board_type_id || '',
                adults: Number(
                    rate?.metadata?.search_request?.rooms?.[0]?.adults
                    ?? rate?.adults
                    ?? pkg?.original_request?.rooms?.[0]?.adults
                    ?? 0
                ),
                children,
            },
        ]);
    };

    const changeRateQuantity = (roomIndex, rateIndex, quantity) => {
        const qty = Math.max(1, Number(quantity) || 1);
        setSelectedRooms((prev) =>
            prev.map((item) =>
                item.roomIndex === roomIndex && item.rateIndex === rateIndex
                    ? { ...item, qty }
                    : item
            )
        );
    };

    const buildCheckRatesRequest = (selections) => {
        let countrycode = 'GB';
        const clientNationality = localStorage.getItem('clientNationality');
        if (clientNationality) countrycode = clientNationality;

        return {
            provider: selectedHotel?.provider,
            hotelId: String(selectedHotel?.id || ''),
            clientNationality: countrycode,
            checkIn: stayHotel?.check_in,
            checkOut: stayHotel?.check_out,
            rooms: selections.map((selected) => ({
                rateKey: String(selected.ratekey || ''),
                quantity: Number(selected.qty || 1),
                adults: Number(selected.adults || 0),
                children: Array.isArray(selected.children) ? selected.children : [],
                roomTypeId: String(selected.roomTypeId || ''),
                boardTypeId: String(selected.boardTypeId || ''),
            })),
        };
    };

    const handleConfirm = async () => {
        if (!selectedHotel || applying) return;

        if (!selectedRooms.length) {
            setApplyError('Please select at least one room to continue.');
            return;
        }

        if (selectedQtyTotal < requiredRoomCount) {
            setApplyError(`Please select ${requiredRoomCount} room${requiredRoomCount > 1 ? 's' : ''} for your booking.`);
            return;
        }

        setApplying(true);
        setApplyError(null);

        try {
            const checkRatesRequest = buildCheckRatesRequest(selectedRooms);
            const checkRatesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/check-rates`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(checkRatesRequest),
            });
            const checkRatesData = await checkRatesResponse.json();

            const isCheckRatesSuccess = Boolean(
                checkRatesData?.success === true
                || checkRatesData?.Success === true
            );

            if (!isCheckRatesSuccess) {
                const message = checkRatesData?.message
                    || checkRatesData?.Description
                    || checkRatesData?.Title
                    || 'Selected room is no longer available. Please choose another option.';
                setApplyError(message);
                notifications.show({
                    title: 'Rate check failed',
                    message,
                    color: 'red',
                    autoClose: 3500,
                });
                return;
            }

            const hotelDetail = {
                ...(hotelFullDetails || {}),
                ...(apiDetails || {}),
                hotel_code: selectedHotel?.id,
                id: selectedHotel?.id,
                hotel_name: selectedHotel?.name || hotelFullDetails?.hotel_name || hotelFullDetails?.name,
                name: selectedHotel?.name || hotelFullDetails?.name,
                provider: selectedHotel?.provider,
                checkIn: stayHotel?.check_in,
                checkOut: stayHotel?.check_out,
                rooms: roomsSource,
                address: apiDetails?.address || hotelFullDetails?.address,
                city: cityName,
            };

            const applyResult = await applyHotelRevision({
                packageId: pkg?.package_id,
                hotelDetail,
                roomList: roomsSource,
                selectedRooms,
                checkRatesData,
                reviseContext: getReviseContext(),
                packageCurrency,
                rates,
            });

            if (!applyResult?.success) {
                if (applyResult?.expired) {
                    setApplyError(applyResult.message);
                    notifications.show({
                        title: 'Session expired',
                        message: applyResult.message,
                        color: 'red',
                        autoClose: 2000,
                    });
                    setTimeout(() => router.push('/'), 2000);
                    return;
                }
                setApplyError(applyResult?.message || 'Failed to apply hotel revision. Please try again.');
                return;
            }

            setProceedPayload({
                selectedRooms,
                checkRatesData,
                reviseApplyData: applyResult.data,
                payload: applyResult.payload,
            });
            setReviseSummary(applyResult?.data?.Content || null);

            setTimeout(() => {
                summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        } catch (err) {
            console.error('Apply selected room error:', err);
            const message = err?.message || 'Unable to apply selected room. Please try again.';
            setApplyError(message);
            notifications.show({
                title: 'Error',
                message,
                color: 'red',
                autoClose: 3500,
            });
        } finally {
            setApplying(false);
        }
    };

    const cityLabel = cityName || 'Hotel';

    const summaryPricing = reviseSummary?.pricing || {};
    const paymentPreview = reviseSummary?.payment_preview || {};
    const summaryCurrency =
        paymentPreview?.customer_currency
        || paymentPreview?.package_currency
        || summaryPricing?.currency
        || packageCurrency;
    const payingNowAmount = Number(
        paymentPreview?.customer_amount
        ?? paymentPreview?.package_payable
        ?? summaryPricing?.hotel_price
        ?? 0
    );
    const totalPackageAmount = Number(
        paymentPreview?.full_customer_amount
        ?? paymentPreview?.package_total
        ?? summaryPricing?.total_price
        ?? 0
    );

    const handleProceedForThis = async () => {
        if (!proceedPayload || retryingPayment) return;

        const domain = window.location.origin;
        const packageId = pkg?.package_id || reviseSummary?.package_id;
        const bookingReference = reviseSummary?.booking_reference || getReviseContext()?.booking_reference || '';

        if (!packageId) {
            notifications.show({
                title: 'Error',
                message: 'Package ID missing. Please refresh and try again.',
                color: 'red',
                autoClose: 3500,
            });
            return;
        }

        setRetryingPayment(true);
        try {
            const successPath = bookingReference
                ? `/holiday-packages/${packageId}/${bookingReference}`
                : `/holiday-packages/${packageId}`;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/revise/retry-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    package_id: packageId,
                    success_url: `${domain}${successPath}`,
                    cancel_url: `${domain}/holiday-packages/checkout`,
                    booking_source: 'website',
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !(data?.Success || data?.success)) {
                const message = data?.Description
                    || data?.message
                    || data?.Title
                    || 'Unable to continue payment. Please try again.';
                notifications.show({
                    title: 'Payment retry failed',
                    message,
                    color: 'red',
                    autoClose: 3500,
                });
                return;
            }

            const checkoutUrl = data?.Content?.checkout_url || data?.checkout_url;
            if (!checkoutUrl) {
                notifications.show({
                    title: 'Payment retry failed',
                    message: 'Checkout URL not found in response.',
                    color: 'red',
                    autoClose: 3500,
                });
                return;
            }

            onConfirm?.(proceedPayload);
            router.push(checkoutUrl);
        } catch (error) {
            notifications.show({
                title: 'Network error',
                message: error?.message || 'Unable to retry payment right now.',
                color: 'red',
                autoClose: 3500,
            });
        } finally {
            setRetryingPayment(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <div className={styles.confirmHeader}>
                    <div className={styles.confirmIcon}><HiOutlineBuildingOffice2 size={18} /></div>
                    <Text fw={700} size="lg">Select Room &amp; Meal Plan</Text>
                </div>
            }
            size="90%"
            radius="lg"
            centered
            lockScroll
            closeOnClickOutside={false}
            closeOnEscape={false}
            transitionProps={{ transition: 'pop', duration: 200 }}
            zIndex={350}
            classNames={{
                content: styles.revisionModalContent,
                body: styles.revisionModalBody,
            }}
        >
            {loading && (
                <div className={styles.stateBox}>
                    <Loader size="md" color="teal" />
                    <p className={styles.stateText}>Loading hotel details…</p>
                </div>
            )}

            {!loading && error && (
                <div className={styles.errorBox} style={{ marginBottom: 12 }}>
                    <MdErrorOutline size={18} />
                    <span>{error}</span>
                </div>
            )}

            {!loading && detail && (
                <div className={styles.revisionDetailWrap}>

                    <div className={detailStyle.hotelInfoCard}>
                        <div className={detailStyle.hotelInfoHeader}>
                            <span className={detailStyle.cityBadge}>{cityLabel}</span>
                            <h2 className={detailStyle.hotelName}>{detail?.name}</h2>
                            {detail?.location?.address && (
                                <p className={detailStyle.hotelAddress}>
                                    <FaLocationDot size={14} />
                                    <span>{detail.location.address}</span>
                                </p>
                            )}
                        </div>

                        <div className={detailStyle.hotelStatsBar}>
                            <div className={detailStyle.hotelStatChip}>
                                <FaMoon size={14} color="#e31c23" />
                                <div>
                                    <span className={detailStyle.hotelStatLabel}>Stay</span>
                                    <span className={detailStyle.hotelStatValue}>
                                        {nights} {nights === 1 ? 'Night' : 'Nights'}
                                    </span>
                                </div>
                            </div>
                            {detail?.check_in && (
                                <div className={detailStyle.hotelStatChip}>
                                    <FaCalendarAlt size={14} color="#e31c23" />
                                    <div>
                                        <span className={detailStyle.hotelStatLabel}>Check-in</span>
                                        <span className={detailStyle.hotelStatValue}>
                                            {moment(detail.check_in).format('DD MMM YYYY')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {detail?.check_out && (
                                <div className={detailStyle.hotelStatChip}>
                                    <FaCalendarAlt size={14} color="#e31c23" />
                                    <div>
                                        <span className={detailStyle.hotelStatLabel}>Check-out</span>
                                        <span className={detailStyle.hotelStatValue}>
                                            {moment(detail.check_out).format('DD MMM YYYY')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {detail?.star_rating && !isNaN(parseFloat(detail.star_rating)) && (
                                <div className={detailStyle.hotelStatChip}>
                                    <FaStar size={14} color="#e31c23" />
                                    <div>
                                        <span className={detailStyle.hotelStatLabel}>Rating</span>
                                        <span className={detailStyle.hotelStatValue}>
                                            {parseFloat(detail.star_rating)}-Star
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {plainDescription && (
                            <div className={detailStyle.descriptionSection}>
                                <h3 className={detailStyle.descriptionTitle}>About this hotel</h3>
                                {isHtmlDescription ? (
                                    <div
                                        ref={descriptionContentRef}
                                        className={`${detailStyle.descriptionHtml} ${descExpanded ? '' : detailStyle.descriptionCollapsed}`}
                                        dangerouslySetInnerHTML={{ __html: normalizedHtmlDescription }}
                                    />
                                ) : descExpanded ? (
                                    <p ref={descriptionContentRef} className={detailStyle.descriptionText}>
                                        {description}
                                    </p>
                                ) : (
                                    <p
                                        ref={descriptionContentRef}
                                        className={`${detailStyle.descriptionText} ${detailStyle.descriptionCollapsed}`}
                                    >
                                        {plainDescription}
                                    </p>
                                )}
                                {showReadMore && (
                                    <button
                                        type="button"
                                        className={detailStyle.readMoreBtn}
                                        onClick={() => setDescExpanded((prev) => !prev)}
                                    >
                                        {descExpanded ? 'Read less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`${detailStyle.roomsSection} ${reviseStyles.roomsSectionResponsive}`}>
                        <h5 className={detailStyle.roomsSectionTitle}>Rooms Available</h5>
                        {(roomsSource || []).map((room, roomIndex) => (
                            <div key={room?.id || roomIndex} className={detailStyle.roomCard}>
                                <div className="row g-3">
                                    <div className={`col-12 col-lg-3 ${detailStyle.roomInfoCol} ${reviseStyles.roomInfoCol}`}>
                                        <h5 className={`${detailStyle.roomName} ${reviseStyles.roomName}`}>{room?.name || 'Room'}</h5>
                                        {room?.amenities?.length > 0 && (
                                            <div className={detailStyle.amenitiesWrap}>
                                                <button
                                                    type="button"
                                                    className={detailStyle.seeAmenitiesBtn}
                                                    onClick={() =>
                                                        setExpandedAmenities((prev) => ({
                                                            ...prev,
                                                            [roomIndex]: !prev[roomIndex],
                                                        }))
                                                    }
                                                >
                                                    {expandedAmenities[roomIndex]
                                                        ? 'Hide amenities'
                                                        : `See amenities (${room.amenities.length})`}
                                                </button>
                                                {expandedAmenities[roomIndex] && (
                                                    <div className={detailStyle.amenitiesList}>
                                                        {room.amenities.slice(0, 10).map((facility, idx) => (
                                                            <span key={idx} className={detailStyle.amenityTag}>
                                                                <FaCheck size={9} />{' '}
                                                                {typeof facility === 'string'
                                                                    ? facility
                                                                    : facility?.description?.content || facility?.name || ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`col-12 col-lg-6 ${detailStyle.mealPlanCol} ${reviseStyles.mealPlanCol}`}>
                                        <div className={detailStyle.mealPlanHeader}>
                                            <FaUtensils size={13} />
                                            <span>Meal Plan</span>
                                        </div>
                                        <div className={detailStyle.mealPlanList}>
                                            {(() => {
                                                const ratesList = room?.rates || [];
                                                const hasMoreRates = ratesList.length > RATES_DEFAULT_COUNT;
                                                const isRatesExpanded = expandedRoomRates[roomIndex];
                                                const visibleRateIndices = getVisibleRateIndices(roomIndex, ratesList);

                                                return (
                                                    <>
                                                        {visibleRateIndices.map((rateIndex) => {
                                                            const rate = ratesList[rateIndex];
                                                            const selected = findSelected(roomIndex, rateIndex);
                                                            const isSelected = Boolean(selected);
                                                            const qty = Number(selected?.qty || 1);
                                                            const converted = ConvertPrice(
                                                                Number(rate?.price || 0),
                                                                rate?.currency,
                                                                packageCurrency || rate?.currency,
                                                                rates
                                                            );
                                                            const rateCurrency = converted.newcurrency || rate?.currency;
                                                            const ratePrice = Number(converted.newprice || rate?.price || 0);
                                                            const cancellation = getActiveCancellationMessage(
                                                                rate?.cancellation_policies
                                                            );
                                                            const allotment = Math.max(1, Number(rate?.allotment) || 5);

                                                            return (
                                                                <div
                                                                    key={rateIndex}
                                                                    className={`${detailStyle.mealOption} ${isSelected ? detailStyle.mealOptionSelected : ''} ${reviseStyles.mealOptionResponsive}`}
                                                                >
                                                                    <div className={detailStyle.mealOptionMain}>
                                                                        <span className={detailStyle.mealOptionRadio} aria-hidden="true">
                                                                            {isSelected && (
                                                                                <span className={detailStyle.mealOptionRadioDot} />
                                                                            )}
                                                                        </span>
                                                                        <div className={detailStyle.mealOptionInfo}>
                                                                            <span className={detailStyle.mealOptionName}>
                                                                                {rate?.board_name || 'Room Only'}
                                                                            </span>
                                                                            <div className={detailStyle.mealOptionGuests}>
                                                                                <span className={detailStyle.guestChip}>
                                                                                    <FaUser size={9} />
                                                                                    {rate?.adults || 0} Adult
                                                                                    {(rate?.adults || 0) !== 1 ? 's' : ''}
                                                                                </span>
                                                                                <span className={detailStyle.guestChip}>
                                                                                    <FaChild size={9} />
                                                                                    {Array.isArray(rate?.children)
                                                                                        ? rate.children.length
                                                                                        : (rate?.children || 0)} Child
                                                                                    {(Array.isArray(rate?.children)
                                                                                        ? rate.children.length
                                                                                        : (rate?.children || 0)) !== 1 ? 'ren' : ''}
                                                                                </span>
                                                                            </div>
                                                                            <span
                                                                                className={`${styles.revisionCancelBadge} ${cancellation.type === 'free'
                                                                                    ? styles.revisionCancelFree
                                                                                    : cancellation.type === 'fee'
                                                                                        ? styles.revisionCancelFee
                                                                                        : styles.revisionCancelNonRefundable
                                                                                    }`}
                                                                            >
                                                                                {cancellation.type === 'fee' ? (
                                                                                    <>
                                                                                        {cancellation.message}{' '}
                                                                                        <PriceDisplay
                                                                                            price={cancellation.amount}
                                                                                            currency={rate?.currency}
                                                                                        />
                                                                                    </>
                                                                                ) : (
                                                                                    cancellation.message
                                                                                )}
                                                                            </span>
                                                                            <span className={`${detailStyle.mealOptionPrice} ${reviseStyles.mealOptionPrice}`}>
                                                                                Room Price :{' '}
                                                                                <PriceDisplay
                                                                                    currency={rateCurrency}
                                                                                    price={ratePrice}
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className={reviseStyles.mealOptionActions}>
                                                                        {isSelected ? (
                                                                            <>
                                                                                <select
                                                                                    className={`form-select form-select-sm ${reviseStyles.qtySelect}`}
                                                                                    value={qty}
                                                                                    disabled={applying}
                                                                                    onChange={(e) =>
                                                                                        changeRateQuantity(
                                                                                            roomIndex,
                                                                                            rateIndex,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {Array.from({ length: allotment }, (_, i) => i + 1).map((value) => (
                                                                                        <option key={value} value={value}>{value}</option>
                                                                                    ))}
                                                                                </select>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`btn btn-sm btn-outline-danger d-flex align-items-center gap-1 ${reviseStyles.rateActionBtn}`}
                                                                                    disabled={applying}
                                                                                    onClick={() =>
                                                                                        toggleRateSelection(room, rate, roomIndex, rateIndex)
                                                                                    }
                                                                                >
                                                                                    <CiTrash size={16} />
                                                                                    Remove
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                className={`btn btn-sm btn-success ${detailStyle.selectRoomBtn} ${reviseStyles.rateActionBtn}`}
                                                                                disabled={applying}
                                                                                onClick={() =>
                                                                                    toggleRateSelection(room, rate, roomIndex, rateIndex)
                                                                                }
                                                                            >
                                                                                Select
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {hasMoreRates && (
                                                            <button
                                                                type="button"
                                                                className={detailStyle.readMoreBtn}
                                                                onClick={() =>
                                                                    setExpandedRoomRates((prev) => ({
                                                                        ...prev,
                                                                        [roomIndex]: !prev[roomIndex],
                                                                    }))
                                                                }
                                                            >
                                                                {isRatesExpanded
                                                                    ? 'View less'
                                                                    : `View more (${ratesList.length - RATES_DEFAULT_COUNT} more)`}
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className={`col-12 col-lg-3 ${detailStyle.priceCol} ${reviseStyles.priceColResponsive}`}>
                                        {(() => {
                                            const roomSelections = selectedRooms.filter((item) => item.roomIndex === roomIndex);
                                            const roomTotal = roomSelections.reduce((sum, selected) => {
                                                const rate = room.rates?.[selected.rateIndex];
                                                if (!rate) return sum;
                                                const converted = ConvertPrice(
                                                    Number(rate.price || 0) * Number(selected.qty || 1),
                                                    rate.currency,
                                                    packageCurrency || rate.currency,
                                                    rates
                                                );
                                                return sum + Number(converted.newprice || 0);
                                            }, 0);
                                            const hasSelection = roomSelections.length > 0;

                                            return (
                                                <>
                                                    <span className={detailStyle.roompricediffup}>Room Total</span>
                                                    <span className={`${detailStyle.roomPriceMain} ${reviseStyles.roomPriceMain}`} style={{ color: '#e31c23' }}>
                                                        <PriceDisplay
                                                            currency={packageCurrency || room.rates?.[0]?.currency}
                                                            price={roomTotal}
                                                        />
                                                    </span>
                                                    <span className="small" style={{ fontSize: '12px' }}>
                                                        VAT and Taxes included
                                                    </span>
                                                    {hasSelection ? (
                                                        <button
                                                            type="button"
                                                            className={`btn ${detailStyle.selectRoomBtn} btn-success ${reviseStyles.rateActionBtn}`}
                                                            disabled={applying || !selectedRooms.length}
                                                            onClick={handleConfirm}
                                                        >
                                                            {applying ? 'Checking…' : 'Confirm & Continue'}
                                                        </button>
                                                    ) : (
                                                        <span className="small text-muted mt-2 d-block">
                                                            Select a rate to continue
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {detail?.facilities?.length > 0 && (() => {
                        const hasMoreFacilities = detail.facilities.length > FACILITIES_DEFAULT_COUNT;
                        const visibleFacilities = facilitiesExpanded
                            ? detail.facilities
                            : detail.facilities.slice(0, FACILITIES_DEFAULT_COUNT);

                        return (
                            <div className={detailStyle.facilitiesSection}>
                                <div className={detailStyle.facilitiesGrid}>
                                    <div className={detailStyle.sectionLabel}>
                                        <span>Hotel Facilities</span>
                                        <div className={detailStyle.sectionLine} />
                                    </div>
                                    <div className="row row-cols-2 row-cols-sm-4">
                                        {visibleFacilities.map((amenity, index) => (
                                            <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mt-2">
                                                <div className={detailStyle.facilityTile}>
                                                    <div className={detailStyle.facilityIcon}>
                                                        <GiCheckMark size={11} color="#16a34a" />
                                                    </div>
                                                    {typeof amenity === 'string' ? amenity : amenity?.name || ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {hasMoreFacilities && (
                                        <button
                                            type="button"
                                            className={detailStyle.readMoreBtn}
                                            onClick={() => setFacilitiesExpanded((prev) => !prev)}
                                        >
                                            {facilitiesExpanded
                                                ? 'View less'
                                                : `View more (${detail.facilities.length - FACILITIES_DEFAULT_COUNT} more)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {reviseSummary && (
                        <div ref={summaryRef} className={reviseStyles.reviseSummaryCard}>
                            <div className={reviseStyles.reviseSummaryHeader}>
                                <p className={reviseStyles.reviseSummaryEyebrow}>Payment update</p>
                                <h4 className={reviseStyles.reviseSummaryTitle}>Updated payment summary</h4>
                                <p className={reviseStyles.reviseSummaryText}>
                                    {paymentPreview?.note
                                        || 'Review your new total and proceed to payment for the remaining services.'}
                                </p>
                            </div>

                            <div className={reviseStyles.reviseSummaryRows}>
                                <div className={reviseStyles.reviseSummaryRow}>
                                    <span className={reviseStyles.reviseSummaryRowLabel}>Total package amount</span>
                                    <span className={reviseStyles.reviseSummaryRowValue}>
                                        <PriceDisplay
                                            price={totalPackageAmount}
                                            currency={summaryCurrency}
                                        />
                                    </span>
                                </div>
                            </div>

                            <div className={reviseStyles.reviseSummaryTotal}>
                                <span className={reviseStyles.reviseSummaryTotalLabel}>Paying now</span>
                                <span className={reviseStyles.reviseSummaryTotalValue}>
                                    <PriceDisplay
                                        price={payingNowAmount}
                                        currency={summaryCurrency}
                                    />
                                </span>
                                <span className={reviseStyles.reviseSummaryTotalNote}>VAT and taxes included</span>
                            </div>

                            {Array.isArray(paymentPreview?.pending_services) && paymentPreview.pending_services.length > 0 ? (
                                <div className={reviseStyles.reviseSummaryPending}>
                                    <span className={reviseStyles.reviseSummaryPendingLabel}>Pending services</span>
                                    <div className={reviseStyles.reviseSummaryPendingChips}>
                                        {paymentPreview.pending_services.map((service) => (
                                            <span key={service} className={reviseStyles.reviseSummaryChip}>
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className={reviseStyles.revisionFooterActions}>
                        {applyError && (
                            <div className={reviseStyles.footerError}>
                                <MdErrorOutline size={16} />
                                <span>{applyError}</span>
                            </div>
                        )}

                        <div className={reviseStyles.revisionFooterButtons}>
                            <button
                                type="button"
                                className={reviseStyles.cancelBtn}
                                onClick={onClose}
                                disabled={applying || retryingPayment}
                            >
                                Cancel
                            </button>

                            {reviseSummary ? (
                                <button
                                    type="button"
                                    className={reviseStyles.applyBtn}
                                    disabled={!proceedPayload || retryingPayment}
                                    onClick={handleProceedForThis}
                                >
                                    <FiCheckCircle size={15} />
                                    {retryingPayment ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={reviseStyles.applyBtn}
                                    onClick={handleConfirm}
                                    disabled={applying || !selectedRooms.length}
                                >
                                    <FiCheckCircle size={15} />
                                    {applying
                                        ? 'Checking…'
                                        : `Confirm ${selectedQtyTotal || 0} Room${selectedQtyTotal === 1 ? '' : 's'} & Continue`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
