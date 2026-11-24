'use client'
import styles from './invoice.module.css'
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
  FaFileInvoice, FaHome, FaCar, FaGlobe,
  FaMapMarkedAlt, FaPhoneAlt, FaEnvelope,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import Link from "next/link";
import {
  normalizeTransferBookingDetails,
  formatTransferTime,
} from "@/util/normalizeTransferBookingDetails";

export default function Page() {
  const { id } = useParams();
  const ref = useRef();
  const [invoiceDetail, setInvoiceDetail] = useState({});
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
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_reference: id })
      });
      const res = await responses.json();
      setIsLoading(false);
      if (res.success) {
        setInvoiceDetail(res?.data);
      } else {
        setErrorMessage(res?.message)
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching transfer details:", err);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    const s = String(text).replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function convertToCustomerCurrency(price) {
    if (!price || !invoiceDetail.pricing?.supplier_to_display_rate) return Number(price || 0).toFixed(2);
    if (invoiceDetail.pricing?.supplier_currency === invoiceDetail.pricing?.display_currency) {
      return Number(price).toFixed(2);
    }
    const convertedPrice = Number(price) * Number(invoiceDetail.pricing?.supplier_to_display_rate);
    return convertedPrice.toFixed(2);
  }

  const normalized = normalizeTransferBookingDetails(invoiceDetail);
  const {
    transfer,
    lead,
    pax,
    tripType,
    pickupLocation,
    dropoffLocation,
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    vehicleName,
    vehicleCategoryName,
    passengerCapacity,
    luggageCapacity,
    bookedQty,
    totalPassengers,
    displayAmount,
    displayCurrency,
    isMultiLocation,
    locations,
    bookedExtras,
    extrasTotal,
  } = normalized;

  const passengerCount = totalPassengers || (invoiceDetail?.guest_details?.length
    ? 1 + invoiceDetail.guest_details.length
    : 1);
  const currency = displayCurrency || invoiceDetail?.pricing?.display_currency || invoiceDetail?.pricing?.currency;
  const totalAmount = displayAmount;
  const transferQty = Number(bookedQty || 1) || 1;
  // selected_transfers.fare is per-unit (supplier currency) — same as Alhijaz
  const transferFare = Number(transfer?.fare || 0);
  const extrasTotalAmount = Number(extrasTotal || 0);
  const transferLineRaw = transferFare * transferQty;
  const pricingSubtotal = Number(totalAmount || 0);
  const pricingItemName = `${capitalize(vehicleName) || "Transfer"} transfer (${
    String(capitalize(tripType) || "one way").toLowerCase()
  })`;
  const formatConvertedMoney = (value) =>
    `${currency || ""} ${convertToCustomerCurrency(value)}`.trim();
  const formatDisplayMoney = (value) =>
    `${currency || ""} ${Number(value || 0).toFixed(2)}`.trim();
  const leadPassenger = lead || invoiceDetail?.lead_passenger || {};
  const leadName = [
    leadPassenger?.title,
    leadPassenger?.first_name,
    leadPassenger?.last_name,
  ].filter(Boolean).join(" ");
  const leadEmail = leadPassenger?.email || "";
  const leadPhone = leadPassenger?.phone_number || leadPassenger?.phone || "";
  const leadAddress = [
    leadPassenger?.city || leadPassenger?.address || leadPassenger?.nationality,
    leadPassenger?.country || leadPassenger?.country_name,
  ]
    .filter(Boolean)
    .join(", ");
  const pickupName = pickupLocation;
  const dropoffName = dropoffLocation;
  const invoiceDateLabel = invoiceDetail?.created_at
    ? moment(invoiceDetail.created_at).format("DD MMM YYYY")
    : "—";
  const bookingStatusRaw = String(invoiceDetail?.booking_status || "confirmed").toLowerCase();
  const paymentStatusRaw = String(invoiceDetail?.payment_status || "").toLowerCase();
  const bookingStatusLabel =
    bookingStatusRaw.charAt(0).toUpperCase() + bookingStatusRaw.slice(1);
  const paymentStatusLabel = paymentStatusRaw
    ? paymentStatusRaw.charAt(0).toUpperCase() + paymentStatusRaw.slice(1)
    : "";

  const serviceRoute =
    pickupName && dropoffName
      ? `${pickupName} to ${dropoffName}`
      : pickupName || dropoffName || "";
  const serviceValue = serviceRoute
    ? `Private transfer — ${serviceRoute}`
    : "Private transfer";

  const vehicleTitle = vehicleName
    ? vehicleCategoryName &&
      String(vehicleCategoryName).toLowerCase() !== String(vehicleName).toLowerCase()
      ? `${capitalize(vehicleName)} (${capitalize(vehicleCategoryName)})`
      : capitalize(vehicleName)
    : vehicleCategoryName
      ? capitalize(vehicleCategoryName)
      : "";
  const vehicleValue = [
    vehicleTitle || null,
    passengerCapacity && passengerCapacity !== "N/A"
      ? `${passengerCapacity} passengers`
      : null,
    luggageCapacity && luggageCapacity !== "N/A"
      ? `${luggageCapacity} luggage`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") || "—";

  const pickupDateTimeValue = [
    pickupDate ? moment(pickupDate).format("DD MMM YYYY") : null,
    pickupTime ? formatTransferTime(pickupTime) : null,
  ]
    .filter(Boolean)
    .join(" · ") || "—";

  const adultsCount = Number(pax?.adults || 0);
  const childrenCount = Number(pax?.children || 0);
  const infantsCount = Number(pax?.infants || 0);
  const travellersValue = [
    adultsCount > 0
      ? `${adultsCount} Adult${adultsCount === 1 ? "" : "s"}`
      : null,
    childrenCount > 0
      ? `${childrenCount} Child${childrenCount === 1 ? "" : "ren"}`
      : null,
    infantsCount > 0
      ? `${infantsCount} Infant${infantsCount === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") ||
    `${passengerCount} Adult${passengerCount === 1 ? "" : "s"}`;

  const guestRows = [
    {
      fullName: leadName || "—",
      email: leadEmail || leadPassenger?.email || "",
      phone: leadPhone || leadPassenger?.phone_number || leadPassenger?.phone || "",
      gender: capitalize(leadPassenger?.gender) || "—",
      country:
        leadPassenger?.country_name ||
        leadPassenger?.country ||
        leadPassenger?.nationality ||
        "—",
    },
    ...(Array.isArray(invoiceDetail?.guest_details)
      ? invoiceDetail.guest_details.map((guest) => ({
          fullName: [
            guest?.title,
            guest?.first_name,
            guest?.last_name,
          ]
            .filter(Boolean)
            .join(" ") || "—",
          email: guest?.email || "",
          phone: guest?.phone_number || guest?.phone || "",
          gender: capitalize(guest?.gender) || "—",
          country:
            guest?.country_name || guest?.country || guest?.nationality || "—",
        }))
      : []),
  ];

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
                <div className={styles.brandIdentity}>
                  <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                  <p className={styles.brandTagline}>HOLIDAYS FOR A BRIGHTER YOU</p>
                </div>
                <div className={styles.brandContact}>
                  <a href="tel:+966509736777" className={styles.brandContactPill}>
                    <span className={styles.brandContactIcon} aria-hidden="true">
                      <FaPhoneAlt />
                    </span>
                    <span>+966 509 736777</span>
                  </a>
                  <a href="mailto:info@example.com" className={styles.brandContactPill}>
                    <span className={styles.brandContactIcon} aria-hidden="true">
                      <FaEnvelope />
                    </span>
                    <span>info@example.com</span>
                  </a>
                </div>
              </div>
              <div className={styles.brandHeaderDivider} />
            </div>

            <div className={styles.invoiceHero}>
              <div className={styles.invoiceHeroLeft}>
                <p className={styles.invoiceHeroEyebrow}>Transfer booking</p>
                <h1 className={styles.invoiceHeroTitle}>Invoice</h1>
                <div className={styles.invoiceMetaRow}>
                  <div className={styles.invoiceMetaItem}>
                    <span className={styles.invoiceMetaLabel}>Invoice no.</span>
                    <span className={styles.invoiceMetaValue}>
                      {invoiceDetail?.invoice_number || "—"}
                    </span>
                  </div>
                  <div className={styles.invoiceMetaItem}>
                    <span className={styles.invoiceMetaLabel}>Date</span>
                    <span className={styles.invoiceMetaValue}>{invoiceDateLabel}</span>
                  </div>
                  <div className={styles.invoiceMetaItem}>
                    <span className={styles.invoiceMetaLabel}>Booking ref.</span>
                    <span className={styles.invoiceMetaValue}>
                      {invoiceDetail?.booking_reference || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <aside className={styles.billedToCard}>
                <p className={styles.billedToLabel}>Billed to</p>
                <h2 className={styles.billedToName}>{leadName || "—"}</h2>
                <div className={styles.billedToMeta}>
                  {leadAddress ? <p>{leadAddress}</p> : null}
                  {leadEmail ? <p>{leadEmail}</p> : null}
                  {leadPhone ? <p>{leadPhone}</p> : null}
                  {!leadAddress && !leadEmail && !leadPhone ? <p>—</p> : null}
                </div>
                <div className={styles.billedToBadges}>
                  <span
                    className={`${styles.statusPill} ${bookingStatusRaw === "cancelled"
                        ? styles.statusPillCancelled
                        : bookingStatusRaw === "tentative" || bookingStatusRaw === "pending"
                          ? styles.statusPillPending
                          : styles.statusPillSuccess
                      }`}
                  >
                    <span className={styles.statusPillDot} aria-hidden="true" />
                    {bookingStatusLabel || "Confirmed"}
                  </span>
                  {paymentStatusLabel ? (
                    <span
                      className={`${styles.statusPill} ${paymentStatusRaw === "paid"
                          ? styles.statusPillSuccess
                          : paymentStatusRaw === "pending"
                            ? styles.statusPillPending
                            : styles.statusPillSuccess
                        }`}
                    >
                      <span className={styles.statusPillDot} aria-hidden="true" />
                      {paymentStatusLabel}
                    </span>
                  ) : null}
                </div>
              </aside>
            </div>

            <div className={styles.transferDetailsSection}>
              <h2 className={styles.transferDetailsTitle}>Transfer details</h2>
              <div className={styles.transferDetailsList}>
                <div className={styles.transferDetailsRow}>
                  <span className={styles.transferDetailsLabel}>Service</span>
                  <span className={styles.transferDetailsValue}>{serviceValue}</span>
                </div>
                <div className={styles.transferDetailsRow}>
                  <span className={styles.transferDetailsLabel}>Vehicle</span>
                  <span className={styles.transferDetailsValue}>{vehicleValue}</span>
                </div>
                <div className={styles.transferDetailsRow}>
                  <span className={styles.transferDetailsLabel}>{"Date & pickup time"}</span>
                  <span className={styles.transferDetailsValue}>{pickupDateTimeValue}</span>
                </div>
                <div className={styles.transferDetailsRow}>
                  <span className={styles.transferDetailsLabel}>Transfer type</span>
                  <span className={styles.transferDetailsValue}>
                    {capitalize(tripType) || "—"}
                  </span>
                </div>
                <div className={styles.transferDetailsRow}>
                  <span className={styles.transferDetailsLabel}>Travellers</span>
                  <span className={styles.transferDetailsValue}>{travellersValue}</span>
                </div>
                {invoiceDetail?.flight_number ? (
                  <div className={styles.transferDetailsRow}>
                    <span className={styles.transferDetailsLabel}>Flight number</span>
                    <span className={styles.transferDetailsValue}>
                      {invoiceDetail.flight_number}
                    </span>
                  </div>
                ) : null}
                {dropoffDate ? (
                  <div className={styles.transferDetailsRow}>
                    <span className={styles.transferDetailsLabel}>{"Return date & time"}</span>
                    <span className={styles.transferDetailsValue}>
                      {[
                        moment(dropoffDate).format("DD MMM YYYY"),
                        dropoffTime ? formatTransferTime(dropoffTime) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.guestDetailsSection}>
              <h2 className={styles.guestDetailsTitle}>Guest details</h2>
              <div className={styles.guestTableWrap}>
                <table className={styles.guestTable}>
                  <thead>
                    <tr>
                      <th className={styles.guestColIndex}>#</th>
                      <th className={styles.guestColName}>Full name</th>
                      <th className={styles.guestColContact}>Contact</th>
                      <th className={styles.guestColGender}>Gender</th>
                      <th className={styles.guestColCountry}>Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestRows.map((guest, index) => (
                      <tr key={`guest-${index}`}>
                        <td
                          className={styles.guestColIndex}
                          data-label="#"
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`${styles.guestColName} ${styles.guestNameCell}`}
                          data-label="Full name"
                        >
                          {guest.fullName}
                        </td>
                        <td
                          className={`${styles.guestColContact} ${styles.guestContactCell}`}
                          data-label="Contact"
                        >
                          {guest.email || guest.phone ? (
                            <>
                              {guest.email ? <span>{guest.email}</span> : null}
                              {guest.phone ? <span>{guest.phone}</span> : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={styles.guestColGender}
                          data-label="Gender"
                        >
                          {guest.gender}
                        </td>
                        <td
                          className={styles.guestColCountry}
                          data-label="Country"
                        >
                          {guest.country}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {isMultiLocation && locations.length > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}><FaMapMarkedAlt size={12} /></span>
                    MULTIPLE LOCATIONS
                  </div>
                </div>
                <div className={styles.segmentsWrapper}>
                  {locations.map((location, index) => (
                    <div key={index} className={styles.flightSegmentCard}>
                      <div className={styles.routeGrid}>
                        <div className={styles.routeStation}>
                          <p className={styles.routeCity}>PICKUP</p>
                          <p className={styles.routeAirport}>
                            {location.pickup_address || location.pickup_title || "—"}
                          </p>
                        </div>
                        <div className={styles.routeArrow}>
                          <span className={styles.durationLabel}>
                            {tripType === "return" ? "" : `Stop ${index + 1}`}
                          </span>
                          <div className={styles.arrowLine}>
                            <FaCar className={styles.planeIcon} />
                          </div>
                        </div>
                        <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                          <p className={styles.routeCity}>DROPOFF</p>
                          <p className={styles.routeAirport}>
                            {location.dropoff_address || location.dropoff_title || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.vehicleDetailsSection}>
              <h2 className={styles.vehicleDetailsTitle}>Vehicle details</h2>
              <div className={styles.vehicleFields}>
                <div className={styles.vehicleField}>
                  <span className={styles.vehicleFieldLabel}>Vehicle</span>
                  <span className={styles.vehicleFieldValue}>
                    {vehicleTitle || capitalize(vehicleName) || "—"}
                  </span>
                </div>
                <div className={styles.vehicleField}>
                  <span className={styles.vehicleFieldLabel}>Quantity</span>
                  <span className={styles.vehicleFieldValue}>
                    {bookedQty} x {formatConvertedMoney(transferFare)}
                  </span>
                </div>
                <div className={styles.vehicleField}>
                  <span className={styles.vehicleFieldLabel}>Transfer type</span>
                  <span className={styles.vehicleFieldValue}>
                    {capitalize(tripType) || "—"}
                  </span>
                </div>
                <div className={styles.vehicleField}>
                  <span className={styles.vehicleFieldLabel}>Passenger capacity</span>
                  <span className={styles.vehicleFieldValue}>
                    {passengerCapacity && passengerCapacity !== "N/A"
                      ? passengerCapacity
                      : "N/A"}
                  </span>
                </div>
                <div className={styles.vehicleField}>
                  <span className={styles.vehicleFieldLabel}>Luggage capacity</span>
                  <span className={styles.vehicleFieldValue}>
                    {luggageCapacity && luggageCapacity !== "N/A"
                      ? luggageCapacity
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.pricingDetailsSection}>
              <div className={styles.pricingDetailsHeader}>
                <h2 className={styles.pricingDetailsTitle}>Pricing details</h2>
                {currency ? (
                  <span className={styles.pricingCurrencyBadge}>{currency}</span>
                ) : null}
              </div>

              <div className={styles.pricingTableWrap}>
                <table className={styles.pricingTable}>
                  <thead>
                    <tr>
                      <th className={styles.pricingColItem}>Item</th>
                      <th className={styles.pricingColQty}>Qty</th>
                      <th className={styles.pricingColUnit}>Unit price</th>
                      <th className={styles.pricingColTotal}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        className={`${styles.pricingColItem} ${styles.pricingItemName}`}
                        data-label="Item"
                      >
                        {pricingItemName}
                      </td>
                      <td
                        className={styles.pricingColQty}
                        data-label="Qty"
                      >
                        {transferQty}
                      </td>
                      <td
                        className={styles.pricingColUnit}
                        data-label="Unit price"
                      >
                        {formatConvertedMoney(transferFare)}
                      </td>
                      <td
                        className={`${styles.pricingColTotal} ${styles.pricingTotalCell}`}
                        data-label="Total"
                      >
                        {formatConvertedMoney(transferLineRaw)}
                      </td>
                    </tr>
                    {bookedExtras.map((extra, index) => {
                      const extraQty = Number(extra?.units || 1) || 1;
                      const extraUnit = Number(extra?.amount || 0);
                      const extraLineTotal = extraUnit * extraQty;
                      return (
                        <tr key={`extra-${index}`}>
                          <td
                            className={`${styles.pricingColItem} ${styles.pricingItemName}`}
                            data-label="Item"
                          >
                            {extra?.name || extra?.description || "Extra"}
                          </td>
                          <td
                            className={styles.pricingColQty}
                            data-label="Qty"
                          >
                            {extraQty}
                          </td>
                          <td
                            className={styles.pricingColUnit}
                            data-label="Unit price"
                          >
                            {formatConvertedMoney(extraUnit)}
                          </td>
                          <td
                            className={`${styles.pricingColTotal} ${styles.pricingTotalCell}`}
                            data-label="Total"
                          >
                            {formatConvertedMoney(extraLineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pricingSummary}>
                <p className={styles.pricingBreakdown}>
                  Transfer: {formatConvertedMoney(transferLineRaw)}
                  {bookedExtras.length > 0
                    ? ` · Extra services: ${formatConvertedMoney(extrasTotalAmount)}`
                    : ""}
                </p>
                <p className={styles.pricingSubtotal}>
                  Subtotal:{" "}
                  <strong>{formatDisplayMoney(pricingSubtotal)}</strong>
                </p>
              </div>

              <div className={styles.pricingTotalBar}>
                <div className={styles.pricingTotalLeft}>
                  <span className={styles.pricingTotalLabel}>Total</span>
                  <span className={styles.pricingTotalNote}>Incl. VAT and taxes</span>
                </div>
                <span className={styles.pricingTotalAmount}>
                  {formatDisplayMoney(pricingSubtotal)}
                </span>
              </div>
            </div>

            {invoiceDetail?.cancellation_policies?.cancel_policy && (
              <div className={styles.cancelPolicySection}>
                <div className={styles.cancelPolicyCard}>
                  <div className={styles.cancelPolicyTitleRow}>
                    <span className={styles.cancelPolicyIcon} aria-hidden="true">
                      ⚠
                    </span>
                    <h2 className={styles.cancelPolicyTitle}>Cancellation policy</h2>
                  </div>
                  {invoiceDetail.cancellation_policies.cancel_policy === "refundable" ? (
                    invoiceDetail.cancellation_policies.policies?.length > 0 ? (
                      <div className={styles.cancelPolicyBody}>
                        {invoiceDetail.cancellation_policies.policies.map((policy, idx) => (
                          <p key={idx}>
                            If cancelled from{" "}
                            <strong>{moment(policy.from).format("DD MMM YYYY")}</strong>, a
                            cancellation fee of{" "}
                            <strong>
                              {invoiceDetail?.pricing?.display_currency}{" "}
                              {convertToCustomerCurrency(policy.amount)}
                            </strong>{" "}
                            will be charged.
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.cancelPolicyBody}>
                        This transfer is refundable as per the booking terms.
                      </p>
                    )
                  ) : (
                    <p className={styles.cancelPolicyBody}>
                      This transfer is non-refundable. No refund will be issued in case of
                      cancellation.
                    </p>
                  )}
                </div>
              </div>
            )}

            {invoiceDetail?.special_request ? (
              <div className={styles.specialRequestSection}>
                <h2 className={styles.specialRequestTitle}>Special request</h2>
                <div className={styles.specialRequestCard}>
                  {invoiceDetail.special_request}
                </div>
              </div>
            ) : null}

            <div className={styles.importantInfoSection}>
              <h2 className={styles.importantInfoTitle}>Important information</h2>
              <ul className={styles.importantInfoList}>
                <li>
                  Please be ready at the pickup location at least 15 minutes before
                  the scheduled pickup time.
                </li>
                <li>
                  Ensure your contact details are accurate so the driver can reach
                  you.
                </li>
                <li>
                  The driver will wait up to 30 minutes after the scheduled pickup
                  time.
                </li>
                <li>
                  Luggage allowance is subject to the vehicle capacity confirmed at
                  the time of booking.
                </li>
                <li>
                  This booking confirmation is non-transferable and must be
                  presented to the driver.
                </li>
                <li>
                  The invoice shows the complete pricing, inclusive of all
                  applicable taxes.
                </li>
              </ul>

              <div className={styles.invoiceClosingRow}>
                <p className={styles.invoiceClosingNote}>
                  This is a computer-generated invoice and does not require a
                  physical signature.
                </p>
                <div className={styles.invoiceClosingSignoff}>
                  <span>Thank you and best regards,</span>
                  <strong>ROYALANE</strong>
                </div>
              </div>
            </div>

            <div className={styles.invoiceFooterCard}>
              <div className={styles.invoiceFooterTop}>
                <h2 className={styles.invoiceFooterTitle}>Thank you for choosing us</h2>
                <p className={styles.invoiceFooterSubtitle}>
                  We hope you have a wonderful trip.
                </p>
              </div>
              <div className={styles.invoiceFooterDivider} />
              <div className={styles.invoiceFooterContacts}>
                <a href="tel:+966509736777" className={styles.invoiceFooterContact}>
                  <FaPhoneAlt aria-hidden="true" />
                  <span>+966 509 736777</span>
                </a>
                <a href="mailto:info@example.com" className={styles.invoiceFooterContact}>
                  <FaEnvelope aria-hidden="true" />
                  <span>info@example.com</span>
                </a>
                <a
                  href="https://www.royalane.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invoiceFooterContact}
                >
                  <FaGlobe aria-hidden="true" />
                  <span>www.royalane.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.btnPrimary}
              onClick={() => window.print()}
              type="button"
            >
              <MdOutlineFileDownload size={17} />
              Print / Download Invoice
            </button>
            <Link
              href={`/transfers/voucher/${invoiceDetail?.invoice_number || invoiceDetail?.booking_reference}`}
              className={styles.btnGold}
            >
              <FaFileInvoice size={14} />
              View Voucher
            </Link>
            <Link href="/" className={styles.btnHome}>
              <FaHome size={14} />
              Go to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
