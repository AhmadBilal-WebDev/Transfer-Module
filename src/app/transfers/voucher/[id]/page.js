'use client'
import styles from './voucher.module.css'
import {
  FaFileInvoice,
  FaCar,
  FaHome,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
} from 'react-icons/fa'
import { MdOutlineFileDownload } from 'react-icons/md'
import moment from 'moment'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import HotelVoucherLoader from '@/components/Loader/HotelVoucherLoader'
import QRCode from 'react-qr-code'
import Link from 'next/link'
import {
  normalizeTransferBookingDetails,
  formatTransferTime,
} from '@/util/normalizeTransferBookingDetails'

export default function Page() {
  const { id } = useParams()
  const ref = useRef()
  const [voucherDetail, setVoucherDetail] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [voucherUrl, setVoucherUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVoucherUrl(window.location.href)
    }
    document.body.style.backgroundColor = '#f6f1e9'
    fetchDetails()
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [id])

  const fetchDetails = async () => {
    setIsLoading(true)
    try {
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/details`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_reference: id }),
        },
      )
      const res = await responses.json()
      setIsLoading(false)
      if (res.success) {
        setVoucherDetail(res?.data)
      } else {
        setErrorMessage(res?.message)
      }
    } catch (err) {
      setIsLoading(false)
      console.error('Error fetching transfer details:', err)
    }
  }

  function capitalize(text) {
    if (!text) return ''
    const s = String(text).replace(/-/g, ' ')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.pricing?.supplier_to_display_rate) {
      return Number(price || 0).toFixed(2)
    }
    if (
      voucherDetail.pricing?.supplier_currency ===
      voucherDetail.pricing?.display_currency
    ) {
      return Number(price).toFixed(2)
    }
    const convertedPrice =
      Number(price) * Number(voucherDetail.pricing?.supplier_to_display_rate)
    return convertedPrice.toFixed(2)
  }

  const handlePrint = () => window.print()

  const normalized = normalizeTransferBookingDetails(voucherDetail)
  const {
    lead,
    pax,
    tripType,
    pickupLocation,
    dropoffLocation,
    pickupDate,
    pickupTime,
    vehicleName,
    vehicleCategoryName,
    passengerCapacity,
    luggageCapacity,
    bookedQty,
    totalPassengers,
    displayCurrency,
    isMultiLocation,
    locations,
    bookedExtras,
  } = normalized

  const leadPassenger = lead || voucherDetail?.lead_passenger || {}
  const leadName = [
    leadPassenger?.title,
    leadPassenger?.first_name,
    leadPassenger?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
  const leadEmail = leadPassenger?.email || ''
  const leadPhone =
    leadPassenger?.phone_number || leadPassenger?.phone || ''
  const leadCountry =
    leadPassenger?.country_name ||
    leadPassenger?.country ||
    leadPassenger?.nationality ||
    '—'
  const leadGender = capitalize(leadPassenger?.gender) || '—'

  const additionalGuests = Array.isArray(voucherDetail?.guest_details)
    ? voucherDetail.guest_details
    : []
  const passengerCount =
    totalPassengers ||
    (additionalGuests.length ? 1 + additionalGuests.length : 1)

  const adultsCount = Number(pax?.adults || 0)
  const childrenCount = Number(pax?.children || 0)
  const infantsCount = Number(pax?.infants || 0)
  const travellersValue = [
    adultsCount > 0
      ? `${adultsCount} Adult${adultsCount === 1 ? '' : 's'}`
      : null,
    childrenCount > 0
      ? `${childrenCount} Child${childrenCount === 1 ? '' : 'ren'}`
      : null,
    infantsCount > 0
      ? `${infantsCount} Infant${infantsCount === 1 ? '' : 's'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ') ||
    `${passengerCount} Adult${passengerCount === 1 ? '' : 's'}`

  const currency =
    displayCurrency || voucherDetail?.pricing?.display_currency
  const pickupName = pickupLocation
  const dropoffName = dropoffLocation
  const issueDateLabel = voucherDetail?.created_at
    ? moment(voucherDetail.created_at).format('DD MMM YYYY')
    : '—'
  const pickupDateLabel = pickupDate
    ? moment(pickupDate).format('DD MMM YYYY')
    : '—'
  const pickupTimeLabel = pickupTime
    ? formatTransferTime(pickupTime)
    : '—'
  const tripTypeLabel = capitalize(tripType) || '—'
  const bookingStatusRaw = String(
    voucherDetail?.booking_status || 'confirmed',
  ).toLowerCase()
  const paymentStatusRaw = String(
    voucherDetail?.payment_status || '',
  ).toLowerCase()
  const bookingStatusLabel =
    bookingStatusRaw.charAt(0).toUpperCase() + bookingStatusRaw.slice(1)
  const paymentStatusLabel = paymentStatusRaw
    ? paymentStatusRaw.charAt(0).toUpperCase() + paymentStatusRaw.slice(1)
    : ''

  const vehicleTitle = vehicleName
    ? capitalize(vehicleName)
    : vehicleCategoryName
      ? capitalize(vehicleCategoryName)
      : '—'
  const vehicleCategoryLabel = vehicleCategoryName
    ? capitalize(vehicleCategoryName)
    : '—'

  const guestRows = [
    {
      fullName: leadName || '—',
      email: leadEmail,
      phone: leadPhone,
      gender: leadGender,
      country: leadCountry,
    },
    ...additionalGuests.map((guest) => ({
      fullName:
        [guest?.title, guest?.first_name, guest?.last_name]
          .filter(Boolean)
          .join(' ') || '—',
      email: guest?.email || '',
      phone: guest?.phone_number || guest?.phone || '',
      gender: capitalize(guest?.gender) || '—',
      country:
        guest?.country_name || guest?.country || guest?.nationality || '—',
    })),
  ]

  const cancelPolicy = voucherDetail?.cancellation_policies

  return (
    <div className={styles.pageWrapper}>
      {isLoading ? (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div className="bg-white rounded shadow p-3">
            <HotelVoucherLoader />
          </div>
        </div>
      ) : errorMessage ? (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div className={styles.errorBox}>
            <h2>Oops! Something went wrong</h2>
            <p>{errorMessage}</p>
            <Link href="/" className={styles.btnHome}>
              <FaHome size={14} />
              Go to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div ref={ref} id="voucher" className={styles.voucherCard}>
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
                <div className={styles.brandIdentity}>
                  <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                  <p className={styles.brandTagline}>
                    HOLIDAYS FOR A BRIGHTER YOU
                  </p>
                </div>
                <div className={styles.brandContact}>
                  <a href="tel:+966509736777" className={styles.brandContactPill}>
                    <span className={styles.brandContactIcon} aria-hidden="true">
                      <FaPhoneAlt />
                    </span>
                    <span>+966 509 736777</span>
                  </a>
                  <a
                    href="mailto:info@example.com"
                    className={styles.brandContactPill}
                  >
                    <span className={styles.brandContactIcon} aria-hidden="true">
                      <FaEnvelope />
                    </span>
                    <span>info@example.com</span>
                  </a>
                </div>
              </div>
              <div className={styles.brandHeaderDivider} />
            </div>

            <div className={styles.voucherHero}>
              <div className={styles.voucherHeroLeft}>
                <p className={styles.voucherHeroEyebrow}>
                  Transfer confirmation voucher
                </p>
                <h1 className={styles.voucherHeroTitle}>
                  Your transfer is booked.
                </h1>
                <p className={styles.voucherHeroText}>
                  Show this voucher to the driver — printed or on your phone.
                  Thank you for choosing ROYALANE.
                </p>
                <div className={styles.voucherHeroBadges}>
                  <span
                    className={`${styles.statusPill} ${
                      bookingStatusRaw === 'cancelled'
                        ? styles.statusPillCancelled
                        : bookingStatusRaw === 'tentative' ||
                            bookingStatusRaw === 'pending'
                          ? styles.statusPillPending
                          : styles.statusPillSuccess
                    }`}
                  >
                    <span className={styles.statusPillDot} aria-hidden="true" />
                    Status: {bookingStatusLabel || 'Confirmed'}
                  </span>
                  {paymentStatusLabel ? (
                    <span
                      className={`${styles.statusPill} ${
                        paymentStatusRaw === 'paid'
                          ? styles.statusPillSuccess
                          : paymentStatusRaw === 'pending'
                            ? styles.statusPillPending
                            : styles.statusPillSuccess
                      }`}
                    >
                      <span className={styles.statusPillDot} aria-hidden="true" />
                      Payment: {paymentStatusLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={styles.qrCard}>
                <div className={styles.qrCodeWrap}>
                  {voucherUrl ? (
                    <QRCode
                      value={voucherUrl}
                      size={96}
                      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    />
                  ) : null}
                </div>
                <p className={styles.qrLabel}>QR CODE</p>
                <p className={styles.qrHint}>Scan to verify</p>
              </div>
            </div>

            <div className={styles.metaStrip}>
              <div className={`${styles.metaCell} ${styles.metaCellAccent}`}>
                <span className={styles.metaLabel}>Invoice no.</span>
                <span className={styles.metaValue}>
                  {voucherDetail?.invoice_number || '—'}
                </span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Booking reference</span>
                <span className={styles.metaValue}>
                  {voucherDetail?.booking_reference || '—'}
                </span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Issue date</span>
                <span className={styles.metaValue}>{issueDateLabel}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.metaLabel}>Lead passenger</span>
                <span className={styles.metaValue}>{leadName || '—'}</span>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Transfer details</h2>
              <div className={styles.routeCard}>
                <div className={styles.routeSide}>
                  <p className={styles.routeLabel}>Pickup</p>
                  <p className={styles.routePlace}>{pickupName || '—'}</p>
                  <p className={styles.routeMeta}>
                    {[pickupDateLabel !== '—' ? pickupDateLabel : null, pickupTimeLabel !== '—' ? pickupTimeLabel : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <div className={styles.routeCenter}>
                  <FaCar className={styles.routeCarIcon} aria-hidden="true" />
                  <p className={styles.routeType}>— {tripTypeLabel} —</p>
                </div>
                <div className={`${styles.routeSide} ${styles.routeSideRight}`}>
                  <p className={styles.routeLabel}>Dropoff</p>
                  <p className={styles.routePlace}>{dropoffName || '—'}</p>
                </div>
              </div>

              <div className={styles.infoChips}>
                <div className={styles.infoChip}>
                  <span className={styles.infoChipLabel}>Transfer date</span>
                  <span className={styles.infoChipValue}>{pickupDateLabel}</span>
                </div>
                <div className={styles.infoChip}>
                  <span className={styles.infoChipLabel}>Pickup time</span>
                  <span className={styles.infoChipValue}>{pickupTimeLabel}</span>
                </div>
                <div className={styles.infoChip}>
                  <span className={styles.infoChipLabel}>Transfer type</span>
                  <span className={styles.infoChipValue}>{tripTypeLabel}</span>
                </div>
                <div className={styles.infoChip}>
                  <span className={styles.infoChipLabel}>Passengers</span>
                  <span className={styles.infoChipValue}>{travellersValue}</span>
                </div>
              </div>

              {voucherDetail?.flight_number ? (
                <p className={styles.flightNote}>
                  Flight number: <strong>{voucherDetail.flight_number}</strong>
                </p>
              ) : null}

              {isMultiLocation && locations.length > 0 ? (
                <div className={styles.multiStops}>
                  {locations.map((location, index) => (
                    <div key={index} className={styles.multiStopRow}>
                      <span>
                        {location.pickup_address ||
                          location.pickup_title ||
                          '—'}
                      </span>
                      <FaCar aria-hidden="true" />
                      <span>
                        {location.dropoff_address ||
                          location.dropoff_title ||
                          '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Vehicle details</h2>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Category</th>
                      <th>Transfer type</th>
                      <th>Passengers</th>
                      <th>Luggage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td data-label="Vehicle" className={styles.cellStrong}>
                        {vehicleTitle}
                        {bookedQty > 1 ? ` × ${bookedQty}` : ''}
                      </td>
                      <td data-label="Category">{vehicleCategoryLabel}</td>
                      <td data-label="Transfer type">{tripTypeLabel}</td>
                      <td data-label="Passengers">
                        {passengerCapacity && passengerCapacity !== 'N/A'
                          ? passengerCapacity
                          : 'N/A'}
                      </td>
                      <td data-label="Luggage">
                        {luggageCapacity && luggageCapacity !== 'N/A'
                          ? luggageCapacity
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {bookedExtras.length > 0 ? (
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Extra services</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th className={styles.colNarrow}>Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookedExtras.map((extra, index) => (
                        <tr key={`extra-${index}`}>
                          <td data-label="Service" className={styles.cellStrong}>
                            {extra?.name || extra?.description || 'Extra'}
                          </td>
                          <td
                            data-label="Units"
                            className={styles.colNarrow}
                          >
                            {extra?.units || 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Guest information</h2>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.colIndex}>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestRows.map((guest, index) => (
                      <tr key={`guest-${index}`}>
                        <td data-label="#" className={styles.colIndex}>
                          {index + 1}
                        </td>
                        <td data-label="Name" className={styles.cellStrong}>
                          {guest.fullName}
                        </td>
                        <td data-label="Email">{guest.email || '—'}</td>
                        <td data-label="Phone">{guest.phone || '—'}</td>
                        <td data-label="Gender">{guest.gender}</td>
                        <td data-label="Country">{guest.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.totalPax}>Total Pax: {travellersValue}</p>
            </div>

            {cancelPolicy?.cancel_policy ? (
              <div className={styles.cancelPolicySection}>
                <div className={styles.cancelPolicyCard}>
                  <div className={styles.cancelPolicyTitleRow}>
                    <span className={styles.cancelPolicyIcon} aria-hidden="true">
                      ⚠
                    </span>
                    <h2 className={styles.cancelPolicyTitle}>
                      Cancellation policy
                    </h2>
                  </div>
                  {cancelPolicy.cancel_policy === 'refundable' &&
                  cancelPolicy.policies?.length > 0 ? (
                    <div className={styles.cancelPolicyBody}>
                      {cancelPolicy.policies.map((policy, idx) => (
                        <p key={idx}>
                          If cancelled from{' '}
                          <strong>
                            {moment(policy.from).format('DD MMM YYYY')}
                          </strong>
                          , a cancellation fee of{' '}
                          <strong>
                            {currency} {convertToCustomerCurrency(policy.amount)}
                          </strong>{' '}
                          will be charged.
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.cancelPolicyBody}>
                      This transfer is non-refundable. No refund will be issued
                      in case of cancellation.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {voucherDetail?.special_request ? (
              <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Special request</h2>
                <div className={styles.specialRequestCard}>
                  {voucherDetail.special_request}
                </div>
              </div>
            ) : null}

            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Important information</h2>
              <ul className={styles.importantList}>
                <li>
                  Please be ready at the pickup location at least 15 minutes
                  before the scheduled pickup time.
                </li>
                <li>
                  Present this voucher to the driver — printed or on your phone.
                </li>
                <li>
                  Ensure your contact details are accurate so the driver can
                  reach you.
                </li>
                <li>
                  The driver will wait up to 30 minutes after the scheduled
                  pickup time.
                </li>
                <li>
                  Luggage allowance is subject to the vehicle capacity confirmed
                  at the time of booking.
                </li>
                <li>
                  Additional waiting time or route changes may incur extra
                  charges.
                </li>
              </ul>
            </div>

            <div className={styles.invoiceFooterCard}>
              <div className={styles.invoiceFooterTop}>
                <h2 className={styles.invoiceFooterTitle}>
                  Thank you for choosing us
                </h2>
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
                <a
                  href="mailto:info@example.com"
                  className={styles.invoiceFooterContact}
                >
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
              onClick={handlePrint}
              type="button"
            >
              <MdOutlineFileDownload size={17} />
              Print / Download Voucher
            </button>
            <Link
              href={`/transfers/invoice/${voucherDetail?.invoice_number || voucherDetail?.booking_reference}`}
              className={styles.btnGold}
            >
              <FaFileInvoice size={14} />
              View Invoice
            </Link>
            <Link href="/" className={styles.btnHome}>
              <FaHome size={14} />
              Go to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
