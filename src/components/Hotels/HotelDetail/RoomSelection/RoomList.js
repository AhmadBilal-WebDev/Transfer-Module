'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import RoomSummery from './RoomSummery'
import { FaCheck, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { CiTrash } from "react-icons/ci";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import moment from 'moment';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';
import { MdInfoOutline } from 'react-icons/md';
import { Tooltip } from '@mantine/core';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import styles from './RoomList.module.css';
import { useLockBodyScroll } from '@/util/useLockBodyScroll';

export default function RoomList({ hotelDetail, isPackageMode, isEditMode }) {
    const { selectedData } = useHolidayPackageStore();
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [roomData, setRoomData] = useState(hotelDetail?.rooms || []);
    const [filteredRoomData, setFilteredRoomData] = useState(hotelDetail?.rooms || []);
    const [activeFilters, setActiveFilters] = useState([]);
    const [modalPolicy, setModalPolicy] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { currency, rates } = useCurrency();
    const [amenitiesModal, setAmenitiesModal] = useState(null);
    const [expandedRates, setExpandedRates] = useState({});
    const [showAllRooms, setShowAllRooms] = useState(false);
    const INITIAL_ROOM_COUNT = 2;
    const INITIAL_RATE_COUNT = 2;

    useLockBodyScroll(showModal || Boolean(amenitiesModal));

    const totalNights = React.useMemo(() => {
        if (hotelDetail?.checkIn && hotelDetail?.checkOut) {
            const nights = moment(hotelDetail.checkOut).diff(moment(hotelDetail.checkIn), 'days');
            return nights > 0 ? nights : 1;
        }
        return 1;
    }, [hotelDetail?.checkIn, hotelDetail?.checkOut]);

    const toggleRates = (roomIndex) => {
        setExpandedRates(prev => ({ ...prev, [roomIndex]: !prev[roomIndex] }));
    };

    const openAmenitiesModal = (room) => {
        setAmenitiesModal({
            name: room?.name || 'Room',
            amenities: Array.isArray(room?.amenities) ? room.amenities : [],
        });
    };

    useEffect(() => {
        if (isPackageMode) {
            const rooms = hotelDetail?.rooms || [];
            const selected = [];

            rooms.forEach((room) => {
                room?.rates?.forEach((rate) => {
                    if (!rate?.is_selected) return;
                    const searchRoom = rate?.metadata?.search_request?.rooms?.[0];
                    selected.push({
                        roomId: room.id,
                        ratekey: rate.rate_key,
                        qty: 1,
                        roomTypeId: rate?.metadata?.room_type_id || '',
                        boardTypeId: rate?.metadata?.board_type_id || '',
                        adults: searchRoom?.adults ?? rate?.adults ?? 2,
                        children: searchRoom?.children ?? [],
                    });
                });
            });

            setSelectedRooms(selected);
        }
        if (isEditMode) {
            setSelectedRooms(selectedData?.hotel?.selectedRoom || []);
        }
        setRoomData(hotelDetail?.rooms || []);
        setFilteredRoomData(hotelDetail?.rooms || []);
        setShowAllRooms(false);
        setExpandedRates({});
    }, [hotelDetail, isPackageMode, isEditMode, selectedData]);

    const handleSelectToggle = (roomid, selectedId, rate) => {
        const isSelected = selectedRooms.find((r) => r.ratekey === selectedId);
        const searchRoom = rate?.metadata?.search_request?.rooms?.[0];

        if (isSelected) {
            setSelectedRooms(selectedRooms.filter((xr) => xr.ratekey !== selectedId));
        } else {
            setSelectedRooms([...selectedRooms, {
                roomId: roomid,
                ratekey: selectedId,
                qty: 1,
                roomTypeId: rate?.metadata?.room_type_id || '',
                boardTypeId: rate?.metadata?.board_type_id || '',
                adults: searchRoom?.adults ?? rate?.adults ?? 2,
                children: searchRoom?.children ?? [],
            }]);
        }
    };

    const handleQuantityChange = (rateKey, quantity) => {
        const updatedRooms = selectedRooms.map((room) => {
            if (room.ratekey === rateKey) {
                return { ...room, qty: Number(quantity) || 1 };
            }
            return room;
        });
        setSelectedRooms(updatedRooms);
    };

    const isRoomSelected = (selectedId) => {
        return selectedRooms.some((r) => r.ratekey === selectedId);
    };

    // Extract available filters from room data
    const availableFilters = React.useMemo(() => {
        const filters = {
            boardTypes: new Set(),
            hasFreeBreakfast: false,
            hasFreeCancellation: false,
        };

        roomData.forEach(room => {
            room?.rates?.forEach(rate => {
                if (rate?.board_name) {
                    filters.boardTypes.add(rate.board_name);
                }

                if (rate?.cancellation_policies && Array.isArray(rate.cancellation_policies) && rate.cancellation_policies.length > 0) {
                    const sortedPolicies = [...rate.cancellation_policies].sort((a, b) =>
                        moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
                    );
                    const now = moment.utc();
                    const allDatesInFuture = sortedPolicies.every(policy =>
                        moment.utc(policy.from).isAfter(now)
                    );
                    if (allDatesInFuture) {
                        filters.hasFreeCancellation = true;
                    }
                }

                if (rate?.board_name && (
                    rate.board_name.toLowerCase().includes('breakfast') ||
                    rate.board_name.toLowerCase().includes('bed and breakfast') ||
                    rate.board_name.toLowerCase().includes('bb')
                )) {
                    filters.hasFreeBreakfast = true;
                }
            });
        });

        return {
            ...filters,
            boardTypes: Array.from(filters.boardTypes)
        };
    }, [roomData]);

    const toggleFilter = (filterType, filterValue) => {
        const filterKey = `${filterType}:${filterValue}`;
        
        setActiveFilters(prev => {
            if (prev.includes(filterKey)) {
                return prev.filter(f => f !== filterKey);
            } else {
                return [...prev, filterKey];
            }
        });
    };

    React.useEffect(() => {
        if (activeFilters.length === 0) {
            setFilteredRoomData(roomData);
            setShowAllRooms(false);
            return;
        }

        const filtered = roomData.map(room => {
            const filteredRates = room.rates.filter(rate => {
                for (const filter of activeFilters) {
                    const [filterType, filterValue] = filter.split(':');

                    if (filterType === 'breakfast') {
                        const hasBreakfast = rate?.board_name && (
                            rate.board_name.toLowerCase().includes('breakfast') ||
                            rate.board_name.toLowerCase().includes('bed and breakfast') ||
                            rate.board_name.toLowerCase().includes('bb')
                        );
                        if (!hasBreakfast) return false;
                    }

                    if (filterType === 'cancellation') {
                        if (!rate?.cancellation_policies || rate.cancellation_policies.length === 0) return false;
                        const sortedPolicies = [...rate.cancellation_policies].sort((a, b) =>
                            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
                        );
                        const now = moment.utc();
                        const allDatesInFuture = sortedPolicies.every(policy =>
                            moment.utc(policy.from).isAfter(now)
                        );
                        if (!allDatesInFuture) return false;
                    }

                    if (filterType === 'board') {
                        if (rate?.board_name !== filterValue) return false;
                    }
                }

                return true;
            });

            return {
                ...room,
                rates: filteredRates
            };
        }).filter(room => room.rates.length > 0);

        setFilteredRoomData(filtered);
        setShowAllRooms(false);
    }, [activeFilters, roomData]);

    const isFilterActive = (filterType, filterValue) => {
        return activeFilters.includes(`${filterType}:${filterValue}`);
    };

    function getCancellationSummary(policyArr, Defaultcurrency) {
        if (!Array.isArray(policyArr) || policyArr.length === 0) {
            return { message: 'Non-refundable', type: 'non-refundable' };
        }

        const sortedPolicies = [...policyArr].sort((a, b) =>
            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
        );

        const now = moment.utc();

        const allDatesInFuture = sortedPolicies.every(policy =>
            moment.utc(policy.from).isAfter(now)
        );

        const nearestPolicy = sortedPolicies[0];
        const nearestDate = moment.utc(nearestPolicy.from);

        if (allDatesInFuture) {
            return {
                message: `Free cancellation before ${nearestDate.format('DD MMMM YYYY')}`,
                type: 'free',
                policy: nearestPolicy
            };
        }

        // Currently active policy = last policy whose 'from' date has already passed
        const passedPolicies = sortedPolicies.filter(policy =>
            !moment.utc(policy.from).isAfter(now)
        );
        const currentPolicy = passedPolicies[passedPolicies.length - 1];

        const ConvertedAmount = ConvertPrice(currentPolicy?.amount, Defaultcurrency, currency, rates);
        return {
            message: `Cancellation fee: ${ConvertedAmount.newcurrency} ${ConvertedAmount.newprice}`,
            type: 'fee',
            policy: currentPolicy
        };
    }

    function handleViewPolicy(policyArr, currency) {
        setModalPolicy({ policies: policyArr, currency });
        setShowModal(true);
    }

    function CancellationModal() {
        if (!showModal || !modalPolicy) return null;

        const sortedPolicies = [...modalPolicy.policies].sort((a, b) =>
            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
        );

        return (
            <div
                className={`modal fade show ${styles.cancelOverlay}`}
                onClick={() => setShowModal(false)}
            >
                <div
                    className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${styles.cancelDialog}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`modal-content ${styles.cancelModal}`}>
                        <div className={styles.cancelModalTop}>
                            <div className={styles.cancelModalBrand} aria-hidden="true">
                                <span className={styles.cancelBrandDark}>Voy</span>
                                <span className={styles.cancelBrandRed}>ara</span>
                            </div>
                            <button
                                type="button"
                                className={styles.cancelClose}
                                aria-label="Close cancellation policy"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.cancelModalHeader}>
                            <p className={styles.cancelEyebrow}>Booking protection</p>
                            <h5 className={styles.cancelModalTitle}>Cancellation Policy</h5>
                            <p className={styles.cancelModalSubtitle}>
                                Review refund windows and fees before you reserve.
                            </p>
                        </div>

                        <div className={styles.cancelModalBody}>
                            <div className={styles.cancelPolicy}>
                                <div className={styles.cancelPolicyRow}>
                                    <div>
                                        <span className={styles.cancelPolicyLabel}>Before</span>
                                        <div className={styles.cancelPolicyDate}>
                                            {moment.utc(sortedPolicies[0].from).format('MMM DD, YYYY')}
                                        </div>
                                    </div>
                                    <span className={`${styles.cancelPolicyBadge} ${styles.cancelPolicyBadgeRefund}`}>
                                        Full Refund
                                    </span>
                                </div>
                                <p className={styles.cancelPolicyText}>
                                    Cancel your reservation before{' '}
                                    {moment.utc(sortedPolicies[0].from).format('MMM DD [at] h:mm A')}, and
                                    you&apos;ll get a full refund. Times are based on the property&apos;s
                                    local time.
                                </p>
                            </div>

                            {sortedPolicies.map((policy, idx) => {
                                const dateObj = moment.utc(policy.from);
                                return (
                                    <div key={idx} className={styles.cancelPolicy}>
                                        <div className={styles.cancelPolicyRow}>
                                            <div>
                                                <span className={styles.cancelPolicyLabel}>From</span>
                                                <div className={styles.cancelPolicyDate}>
                                                    {dateObj.format('MMM DD, YYYY')}
                                                </div>
                                            </div>
                                            <span className={styles.cancelPolicyFee}>
                                                <PriceDisplay price={policy.amount} currency={modalPolicy.currency} />
                                            </span>
                                        </div>
                                        <p className={styles.cancelPolicyText}>
                                            From {dateObj.format('MMM DD [at] h:mm A')}, a cancellation fee of{' '}
                                            <strong>
                                                <PriceDisplay price={policy.amount} currency={modalPolicy.currency} />
                                            </strong>{' '}
                                            will be charged.
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.cancelModalFooter}>
                            <button
                                type="button"
                                className={styles.cancelDoneBtn}
                                onClick={() => setShowModal(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function AmenitiesModal() {
        if (!amenitiesModal) return null;

        const count = amenitiesModal.amenities.length;

        return (
            <div
                className={`modal fade show ${styles.amenitiesOverlay}`}
                onClick={() => setAmenitiesModal(null)}
            >
                <div
                    className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${styles.amenitiesDialog}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`modal-content ${styles.amenitiesModal}`}>
                        <div className={styles.amenitiesModalTop}>
                            <div className={styles.amenitiesModalBrand} aria-hidden="true">
                                <span className={styles.amenitiesBrandDark}>Voy</span>
                                <span className={styles.amenitiesBrandRed}>ara</span>
                            </div>
                            <button
                                type="button"
                                className={styles.amenitiesClose}
                                aria-label="Close amenities"
                                onClick={() => setAmenitiesModal(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.amenitiesModalHeader}>
                            <p className={styles.amenitiesEyebrow}>Included with your room</p>
                            <h5 className={styles.amenitiesModalTitle}>Room Amenities</h5>
                            <p className={styles.amenitiesModalSubtitle}>{amenitiesModal.name}</p>
                            <span className={styles.amenitiesCountBadge}>
                                {count} amenit{count === 1 ? 'y' : 'ies'}
                            </span>
                        </div>

                        <div className={styles.amenitiesModalBody}>
                            <div className={styles.amenitiesModalList}>
                                {amenitiesModal.amenities.map((facility, idx) => (
                                    <div key={idx} className={styles.amenityItem}>
                                        <span className={styles.amenityIcon} aria-hidden="true">
                                            <FaCheck size={11} />
                                        </span>
                                        <span className={styles.amenityLabel}>
                                            {facility?.description?.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.amenitiesModalFooter}>
                            <button
                                type="button"
                                className={styles.amenitiesDoneBtn}
                                onClick={() => setAmenitiesModal(null)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <CancellationModal />
            <AmenitiesModal />
            <div className='row mt-5'>
                <h4 className={styles.sectionTitle}>Available Suite Configurations</h4>
                
                {/* Filter Pills */}
                <div className="mb-4">
                    <div className="d-flex flex-wrap gap-2 mb-2">
                        {availableFilters.hasFreeBreakfast && (
                            <button
                                onClick={() => toggleFilter('breakfast', 'included')}
                                className={`btn btn-sm px-4 py-2 ${styles.filterPill} ${styles.filterPillMeta} ${
                                    isFilterActive('breakfast', 'included')
                                        ? styles.filterPillActive
                                        : styles.filterPillInactive
                                }`}
                            >
                                 Breakfast Included
                            </button>
                        )}

                        {availableFilters.hasFreeCancellation && (
                            <button
                                onClick={() => toggleFilter('cancellation', 'free')}
                                className={`btn btn-sm px-4 py-2 ${styles.filterPill} ${styles.filterPillMeta} ${
                                    isFilterActive('cancellation', 'free')
                                        ? styles.filterPillActive
                                        : styles.filterPillInactive
                                }`}
                            >
                                 Free Cancellation
                            </button>
                        )}

                        {availableFilters.boardTypes.map((boardType, idx) => (
                            <button
                                key={idx}
                                onClick={() => toggleFilter('board', boardType)}
                                className={`btn btn-sm px-4 py-2 ${styles.filterPill} ${styles.filterPillMeta} ${
                                    isFilterActive('board', boardType)
                                        ? styles.filterPillActive
                                        : styles.filterPillInactive
                                }`}
                            >
                                {boardType}
                            </button>
                        ))}
                    </div>

                    {activeFilters.length > 0 && (
                        <div className="d-flex align-items-center gap-2">
                            <small className="text-muted fw-semibold">
                                {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} applied
                            </small>
                            <button
                                onClick={() => setActiveFilters([])}
                                className={`btn btn-link btn-sm text-danger p-0 text-decoration-none ${styles.clearAllBtn}`}
                            >
                                Clear all ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className='col-12 col-md-8'>
                    {filteredRoomData.length === 0 ? (
                        <div className={styles.emptyFilters}>
                            No rooms match your selected filters. Try adjusting your filters.
                        </div>
                    ) : (
                        <>
                            {(showAllRooms
                                ? filteredRoomData
                                : filteredRoomData.slice(0, INITIAL_ROOM_COUNT)
                            ).map((room, index) => {
                            const guestCount = room?.rates?.[0]?.adults || 2;
                            const childCount = room?.rates?.[0]?.children ?? 0;
                            const visibleRates = expandedRates[index]
                                ? room?.rates
                                : room?.rates?.slice(0, INITIAL_RATE_COUNT);

                            return (
                            <div key={room?.id ?? index} className={`mb-4 ${styles.roomCard}`}>
                                <div className={styles.roomLayout}>
                                    <div className={styles.roomMedia}>
                                        <div className={styles.roomImageWrap}>
                                            <Image
                                                className={styles.roomImage}
                                                src={room?.images && room.images !== null && room.images.length > 0 ? room.images[0]?.url : '/images/noimage.png'}
                                                height={420}
                                                width={320}
                                                alt={room?.name || 'Room image'}
                                            />
                                            <span className={styles.guestBadge}>
                                                {guestCount} GUESTS
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.roomBody}>
                                        <div className={styles.roomHeader}>
                                            <h5 className={styles.roomTitle}>{room?.name}</h5>
                                            <p className={styles.roomMeta}>
                                                {guestCount} Guest{guestCount !== 1 ? 's' : ''}
                                                {childCount > 0 ? ` · ${childCount} Child${childCount !== 1 ? 'ren' : ''}` : ''}
                                                {room?.rates?.length > 0 ? ` · ${room.rates.length} rate option${room.rates.length !== 1 ? 's' : ''}` : ''}
                                            </p>
                                            {room?.amenities !== null && room?.amenities?.length > 0 && (
                                                <button
                                                    type="button"
                                                    className={styles.amenitiesBtn}
                                                    onClick={() => openAmenitiesModal(room)}
                                                >
                                                    View Amenities
                                                    <span className={styles.amenitiesBtnCount}>
                                                        {room.amenities.length}
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        <div className={styles.rateGrid}>
                                            {visibleRates?.map((rate, idx) => {
                                                const summary = getCancellationSummary(rate?.cancellation_policies, rate?.currency);
                                                const selected = isRoomSelected(rate?.rate_key);

                                                return (
                                                    <div key={idx} className={styles.rateOption}>
                                                        <div className={styles.rateOptionLeft}>
                                                            <p className={styles.rateBoardTitle}>{rate?.board_name || 'Room Only'}</p>
                                                            <div className={styles.rateCancelLine}>
                                                                <span className={summary.type === 'free' ? styles.cancelFree : (summary.type === 'non-refundable' ? styles.cancelDanger : styles.cancelMuted)}>
                                                                    {summary.message}
                                                                </span>
                                                                {rate?.cancellation_policies && rate.cancellation_policies.length > 0 && (
                                                                    <MdInfoOutline
                                                                        size={15}
                                                                        className={`cursor-pointer ${styles.cancelInfo}`}
                                                                        onClick={() => handleViewPolicy(rate?.cancellation_policies, rate?.currency)}
                                                                    />
                                                                )}
                                                            </div>
                                                            <p className={styles.rateOccupancy}>Adults: {rate?.adults ?? 0}</p>
                                                            <p className={styles.rateOccupancy}>Child: {rate?.children ?? 0}</p>
                                                            {rate?.on_request && (
                                                                <span className={`badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1 mt-1 ${styles.onRequestBadge}`}>
                                                                    On Request
                                                                    <Tooltip label="This room is not instantly confirmed and requires availability confirmation from the hotel.">
                                                                        <MdInfoOutline size={14} className="cursor-pointer" />
                                                                    </Tooltip>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className={styles.rateOptionRight}>
                                                            <span className={styles.onlyFor}>Only for</span>
                                                            <div className={styles.rateTotalPrice}>
                                                                <PriceDisplay price={rate?.price} currency={rate?.currency} />
                                                            </div>
                                                            <div className={styles.ratePerNightLine}>
                                                                <PriceDisplay price={rate?.price / totalNights} currency={rate?.currency} />
                                                                <span> / Per Night</span>
                                                            </div>
                                                            <span className={styles.vatText}>VAT & Tax Included</span>

                                                            {selected ? (
                                                                <div className={styles.selectedActions}>
                                                                    <select
                                                                        onChange={(e) => handleQuantityChange(rate?.rate_key, e.target.value)}
                                                                        className={`form-select form-select-sm ${styles.qtySelect}`}
                                                                        value={selectedRooms.find((r) => r.ratekey === rate?.rate_key)?.qty || 1}
                                                                    >
                                                                        {Array(Number(rate?.allotment)).fill(0).map((_, i) => (
                                                                            <option key={i} value={i + 1}>{i + 1}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSelectToggle(room?.id, rate?.rate_key, rate)}
                                                                        className={`btn btn-sm btn-outline-danger d-flex align-items-center gap-1 ${styles.removeBtn}`}
                                                                    >
                                                                        <CiTrash size={18} />
                                                                        <span>Remove</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectToggle(room?.id, rate?.rate_key, rate)}
                                                                    className={styles.reserveBtn}
                                                                >
                                                                    Reserve
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {room?.rates?.length > INITIAL_RATE_COUNT && (
                                            <button
                                                type="button"
                                                onClick={() => toggleRates(index)}
                                                className={`btn btn-outline-secondary btn-sm w-100 mt-3 ${styles.viewMoreBtn}`}
                                            >
                                                {expandedRates[index]
                                                    ? <><FaAngleUp className="me-1" />Show Less Rates</>
                                                    : <><FaAngleDown className="me-1" />View More Rates ({room.rates.length - INITIAL_RATE_COUNT} more)</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })}

                            {filteredRoomData.length > INITIAL_ROOM_COUNT && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllRooms((prev) => !prev)}
                                    className={`btn btn-outline-secondary btn-sm w-100 ${styles.viewMoreRoomsBtn}`}
                                >
                                    {showAllRooms ? (
                                        <>
                                            <FaAngleUp className="me-1" />
                                            Show Less Rooms
                                        </>
                                    ) : (
                                        <>
                                            <FaAngleDown className="me-1" />
                                            View More Rooms ({filteredRoomData.length - INITIAL_ROOM_COUNT} more)
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
                <div className='col-12 col-md-4'>
                    <RoomSummery selectedRooms={selectedRooms} roomList={roomData} detail={hotelDetail} />
                </div>
            </div>
        </>
    )
}
