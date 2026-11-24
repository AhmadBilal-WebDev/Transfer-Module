'use client'
import styles from "./invoice.module.css";
import moment from "moment";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
    FaBus, FaFileInvoice, FaHotel, FaUser, FaUserFriends, FaHome,
    FaConciergeBell, FaPassport, FaMapMarkerAlt, FaInfoCircle, FaSuitcase,
} from "react-icons/fa";
import { MdFlight, MdOutlineFileDownload } from "react-icons/md";
import Link from "next/link";

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
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/booking/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.Success) {
                setVoucherDetail(res?.Content);
            } else {
                setErrorMessage(res?.Title);
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching package details:", err);
        }
    };

    function capitalize(text) {
        if (!text) return "";
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

    function convertToCustomerCurrency(price) {
        if (!price || !voucherDetail.customer_exchange_rate) return Number(price || 0).toFixed(2);
        if (voucherDetail.currency_code === voucherDetail.customer_currency || voucherDetail.currency === voucherDetail.customer_currency) {
            return Number(price).toFixed(2);
        }
        const convertedPrice = Number(price) * Number(voucherDetail.customer_exchange_rate);
        return convertedPrice.toFixed(2);
    }

    function capitalizeString(str) {
        if (!str) return "";
        return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    const ctx = voucherDetail?.package_context || {};
    const snapshot = voucherDetail?.package_snapshot || {};
    const hotel = ctx.hotel || snapshot.hotel;
    const flight = ctx.flight || snapshot.flight;
    const transfer = ctx.transfer?.data || ctx.transfer || snapshot.transfer?.data || snapshot.transfer;
    const flightSegments = flight?.segments || flight?.data?.segments || [];
    const originCode = ctx?.searchData?.leavingFrom?.airportCode
        || flight?.search_criteria?.legs?.[0]?.origin
        || flightSegments[0]?.departure?.airport_code;
    const isReturnTrip = ['return', 'Return'].includes(flight?.trip_type)
        || flight?.search_criteria?.AirTripType === 'Return'
        || (flight?.search_criteria?.legs?.length || 0) > 1;
    let outboundFlights = [];
    let returnFlights = [];
    if (isReturnTrip && flightSegments.length >= 2) {
        const mid = Math.ceil(flightSegments.length / 2);
        outboundFlights = flightSegments.slice(0, mid);
        returnFlights = flightSegments.slice(mid);
    } else {
        outboundFlights = originCode
            ? flightSegments.filter(s => s.departure?.airport_code === originCode)
            : flightSegments;
        returnFlights = originCode
            ? flightSegments.filter(s => s.departure?.airport_code !== originCode)
            : [];
        if (!outboundFlights.length && flightSegments.length) {
            outboundFlights = flightSegments;
            returnFlights = [];
        }
    }
    const serviceStatus = voucherDetail?.service_booking_status || {};
    const hotelRooms = ctx.selectedHotelRooms || snapshot.selectedHotelRooms || [];
    const packageServices = (ctx.services || snapshot.services || []).map(s => (s === 'stay' ? 'hotel' : s));
    const checkIn = hotel?.checkIn || ctx?.searchData?.dates?.checkIn || ctx?.searchData?.stayDates?.checkIn;
    const checkOut = hotel?.checkOut || ctx?.searchData?.dates?.checkOut || ctx?.searchData?.stayDates?.checkOut;
    const hotelLocation = [hotel?.city, hotel?.address].filter(Boolean).join(' · ') || hotel?.location || '—';
    const pricing = ctx.pricing || snapshot.pricing || ctx.priceBreakdown || {};
    const priceCurrency = pricing.currency
        || ctx.priceBreakdown?.hotel
        || voucherDetail?.customer_currency
        || voucherDetail?.currency
        || 'GBP';
    const hotelPrice = pricing.hotel_price ?? pricing.hotelPrice ?? 0;
    const flightPrice = pricing.flight_price ?? pricing.flightPrice ?? 0;
    const transferPrice = pricing.transfer_price ?? pricing.transferPrice ?? 0;
    const hasHotel = !!hotel?.name || packageServices.includes('hotel');
    const hasFlight = packageServices.includes('flight') || flightSegments.length > 0;
    const hasTransfer = packageServices.includes('transfer') || !!(transfer?.locations?.length || transfer?.vehicle || transfer?.vehicle_details);
    const packageTitle = snapshot?.title || ctx?.packageInfo?.title || ctx?.package_name || hotel?.name || 'Holiday Package';
    const destinationLabel = snapshot?.destination || ctx?.searchData?.destination?.name || hotel?.city || '';

    const formatDuration = (mins) => {
        if (!mins && mins !== 0) return '—';
        const h = Math.floor(Number(mins) / 60);
        const m = Number(mins) % 60;
        return `${h}h ${m}m`;
    };

    const statusBadgeClass = (status) => {
        if (status === 'cancelled' || status === 'failed') return styles.cancelledBadge;
        if (status === 'tentative' || status === 'pending') return styles.tentativeBadge;
        return '';
    };

    const getTotalGuests = () => {
        const adults = 1 + (voucherDetail?.other_passengers?.additional_adults?.length || 0);
        const children = voucherDetail?.other_passengers?.children_details?.length || 0;
        const infants = voucherDetail?.other_passengers?.infants_details?.length || 0;
        return [
            `${adults} Adult${adults !== 1 ? 's' : ''}`,
            children > 0 && `${children} Child${children !== 1 ? 'ren' : ''}`,
            infants > 0 && `${infants} Infant${infants !== 1 ? 's' : ''}`,
        ]
            .filter(Boolean)
            .join(', ');
    };

    const nightCount = checkIn && checkOut ? moment(checkOut).diff(moment(checkIn), 'days') : null;
    const currency = voucherDetail?.customer_currency || priceCurrency;
    const totalAmount = voucherDetail?.customer_amount ?? voucherDetail?.amount ?? '—';

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

                        <div className={styles.brandHeader}>
                            <div className={styles.brandHeaderTop}>
                                <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                                <div className={styles.brandContact}>
                                    <a href="tel:+966509736777" className={styles.brandPhone}>
                                        +966 509 736777
                                    </a>
                                    <a href="mailto:info@example.com" className={styles.brandEmail}>
                                        info@example.com
                                    </a>
                                </div>
                            </div>
                            <div className={styles.brandHeaderDivider} />
                            <div className={styles.brandHeaderBottom}>
                                <p className={styles.headerAddress}>
                                    Holiday Package Booking Invoice
                                </p>
                                <p className={styles.generatedOn}>
                                    Generated on {moment(voucherDetail?.created_at).format("DD MMM YYYY, h:mm A")}
                                </p>
                            </div>
                        </div>

                        <div className={styles.voucherDetailsBand}>
                            <div className={styles.voucherBandInner}>
                                <div className={styles.voucherDetailsRow}>
                                    <div className={styles.voucherDetailsLeft}>
                                        <p className={styles.voucherForLabel}>Invoice For</p>
                                        <h2 className={styles.customerName}>
                                            {voucherDetail?.lead_details?.title}{' '}
                                            {voucherDetail?.lead_details?.firstName}{' '}
                                            {voucherDetail?.lead_details?.lastName}
                                        </h2>
                                        <p className={styles.customerMeta}>
                                            {[packageTitle, destinationLabel].filter(Boolean).join(' · ')}
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
                                        {voucherDetail?.booking_reference && (
                                            <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Booking ID</span>
                                                <span className={styles.bookingDetailValue}>{voucherDetail.booking_reference}</span>
                                            </div>
                                        )}
                                        {nightCount != null && (
                                            <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Duration</span>
                                                <span className={styles.bookingDetailValue}>{nightCount} Night{nightCount !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                        {(checkIn || checkOut) && (
                                            <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Travel Dates</span>
                                                <span className={styles.bookingDetailValue}>
                                                    {checkIn ? moment(checkIn).format('DD MMM YYYY') : '—'}
                                                    {checkOut ? ` – ${moment(checkOut).format('DD MMM YYYY')}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        <div className={styles.summaryLine}>
                                            <span className={styles.bookingDetailLabel}>Total Guests</span>
                                            <span className={styles.bookingDetailValue}>{getTotalGuests()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {Object.keys(serviceStatus).length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaSuitcase size={12} /></span>
                                        BOOKED SERVICES
                                    </div>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Status</th>
                                                <th>Confirmation Ref</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {serviceStatus.hotel && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>Hotel</td>
                                                    <td>
                                                        <span className={`${styles.confirmedBadge} ${statusBadgeClass(serviceStatus.hotel.status)}`}>
                                                            {serviceStatus.hotel.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{serviceStatus.hotel.reference || serviceStatus.hotel.invoice_number || '—'}</td>
                                                </tr>
                                            )}
                                            {serviceStatus.flight && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>Flight</td>
                                                    <td>
                                                        <span className={`${styles.confirmedBadge} ${statusBadgeClass(serviceStatus.flight.status)}`}>
                                                            {serviceStatus.flight.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{serviceStatus.flight.reference || serviceStatus.flight.order_id || '—'}</td>
                                                </tr>
                                            )}
                                            {serviceStatus.transfer && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>Transfer</td>
                                                    <td>
                                                        <span className={`${styles.confirmedBadge} ${statusBadgeClass(serviceStatus.transfer.status)}`}>
                                                            {serviceStatus.transfer.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{serviceStatus.transfer.reference || '—'}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

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
                                        {voucherDetail?.lead_details?.title}{' '}
                                        {voucherDetail?.lead_details?.firstName}{' '}
                                        {voucherDetail?.lead_details?.lastName}
                                    </span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Email</span>
                                    <span className={styles.kvValue}>{voucherDetail?.lead_details?.email || '—'}</span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Phone</span>
                                    <span className={styles.kvValue}>
                                        {voucherDetail?.lead_details?.phoneCode}
                                        {voucherDetail?.lead_details?.phone || '—'}
                                    </span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Gender</span>
                                    <span className={styles.kvValue}>{capitalize(voucherDetail?.lead_details?.gender) || '—'}</span>
                                </div>
                                <div className={styles.kvItem}>
                                    <span className={styles.kvLabel}>Country</span>
                                    <span className={styles.kvValue}>{voucherDetail?.lead_details?.country || '—'}</span>
                                </div>
                                {voucherDetail?.lead_address && (
                                    <div className={styles.kvItem}>
                                        <span className={styles.kvLabel}>Address</span>
                                        <span className={styles.kvValue}>{voucherDetail.lead_address}</span>
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
                                            <span className={styles.guestName}>
                                                {adult.title} {adult.firstName} {adult.lastName}
                                            </span>
                                            <span className={styles.guestMeta}>{capitalize(adult.gender)}</span>
                                            <span className={styles.typeBadge}>Adult</span>
                                        </div>
                                    ))}
                                    {voucherDetail?.other_passengers?.children_details?.map((child, i) => (
                                        <div key={`child-${i}`} className={styles.guestRow}>
                                            <span className={styles.guestIndex}>
                                                {(voucherDetail?.other_passengers?.additional_adults?.length || 0) + i + 1}
                                            </span>
                                            <span className={styles.guestName}>
                                                {child.title} {child.firstName} {child.lastName}
                                            </span>
                                            <span className={styles.guestMeta}>{capitalize(child.gender)}</span>
                                            <span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span>
                                        </div>
                                    ))}
                                    {voucherDetail?.other_passengers?.infants_details?.map((infant, i) => {
                                        const offset =
                                            (voucherDetail?.other_passengers?.additional_adults?.length || 0) +
                                            (voucherDetail?.other_passengers?.children_details?.length || 0);
                                        return (
                                            <div key={`infant-${i}`} className={styles.guestRow}>
                                                <span className={styles.guestIndex}>{offset + i + 1}</span>
                                                <span className={styles.guestName}>
                                                    {infant.title} {infant.firstName} {infant.lastName}
                                                </span>
                                                <span className={styles.guestMeta}>{capitalize(infant.gender)}</span>
                                                <span className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}>Infant</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {hotel?.name && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaHotel size={12} /></span>
                                        ACCOMMODATION DETAILS
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    <div className={styles.flightSegmentCard}>
                                        <div className={styles.airlineRow}>
                                            <FaHotel size={22} color="#e31c23" />
                                            <div>
                                                <p className={styles.airlineNameText}>
                                                    {capitalizeString(hotel.name)}
                                                    {hotel?.city && <span className={styles.cityChip}>{hotel.city}</span>}
                                                </p>
                                                <p className={styles.hotelMeta}>
                                                    <FaMapMarkerAlt size={12} />
                                                    {capitalizeString(hotelLocation)}
                                                </p>
                                                {serviceStatus.hotel?.reference && (
                                                    <p className={styles.flightNumberText}>
                                                        Confirmation: {serviceStatus.hotel.reference}
                                                        {serviceStatus.hotel.invoice_number
                                                            ? ` · Invoice: ${serviceStatus.hotel.invoice_number}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.packageInfoDates} style={{ marginTop: '0.75rem' }}>
                                            <div className={styles.hotelDateRow}>
                                                <span className={styles.hotelDateLabel}>Check-In</span>
                                                <span className={styles.hotelDateValue}>
                                                    {checkIn ? moment(checkIn).format('DD MMM YYYY') : '—'}
                                                </span>
                                            </div>
                                            <div className={styles.hotelDateRow}>
                                                <span className={styles.hotelDateLabel}>Check-Out</span>
                                                <span className={styles.hotelDateValue}>
                                                    {checkOut ? moment(checkOut).format('DD MMM YYYY') : '—'}
                                                </span>
                                            </div>
                                            {nightCount != null && (
                                                <div className={styles.hotelDateRow}>
                                                    <span className={styles.hotelDateLabel}>Duration</span>
                                                    <span className={styles.hotelDateValue}>
                                                        {nightCount} Night{nightCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {hotelRooms.length > 0 && (
                                            <div className={styles.tableWrap} style={{ marginTop: '0.75rem' }}>
                                                <table className={styles.premiumTable}>
                                                    <thead>
                                                        <tr>
                                                            <th className={styles.srCell}>#</th>
                                                            <th>Room Type</th>
                                                            <th>Board</th>
                                                            <th className="text-center">Qty</th>
                                                            <th className="text-center">Adults</th>
                                                            <th className="text-center">Children</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {hotelRooms.map((room, rindex) => (
                                                            <tr key={rindex}>
                                                                <td className={styles.srCell}>{rindex + 1}</td>
                                                                <td style={{ fontWeight: 600 }}>{room.roomType || '—'}</td>
                                                                <td>{room.boardName || '—'}</td>
                                                                <td className="text-center">{room.quantity}</td>
                                                                <td className="text-center">{room.adults}</td>
                                                                <td className="text-center">{room.children}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {outboundFlights.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><MdFlight size={13} /></span>
                                        OUTBOUND FLIGHT DETAILS
                                        {serviceStatus.flight?.reference && (
                                            <span className={styles.cityChip}>PNR: {serviceStatus.flight.reference}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {outboundFlights.map((seg, fIndex) => (
                                        <div key={`dep-${fIndex}`} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                {seg.airline?.logo_url
                                                    ? <img src={seg.airline.logo_url} alt={seg.airline.name} style={{ height: 28, objectFit: 'contain' }} />
                                                    : <MdFlight size={26} color="#e31c23" />}
                                                <div>
                                                    <p className={styles.airlineNameText}>{seg.airline?.name}</p>
                                                    <p className={styles.flightNumberText}>
                                                        Flight {seg.airline?.code}{seg.flight_number}&nbsp;·&nbsp;{seg.cabin_class?.name}
                                                        &nbsp;·&nbsp;{seg.stops === 0 ? 'Non-stop' : `${seg.stops} Stop(s)`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.routeGrid}>
                                                <div className={styles.routeStation}>
                                                    <h4 className={styles.routeCity}>{seg.departure?.airport_code}</h4>
                                                    <p className={styles.routeAirport}>
                                                        {seg.departure?.city}
                                                        {seg.departure?.terminal ? ` · Terminal ${seg.departure.terminal}` : ''}
                                                    </p>
                                                    <p className={styles.routeTime}>{moment(seg.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                </div>
                                                <div className={styles.routeArrow}>
                                                    <span className={styles.durationLabel}>{formatDuration(seg.duration)}</span>
                                                    <div className={styles.arrowLine}><MdFlight className={styles.planeIcon} /></div>
                                                </div>
                                                <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                    <h4 className={styles.routeCity}>{seg.arrival?.airport_code}</h4>
                                                    <p className={styles.routeAirport}>
                                                        {seg.arrival?.city}
                                                        {seg.arrival?.terminal ? ` · Terminal ${seg.arrival.terminal}` : ''}
                                                    </p>
                                                    <p className={styles.routeTime}>{moment(seg.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                </div>
                                            </div>
                                            {seg.baggage_info?.adult && (
                                                <div className={styles.tableWrap} style={{ marginTop: '0.75rem' }}>
                                                    <table className={styles.premiumTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Cabin Baggage</th>
                                                                <th>Checked Baggage</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>{seg.baggage_info.adult.cabin || '—'}</td>
                                                                <td>{seg.baggage_info.adult.checked || '—'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {returnFlights.length > 0 && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><MdFlight size={13} /></span>
                                        RETURN FLIGHT DETAILS
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {returnFlights.map((seg, fIndex) => (
                                        <div key={`ret-${fIndex}`} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                {seg.airline?.logo_url
                                                    ? <img src={seg.airline.logo_url} alt={seg.airline.name} style={{ height: 28, objectFit: 'contain' }} />
                                                    : <MdFlight size={26} color="#e31c23" />}
                                                <div>
                                                    <p className={styles.airlineNameText}>{seg.airline?.name}</p>
                                                    <p className={styles.flightNumberText}>
                                                        Flight {seg.airline?.code}{seg.flight_number}&nbsp;·&nbsp;{seg.cabin_class?.name}
                                                        &nbsp;·&nbsp;{seg.stops === 0 ? 'Non-stop' : `${seg.stops} Stop(s)`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.routeGrid}>
                                                <div className={styles.routeStation}>
                                                    <h4 className={styles.routeCity}>{seg.departure?.airport_code}</h4>
                                                    <p className={styles.routeAirport}>
                                                        {seg.departure?.city}
                                                        {seg.departure?.terminal ? ` · Terminal ${seg.departure.terminal}` : ''}
                                                    </p>
                                                    <p className={styles.routeTime}>{moment(seg.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                </div>
                                                <div className={styles.routeArrow}>
                                                    <span className={styles.durationLabel}>{formatDuration(seg.duration)}</span>
                                                    <div className={styles.arrowLine}><MdFlight className={styles.planeIcon} /></div>
                                                </div>
                                                <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                    <h4 className={styles.routeCity}>{seg.arrival?.airport_code}</h4>
                                                    <p className={styles.routeAirport}>
                                                        {seg.arrival?.city}
                                                        {seg.arrival?.terminal ? ` · Terminal ${seg.arrival.terminal}` : ''}
                                                    </p>
                                                    <p className={styles.routeTime}>{moment(seg.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                </div>
                                            </div>
                                            {seg.baggage_info?.adult && (
                                                <div className={styles.tableWrap} style={{ marginTop: '0.75rem' }}>
                                                    <table className={styles.premiumTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Cabin Baggage</th>
                                                                <th>Checked Baggage</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>{seg.baggage_info.adult.cabin || '—'}</td>
                                                                <td>{seg.baggage_info.adult.checked || '—'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(transfer?.locations?.length > 0 || transfer?.vehicle || transfer?.vehicle_details) && (
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaBus size={12} /></span>
                                        TRANSFER DETAILS
                                        {serviceStatus.transfer?.reference && (
                                            <span className={styles.cityChip}>Ref: {serviceStatus.transfer.reference}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    <div className={styles.flightSegmentCard}>
                                        <div className={styles.airlineRow}>
                                            <FaBus size={22} color="#e31c23" />
                                            <div>
                                                <p className={styles.airlineNameText}>
                                                    {capitalize(transfer?.vehicle_details?.name || transfer?.vehicle || 'Transfer')}
                                                    {transfer?.vehiclecategory?.name && (
                                                        <span className={styles.cityChip}>{transfer.vehiclecategory.name}</span>
                                                    )}
                                                </p>
                                                <p className={styles.flightNumberText}>
                                                    {[
                                                        transfer?.trip_type && capitalize(transfer.trip_type),
                                                        transfer?.vehicle_details?.passenger_capacity && `${transfer.vehicle_details.passenger_capacity} Passengers`,
                                                        transfer?.vehicle_details?.transmission_type,
                                                    ].filter(Boolean).join(' · ') || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {(transfer.locations || []).map((loc, idx) => (
                                            <div key={idx} className={styles.routeGrid}>
                                                <div className={styles.routeStation}>
                                                    <h4 className={styles.routeCity}>PICKUP</h4>
                                                    <p className={styles.routeAirport}>{loc.pickup_title}</p>
                                                    <p className={styles.routeTime}>{loc.pickup_address}</p>
                                                </div>
                                                <div className={styles.routeArrow}>
                                                    <span className={styles.durationLabel}>{capitalize(transfer?.trip_type) || 'Transfer'}</span>
                                                    <div className={styles.arrowLine}><FaBus className={styles.planeIcon} /></div>
                                                </div>
                                                <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                    <h4 className={styles.routeCity}>DROPOFF</h4>
                                                    <p className={styles.routeAirport}>{loc.dropoff_title}</p>
                                                    <p className={styles.routeTime}>{loc.dropoff_address}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                <div className={styles.tableWrap}>
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.srCell}>#</th>
                                                <th>Visa Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail.visas.map((item, index) => (
                                                <tr key={index}>
                                                    <td className={styles.srCell}>{index + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {item?.visa_type || '—'}
                                                        {item?.visa_description ? (
                                                            <>
                                                                <br />
                                                                <span style={{ fontWeight: 400, color: '#6b7280' }}>{item.visa_description}</span>
                                                            </>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
                                                <th>Service Name</th>
                                                <th className="text-center">Quantity / Pax</th>
                                                <th className="text-end">Price / Person</th>
                                                <th className="text-end">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail.additional_services.map((item, index) => (
                                                <tr key={index}>
                                                    <td className={styles.srCell}>{index + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">{currency} {convertToCustomerCurrency(item.price_per_person)}</td>
                                                    <td className="text-end">{currency} {convertToCustomerCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={styles.sectionIconWrap}><FaFileInvoice size={12} /></span>
                                    PRICE BREAKDOWN
                                </div>
                            </div>
                            <div className={styles.tableWrap}>
                                <table className={styles.premiumTable}>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-end">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hasHotel && Number(hotelPrice) > 0 && (
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Hotel</td>
                                                <td className="text-end">{currency} {convertToCustomerCurrency(hotelPrice)}</td>
                                            </tr>
                                        )}
                                        {hasFlight && Number(flightPrice) > 0 && (
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Flight</td>
                                                <td className="text-end">{currency} {convertToCustomerCurrency(flightPrice)}</td>
                                            </tr>
                                        )}
                                        {hasTransfer && Number(transferPrice) > 0 && (
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Transfer</td>
                                                <td className="text-end">{currency} {convertToCustomerCurrency(transferPrice)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className={styles.totalsWrap}>
                            <div className={styles.totalPill}>
                                <span className={styles.totalPillLabel}>Total Amount</span>
                                <span className={styles.totalPillAmount}>{currency} {totalAmount}</span>
                                <span className={styles.totalPillNote}>Included VAT and Taxes</span>
                            </div>
                        </div>

                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={styles.sectionIconWrap}><FaInfoCircle size={12} /></span>
                                    IMPORTANT INFORMATION
                                </div>
                            </div>
                            <ul className={styles.importantList}>
                                <li>The invoice displays the complete pricing details of your holiday package booking, inclusive of all applicable taxes.</li>
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
                                    <a href="mailto:info@example.com">info@example.com</a>
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
                        <Link href={`/holiday-packages/voucher/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
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
