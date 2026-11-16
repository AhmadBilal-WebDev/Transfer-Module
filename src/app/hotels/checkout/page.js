'use client'
import React, { useMemo, useState } from 'react'
import { useLockBodyScroll } from '@/util/useLockBodyScroll'
import Link from 'next/link'
import { FaStar, FaStarHalfAlt, FaTag, FaCalendarCheck, FaCrown, FaUtensils, FaBed } from 'react-icons/fa'
import { BiUser } from 'react-icons/bi'
import { useHotelStore } from '@/components/Store/HotelStore'
import moment from 'moment'
import CheckoutForm from '@/components/Hotels/HotelCheckout/CheckoutForm'
import { FaLocationDot } from 'react-icons/fa6'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import { Tooltip } from '@mantine/core'
import { MdInfoOutline } from 'react-icons/md'
import { useCurrency } from '@/util/currency'
import { ConvertPrice } from '@/components/Currency/ConvertPrice'
import Image from 'next/image'
import { IoPricetagOutline } from 'react-icons/io5'
import { FiChevronLeft } from 'react-icons/fi'
import { IoInformationCircleOutline } from 'react-icons/io5'
import './checkout.css'

export const dynamic = 'force-dynamic'

const makingSlug = (name = '') =>
  name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

const encodeProvider = (str = '') =>
  [...String(str)].map((c) => (c.charCodeAt(0) + 3).toString(36)).join('')

