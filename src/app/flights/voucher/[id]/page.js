'use client'
import React, { useRef, useEffect, useState } from 'react'
import styles from './voucher.module.css'
import moment from 'moment'
import { FaUser, FaUserFriends, FaFileInvoice, FaHome, FaInfoCircle } from 'react-icons/fa'
import { MdFlight, MdLuggage, MdOutlineFileDownload, MdArrowForward } from 'react-icons/md'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlightBookingDetailLoader from '@/components/Loader/FlightBookinfDetailLoader'
import Image from 'next/image'
import QRCode from 'react-qr-code'
import { IoWarningOutline } from 'react-icons/io5'
import {
  hasBackendPenaltyData,
  getChangePenalty,
  getRefundPolicyDescription,
  getChangePolicyDescription,
} from '@/components/Flights/Checkout/flightHelpers'

export default function FlightVoucher() {
  const voucherRef = useRef()
  const { id } = useParams()
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
    return () => { document.body.style.backgroundColor = '' }
  }, [id])

  const fetchDetails = async () => {
    setIsLoading(true)
    try {
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_reference: id }),
      })
      const res = await responses.json()
      setIsLoading(false)
      if (res.success) {
        setVoucherDetail(res?.data)
      } else {
        setErrorMessage(res?.message)
      }
    } catch (err) {
      setIsLoading(false)
      console.error('Error fetching flight details:', err)
    }
  }

  const getAirportName = (seg) => seg?.name || seg?.iata_code || ''
  const getCityName = (seg) => seg?.city || seg?.iata_code || ''
  const getAirlineName = (airline) => airline?.name || airline?.iata_code || ''

  const formatDuration = (segment) => {
    return `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`
  }

  const getTripTypeLabel = () => {
    const t = voucherDetail?.flight_details?.trip_type
    if (t === 'one_way') return 'One Way Flight'
    if (t === 'return') return 'Return Flight'
    if (t === 'multi_city') return 'Multi City Flight'
    return 'Flight Details'
  }

  const getTotalPassengers = () => {
    if (!voucherDetail?.passenger_counts) return ''
    const { adults = 0, children = 0, infants = 0 } = voucherDetail.passenger_counts
    return [
      adults > 0 && `${adults} Adult${adults > 1 ? 's' : ''}`,
      children > 0 && `${children} Child${children > 1 ? 'ren' : ''}`,
      infants > 0 && `${infants} Infant${infants > 1 ? 's' : ''}`,
    ].filter(Boolean).join(', ')
  }

  const formatGender = (gender) => {
    if (!gender) return '—'
    const g = String(gender).toLowerCase()
    if (g === 'm' || g === 'male') return 'Male'
    if (g === 'f' || g === 'female') return 'Female'
    return String(gender)
  }

  const formatPassengerType = (type) => {
    if (!type) return '—'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const passengerTypeBadgeClass = (type) => {
    const t = String(type || '').toLowerCase()
    if (t === 'child' || t === 'children') return `${styles.typeBadge} ${styles.typeBadgeChild}`
    if (t === 'infant' || t === 'infants') return `${styles.typeBadge} ${styles.typeBadgeInfant}`
    return styles.typeBadge
  }

  const leadPassenger = voucherDetail?.passenger_details?.[0]
  const additionalPassengers = voucherDetail?.passenger_details?.slice(1) || []
  const leadName = [
    leadPassenger?.title ? String(leadPassenger.title).toUpperCase() : null,
    leadPassenger?.firstName,
    leadPassenger?.lastName,
  ].filter(Boolean).join(' ')
  const cancelPolicy = voucherDetail?.cancellation_policies || voucherDetail?.cancellation_policy
  const hasPenalties = hasBackendPenaltyData(voucherDetail)
  const changePenalty = getChangePenalty(voucherDetail)

  const getOverviewRoute = () => {
    const segs = voucherDetail?.segments || []
    if (!segs.length) return null
    const from = segs[0]?.origin
    const trip = voucherDetail?.flight_details?.trip_type
    const to = trip === 'return' && segs.length >= 2
      ? segs[0]?.destination
      : segs[segs.length - 1]?.destination
    if (!from && !to) return null
    return { from, to }
  }

  const overviewRoute = getOverviewRoute()

  return (
    <div className={styles.pageWrapper}>
      {isLoading ? (
        <div className={`container px-0 ${styles.confirmationWrapper}`}>
          <div className="bg-white rounded shadow p-3">
            <FlightBookingDetailLoader />
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
            <div ref={voucherRef} className={styles.voucherCard}>
              <div className={styles.watermark}>
                <Image
                  src="/watermark.png"
                  width={450}
                  height={450}
                  style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                  alt="Watermark"
                  quality={100}
                />
              </div>

              <div className={styles.brandHeader}>
                <div className={styles.brandHeaderTop}>
                  <div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>
                  <div className={styles.brandContact}>
                    <a href="tel:+966509736777" className={styles.brandPhone}>+966 509 736777</a>
                    <a href="mailto:example@royalane.com" className={styles.brandEmail}>example@royalane.com</a>
                  </div>
                </div>
                <div className={styles.brandHeaderDivider} />
                <div className={styles.brandHeaderBottom}>
                  <h1 className={styles.mainTitle}>Flight Booking Voucher</h1>
                  <p className={styles.mainSubtitle}>Generated on {moment(voucherDetail?.created_at, 'DD-MM-YYYY h:mm A').format("DD MMM YYYY, H:mm A")}</p>
                </div>
              </div>

              <div className={styles.voucherDetailsBand}>
                <div className={styles.voucherBandInner}>
                  <div className={styles.voucherDetailsRow}>
                    <div className={styles.voucherDetailsLeft}>
                      <p className={styles.voucherForLabel}>Voucher For</p>
                      <h2 className={styles.customerName}>{leadName}</h2>
                      {overviewRoute && (
                        <div className={styles.overviewRoute}>
                          <div className={styles.overviewRouteEnd}>
                            <span className={styles.overviewRouteCity}>
                              {overviewRoute.from?.city || overviewRoute.from?.name || getCityName(overviewRoute.from)}
                            </span>
                          </div>
                          <MdArrowForward className={styles.overviewRouteArrow} aria-hidden />
                          <div className={styles.overviewRouteEnd}>
                            <span className={styles.overviewRouteCity}>
                              {overviewRoute.to?.city || overviewRoute.to?.name || getCityName(overviewRoute.to)}
                            </span>
                          </div>
                        </div>
                      )}
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
                            <span className={`${styles.confirmedBadge} ${String(voucherDetail.payment_status).toLowerCase() === 'paid'
                              ? styles.paidBadge
                              : String(voucherDetail.payment_status).toLowerCase() === 'pending'
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
                        <span className={styles.bookingDetailLabel}>Trip Type</span>
                        <span className={styles.bookingDetailValue}>{getTripTypeLabel()}</span>
                      </div>
                      <div className={styles.summaryLine}>
                        <span className={styles.bookingDetailLabel}>Passengers</span>
                        <span className={styles.bookingDetailValue}>{getTotalPassengers() || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {leadPassenger && (
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
                      <span className={styles.kvValue}>{leadPassenger?.email || voucherDetail?.email || '—'}</span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Phone</span>
                      <span className={styles.kvValue}>{leadPassenger?.phone || '—'}</span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Type</span>
                      <span className={styles.kvValue}>{formatPassengerType(leadPassenger?.type)}</span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Gender</span>
                      <span className={styles.kvValue}>{formatGender(leadPassenger?.gender)}</span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Date of Birth</span>
                      <span className={styles.kvValue}>
                        {leadPassenger?.dateOfBirth ? moment(leadPassenger.dateOfBirth).format('DD MMM YYYY') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {additionalPassengers.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}><FaUserFriends size={12} /></span>
                      ADDITIONAL GUESTS
                    </div>
                  </div>
                  <div className={styles.guestList}>
                    {additionalPassengers.map((passenger, index) => (
                      <div key={index} className={styles.guestRow}>
                        <span className={styles.guestIndex}>{index + 2}</span>
                        <span className={styles.guestName}>
                          {[passenger.title ? String(passenger.title).toUpperCase() : null, passenger.firstName, passenger.lastName]
                            .filter(Boolean)
                            .join(' ')}
                          {passenger.dateOfBirth ? ` · ${moment(passenger.dateOfBirth).format('DD MMM YYYY')}` : ''}
                        </span>
                        <span className={styles.guestMeta}>{formatGender(passenger.gender)}</span>
                        <span className={passengerTypeBadgeClass(passenger.type)}>
                          {formatPassengerType(passenger.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {voucherDetail?.segments?.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={styles.sectionIconWrap}><MdFlight size={13} /></span>
                      {getTripTypeLabel().toUpperCase()}
                    </div>
                  </div>
                  <div className={styles.segmentsWrapper}>
                    {voucherDetail.segments.map((segment, segIndex) => (
                      <div key={segIndex} className={styles.flightSegmentCard}>
                        <div className={styles.airlineRow}>
                          {segment.airline?.logo_url && (
                            <img
                              src={segment.airline.logo_url}
                              alt={getAirlineName(segment.airline)}
                              className={styles.airlineLogo}
                            />
                          )}
                          {!segment.airline?.logo_url && <MdFlight size={26} color="#e31c23" />}
                          <div>
                            <p className={styles.airlineNameText}>{getAirlineName(segment.airline)}</p>
                            <p className={styles.flightNumberText}>
                              Flight: {segment.airline?.iata_code} {segment.flight_number}&nbsp;|&nbsp;
                              {segment.cabin_class
                                ? segment.cabin_class.charAt(0).toUpperCase() + segment.cabin_class.slice(1)
                                : 'Economy'}
                            </p>
                          </div>
                          <span className={styles.stayBadge}>
                            {voucherDetail?.booking_status?.toUpperCase() || 'CONFIRMED'}
                          </span>
                        </div>

                        <div className={styles.routeGrid}>
                          <div className={styles.routeStation}>
                            <h4 className={styles.routeCity}>{getCityName(segment.origin)}</h4>
                            <p className={styles.routeAirport}>{getAirportName(segment.origin)}</p>
                            <p className={styles.routeCode}>
                              {segment.origin?.iata_code}
                              {segment.origin?.terminal && ` · Terminal ${segment.origin.terminal}`}
                            </p>
                            <p className={styles.routeTime}>
                              {moment(segment.departing_at).format('DD MMM YYYY, HH:mm')}
                            </p>
                          </div>

                          <div className={styles.routeArrow}>
                            <span className={styles.durationLabel}>{formatDuration(segment)}</span>
                            <div className={styles.arrowLine}>
                              <MdFlight className={styles.planeIcon} />
                            </div>
                          </div>

                          <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                            <h4 className={styles.routeCity}>{getCityName(segment.destination)}</h4>
                            <p className={styles.routeAirport}>{getAirportName(segment.destination)}</p>
                            <p className={styles.routeCode}>
                              {segment.destination?.iata_code}
                              {segment.destination?.terminal && ` · Terminal ${segment.destination.terminal}`}
                            </p>
                            <p className={styles.routeTime}>
                              {moment(segment.arriving_at).format('DD MMM YYYY, HH:mm')}
                            </p>
                          </div>
                        </div>

                        {(segment?.baggage_info?.adult || segment?.baggage_info?.child || segment?.baggage_info?.infant) && (
                          <div className={styles.baggageRow}>
                            <span className={styles.baggageTitle}><MdLuggage size={14} /> Baggage:</span>
                            {segment?.baggage_info?.adult && (
                              <span className={styles.baggageChip}>Adult: {segment.baggage_info.adult.cabin} | {segment.baggage_info.adult.checked}</span>
                            )}
                            {segment?.baggage_info?.child && (
                              <span className={styles.baggageChip}>Child: {segment.baggage_info.child.cabin} | {segment.baggage_info.child.checked}</span>
                            )}
                            {segment?.baggage_info?.infant && (
                              <span className={styles.baggageChip}>Infant: {segment.baggage_info.infant.cabin} | {segment.baggage_info.infant.checked}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}><IoWarningOutline size={13} /></span>
                    CANCELLATION POLICY
                  </div>
                </div>
                {hasPenalties ? (
                  <ul className={styles.policyList}>
                    <li>
                      <strong>Cancellation:</strong> {getRefundPolicyDescription(voucherDetail)}
                    </li>
                    {changePenalty && (
                      <li>
                        <strong>Change/Exchange:</strong> {getChangePolicyDescription(voucherDetail)}
                      </li>
                    )}
                  </ul>
                ) : cancelPolicy?.cancel_policy === 'refundable' && (cancelPolicy.policies || cancelPolicy.cancellation_policies)?.length ? (
                  <ul className={styles.policyList}>
                    {(cancelPolicy.policies || cancelPolicy.cancellation_policies).map((policy, idx) => (
                      <li key={idx}>
                        {policy.from ? (
                          <>
                            If cancelled from <strong>{moment(policy.from).format('DD MMM YYYY')}</strong>, a cancellation fee of{' '}
                            <strong>{policy.amount || policy.value}</strong> will be charged.
                          </>
                        ) : (
                          <>
                            If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{' '}
                            {policy.type === 'percentage'
                              ? <><strong>{policy.value}%</strong> cancellation charge</>
                              : <>fixed cancellation charge of <strong>{policy.value || policy.amount}</strong></>
                            } will apply.
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.nonRefundNote}>
                    This ticket is non-refundable. Cancellations are not permitted.
                  </div>
                )}
              </div>

              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={styles.sectionIconWrap}><FaInfoCircle size={12} /></span>
                    IMPORTANT INFORMATION
                  </div>
                </div>
                <ul className={styles.importantList}>
                  <li>Please arrive at the airport at least 3 hours before international flights and 2 hours before domestic flights.</li>
                  <li>Valid passport and visa (if required) must be presented at check-in.</li>
                  <li>Check-in closes 60 minutes before departure for international flights and 45 minutes for domestic flights.</li>
                  <li>Baggage allowance is subject to airline terms and conditions.</li>
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
            <button className={styles.btnPrimary} onClick={() => window.print()} type="button">
              <MdOutlineFileDownload size={17} />
              Print / Download Voucher
            </button>
            <Link href={`/flights/invoice/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
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
  )
}
