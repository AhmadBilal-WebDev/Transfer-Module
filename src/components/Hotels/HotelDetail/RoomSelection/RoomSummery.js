'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { MdChildFriendly } from "react-icons/md";
import { IoPerson } from "react-icons/io5";
import { IoMdPricetag } from "react-icons/io";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { notifications } from '@mantine/notifications';
import { useHotelStore } from '@/components/Store/HotelStore';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { usePackageMode } from '@/components/Store/PackageModeHelper';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';

const getChildrenCount = (children) => {
    if (Array.isArray(children)) return children.length;
    const n = Number(children);
    return Number.isFinite(n) ? n : 0;
};

const sameId = (a, b) => String(a) === String(b);

export default function RoomSummery({ selectedRooms, roomList, detail }) {
    const { handleHotelSelection, isPackageMode, isEditMode } = usePackageMode();
    const { packageConfig } = useHolidayPackageStore();
    const { setAvailabilityData } = useHotelStore();
    const [isLoading, setIsLoading] = useState(false);
    const [totalNights, setTotalNights] = useState(1);
    const [search, setSearch] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (detail?.checkIn && detail?.checkOut) {
            const nights = moment(detail.checkOut).diff(moment(detail.checkIn), 'days');
            setTotalNights(nights > 0 ? nights : 1);
        }
        const SearchData = localStorage.getItem('searchRoomSelection');
        if (SearchData) {
            try {
                setSearch(JSON.parse(SearchData) || []);
            } catch {
                setSearch([]);
            }
        }
    }, [detail?.checkIn, detail?.checkOut]);

    const { totalPrice, currency } = useMemo(() => {
        let total = 0;
        let currencySymbol = '';

        selectedRooms.forEach(selected => {
            const room = roomList.find(r => sameId(r.id, selected.roomId));
            if (room) {
                const rate = room.rates.find(rt => rt.rate_key === selected.ratekey);
                if (rate) {
                    currencySymbol = rate.currency || currencySymbol;
                    total += (Number(rate.price) * Number(selected.qty || 1));
                }
            }
        });

        return { totalPrice: total.toFixed(2), currency: currencySymbol };
    }, [selectedRooms, roomList]);

    const CheckCustomHotelRoomSelection = () => {
        const filteredRooms = roomList.filter(item =>
            selectedRooms.some(room => sameId(room?.roomId, item.id))
        );
        const totals = filteredRooms.reduce(
            (acc, item) => {
                item.rates.forEach(rate => {
                    const selected = selectedRooms.find(room => room?.ratekey === rate.rate_key);
                    if (selected) {
                        const qty = Number(selected.qty) || 1;
                        acc.adults += (Number(rate.adults) || 0) * qty;
                        acc.children += (Number(rate.children) || 0) * qty;
                    }
                });
                return acc;
            },
            { adults: 0, children: 0 }
        );

        if (isPackageMode || isEditMode) {
            const neededAdults = Number(packageConfig?.searchData?.totalGuests?.adults) || 0;
            const neededChildren = Number(packageConfig?.searchData?.totalGuests?.children) || 0;
            return totals.adults >= neededAdults && totals.children >= neededChildren;
        }

        const roomTotal = (Array.isArray(search) ? search : []).reduce((sum, item) => {
            sum.adults += Number(item?.adults) || 0;
            sum.children += getChildrenCount(item?.children);
            return sum;
        }, { adults: 0, children: 0 });

        // If guest search data is missing, don't block checkout
        if (roomTotal.adults === 0 && roomTotal.children === 0) {
            return true;
        }

        return totals.adults >= roomTotal.adults && totals.children >= roomTotal.children;
    };

    const PreBooking = async () => {
        try {
            if (!selectedRooms.length) {
                notifications.show({
                    autoClose: 3000,
                    title: "Error",
                    message: "Please select at least one room to proceed.",
                    color: "red",
                });
                return;
            }

            if (detail?.provider === 'custom' || isPackageMode || isEditMode) {
                if (!CheckCustomHotelRoomSelection()) {
                    notifications.show({
                        autoClose: 3000,
                        title: "Incomplete Room Selection",
                        message: "Not enough rooms for all guests. Please adjust your selection.",
                        color: "red",
                    });
                    return;
                }
            }

            let searchData = {};
            const storedData = localStorage.getItem('HotelSearchData');
            if (storedData) {
                try {
                    searchData = JSON.parse(storedData) || {};
                } catch {
                    searchData = {};
                }
            }

            const hotelId = detail?.hotel_code || detail?.id || detail?.hotelId;
            const checkIn = searchData?.check_in || detail?.checkIn;
            const checkOut = searchData?.check_out || detail?.checkOut;

            if (!hotelId) {
                notifications.show({
                    autoClose: 3500,
                    title: "Error",
                    message: "Hotel information is missing. Please go back and open the hotel again.",
                    color: "red",
                });
                return;
            }

            if (!checkIn || !checkOut) {
                notifications.show({
                    autoClose: 3500,
                    title: "Error",
                    message: "Check-in / check-out dates are missing. Please search again.",
                    color: "red",
                });
                return;
            }

            const request = {
                provider: detail?.provider,
                hotelId,
                clientNationality: "",
                checkIn,
                checkOut,
                rooms: selectedRooms.map(item => ({
                    rateKey: item.ratekey,
                    quantity: Number(item.qty) || 1,
                    adults: Number(item.adults) || 1,
                    children: Array.isArray(item.children) ? item.children : [],
                    roomTypeId: String(item.roomTypeId ?? ''),
                    boardTypeId: String(item.boardTypeId ?? ''),
                })),
            };

            const clientNationality = localStorage.getItem('clientNationality');
            if (clientNationality) {
                request.clientNationality = clientNationality;
            }

            setIsLoading(true);

            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/check-rates`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            let res = null;
            try {
                res = await responses.json();
            } catch {
                res = null;
            }

            if (!responses.ok || !res?.success || !res?.data) {
                setIsLoading(false);
                notifications.show({
                    title: 'Error',
                    message: res?.message || 'Unable to confirm room rates. Please try again.',
                    autoClose: 3500,
                    color: 'red',
                });
                return;
            }

            if (isPackageMode || isEditMode) {
                setIsLoading(false);
                handleHotelSelection(detail, selectedRooms, true);
                return;
            }

            const availability = {
                ...res.data,
                provider: res.provider || detail?.provider,
                address: detail?.address,
                main_images: detail?.main_images,
                hotel_code: res.data.hotel_code || hotelId,
            };

            setAvailabilityData(availability);
            setIsLoading(false);
            router.push('/hotels/checkout');
        } catch (err) {
            setIsLoading(false);
            console.error("Error during hotel pre-booking:", err);
            notifications.show({
                title: 'Error',
                message: 'Something went wrong while confirming your room. Please try again.',
                autoClose: 3500,
                color: 'red',
            });
        }
    };

    const ctaLabel = isPackageMode ? 'Proceed to Next Service' : 'Confirm & Continue';

    return (
        <>
            <div className="card hotel-room-summary sticky-top-div p-3 p-md-4">
                <h5 className="hotel-room-summary__title">Room Selected</h5>
                {selectedRooms.length === 0 ? (
                    <div className="hotel-room-summary__empty">No Room Selected.</div>
                ) : (
                    <div>
                        {roomList.filter(item => selectedRooms.some(room => sameId(room?.roomId, item.id))).map((item, index) => (
                            <div key={index}>
                                {item?.rates.filter(rate => selectedRooms.some(room => room?.ratekey === rate.rate_key)).map((rateItem, rateIndex) => {
                                    const qty = selectedRooms.find(room => room?.ratekey === rateItem.rate_key)?.qty || 1;
                                    return (
                                    <div key={rateIndex} className="hotel-detail-room-selection">
                                        <h6>{item.name}</h6>
                                        <div className="hotel-room-summary__meta-row">
                                            <span>Board</span>
                                            <strong>{rateItem.board_name}</strong>
                                        </div>
                                        <div className="hotel-room-summary__meta-row">
                                            <span><IoPerson className='icon' size={15} /> {Number(rateItem.adults) > 1 ? 'Adults' : 'Adult'}</span>
                                            <strong>{rateItem.adults}</strong>
                                        </div>
                                        <div className="hotel-room-summary__meta-row">
                                            <span><MdChildFriendly className='icon' size={15} /> {Number(rateItem.children) > 1 ? 'Children' : 'Child'}</span>
                                            <strong>{rateItem.children}</strong>
                                        </div>
                                        <div className="hotel-room-summary__meta-row">
                                            <span><IoMdPricetag className='icon' size={15} /> Price</span>
                                            <strong>
                                                {qty}×
                                                <PriceDisplay price={rateItem.price} currency={rateItem?.currency} />
                                            </strong>
                                        </div>
                                        <div className="hotel-room-summary__meta-row">
                                            <span>Per Night</span>
                                            <strong>
                                                
                                                <PriceDisplay price={Number(rateItem.price) / totalNights} currency={rateItem?.currency} />
                                            </strong>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div>
                            <div className="hotel-room-summary__meta-row">
                                <span>Duration</span>
                                <strong>{totalNights} night{totalNights > 1 ? 's' : ''}</strong>
                            </div>
                            <div className="hotel-room-summary__meta-row">
                                <span>Check-in</span>
                                <strong>{moment(detail?.checkIn).format('DD-MM-YYYY')}</strong>
                            </div>
                            <div className="hotel-room-summary__meta-row">
                                <span>Check-out</span>
                                <strong>{moment(detail?.checkOut).format('DD-MM-YYYY')}</strong>
                            </div>
                        </div>
                        {/* <div className="hotel-room-summary__meta-row mt-2">
                            <span>Price Per Night</span>
                            <strong><PriceDisplay price={totalPrice / totalNights} currency={currency} /></strong>
                        </div> */}
                        <div className="hotel-room-summary__total">
                            <span>Total</span>
                            <span><PriceDisplay price={totalPrice} currency={currency} /></span>
                        </div>
                        <small className="hotel-room-summary__note">
                            Vat and Taxes included
                        </small>
                    </div>
                )}

                <button
                    type="button"
                    disabled={isLoading}
                    onClick={PreBooking}
                    className="hotel-room-summary__cta d-none d-md-flex"
                >
                    {isLoading ? (
                        <div className="spinner-border text-light spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <>{ctaLabel} ›</>
                    )}
                </button>
            </div>

            {selectedRooms.length > 0 && (
                <div className="d-md-none hotel-room-summary__mobile-bar">
                    <div className="d-flex justify-content-between align-items-center gap-3">
                        <div>
                            <small className="text-muted d-block" style={{ fontSize: '12px' }}>Total Price</small>
                            <strong style={{ fontSize: '18px' }}>
                                <PriceDisplay price={totalPrice} currency={currency} />
                            </strong>
                        </div>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={PreBooking}
                            className="hotel-room-summary__mobile-cta"
                        >
                            {isLoading ? (
                                <div className="spinner-border text-light spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            ) : (
                                <>{isPackageMode ? 'Continue' : 'Checkout'}</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
