'use client'
import styles from "./invoice.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
    FaBus, FaFileInvoice, FaHotel, FaPlaneArrival, FaPlaneDeparture,
    FaUser, FaUserFriends, FaHome, FaStar, FaConciergeBell, FaPassport,
    FaMapMarkerAlt, FaCommentDots, FaInfoCircle,
} from "react-icons/fa";
import { MdFlight, MdOutlineFileDownload } from "react-icons/md";
import Link from "next/link";
import { IoWarningOutline } from "react-icons/io5";

export default function Page() {
    const { id } = useParams();
    const ref = useRef();
    const [voucherDetail, setVoucherDetail] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        document.body.style.backgroundColor = '#f6f1e9';
        fetchDetails();
        return () => { document.body.style.backgroundColor = ''; };
    }, [id]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.Success) {
                const uniqueRooms = [
                    ...new Map(res?.Content?.booking.room_selections_original.map(room => [room.type, room])).values()
                ];
                res.Content.booking.room_selections_original = uniqueRooms;
                setVoucherDetail(res?.Content?.booking);
            } else {
                setErrorMessage(res?.Title);
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching package details:", err);
        }
    };

    function formatLabel(count, singular, plural) {
        return `${count} ${count === 1 ? singular : plural}`;
    }

    function capitalize(text) {
        if (!text) return "";
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

    function convertToCustomerCurrency(price) {
        if (!price || !voucherDetail.customer_exchange_rate) return Number(price || 0).toFixed(2);
        if (voucherDetail.currency_code === voucherDetail.customer_currency) {
            return Number(price).toFixed(2);
        }
        const convertedPrice = Number(price) * Number(voucherDetail.customer_exchange_rate);
        return convertedPrice.toFixed(2);
    }

    function CalCulateRoomPrice(room) {
        let price = 0;
        price += Number(room.adultsInRoom >= 0 ? room.adultsInRoom : room.adults) * Number(room?.sale_per_person ? room.sale_per_person : room.adultPrice);
        price += Number(room.childrenInRoom >= 0 ? room.childrenInRoom : room.children) * Number(room?.child_sale_per_person ? room.child_sale_per_person : room.childPrice);
        price += Number(room.infantsInRoom >= 0 ? room.infantsInRoom : room.infants) * Number(room?.infant_sale_per_person ? room.infant_sale_per_person : room.infantPrice);
        if (room.adults_without_bed) {
            price += Number(room.adults_without_bed || 0) * Number(room?.adult_without_bed_price);
        }
        if (room.children_without_bed) {
            price += Number(room.children_without_bed || 0) * Number(room?.child_without_bed_price);
        }
        if (room.infants_without_bed) {
            price += Number(room.infants_without_bed || 0) * Number(room?.infant_without_bed_price);
        }

        return convertToCustomerCurrency(price);
    }
    function capitalizeString(str) {
        if (!str) return "";
        return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    const EXCURSION_CITY_ORDER = ['Makkah', 'Madinah'];

    function groupExcursionsByCity(excursions) {
        if (!Array.isArray(excursions) || excursions.length === 0) return {};
        const groups = {};
        excursions.forEach((exc) => {
            const city = exc?.city || 'Other';
            if (!groups[city]) groups[city] = [];
            groups[city].push(exc);
        });
        const ordered = {};
        EXCURSION_CITY_ORDER.forEach((city) => {
            if (groups[city]) ordered[city] = groups[city];
        });
        Object.keys(groups)
            .filter((city) => !EXCURSION_CITY_ORDER.includes(city))
            .sort()
            .forEach((city) => {
                ordered[city] = groups[city];
            });
        return ordered;
    }

    function getTransferExcursions(transfer) {
        return transfer?.items?.data?.excursions ?? [];
    }

    const CalculateWithoutBeds = (type) => {
        const RoomList = voucherDetail?.room_selections_original.filter(room => room.type === type) || [];

        const adults = RoomList.reduce((sum, room) => sum + (room.adults_without_bed || 0), 0);
        const children = RoomList.reduce((sum, room) => sum + (room.children_without_bed || 0), 0);
        const infants = RoomList.reduce((sum, room) => sum + (room.infants_without_bed || 0), 0);

        // ✅ agar sab zero hain
        if (adults === 0 && children === 0 && infants === 0) {
            return "-";
        }

        return `${adults} Adult${adults !== 1 ? 's' : ''}, ${children} Child${children !== 1 ? 'ren' : ''}, ${infants} Infant${infants !== 1 ? 's' : ''}`;
    };

    const currency = voucherDetail?.customer_currency ? voucherDetail.customer_currency : voucherDetail?.currency_code;
    const totalAmount = voucherDetail?.customer_total_after_discount ? voucherDetail.customer_total_after_discount : voucherDetail?.grand_total_after_discount;
    const subTotal = voucherDetail?.customer_total_after_discount === 0 ? voucherDetail?.grand_total_after_discount : voucherDetail?.customer_total_after_discount;

    const getTotalGuests = () => {
        const op = voucherDetail?.other_passengers || {};
        const adults = voucherDetail?.room_selections_original?.reduce(
            (sum, room) =>
                sum +
                (room?.adultsInRoom >= 0 ? room?.adultsInRoom : room.adults || 0) +
                (room.adults_without_bed || 0),
            0,
        );
        const children = voucherDetail?.room_selections_original?.reduce(
            (sum, room) =>
                sum +
                (room?.childrenInRoom >= 0
                    ? room?.childrenInRoom
                    : room.children || 0) +
                (room.children_without_bed || 0),
            0,
        );
        const infants = voucherDetail?.room_selections_original?.reduce(
            (sum, room) =>
                sum +
                (room?.infantsInRoom >= 0 ? room?.infantsInRoom : room.infants || 0) +
                (room.infants_without_bed || 0),
            0,
        );
        return [
            `${adults} Adult${adults !== 1 ? "s" : ""}`,
            children > 0 && `${children} Child${children !== 1 ? "ren" : ""}`,
            infants > 0 && `${infants} Infant${infants !== 1 ? "s" : ""}`,
        ]
            .filter(Boolean)
            .join(", ");
    };

    return (
        <div className={styles.pageWrapper}>
            {isLoading ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className="bg-white rounded shadow p-3">
                        <HotelInvoiceLoader />
                    </div>
                </div>
            ) : errorMessage ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className={styles.errormessagecontainer}>
                        <div className={styles.errormessagebox}>
                            <div className={styles.erroricon}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h2 className={styles.errortitle}>Oops! Something went wrong</h2>
                            <p className={styles.errordescription}>{errorMessage}</p>
                            <Link href="/" className={styles.errorhomebutton}>
                                <FaHome size={16} />
                                <span>Back to Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div ref={ref} className={styles.voucherCard}>

                        <div className={styles.watermark}>
                            <Image src='/watermark.png' width={450} height={450}
                                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                                alt="Watermark" quality={100} />
                        </div>

                        <div className={styles.brandHeader}>
                            <div className={styles.brandHeaderTop}>
                                <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                                <div className={styles.brandContact}>
                                    <a href="tel:+966509736777" className={styles.brandPhone}>
                                        +966 509 736777
                                    </a>
                                    <a href="mailto:example@royalane.com" className={styles.brandEmail}>
                                        example@royalane.com
                                    </a>
                                </div>
                            </div>
                            <div className={styles.brandHeaderDivider} />
                            <div className={styles.brandHeaderBottom}>
                                <p className={styles.headerAddress}>
                                    Package Booking Invoice
                                </p>
                                <p className={styles.generatedOn}>
                                Generated on {moment(voucherDetail?.packageDetails?.created_at).format("DD MMM YYYY, h:mm A")}
                                </p>
                            </div>
                        </div>

                        <div className={styles.voucherDetailsBand}>
                            <div className={styles.voucherBandInner}>
                                <div className={styles.voucherDetailsRow}>
                                    <div className={styles.voucherDetailsLeft}>
                                        <p className={styles.voucherForLabel}>Invoice For</p>
                                        <h2 className={styles.customerName}>
                                            {voucherDetail?.lead_title} {voucherDetail?.lead_first_name} {voucherDetail?.lead_last_name}
                                        </h2>
                                        <p className={styles.customerMeta}>
                                            {voucherDetail?.packageDetails?.title}
                                        </p>
                                        <div className={styles.badgeRow}>
                                            <div className={styles.statusBadgeGroup}>
                                                <span className={styles.bookingDetailSmallLabel}>Booking:</span>
                                                <span className={`${styles.confirmedBadge} ${voucherDetail?.booking_status === 'cancelled'
                                                    ? styles.cancelledBadge
                                                    : voucherDetail?.booking_status === 'tentative' || voucherDetail?.booking_status === 'pending'
                                                        ? styles.tentativeBadge
                                                        : ''}`}>
                                                    {voucherDetail?.booking_status?.toUpperCase() || 'CONFIRMED'}
                                                </span>
                                            </div>
                                            <div className={styles.statusBadgeGroup}>
                                                <span className={styles.bookingDetailSmallLabel}>Payment:</span>
                                                <span className={`${styles.confirmedBadge} ${String(voucherDetail?.payment_status || '').toLowerCase() === 'paid'
                                                    ? styles.paidBadge
                                                    : String(voucherDetail?.payment_status || '').toLowerCase() === 'pending'
                                                        ? styles.pendingBadge
                                                        : ''}`}>
                                                    {voucherDetail?.payment_status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.voucherDetailsRight}>
                                        {voucherDetail?.booking_reference && <div className={styles.summaryLine}>
                                            <span className={styles.bookingDetailLabel}>Booking ID</span>
                                            <span className={styles.bookingDetailValue}>{voucherDetail?.booking_reference}</span>
                                        </div>}
                                        {voucherDetail?.invoice_number && <div className={styles.summaryLine}>
                                            <span className={styles.bookingDetailLabel}>Invoice Number</span>
                                            <span className={styles.bookingDetailValue}>
                                                {voucherDetail?.invoice_number}
                                            </span>
                                        </div>}
                                        {voucherDetail?.packageDetails?.end_date && voucherDetail?.packageDetails?.start_date && (
                                            <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Duration</span>
                                                <span className={styles.bookingDetailValue}>{moment(voucherDetail?.packageDetails?.end_date).diff(moment(voucherDetail?.packageDetails?.start_date), 'days')} Nights</span>
                                            </div>
                                        )}
                                        <div className={styles.summaryLine}>
                                            <span className={styles.bookingDetailLabel}>Total Guests</span>
                                            <span className={styles.bookingDetailValue}>
                                                {getTotalGuests()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={styles.sectionIconWrap}><FaStar size={12} /></span>
                                    PACKAGE OVERVIEW
                                </div>
                            </div>
                            <div className={styles.packageInfoGrid}>
                                <div className={styles.packageInfoMain}>
                                    <h3 className={styles.packageTitle}>{voucherDetail?.packageDetails?.title}</h3>
                                    {voucherDetail?.packageDetails?.star_rating && (
                                        <div className={styles.starRow}>
                                            {Array(Math.floor(Number(voucherDetail?.packageDetails?.star_rating || 0))).fill(0).map((_, i) => (
                                                <FaStar key={i} size={13} color="#e31c23" />
                                            ))}
                                            <span className={styles.starLabel}>{voucherDetail?.packageDetails?.star_rating} Star Package</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.packageInfoDates}>
                                    <div className={styles.hotelDateRow}>
                                        <span className={styles.hotelDateLabel}>From Date</span>
                                        <span className={styles.hotelDateValue}>{moment(voucherDetail?.packageDetails?.start_date).format('DD MMM YYYY')}</span>
                                    </div>
                                    <div className={styles.hotelDateRow}>
                                        <span className={styles.hotelDateLabel}>To Date</span>
                                        <span className={styles.hotelDateValue}>{moment(voucherDetail?.packageDetails?.end_date).format('DD MMM YYYY')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={styles.sectionIconWrap}><FaUser size={12} /></span>
                                    PASSENGER DETAILS
                                </div>
                            </div>
                            <div className={styles.kvGrid}>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Name</span>
                                    <span className={styles.kvValue}>
                                        {voucherDetail?.lead_title} {voucherDetail?.lead_first_name} {voucherDetail?.lead_last_name}
                                    </span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Email</span>
                                    <span className={styles.kvValue}>{voucherDetail?.lead_email || '—'}</span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Phone</span>
                                    <span className={styles.kvValue}>{voucherDetail?.lead_phone_code}{voucherDetail?.lead_phone || '—'}</span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Gender</span>
                                    <span className={styles.kvValue}>{capitalize(voucherDetail?.lead_gender) || '—'}</span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Country</span>
                                    <span className={styles.kvValue}>{voucherDetail?.lead_country || '—'}</span>
                                </div>
                                {voucherDetail?.lead_address && (
                                    <div className={styles.kvItem}>
                                        <span className={styles.kvLabel}>Address</span>
                                        <span className={styles.kvValue}>{voucherDetail?.lead_address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {(voucherDetail?.other_passengers?.additional_adults?.length > 0
                            || voucherDetail?.other_passengers?.children_details?.length > 0
                            || voucherDetail?.other_passengers?.infants_details?.length > 0
                        ) && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaUserFriends size={12} /></span>
                                            ADDITIONAL GUESTS
                                        </div>
                                    </div>
                                    <div className={styles.guestList}>
                                        {voucherDetail?.other_passengers?.additional_adults?.map((adult, i) => (
                                            <div key={`adult-${i}`} className={styles.guestRow}>
                                                <span className={styles.guestIndex}>{i + 1}</span>
                                                <span className={styles.guestName}>{adult.first_name} {adult.last_name}</span>
                                                <span className={styles.guestMeta}>{capitalize(adult.gender)}</span>
                                                <span className={styles.typeBadge}>Adult</span>
                                            </div>
                                        ))}
                                        {voucherDetail?.other_passengers?.children_details?.map((child, i) => (
                                            <div key={`child-${i}`} className={styles.guestRow}>
                                                <span className={styles.guestIndex}>{(voucherDetail?.other_passengers?.additional_adults?.length || 0) + i + 1}</span>
                                                <span className={styles.guestName}>
                                                    {child.first_name} {child.last_name}
                                                    {child.age ? ` · ${child.age} yrs` : ''}
                                                </span>
                                                <span className={styles.guestMeta}>{capitalize(child.gender)}</span>
                                                <span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span>
                                            </div>
                                        ))}
                                        {voucherDetail?.other_passengers?.infants_details?.map((infant, i) => {
                                            const offset = (voucherDetail?.other_passengers?.additional_adults?.length || 0) + (voucherDetail?.other_passengers?.children_details?.length || 0);
                                            return (
                                                <div key={`infant-${i}`} className={styles.guestRow}>
                                                    <span className={styles.guestIndex}>{offset + i + 1}</span>
                                                    <span className={styles.guestName}>{infant.first_name} {infant.last_name}</span>
                                                    <span className={styles.guestMeta}>{capitalize(infant.gender)}</span>
                                                    <span className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}>Infant</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        {voucherDetail?.room_selections?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaHotel size={12} /></span>
                                        ACCOMMODATION
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {voucherDetail.room_selections.map((item, index) => (
                                        <div key={index} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                <FaHotel size={22} color="#e31c23" />
                                                <div>
                                                    <p className={styles.airlineNameText}>
                                                        {capitalizeString(item?.hotel?.name)}
                                                        <span className={styles.cityChip}>{item?.hotel?.city}</span>
                                                    </p>
                                                    <p className={styles.hotelMeta}>
                                                        <FaMapMarkerAlt size={12} />
                                                        {item?.hotel?.address}
                                                    </p>
                                                </div>
                                                <span className={styles.stayBadge}>Stay</span>
                                            </div>
                                            <div className={styles.routeFlex}>
                                                <div className={styles.routeStation}>
                                                    <h4 className={styles.routeCity}>CHECK-IN</h4>
                                                    <p className={styles.routeTime}>
                                                        {moment(item?.hotel?.booked_from).format(
                                                            "DD MMM YYYY",
                                                        )}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`${styles.routeStation} ${styles.routeStationRight}`}
                                                >
                                                    <h4 className={styles.routeCity}>CHECK-OUT</h4>
                                                    <p className={styles.routeTime}>
                                                        {moment(item?.hotel?.booked_to).format(
                                                            "DD MMM YYYY",
                                                        )}
                                                    </p>
                                                </div>

                                                <div
                                                    className={`${styles.routeStation} ${styles.routeStationRight}`}
                                                >
                                                    <h4 className={styles.routeCity}>Nights</h4>
                                                    <p className={styles.routeTime}>
                                                        {moment(item?.hotel?.booked_to).diff(
                                                            moment(item?.hotel?.booked_from),
                                                            "days",
                                                        )}{" "}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.innerTableWrap}>
                                                <table className={styles.premiumTable}>
                                                    <thead>
                                                        <tr>
                                                            <th className={styles.srCell}>#</th>
                                                            <th>Room Type</th>
                                                            <th>Meal / View</th>
                                                            <th className="text-center">Adults</th>
                                                            <th className="text-center">Children</th>
                                                            <th className="text-center">Infants</th>
                                                            <th>Without Beds</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.rooms.map((room, rindex) => (
                                                            <tr key={rindex}>
                                                                <td className={styles.srCell}>{rindex + 1}</td>
                                                                <td style={{ fontWeight: 600 }}>
                                                                    {room.selection.label === 'without_beds'
                                                                        ? 'Without Beds'
                                                                        : `${room.selection.label} × ${room.selection.rooms}`}
                                                                </td>
                                                                <td>
                                                                    {[room?.rooms?.items?.data?.meal, room?.rooms?.items?.data?.view].filter(Boolean).join(' + ') || '—'}
                                                                </td>
                                                                <td className="text-center">{room.selection.adults}</td>
                                                                <td className="text-center">{room.selection.children}</td>
                                                                <td className="text-center">{room.selection.infants}</td>
                                                                <td className="text-center">{CalculateWithoutBeds(room.selection.type)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {voucherDetail?.flights?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaPlaneDeparture size={12} /></span>
                                        FLIGHT DETAILS
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {voucherDetail.flights.map((item, index) =>
                                        item.stops?.filter(s => s.is_return === false).map((flight, fIndex) => (
                                            <div key={`dep-${index}-${fIndex}`} className={styles.flightSegmentCard}>
                                                <div className={styles.airlineRow}>
                                                    <MdFlight size={26} color="#e31c23" />
                                                    <div>
                                                        <p className={styles.airlineNameText}>{flight.airline_name}</p>
                                                        <p className={styles.flightNumberText}>
                                                            {flight.flight_number}&nbsp;·&nbsp;{capitalize(flight.type)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={styles.routeGrid}>
                                                    <div className={styles.routeStation}>
                                                        <h4 className={styles.routeCity}>{flight?.departure_from}</h4>
                                                        <p className={styles.routeAirport}>Departure</p>
                                                        <p className={styles.routeTime}>{moment.utc(flight.datetime_from).format('DD MMM YYYY, LT')}</p>
                                                    </div>
                                                    <div className={styles.routeArrow}>
                                                        <span className={styles.durationLabel}>{flight.duration}</span>
                                                        <div className={styles.arrowLine}>
                                                            <MdFlight className={styles.planeIcon} />
                                                        </div>
                                                    </div>
                                                    <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                        <h4 className={styles.routeCity}>{flight?.departure_to}</h4>
                                                        <p className={styles.routeAirport}>Arrival</p>
                                                        <p className={styles.routeTime}>{moment.utc(flight.datetime_to).format('DD MMM YYYY, LT')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {voucherDetail?.flights?.some(f => f.stops?.some(s => s.is_return === true)) && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaPlaneArrival size={12} /></span>
                                        RETURN FLIGHT
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {voucherDetail.flights.map((item, index) =>
                                        item.stops?.filter(s => s.is_return === true).map((flight, fIndex) => (
                                            <div key={`ret-${index}-${fIndex}`} className={styles.flightSegmentCard}>
                                                <div className={styles.airlineRow}>
                                                    <MdFlight size={26} color="#e31c23" />
                                                    <div>
                                                        <p className={styles.airlineNameText}>{flight.airline_name}</p>
                                                        <p className={styles.flightNumberText}>
                                                            {flight.flight_number}&nbsp;·&nbsp;{capitalize(flight.type)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={styles.routeGrid}>
                                                    <div className={styles.routeStation}>
                                                        <h4 className={styles.routeCity}>{flight?.departure_from}</h4>
                                                        <p className={styles.routeAirport}>Departure</p>
                                                        <p className={styles.routeTime}>{moment.utc(flight.datetime_from).format('DD MMM YYYY, LT')}</p>
                                                    </div>
                                                    <div className={styles.routeArrow}>
                                                        <span className={styles.durationLabel}>{flight.duration}</span>
                                                        <div className={styles.arrowLine}>
                                                            <MdFlight className={styles.planeIcon} />
                                                        </div>
                                                    </div>
                                                    <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                        <h4 className={styles.routeCity}>{flight?.departure_to}</h4>
                                                        <p className={styles.routeAirport}>Arrival</p>
                                                        <p className={styles.routeTime}>{moment.utc(flight.datetime_to).format('DD MMM YYYY, LT')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {voucherDetail?.transfers?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaBus size={12} /></span>
                                        TRANSFER DETAILS
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {voucherDetail.transfers.map((item, index) => (
                                        <div key={index} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                <FaBus size={22} color="#e31c23" />
                                                <div>
                                                    <p className={styles.airlineNameText}>{capitalize(item?.vehicle)}</p>
                                                    <p className={styles.flightNumberText}>{capitalize(item?.trip_type)}</p>
                                                </div>
                                            </div>
                                            {item.locations.map((loc, idx) => (
                                                <div key={idx} className={styles.routeGrid}>
                                                    <div className={styles.routeStation}>
                                                        <h4 className={styles.routeCity}>PICKUP</h4>
                                                        <p className={styles.routeAirport}>{loc.pickup_address}</p>
                                                        <p className={styles.routeTime}>{moment(loc.outbound).format('DD MMM YYYY, HH:mm')}</p>
                                                    </div>
                                                    <div className={styles.routeArrow}>
                                                        <span className={styles.durationLabel}>{capitalize(item?.trip_type)}</span>
                                                        <div className={styles.arrowLine}>
                                                            <FaBus className={styles.planeIcon} />
                                                        </div>
                                                    </div>
                                                    <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                        <h4 className={styles.routeCity}>DROPOFF</h4>
                                                        <p className={styles.routeAirport}>{loc.dropoff_address}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(() => {
                                                const excursions = getTransferExcursions(item);
                                                const byCity = groupExcursionsByCity(excursions);
                                                const cities = Object.keys(byCity);
                                                if (!cities.length) return null;
                                                return (
                                                    <div className={styles.excursionsSection}>
                                                        <div className={styles.excursionsHeader}>
                                                            <FaMapMarkerAlt size={14} className={styles.excursionsHeaderIcon} />
                                                            <span>Included Ziyarat &amp; Excursions</span>
                                                        </div>
                                                        <div className={styles.excursionsCityGrid}>
                                                            {cities.map((city) => (
                                                                <div key={city} className={styles.excursionCityGroup}>
                                                                    <div className={styles.excursionCityHeader}>
                                                                        <span className={styles.excursionCityName}>{city}</span>
                                                                    </div>
                                                                    <ul className={styles.excursionList}>
                                                                        {byCity[city].map((exc, i) => (
                                                                            <li key={exc.id ?? `${city}-${i}`} className={styles.excursionItem}>
                                                                                <span className={styles.excursionIndex}>{i + 1}</span>
                                                                                <span className={styles.excursionName}>{exc.name}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {voucherDetail?.visas?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaPassport size={12} /></span>
                                        VISA DETAILS
                                    </div>
                                </div>
                                <div className={styles.visaCard}>
                                    <div>
                                        {voucherDetail.visas.map((item, index) => (
                                            <div key={index}>
                                                <div className={styles.visaType}>{item?.visa_type || '—'}</div>
                                                {item?.visa_description && (
                                                    <div className={styles.visaDesc}>{item.visa_description}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <span className={styles.confirmedBadge}>Accepted</span>
                                </div>
                            </div>
                        )}

                        {voucherDetail?.special_request && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaCommentDots size={12} /></span>
                                        SPECIAL REQUEST
                                    </div>
                                </div>
                                <div className={styles.requestBox}>
                                    {voucherDetail.special_request}
                                </div>
                            </div>
                        )}

                        {voucherDetail?.additional_services?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaConciergeBell size={12} /></span>
                                        ADDITIONAL SERVICES
                                    </div>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.srCell}>#</th>
                                                <th>Description</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-end">Rate</th>
                                                <th className="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail.additional_services.map((item, index) => (
                                                <tr key={index}>
                                                    <td className={styles.srCell}>{index + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">{voucherDetail.customer_currency} {convertToCustomerCurrency(item.price_per_person)}</td>
                                                    <td className="text-end">{voucherDetail.customer_currency} {convertToCustomerCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {voucherDetail?.room_selections_original?.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaFileInvoice size={12} /></span>
                                        ROOM PRICE DETAILS
                                    </div>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.srCell}>#</th>
                                                <th>Description</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail.room_selections_original.map((room, rindex) => (
                                                <tr key={rindex}>
                                                    <td className={styles.srCell}>{rindex + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {room.type === 'without_beds' ? 'Without Beds' : `${room.type}`}
                                                    </td>
                                                    <td className="text-center">
                                                        {formatLabel(room.adultsInRoom >= 0 ? room.adultsInRoom + room?.adults_without_bed : room.adults + (room?.adults_without_bed || 0), "Adult", "Adults")} &ndash;{' '}
                                                        {formatLabel(room.childrenInRoom >= 0 ? room.childrenInRoom + room?.children_without_bed : room.children + (room?.children_without_bed || 0), "Child", "Children")} &ndash;{' '}
                                                        {formatLabel(room.infantsInRoom >= 0 ? room.infantsInRoom + room?.infants_without_bed : room.infants + (room?.infants_without_bed || 0), "Infant", "Infants")}
                                                    </td>
                                                    <td className="text-end">{currency} {CalCulateRoomPrice(room)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className={styles.totalsWrap}>
                            {voucherDetail?.total_discount > 0 && (
                                <div className={styles.totalRow}>
                                    Discount: {currency} {voucherDetail?.total_discount}
                                </div>
                            )}
                            <div className={styles.totalRow}>
                                Sub Total: {currency} {subTotal}
                            </div>
                            <div className={styles.totalPill}>
                                <span className={styles.totalPillLabel}>Total Amount</span>
                                <span className={styles.totalPillAmount}>{currency} {totalAmount}</span>
                                <span className={styles.totalPillNote}>Included VAT and Taxes</span>
                            </div>
                        </div>

                        {voucherDetail?.packageDetails?.cancellation_policy && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><IoWarningOutline size={13} /></span>
                                        CANCELLATION POLICY
                                    </div>
                                </div>
                                {voucherDetail.packageDetails.cancellation_policy.cancel_policy === 'refundable' && !!voucherDetail.packageDetails.cancellation_policy.cancellation_policies?.length ? (
                                    <ul className={styles.policyList}>
                                        {voucherDetail.packageDetails.cancellation_policy.cancellation_policies.map((policy, i) => (
                                            <li key={i}>
                                                If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{' '}
                                                {policy.type === 'percentage'
                                                    ? <><strong>{policy.value}%</strong> cancellation charge</>
                                                    : <>fixed cancellation charge of <strong>{voucherDetail.customer_currency} {convertToCustomerCurrency(policy.value)}</strong></>
                                                } will apply.
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className={styles.nonRefundNote}>This booking is non-refundable. No refund will be issued for cancellations.</div>
                                )}
                            </div>
                        )}

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={styles.sectionIconWrap}><FaInfoCircle size={12} /></span>
                                    IMPORTANT INFORMATION
                                </div>
                            </div>
                            <ul className={styles.importantList}>
                                <li>The invoice displays the complete pricing details of your package booking, inclusive of all applicable taxes.</li>
                                <li>Please verify the information and retain this invoice for your records.</li>
                                <li>This is a computer-generated receipt and does not require a physical signature.</li>
                            </ul>
                        </div>

                        <div className={styles.voucherFooter}>
                            <div className={styles.voucherFooterTop}>
                                <p className={styles.voucherFooterThanks}>Thanks For Choosing Us</p>
                                <p className={styles.voucherFooterBrand} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={140} height={34} className={styles.brandLogoImg} />
                  </p>
                            </div>
                            <div className={styles.voucherFooterDivider} />
                            <div className={styles.voucherFooterBottom}>
                                <div className={styles.voucherFooterMeta}>
                                    <a href="tel:+966509736777">+966 509 736777</a>
                                    <a href="mailto:example@royalane.com">example@royalane.com</a>
                                </div>
                                <p className={styles.voucherFooterAddress}>
                                    Abc Street, XYZ Country
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actionRow}>
                        <button className={styles.btnPrimary} onClick={() => window.print()} type="button">
                            <MdOutlineFileDownload size={17} />
                            Print / Download Invoice
                        </button>
                        <Link href={`/${voucherDetail?.packageDetails?.category?.slug}/voucher/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.btnGold} type="button">
                                <FaFileInvoice size={14} />
                                View Voucher
                            </button>
                        </Link>
                        <Link href='/' style={{ textDecoration: 'none' }}>
                            <button className={styles.btnHome} type="button">
                                <FaHome size={14} />
                                Go to Home
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
