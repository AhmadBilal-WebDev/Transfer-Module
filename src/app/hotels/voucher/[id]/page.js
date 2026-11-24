"use client";
import styles from "./Voucher.module.css";
import {
    FaFileInvoice,
    FaHotel,
    FaUser,
    FaUserFriends,
    FaBed,
    FaHome,
    FaMapMarkerAlt,
    FaCommentDots,
    FaInfoCircle,
} from "react-icons/fa";
import moment from "moment";
import { MdOutlineFileDownload } from "react-icons/md";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, Fragment } from "react";
import HotelVoucherLoader from "@/components/Loader/HotelVoucherLoader";
import { IoWarningOutline } from "react-icons/io5";
import QRCode from "react-qr-code";
import Link from "next/link";

const Page = () => {
    const { id } = useParams();
    const ref = useRef();
    const [voucherDetail, setVoucherDetail] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [voucherUrl, setVoucherUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setVoucherUrl(window.location.href);
        }
        document.body.style.backgroundColor = "#f6f1e9";
        fetchDetails();
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, [id]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/booking/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_number: id }),
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.success) {
                setVoucherDetail(res?.data);
            } else {
                setErrorMessage(res?.message);
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching hotel details:", err);
        }
    };

    function convertToCustomerCurrency(price) {
        if (!price || !voucherDetail.pricing?.supplier_to_display_rate) return Number(price || 0).toFixed(2);
        if (voucherDetail.currency_code === voucherDetail.pricing?.display_currency) {
            return Number(price).toFixed(2);
        }
        const convertedPrice = Number(price) * Number(voucherDetail.pricing?.supplier_to_display_rate);
        return convertedPrice.toFixed(2);
    }

    const handleDownload = () => window.print();

    const formatOccupancy = (rate) => {
        const parts = [];
        const adults = Number(rate?.adults || 0);
        const children = Number(rate?.children || 0);
        if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
        if (children > 0) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
        return parts.join(', ') || '—';
    };

    const holder = voucherDetail?.holder_details || {};
    const leadName = [holder.title, holder.name, holder.surname].filter(Boolean).join(' ');
    const bookingPersonFields = [
        { label: 'Name', value: leadName || '—' },
        { label: 'Email', value: holder.email || '—' },
        { label: 'Phone', value: holder.phone || '—' },
        { label: 'Country', value: holder.country || '—' },
        ...(holder.age ? [{ label: 'Age', value: `${holder.age} Y/O` }] : []),
        ...(holder.address ? [{ label: 'Address', value: holder.address }] : []),
    ];
    const additionalAdults = (voucherDetail?.adults_details || []).filter(
        (item) => item.name !== holder.name || item.surname !== holder.surname
    );
    const additionalChildren = voucherDetail?.children_details || [];
    const hasAdditionalGuests = additionalAdults.length > 0 || additionalChildren.length > 0;
    const nights = voucherDetail?.check_in && voucherDetail?.check_out
        ? moment(voucherDetail.check_out).diff(moment(voucherDetail.check_in), 'days')
        : 0;
    const nightsLabel = `${nights} Night${nights !== 1 ? 's' : ''}`;

    const roomRates = [];
    voucherDetail?.rooms_details?.forEach((item, index) => {
        item?.rates?.forEach((rate, rateIndex) => {
            roomRates.push({ item, rate, index, rateIndex });
        });
    });

    const apiCancellationPolicies = Array.isArray(voucherDetail?.cancellation_policies)
        ? voucherDetail.cancellation_policies
        : [];
    const currency = voucherDetail?.pricing?.display_currency;

    const getRoomCancellationPolicies = (item, rate, roomIndex) => {
        const roomId = item?.id ?? item?.room_id ?? rate?.room_id ?? roomIndex + 1;

        const byId = apiCancellationPolicies.find(
            (entry) => Number(entry?.room_id) === Number(roomId)
        );
        if (byId?.policies?.length) return byId.policies;

        // Prefer display order so two rooms with the same name keep separate policies
        const byOrder = apiCancellationPolicies[roomIndex];
        if (byOrder?.policies?.length) return byOrder.policies;

        if (Array.isArray(rate?.cancellationPolicies) && rate.cancellationPolicies.length > 0) {
            return rate.cancellationPolicies;
        }
        if (Array.isArray(rate?.cancellation_policies) && rate.cancellation_policies.length > 0) {
            return rate.cancellation_policies;
        }
        return [];
    };

    const formatCancellationText = (policies) => {
        if (!policies?.length) {
            return 'This room is non-refundable. No cancellation or modification is allowed.';
        }
        return policies.map((policy) => {
            const dateObj = moment.utc(policy.from);
            const dateLabel = dateObj.isValid() ? dateObj.format('DD MMM YYYY') : 'the deadline';
            return `After ${dateLabel}, a cancellation fee of ${currency} ${convertToCustomerCurrency(policy.amount)} will be charged.`;
        }).join(' ');
    };

    const roomPolicies = roomRates.map(({ item, rate }, i) => ({
        roomName: item?.name || `Room ${i + 1}`,
        policies: getRoomCancellationPolicies(item, rate, i),
    }));
    const hasAnyRoomPolicy = roomPolicies.some(({ policies }) => policies.length > 0);

    return (
        <div className={styles.pageWrapper}>
            {isLoading ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className="bg-white rounded shadow p-3">
                        <HotelVoucherLoader />
                    </div>
                </div>
            ) : (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    {errorMessage ? (
                        <div className="bg-white shadow text-center p-5 rounded">
                            <IoWarningOutline className="text-warning" size={120} />
                            <h5 className="mt-4">{errorMessage}</h5>
                        </div>
                    ) : (
                        <div ref={ref} className={styles.voucherCard}>
                            {/* <div className={styles.watermark}>
                                <Image
                                    src='/watermark.png'
                                    width={450}
                                    height={450}
                                    style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                                    alt="Watermark"
                                    quality={100}
                                />
                            </div> */}

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
                                    <h1 className={styles.mainTitle}>Hotel Booking Voucher</h1>
                                    <p className={styles.mainSubtitle}>
                                        Generated on {moment(voucherDetail?.created_at).format('DD MMM YYYY, h:mm A')}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.voucherDetailsBand}>
                                <div className={styles.voucherBandInner}>
                                    <div className={styles.voucherDetailsRow}>
                                        <div className={styles.voucherDetailsLeft}>
                                            <p className={styles.voucherForLabel}>Voucher For</p>
                                            <h2 className={styles.customerName}>{leadName}</h2>
                                            <p className={styles.customerMeta}>
                                                {voucherDetail?.hotel_details?.name}
                                            </p>
                                            <div className={styles.badgeRow}>
                                                <div className={styles.statusBadgeGroup}>
                                                    <span className={styles.bookingDetailSmallLabel}>Booking:</span>
                                                    <span className={`${styles.confirmedBadge} ${voucherDetail?.booking_status === 'cancelled'
                                                        ? styles.cancelledBadge
                                                        : voucherDetail?.booking_status === 'pending' || voucherDetail?.booking_status === 'tentative'
                                                            ? styles.tentativeBadge
                                                            : ''}`}>
                                                        {voucherDetail?.booking_status?.toUpperCase() || 'CONFIRMED'}
                                                    </span>
                                                </div>
                                                {voucherDetail?.payment_status && (
                                                    <div className={styles.statusBadgeGroup}>
                                                        <span className={styles.bookingDetailSmallLabel}>Payment</span>
                                                        <span className={`${styles.confirmedBadge} ${voucherDetail.payment_status === 'paid'
                                                            ? styles.paidBadge
                                                            : voucherDetail.payment_status === 'pending'
                                                                ? styles.pendingBadge
                                                                : ''}`}>
                                                            {voucherDetail.payment_status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.voucherDetailsRight}>
                                            {voucherDetail?.invoice_number && <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Invoice No</span>
                                                <span className={styles.bookingDetailValue}>{voucherDetail?.invoice_number}</span>
                                            </div>}
                                            {voucherDetail?.voucher_number && <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Voucher No</span>
                                                <span className={styles.bookingDetailValue}>{voucherDetail?.voucher_number}</span>
                                            </div>}
                                            {voucherDetail?.booking_reference && <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Booking Ref</span>
                                                <span className={styles.bookingDetailValue}>{voucherDetail?.booking_reference}</span>
                                            </div>}
                                            <div className={styles.summaryLine}>
                                                <span className={styles.bookingDetailLabel}>Duration</span>
                                                <span className={styles.bookingDetailValue}>{nightsLabel}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaUser size={12} /></span>
                                        BOOKING PERSON
                                    </div>
                                </div>
                                <div className={styles.kvGrid}>
                                    {bookingPersonFields.map((field) => (
                                        <div key={field.label} className={styles.kvItem}>
                                            <span className={styles.kvLabel}>{field.label}</span>
                                            <span className={styles.kvValue}>{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {hasAdditionalGuests && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaUserFriends size={12} /></span>
                                            ADDITIONAL GUESTS
                                        </div>
                                    </div>
                                    <div className={styles.guestList}>
                                        {additionalAdults.map((guest, i) => (
                                            <div key={`adult-${i}`} className={styles.guestRow}>
                                                <span className={styles.guestIndex}>{i + 1}</span>
                                                <span className={styles.guestName}>{guest.name} {guest.surname}</span>
                                                {guest.gender && <span className={styles.guestMeta}>{guest.gender}</span>}
                                                <span className={styles.typeBadge}>Adult</span>
                                            </div>
                                        ))}
                                        {additionalChildren.map((child, i) => (
                                            <div key={`child-${i}`} className={styles.guestRow}>
                                                <span className={styles.guestIndex}>{additionalAdults.length + i + 1}</span>
                                                <span className={styles.guestName}>
                                                    {child.name} {child.surname}
                                                    {child.age ? ` · ${child.age} yrs` : ''}
                                                </span>
                                                {child.gender && <span className={styles.guestMeta}>{child.gender}</span>}
                                                <span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaHotel size={12} /></span>
                                        HOTEL INFORMATION
                                    </div>
                                </div>
                                <div className={styles.packageInfoGrid}>
                                    <div className={styles.packageInfoMain}>
                                        <h3 className={styles.packageTitle}>{voucherDetail?.hotel_details?.name}</h3>
                                        {voucherDetail?.hotel_details?.address && (
                                            <p className={styles.hotelMeta}>
                                                <FaMapMarkerAlt size={12} />
                                                {voucherDetail?.hotel_details?.address}
                                            </p>
                                        )}
                                    </div>
                                    <div className={styles.packageInfoDates}>
                                        <div className={styles.dateBox}>
                                            <div className={styles.hotelDateRow}>
                                                <span className={styles.hotelDateLabel}>Check-In</span>
                                                <span className={styles.hotelDateValue}>
                                                    {voucherDetail?.check_in ? moment(voucherDetail.check_in).format('DD MMM YYYY') : '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.dateBox}>
                                            <div className={styles.hotelDateRow}>
                                                <span className={styles.hotelDateLabel}>Check-Out</span>
                                                <span className={styles.hotelDateValue}>
                                                    {voucherDetail?.check_out ? moment(voucherDetail.check_out).format('DD MMM YYYY') : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaBed size={12} /></span>
                                        ROOM DETAILS
                                    </div>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.srCell}>#</th>
                                                <th>Room Type &amp; View</th>
                                                <th>Meal Plan</th>
                                                <th>Occupancy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roomRates.map(({ item, rate }, i) => {
                                                const policies = roomPolicies[i]?.policies || [];
                                                return (
                                                    <Fragment key={`${item.name}-${i}`}>
                                                        <tr>
                                                            <td className={styles.srCell}>{i + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                            <td>{rate?.boardName || '—'}</td>
                                                            <td>{formatOccupancy(rate)}</td>
                                                        </tr>
                                                        <tr className={styles.roomPolicyRow}>
                                                            <td colSpan={4}>
                                                                <div className={styles.roomPolicyBox}>
                                                                    <span className={styles.roomPolicyLabel}>
                                                                        Cancellation · Room {i + 1}
                                                                    </span>
                                                                    <p className={styles.roomPolicyText}>
                                                                        {policies.length > 0 ? (
                                                                            policies.map((policy, pIndex) => {
                                                                                const dateObj = moment.utc(policy.from);
                                                                                const dateLabel = dateObj.isValid()
                                                                                    ? dateObj.format('DD MMM YYYY')
                                                                                    : 'the deadline';
                                                                                return (
                                                                                    <span key={`policy-${i}-${pIndex}`}>
                                                                                        After <strong>{dateLabel}</strong>, a cancellation fee of{' '}
                                                                                        <strong>
                                                                                            {currency} {convertToCustomerCurrency(policy.amount)}
                                                                                        </strong>{' '}
                                                                                        will be charged.
                                                                                        {pIndex < policies.length - 1 ? ' ' : ''}
                                                                                    </span>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            'This room is non-refundable. No cancellation or modification is allowed.'
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><IoWarningOutline size={13} /></span>
                                        CANCELLATION POLICY
                                    </div>
                                </div>
                                {hasAnyRoomPolicy ? (
                                    <ul className={styles.policyList}>
                                        {roomPolicies.map(({ roomName, policies }, i) => (
                                            <li key={`cancel-room-${i}`}>
                                                <strong>Room {i + 1} · {roomName}:</strong>{' '}
                                                {formatCancellationText(policies)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className={styles.nonRefundNote}>
                                        This booking is non-refundable. No cancellation or modification is allowed.
                                    </div>
                                )}
                            </div> */}

                            {voucherDetail?.remark && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaCommentDots size={12} /></span>
                                            SPECIAL REQUEST
                                        </div>
                                    </div>
                                    <div className={styles.requestBox}>{voucherDetail.remark}</div>
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
                                    <li>This voucher must be presented upon arrival.</li>
                                    <li>Standard Check-in time is 16:00 and Check-out time is 12:00.</li>
                                    <li>For group bookings, separate cancellation policies may apply as per the confirmed agreement.</li>
                                    <li>This is a computer generated invoice and does not require any physical signature.</li>
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
                                        ABC Street, XYZ Country
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!isLoading && !errorMessage && (
                <div className={`container mb-3 px-0 ${styles.confirmationWrapper}`}>
                    <div className={styles.actionRow}>
                        <button className={styles.btnPrimary} onClick={handleDownload} type="button">
                            <MdOutlineFileDownload size={17} />
                            Print / Download Voucher
                        </button>
                        <Link href={`/hotels/invoice/${voucherDetail?.invoice_number}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.btnGold} type="button">
                                <FaFileInvoice size={14} />
                                View Invoice
                            </button>
                        </Link>
                        <Link href="/" style={{ textDecoration: 'none' }}>
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
};

export default Page;