export default function Page() {
  const { availabilityData } = useHotelStore()
  const [modalPolicy, setModalPolicy] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { currency, rates } = useCurrency()
  useLockBodyScroll(showModal)

  const detailHref = useMemo(() => {
    if (!availabilityData?.hotel_name || !availabilityData?.hotel_code) {
      return '/hotels'
    }
    const code = encodeProvider(availabilityData?.provider || '')
    return `/hotels/${makingSlug(availabilityData.hotel_name)}?id=${availabilityData.hotel_code}&code=${code}`
  }, [availabilityData])

  const nights = useMemo(() => {
    if (!availabilityData?.check_in || !availabilityData?.check_out) return 1
    const n = moment(availabilityData.check_out).diff(moment(availabilityData.check_in), 'days')
    return n > 0 ? n : 1
  }, [availabilityData?.check_in, availabilityData?.check_out])

  function getCancellationSummary(policyArr, Defaultcurrency) {
    if (!Array.isArray(policyArr) || policyArr.length === 0) {
      return { message: 'Non-refundable', type: 'non-refundable' }
    }

    const sortedPolicies = [...policyArr].sort(
      (a, b) => moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
    )
    const now = moment.utc()
    const allDatesInFuture = sortedPolicies.every((policy) =>
      moment.utc(policy.from).isAfter(now)
    )
    const nearestPolicy = sortedPolicies[0]
    const nearestDate = moment.utc(nearestPolicy.from)

    if (allDatesInFuture) {
      return {
        message: `Free cancellation before ${nearestDate.format('DD MMMM YYYY')}`,
        type: 'free',
        policy: nearestPolicy,
      }
    }

    const activePolicy = sortedPolicies.find((policy) =>
      moment.utc(policy.from).isAfter(now)
    )

    if (!activePolicy) {
      const lastPolicy = sortedPolicies[sortedPolicies.length - 1]
      const ConvertedAmount = ConvertPrice(lastPolicy?.amount, Defaultcurrency, currency, rates)
      return {
        message: `Cancellation fee: ${ConvertedAmount.newcurrency} ${ConvertedAmount.newprice}`,
        type: 'fee',
        policy: lastPolicy,
      }
    }

    const passedPolicies = sortedPolicies.filter(
      (policy) => !moment.utc(policy.from).isAfter(now)
    )
    const currentPolicy = passedPolicies[passedPolicies.length - 1]
    const ConvertedAmount = ConvertPrice(currentPolicy?.amount, Defaultcurrency, currency, rates)
    return {
      message: `Cancellation fee: ${ConvertedAmount.newcurrency} ${ConvertedAmount.newprice}`,
      type: 'fee',
      policy: currentPolicy,
    }
  }

  function handleViewPolicy(policyArr, policyCurrency) {
    setModalPolicy({ policies: policyArr, currency: policyCurrency })
    setShowModal(true)
  }

  function CancellationModal() {
    if (!showModal || !modalPolicy) return null

    const sortedPolicies = [...modalPolicy.policies].sort(
      (a, b) => moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
    )

    return (
      <div
        className="modal fade show hc-cancel-overlay"
        onClick={() => setShowModal(false)}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable hc-cancel-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content hc-cancel-modal">
            <div className="hc-cancel-modal__top">
              <div className="hc-cancel-modal__brand" aria-hidden="true">
                <span className="hc-cancel-modal__brand-dark">Voy</span>
                <span className="hc-cancel-modal__brand-red">ara</span>
              </div>
              <button
                type="button"
                className="hc-cancel-modal__close"
                aria-label="Close cancellation policy"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="hc-cancel-modal__header">
              <p className="hc-cancel-modal__eyebrow">Booking protection</p>
              <h5 className="hc-cancel-modal__title">Cancellation policy</h5>
              <p className="hc-cancel-modal__subtitle">
                Review refund windows and fees before you confirm.
              </p>
            </div>

            <div className="hc-cancel-modal__body">
              <div className="hc-cancel-policy">
                <div className="hc-cancel-policy__row">
                  <div>
                    <span className="hc-cancel-policy__label">Before</span>
                    <div className="hc-cancel-policy__date">
                      {moment.utc(sortedPolicies[0].from).format('MMM DD, YYYY')}
                    </div>
                  </div>
                  <span className="hc-cancel-policy__badge hc-cancel-policy__badge--refund">
                    Full refund
                  </span>
                </div>
                <p className="hc-cancel-policy__text">
                  Cancel your reservation before{' '}
                  {moment.utc(sortedPolicies[0].from).format('MMM DD [at] h:mm A')}, and
                  you&apos;ll get a full refund. Times are based on the property&apos;s local
                  time.
                </p>
              </div>

              {sortedPolicies.map((policy, idx) => {
                const dateObj = moment.utc(policy.from)
                return (
                  <div key={idx} className="hc-cancel-policy">
                    <div className="hc-cancel-policy__row">
                      <div>
                        <span className="hc-cancel-policy__label">From</span>
                        <div className="hc-cancel-policy__date">
                          {dateObj.format('MMM DD, YYYY')}
                        </div>
                      </div>
                      <span className="hc-cancel-policy__fee">
                        <PriceDisplay price={policy.amount} currency={modalPolicy.currency} />
                      </span>
                    </div>
                    <p className="hc-cancel-policy__text">
                      From {dateObj.format('MMM DD [at] h:mm A')}, a cancellation fee of{' '}
                      <strong>
                        <PriceDisplay price={policy.amount} currency={modalPolicy.currency} />
                      </strong>{' '}
                      will be charged.
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="hc-cancel-modal__footer">
              <button
                type="button"
                className="hc-cancel-modal__done"
                onClick={() => setShowModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const primaryCancelSummary = availabilityData?.rooms?.[0]?.rates?.[0]
    ? getCancellationSummary(
      availabilityData.rooms[0].rates[0]?.cancellation_policies,
      availabilityData?.currency
    )
    : null

  return (
    <div className="hotel-checkout-page">
      <CancellationModal />
      <div className="container">
        <Link href={detailHref} className="hotel-checkout-back">
          <FiChevronLeft size={16} aria-hidden="true" />
          Back to Hotel Details
        </Link>

        <div className="row g-4">
          {/* Left — Guest / payment form */}
          <div className="col-lg-8 col-12 order-2 order-lg-1">
            <CheckoutForm data={availabilityData} currency={currency} rates={rates} />
          </div>

          {/* Right — Booking summary */}
          <div className="col-lg-4 col-12 order-1 order-lg-2">
            <aside className="hotel-checkout-sidebar">
              <div className="hc-summary-card">
                {availabilityData?.main_images?.length > 0 ? (
                  <Image
                    src={availabilityData.main_images[0]?.url}
                    alt={availabilityData?.hotel_name || 'Hotel'}
                    width={400}
                    height={220}
                    className="hc-summary-image"
                    unoptimized
                  />
                ) : (
                  <div className="hc-summary-image" />
                )}

                <div className="hc-summary-body">
                  <h3 className="hc-summary-title">{availabilityData?.hotel_name}</h3>

                  <div className="hc-summary-stars">
                    {availabilityData?.stars && !isNaN(availabilityData.stars) ? (
                      <>
                        {Array(Math.floor(Number(availabilityData.stars)))
                          .fill(0)
                          .map((_, i) => (
                            <FaStar key={i} />
                          ))}
                        {Number(availabilityData.stars) % 1 !== 0 && <FaStarHalfAlt />}
                      </>
                    ) : null}
                  </div>

                  <div className="hc-summary-location">
                    <FaLocationDot />
                    <span>{availabilityData?.address}</span>
                  </div>

                  <div className="hc-dates-container">
                    <h5 className="hc-suite-title">Booking Window</h5>

                    <div className="hc-dates">
                      <div className="hc-dates-item">
                        <span className="hc-dates__label">Check-in</span>
                        <span className="hc-dates__value">
                          {moment(availabilityData?.check_in).format('MMM DD, YYYY')}
                        </span>
                      </div>
                      <div className="hc-dates-item">
                        <span className="hc-dates__label">Check-out</span>
                        <span className="hc-dates__value">
                          {moment(availabilityData?.check_out).format('MMM DD, YYYY')}
                        </span>
                      </div>
                      <p className="hc-nights hc-dates__label">
                        <span>Duration:</span> <strong>{nights} Night{nights > 1 ? 's' : ''}</strong>
                      </p>
                    </div>
                  </div>

                  {availabilityData?.rooms?.map((item, index) => (
                    <div key={index}>
                      <h5 className="hc-suite-title">Selected Room: {item.name}</h5>
                      {item.rates.map((rate, idx) => (
                        <div key={idx}>
                          {rate?.on_request && (
                            <span className="text-danger small mb-2 fw-bold d-inline-flex align-items-center">
                              On Request
                              <Tooltip label="This room is not instantly confirmed and requires availability confirmation from the hotel.">
                                <MdInfoOutline color="#e31c23" size={16} className="ms-1 cursor-pointer" />
                              </Tooltip>
                            </span>
                          )}
                          <p className="hc-suite-meta">
                            {rate.adults} Adult{Number(rate.adults) !== 1 ? 's' : ''}
                            {Number(rate.children) > 0
                              ? ` · ${rate.children} Child${Number(rate.children) !== 1 ? 'ren' : ''}`
                              : ''}
                            {` · ${rate.rooms} Room${Number(rate.rooms) > 1 ? 's' : ''}`}
                          </p>
                          <ul className="hc-suite-list">
                            <li>
                              <FaUtensils size={12} /> Meal Type: {rate.board_name}
                            </li>
                            <li>
                              <FaBed size={12} /> Room: {rate.rooms} Room
                              {Number(rate.rooms) > 1 ? 's' : ''}
                            </li>
                            <li>
                              <BiUser size={13} /> Adults: {rate.adults}
                            </li>
                            <li>
                              <BiUser size={13} /> Child: {rate.children}
                            </li>
                            <li>
                              <IoPricetagOutline size={13} /> Room Price:{' '}
                              <PriceDisplay price={rate.price} currency={availabilityData?.currency} />
                            </li>
                          </ul>
                          <div className="small mb-2" style={{ color: '#e31c23' }}>
                            {getCancellationSummary(rate?.cancellation_policies, availabilityData?.currency).message}
                            {rate?.cancellation_policies?.length > 0 && (
                              <MdInfoOutline
                                size={16}
                                className="ms-1 cursor-pointer"
                                onClick={() =>
                                  handleViewPolicy(rate?.cancellation_policies, availabilityData?.currency)
                                }
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}


                  <div className="hc-price-total">
                    <span>Total Amount</span>
                    <div className="d-flex flex-column align-items-end gap-2">
                      <span>
                        <PriceDisplay
                          price={availabilityData?.total_net}
                          currency={availabilityData?.currency}
                        />
                      </span>
                      <div className="hc-price-total-text"> Inclusive of all VAT &amp; taxes</div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="hc-trust-card">
                <h5 className="hc-trust-title">Why Book With Us</h5>
                {[
                  {
                    icon: <FaTag size={16} />,
                    title: 'Best Price Guarantee',
                    desc: "Find it cheaper elsewhere? We'll match it and give you an extra 10% off.",
                  },
                  {
                    icon: <FaCalendarCheck size={16} />,
                    title: 'Flexible Dates',
                    desc: 'Change your travel dates up to 24 hours before check-in at no extra cost.',
                  },
                  {
                    icon: <FaCrown size={16} />,
                    title: 'VIP Perks Included',
                    desc: 'Complimentary welcome drink, late checkout & room upgrade (subject to availability).',
                  },
                ].map((item, i) => (
                  <div key={i} className="hc-trust-item">
                    <div className="hc-trust-icon">{item.icon}</div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
