'use client'
import styles from './invoice.module.css'
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
  FaFileInvoice, FaHome, FaUser, FaUserFriends, FaStar, FaRegStar, FaStarHalfAlt,
  FaMapMarkerAlt, FaCommentDots, FaInfoCircle, FaTicketAlt,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
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
  ].filter(Boolean).join(" ");

  const additionalAdults = voucherDetail?.other_passengers?.additional_adults || [];
  const additionalChildren = voucherDetail?.other_passengers?.children_details || [];
  const hasAdditionalGuests = additionalAdults.length > 0 || additionalChildren.length > 0;
  const currency = voucherDetail?.customer_currency;
  const totalAmount = voucherDetail?.customer_total;
  const cancelPolicy = voucherDetail?.activity?.cancellation_policy;
  const rating = Number(voucherDetail?.activity?.rating_stars || 0);

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
          <div ref={ref} id="invoice" className={styles.voucherCard}>
            {/* <div className={styles.watermark}>
              <Image
                src="/watermark.png"
                width={450}
                height={450}
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
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
                <p className={styles.headerAddress}>Activity Booking Invoice</p>
                <p className={styles.generatedOn}>
                  Generated on {moment(voucherDetail?.created_at, 'DD-MM-YYYY HH:mm:ss').format("DD MMM YYYY, h:mm A")}
                </p>
              </div>
            </div>

            <div className={styles.voucherDetailsBand}>
              <div className={styles.voucherBandInner}>
                <div className={styles.voucherDetailsRow}>
                  <div className={styles.voucherDetailsLeft}>
                    <p className={styles.voucherForLabel}>Invoice For</p>
                    <h2 className={styles.customerName}>{leadName}</h2>
                    <p className={styles.customerMeta}>
                    {voucherDetail?.activity?.title}
                    </p>
                    <div className={styles.badgeRow}>
                      <div className={styles.statusBadgeGroup}>
                        <span className={styles.bookingDetailSmallLabel}>Booking:</span>
                        <span className={`${styles.confirmedBadge} ${voucherDetail?.booking_status === "cancelled"
                          ? styles.cancelledBadge
                          : voucherDetail?.booking_status === "tentative" || voucherDetail?.booking_status === "pending"
                            ? styles.tentativeBadge
                            : ""}`}>
                          {voucherDetail?.booking_status?.toUpperCase() || "CONFIRMED"}
                        </span>
                      </div>
                      {voucherDetail?.payment_status && (
                        <div className={styles.statusBadgeGroup}>
                          <span className={styles.bookingDetailSmallLabel}>Payment:</span>
                          <span className={`${styles.confirmedBadge} ${voucherDetail.payment_status.toLowerCase() === "paid"
                            ? styles.paidBadge
                            : voucherDetail.payment_status.toLowerCase() === "pending"
                              ? styles.pendingBadge
                              : ""}`}>
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
                      <span className={styles.bookingDetailValue}>{getTotalPassengers() || "—"}</span>
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
                  <span className={styles.kvValue}>{leadName || "—"}</span>
                </div>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>Email</span>
                  <span className={styles.kvValue}>{voucherDetail?.lead_email || "—"}</span>
                </div>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>Phone</span>
                  <span className={styles.kvValue}>{voucherDetail?.lead_phone || "—"}</span>
                </div>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>Gender</span>
                  <span className={styles.kvValue}>{capitalize(voucherDetail?.lead_gender) || "—"}</span>
                </div>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>Country</span>
                  <span className={styles.kvValue}>{voucherDetail?.lead_country || "—"}</span>
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
                      <span className={styles.guestMeta}>{capitalize(adult.gender) || "—"}</span>
                      <span className={styles.typeBadge}>Adult</span>
                    </div>
                  ))}
                  {additionalChildren.map((child, i) => (
                    <div key={`child-${i}`} className={styles.guestRow}>
                      <span className={styles.guestIndex}>{additionalAdults.length + i + 1}</span>
                      <span className={styles.guestName}>
                        {child.first_name} {child.last_name}
                        {child.age ? ` · ${child.age} yrs` : ""}
                      </span>
                      <span className={styles.guestMeta}>{capitalize(child.gender) || "—"}</span>
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
                        ? moment(voucherDetail.travel_date).format("DD MMM YYYY")
                        : "—"}
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
                    ? `${moment(voucherDetail.travel_date).format("DD-MM-YYYY")}${getActivityOpenTime() ? ` ${getActivityOpenTime()}` : ""}`
                    : "—"}
                </span>
                {voucherDetail?.activity?.activity_duration && (
                  <>
                    <span className={styles.kvLabel}>Duration</span>
                    <span className={styles.kvValue}>{voucherDetail.activity.activity_duration}</span>
                  </>
                )}
                <span className={styles.kvLabel}>Travelers</span>
                <span className={styles.kvValue}>{getTotalPassengers() || "—"}</span>
              </div> */}
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className="d-flex align-items-center gap-2">
                  <span className={styles.sectionIconWrap}><FaFileInvoice size={12} /></span>
                  PRICING DETAILS
                </div>
                <span className={styles.nightsHint}>{currency}</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.premiumTable}>
                  <thead>
                    <tr>
                      <th className={styles.srCell}>#</th>
                      <th>Traveler Type</th>
                      <th className="text-center">Qty × Unit Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.srCell}>1</td>
                      <td style={{ fontWeight: 600 }}>Adult{Number(voucherDetail?.adults) !== 1 ? "s" : ""}</td>
                      <td className="text-center">
                        {voucherDetail?.adults} × {currency} {convertToCustomerCurrency(voucherDetail?.activity?.sale_price)}
                      </td>
                      <td className="text-end">{currency} {convertToCustomerCurrency(voucherDetail?.adult_price)}</td>
                    </tr>
                    {Number(voucherDetail?.children) > 0 && (
                      <tr>
                        <td className={styles.srCell}>2</td>
                        <td style={{ fontWeight: 600 }}>Child{Number(voucherDetail?.children) !== 1 ? "ren" : ""}</td>
                        <td className="text-center">
                          {voucherDetail?.children} × {currency} {convertToCustomerCurrency(voucherDetail?.activity?.child_sale_price)}
                        </td>
                        <td className="text-end">{currency} {convertToCustomerCurrency(voucherDetail?.child_price)}</td>
                      </tr>
                    )}
                    {voucherDetail?.additional_services?.map((item, index) => (
                      <tr key={`svc-${index}`}>
                        <td className={styles.srCell}>
                          {(Number(voucherDetail?.children) > 0 ? 2 : 1) + index + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td className="text-center">
                          {item.quantity} × {currency} {convertToCustomerCurrency(item?.price)}
                        </td>
                        <td className="text-end">{currency} {convertToCustomerCurrency(item?.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.totalsWrap}>
              <div className={styles.totalRow}>
                Subtotal: {currency} {totalAmount}
              </div>
              <div className={styles.totalPill}>
                <span className={styles.totalPillLabel}>Total Amount</span>
                <span className={styles.totalPillAmount}>{currency} {totalAmount}</span>
                <span className={styles.totalPillNote}>Included VAT and Taxes</span>
              </div>
            </div>

            {cancelPolicy && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}><IoWarningOutline size={13} /></span>
                    CANCELLATION POLICY
                  </div>
                </div>
                {cancelPolicy.cancel_policy === "refundable" && cancelPolicy.cancellation_policies?.length ? (
                  <ul className={styles.policyList}>
                    {cancelPolicy.cancellation_policies.map((policy, i) => (
                      <li key={i}>
                        If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{" "}
                        {policy.type === "percentage"
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
                <li>Please present this invoice on arrival at the activity location.</li>
                <li>Arrive at least 15 minutes before the scheduled activity start time.</li>
                <li>Valid passport or photo ID must be presented at check-in.</li>
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

          <div className={styles.actionRow}>
            <button className={styles.btnPrimary} onClick={() => window.print()} type="button">
              <MdOutlineFileDownload size={17} />
              Print / Download Invoice
            </button>
            <Link href={`/activities/voucher/${voucherDetail?.booking_reference}`} style={{ textDecoration: "none" }}>
              <button className={styles.btnGold} type="button">
                <FaFileInvoice size={14} />
                View Voucher
              </button>
            </Link>
            <Link href="/" style={{ textDecoration: "none" }}>
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
