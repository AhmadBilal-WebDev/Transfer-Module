'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import moment from 'moment';
import { IoLocationOutline, IoCalendarOutline, IoTimeOutline, IoInformationCircleOutline } from 'react-icons/io5';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import FlightDetail from '@/components/Flights/FlightDetail';
import PolicyModal from './PolicyModal';
import airline from '@/util/airlines.json';
import {
    groupSegments,
    getCompactPassengerLabel,
    getPassengerCount,
    isNonRefundable,
    getRefundPenalty,
    formatRouteDate,
    calcLegDuration,
    formatDuration,
    getStopsLabel,
} from './flightHelpers';
import styles from './FlightSummary.module.css';

const HERO_IMAGE =
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';

export default function FlightSummary({ flightDetails }) {
    const [policyOpen, setPolicyOpen] = useState(false);
    const [flightDetailOpen, setFlightDetailOpen] = useState(false);

    const segmentGroups = groupSegments(flightDetails);
    const refundPenalty = getRefundPenalty(flightDetails);
    const nonRefundable = isNonRefundable(flightDetails);
    const passengerLabel = getCompactPassengerLabel(flightDetails);
    const passengerCount = getPassengerCount(flightDetails) || 1;
    const pricing = flightDetails?.pricing;
    const baseAmount =
        Number(pricing?.base_amount || 0) + Number(pricing?.markup_details?.total_markup_amount || 0);
    const taxAmount = Number(pricing?.tax_amount || 0);
    const totalAmount = Number(pricing?.total_amount || 0);
    const currency = pricing?.currency;
    const primaryGroup = segmentGroups[0];
    const firstSegment = primaryGroup?.segments?.[0];
    const segmentAirlineData = airline.find((a) => a.iata === firstSegment?.airline?.code);
    const airlineName = firstSegment?.airline?.name || segmentAirlineData?.name || firstSegment?.airline?.code || '';
    const flightNumber = firstSegment?.flight_number || '';
    const bookingRef = flightDetails?.id ? `Ref ${String(flightDetails.id).slice(0, 8)}` : '';

    const cancellationText = nonRefundable
        ? 'This fare is non-refundable. Changes and cancellations are not permitted for this ticket.'
        : Number(refundPenalty?.penalty_amount) > 0
            ? `Cancellation is allowed before departure with an airline penalty fee. Change conditions also apply per the fare rules for this ticket.`
            : 'Cancellation is allowed before departure at no additional airline penalty. Change conditions apply per the fare rules for this ticket.';

    return (
        <aside className={styles.summary}>
            <div className={styles.summaryCard}>
                <div className={styles.heroWrap}>
                    <Image
                        src={HERO_IMAGE}
                        alt="Flight"
                        width={800}
                        height={320}
                        className={styles.heroImage}
                    />
                </div>

                <div className={styles.summaryBody}>
                    <h2 className={styles.summaryTitle}>Flight Summary</h2>

                    <div className={styles.airlineBox}>
                        <p className={styles.airlineName}>{airlineName}</p>
                        {flightNumber && <p className={styles.bookingRef}>Flight no: {flightNumber}</p>}
                    </div>

                    {segmentGroups.map((group, index) => {
                        const groupFirst = group.segments[0];
                        const groupLast = group.segments[group.segments.length - 1];
                        const groupDep = groupFirst?.departure?.datetime
                            ? moment(groupFirst.departure.datetime).format('h:mm A')
                            : '';
                        const groupArr = groupLast?.arrival?.datetime
                            ? moment(groupLast.arrival.datetime).format('h:mm A')
                            : '';
                        const groupRoute = `${groupFirst?.departure?.airport_code} → ${groupLast?.arrival?.airport_code}`;
                        const groupDuration = calcLegDuration(group.segments);
                        const groupStops = getStopsLabel(group.segments);

                        return (
                            <div key={index} className={styles.legBlock}>
                                {segmentGroups.length > 1 && (
                                    <span className={styles.legLabel}>{group.label}</span>
                                )}

                                <ul className={styles.detailList}>
                                    <li className={styles.detailItem}>
                                        <IoLocationOutline className={styles.detailIcon} aria-hidden />
                                        <div>
                                            <span className={styles.detailKey}>Route</span>
                                            <span className={styles.detailVal}>{groupRoute}</span>
                                        </div>
                                    </li>
                                    <li className={styles.detailItem}>
                                        <IoCalendarOutline className={styles.detailIcon} aria-hidden />
                                        <div>
                                            <span className={styles.detailKey}>Date &amp; Time</span>
                                            <span className={styles.detailVal}>
                                                {formatRouteDate(groupFirst?.departure?.datetime)}
                                                {groupDep && groupArr ? ` · ${groupDep} - ${groupArr}` : ''}
                                            </span>
                                        </div>
                                    </li>
                                    <li className={styles.detailItem}>
                                        <IoTimeOutline className={styles.detailIcon} aria-hidden />
                                        <div>
                                            <span className={styles.detailKey}>Duration</span>
                                            <span className={styles.detailVal}>
                                                {formatDuration(groupDuration)}
                                                {groupStops ? ` · ${groupStops}` : ''}
                                                {passengerLabel && index === 0 ? ` · ${passengerLabel}` : ''}
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        className={styles.viewDetailsBtn}
                        onClick={() => setFlightDetailOpen(true)}
                    >
                        View Flight Details
                    </button>

                    <div className={styles.priceDivider} />

                    <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>
                            Base Fare ({passengerCount} Passenger{passengerCount !== 1 ? 's' : ''})
                        </span>
                        <span className={styles.priceValue}>
                            <PriceDisplay currency={currency} price={baseAmount} />
                        </span>
                    </div>

                    <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Taxes &amp; Fees</span>
                        <span className={styles.priceValue}>
                            <PriceDisplay currency={currency} price={taxAmount} />
                        </span>
                    </div>

                    <div className={styles.totalBlock}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalValue}>
                            <PriceDisplay currency={currency} price={totalAmount} />
                        </span>
                        <span className={styles.totalNote}>Vat and Taxes included</span>
                    </div>
                </div>
            </div>

            <div className={styles.policyCard}>
                <IoInformationCircleOutline className={styles.policyCardIcon} aria-hidden />
                <div>
                    <h3 className={styles.policyCardTitle}>Cancellation Policy</h3>
                    <p className={styles.policyCardText}>{cancellationText}</p>
                    <button
                        type="button"
                        className={styles.policyLink}
                        onClick={() => setPolicyOpen(true)}
                    >
                        View Baggage &amp; Cancellation Policy
                    </button>
                </div>
            </div>

            <FlightDetail
                flightdata={flightDetails}
                hideTrigger
                showFlights={flightDetailOpen}
                onClose={() => setFlightDetailOpen(false)}
            />

            <PolicyModal
                opened={policyOpen}
                onClose={() => setPolicyOpen(false)}
                flightDetails={flightDetails}
                segmentGroups={segmentGroups}
            />
        </aside>
    );
}
