'use client'
import styles from './voucher.module.css'
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
  FaFileInvoice, FaHome, FaUser, FaUserFriends, FaRegStar, FaStar, FaStarHalfAlt,
  FaMapMarkerAlt, FaCommentDots, FaInfoCircle, FaTicketAlt, FaConciergeBell,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function Page() {
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
    document.body.style.backgroundColor = '#f6f1e9';
    fetchDetails();
    return () => { document.body.style.backgroundColor = ''; };
  }, [id]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/booking/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await responses.json();
      setIsLoading(false);
      if (res.Success) {
        setVoucherDetail(res?.Content?.booking);
      } else {
        setErrorMessage(res?.message);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching activity details:", err);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.customer_exchange_rate) return Number(price || 0).toFixed(2);
    if (voucherDetail.currency_code === voucherDetail.customer_currency) return Number(price).toFixed(2);
    return (Number(price) * Number(voucherDetail.customer_exchange_rate)).toFixed(2);
  }

  const handlePrint = () => window.print();

  const getTotalPassengers = () => {
    const parts = [];
    const adults = Number(voucherDetail?.adults || 0);
    const children = Number(voucherDetail?.children || 0);
    if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
    return parts.join(', ');
  };

  const getActivityOpenTime = () => {
    const openTime = voucherDetail?.activity?.open_hours?.[
      moment(voucherDetail?.travel_date).format('dddd').toLowerCase()
    ]?.open;
    return openTime ? moment(openTime, 'HH:mm').format('hh:mm A') : '';
  };

  const leadName = [
    voucherDetail?.lead_title,
    voucherDetail?.lead_first_name,
    voucherDetail?.lead_last_name,
  ].filter(Boolean).join(' ');

  const additionalAdults = voucherDetail?.other_passengers?.additional_adults || [];
  const additionalChildren = voucherDetail?.other_passengers?.children_details || [];
  const hasAdditionalGuests = additionalAdults.length > 0 || additionalChildren.length > 0;
  const cancelPolicy = voucherDetail?.activity?.cancellation_policy;
  const rating = Number(voucherDetail?.activity?.rating_stars || 0);
  const currency = voucherDetail?.customer_currency;

  return (
    <div className={styles.pageWrapper}>
      {isLoading ? (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div className="bg-white rounded shadow p-3">
            <HotelInvoiceLoader />
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
                  src="/watermark.png"
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
                    <a href="tel:+966509736777" className={styles.brandPhone}>+966 509 736777</a>
                    <a href="mailto:info@example.com" className={styles.brandEmail}>info@example.com</a>
                  </div>
                </div>
                <div className={styles.brandHeaderDivider} />
                <div className={styles.brandHeaderBottom}>
                  <h1 className={styles.mainTitle}>Activity Booking Voucher</h1>
                  <p className={styles.mainSubtitle}>Generated on {moment(voucherDetail?.created_at, 'DD-MM-YYYY HH:mm:ss').format("DD MMM YYYY, h:mm A")}</p>
                </div>
              </div>

              <div className={styles.voucherDetailsBand}>
                <div className={styles.voucherBandInner}>
                  <div className={styles.voucherDetailsRow}>
                    <div className={styles.voucherDetailsLeft}>
                      <p className={styles.voucherForLabel}>Voucher For</p>
                      <h2 className={styles.customerName}>{leadName}</h2>
                      <p className={styles.customerMeta}>
                      {voucherDetail?.activity?.title}
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
                            <span className={styles.bookingDetailSmallLabel}>Payment:</span>
                            <span className={`${styles.confirmedBadge} ${voucherDetail.payment_status.toLowerCase() === 'paid'
                              ? styles.paidBadge
                              : voucherDetail.payment_status.toLowerCase() === 'pending'
                                ? styles.pendingBadge
                                : ''}`}>
                              {voucherDetail.payment_status.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.voucherDetailsRight}>
                      {voucherDetail?.booking_reference && <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>Booking Ref</span>
                        <span className={styles.bookingDetailValue}>{voucherDetail?.booking_reference}</span>
                      </div>}
                      {voucherDetail?.invoice_number && <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>Invoice Number</span>
                        <span className={styles.bookingDetailValue}>{voucherDetail?.invoice_number}</span>
                      </div>}
                      <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>Travelers</span>
                        <span className={styles.bookingDetailValue}>{getTotalPassengers() || '—'}</span>
                      </div>
                      <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>Duration</span>
                        <span className={styles.bookingDetailValue}>{voucherDetail.activity.activity_duration}</span>
                      </div>
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
                    <span className={styles.kvValue}>{leadName || '—'}</span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Email</span>
                    <span className={styles.kvValue}>{voucherDetail?.lead_email || '—'}</span>
                  </div>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Phone</span>
                    <span className={styles.kvValue}>{voucherDetail?.lead_phone || '—'}</span>
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
                      <span className={styles.kvValue}>{voucherDetail.lead_address}</span>
                    </div>
                  )}
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
                    {additionalAdults.map((adult, i) => (
                      <div key={`adult-${i}`} className={styles.guestRow}>
                        <span className={styles.guestIndex}>{i + 1}</span>
                        <span className={styles.guestName}>{adult.first_name} {adult.last_name}</span>
                        <span className={styles.guestMeta}>{capitalize(adult.gender) || '—'}</span>
                        <span className={styles.typeBadge}>Adult</span>
                      </div>
                    ))}
                    {additionalChildren.map((child, i) => (
                      <div key={`child-${i}`} className={styles.guestRow}>
                        <span className={styles.guestIndex}>{additionalAdults.length + i + 1}</span>
                        <span className={styles.guestName}>
                          {child.first_name} {child.last_name}
                          {child.age ? ` · ${child.age} yrs` : ''}
                        </span>
                        <span className={styles.guestMeta}>{capitalize(child.gender) || '—'}</span>
                        <span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}><FaTicketAlt size={12} /></span>
                    ACTIVITY DETAILS
                  </div>
                </div>
                <div className={styles.packageInfoGrid}>
                  <div className={styles.packageInfoMain}>
                    <h3 className={styles.packageTitle}>{voucherDetail?.activity?.title}</h3>
                    {voucherDetail?.activity?.address && (
                      <p className={styles.hotelMeta}>
                        <FaMapMarkerAlt size={12} />
                        {voucherDetail.activity.address}
                      </p>
                    )}
                    {rating > 0 && (
                      <div className={styles.starRow}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const fullStars = Math.floor(rating);
                          const hasHalfStar = rating - fullStars >= 0.5;
                          if (index < fullStars) return <FaStar key={index} size={13} color="#e31c23" />;
                          if (index === fullStars && hasHalfStar) return <FaStarHalfAlt key={index} size={13} color="#e31c23" />;
                          return <FaRegStar key={index} size={13} color="#e31c23" />;
                        })}
                        <span className={styles.starLabel}>{rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.packageInfoDates}>
                    <div className={styles.hotelDateRow}>
                      <span className={styles.hotelDateLabel}>Date</span>
                      <span className={styles.hotelDateValue}>
                        {voucherDetail?.travel_date
                          ? moment(voucherDetail.travel_date).format('DD MMM YYYY')
                          : '—'}
                      </span>
                    </div>
                    {getActivityOpenTime() && (
                      <div className={styles.hotelDateRow}>
                        <span className={styles.hotelDateLabel}>Time</span>
                        <span className={styles.hotelDateValue}>{getActivityOpenTime()}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* <div className={styles.kvList}>
                  <span className={styles.kvLabel}>Activity Date/Time</span>
                  <span className={styles.kvValue}>
                    {voucherDetail?.travel_date
                      ? `${moment(voucherDetail.travel_date).format('DD-MM-YYYY')}${getActivityOpenTime() ? ` ${getActivityOpenTime()}` : ''}`
                      : '—'}
                  </span>
                  <span className={styles.kvLabel}>Day</span>
                  <span className={styles.kvValue}>
                    {voucherDetail?.travel_date ? moment(voucherDetail.travel_date).format('dddd') : '—'}
                  </span>
                  {voucherDetail?.activity?.activity_duration && (
                    <>
                      <span className={styles.kvLabel}>Duration</span>
                      <span className={styles.kvValue}>{voucherDetail.activity.activity_duration}</span>
                    </>
                  )}
                  <span className={styles.kvLabel}>Adults</span>
                  <span className={styles.kvValue}>{voucherDetail?.adults || 0}</span>
                  {Number(voucherDetail?.children) > 0 && (
                    <>
                      <span className={styles.kvLabel}>Children</span>
                      <span className={styles.kvValue}>{voucherDetail.children}</span>
                    </>
                  )}
                </div> */}
              </div>

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
                          <th>Service</th>
                          <th className="text-center">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherDetail.additional_services.map((item, index) => (
                          <tr key={index}>
                            <td className={styles.srCell}>{index + 1}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {cancelPolicy && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}><IoWarningOutline size={13} /></span>
                      CANCELLATION POLICY
                    </div>
                  </div>
                  {cancelPolicy.cancel_policy === 'refundable' && cancelPolicy.cancellation_policies?.length ? (
                    <ul className={styles.policyList}>
                      {cancelPolicy.cancellation_policies.map((policy, i) => (
                        <li key={i}>
                          If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{' '}
                          {policy.type === 'percentage'
                            ? <><strong>{policy.value}%</strong> cancellation charge</>
                            : <>fixed cancellation charge of <strong>{currency} {convertToCustomerCurrency(policy.value)}</strong></>
                          } will apply.
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.nonRefundNote}>
                      This booking is non-refundable. No refund will be issued for cancellations.
                    </div>
                  )}
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
                  <div className={styles.requestBox}>{voucherDetail.special_request}</div>
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
                  <li>Please present this voucher on arrival at the activity location.</li>
                  <li>Arrive at least 15 minutes before the scheduled activity start time.</li>
                  <li>Valid passport or photo ID must be presented at check-in.</li>
                  <li>This is a computer-generated confirmation and does not require a physical signature.</li>
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
            <button className={styles.btnPrimary} onClick={handlePrint} type="button">
              <MdOutlineFileDownload size={17} />
              Print / Download Voucher
            </button>
            <Link href={`/activities/invoice/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
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
}
