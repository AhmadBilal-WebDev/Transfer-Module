'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '@mantine/core';
import { FaAngleDown, FaSuitcase, FaPlane, FaChair, FaClock, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { MdCancel, MdSwapHoriz } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import moment from 'moment';
import { AirportList } from '@/util/AirportList';
import Image from 'next/image';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { getRefundPenalty, getChangePenalty } from '@/components/Flights/Checkout/flightHelpers';
import styles from './FlightDetail.module.css';

function getAirportInfo(code) {
    const airport = AirportList.find((a) => a.airportCode === code);
    return {
        code: code || '—',
        name: airport?.airportName || code,
        city: airport?.cityName || '',
    };
}

function calcLegDuration(segments) {
    return segments.reduce((acc, seg, idx) => {
        let time = acc + seg.duration;
        const next = segments[idx + 1];
        if (next) {
            time += moment(next.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
        }
        return time;
    }, 0);
}

function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

function groupSegments(flight) {
    if (!flight || !flight.segments) return [];
    if (flight.trip_type === 'return') {
        const legs = flight?.search_criteria?.legs || [];
        if (legs.length === 0) {
            const midpoint = Math.ceil(flight.segments.length / 2);
            return [
                { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
                { segments: flight.segments.slice(midpoint), label: 'Return' }
            ];
        }

        const groupedLegs = [];
        let segmentIndex = 0;
        const labels = ['Departure', 'Return'];

        legs.forEach((leg, legIndex) => {
            const legSegments = [];
            while (segmentIndex < flight.segments.length) {
                const segment = flight.segments[segmentIndex];
                legSegments.push(segment);
                segmentIndex++;
                if (segment.arrival?.airport_code === leg.destination) break;
            }
            if (legSegments.length) {
                groupedLegs.push({
                    segments: legSegments,
                    label: labels[legIndex] || `Flight ${legIndex + 1}`,
                });
            }
        });

        return groupedLegs;
    }
    if (flight.trip_type === 'multicity') {
        const legs = flight.search_criteria?.legs || [];
        if (legs.length === 0) {
            return flight.segments.map((segment, idx) => ({
                segments: [segment],
                label: `Flight ${idx + 1}`
            }));
        }

        const groupedLegs = [];
        let currentSegmentIndex = 0;

        legs.forEach((leg, legIndex) => {
            const legSegments = [];
            const destination = leg.destination;

            while (currentSegmentIndex < flight.segments.length) {
                const segment = flight.segments[currentSegmentIndex];
                legSegments.push(segment);
                currentSegmentIndex++;
                if (segment.arrival.airport_code === destination) break;
            }

            if (legSegments.length > 0) {
                groupedLegs.push({
                    segments: legSegments,
                    label: `Flight ${legIndex + 1}`
                });
            }
        });

        return groupedLegs;
    }
    return [{ segments: flight.segments, label: 'Departure' }];
}

function formatBaggageSummary(segments) {
    const firstWithBaggage = segments.find(s => s?.baggage_info?.adult);
    if (!firstWithBaggage) return null;
    const { cabin, checked } = firstWithBaggage.baggage_info.adult;
    return { checked, cabin };
}

export default function FlightDetail({ flightdata, outlineBtn, showFlights, onClose, hideTrigger = false }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSize, setModalSize] = useState('100%');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateSize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setModalSize(mobile ? '100%' : '680px');
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Keep modal height in sync with iOS visual viewport (URL bar show/hide)
    useEffect(() => {
        if (!modalOpen) return;

        const root = document.documentElement;
        const syncViewportHeight = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            root.style.setProperty('--flight-detail-vh', `${Math.round(height)}px`);
        };

        syncViewportHeight();
        window.visualViewport?.addEventListener('resize', syncViewportHeight);
        window.visualViewport?.addEventListener('scroll', syncViewportHeight);
        window.addEventListener('resize', syncViewportHeight);

        return () => {
            window.visualViewport?.removeEventListener('resize', syncViewportHeight);
            window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
            window.removeEventListener('resize', syncViewportHeight);
            root.style.removeProperty('--flight-detail-vh');
        };
    }, [modalOpen]);

    useEffect(() => {
        if (showFlights !== undefined) {
            setModalOpen(showFlights);
        }
    }, [showFlights]);

    const handlemodalopenclose = () => {
        const next = !modalOpen;
        setModalOpen(next);
        if (!next && onClose) onClose();
    };

    const legGroups = useMemo(() => groupSegments(flightdata), [flightdata]);

    const headerMeta = useMemo(() => {
        const firstGroup = legGroups[0];
        if (!firstGroup?.segments?.length) {
            return { title: 'Flight Details', subtitle: '' };
        }
        const segments = firstGroup.segments;
        const stops = segments.length - 1;
        const totalMin = calcLegDuration(segments);
        const firstSeg = segments[0];
        const ref = `${firstSeg.flight_number || ''}`.trim();

        let layoverMin = 0;
        if (segments.length > 1) {
            layoverMin = moment(segments[1].departure.datetime).diff(moment(segments[0].arrival.datetime), 'minutes');
        }

        const title = stops === 0
            ? 'Direct Flight'
            : `${stops} ${stops === 1 ? 'Stop' : 'Stops'}${layoverMin > 0 ? `, ${formatDuration(layoverMin)} Layover` : ''}`;

        const subtitle = `Total Duration: ${formatDuration(totalMin)}`;

        return { title, subtitle };
    }, [legGroups]);

    const renderPenalties = () => {
        const refundPenalty = getRefundPenalty(flightdata);
        const changePenalty = getChangePenalty(flightdata);

        const renderNonRefundableCard = () => (
            <div className={styles.penaltyCard}>
                <MdCancel className={styles.penaltyIcon} />
                <div>
                    <span className={styles.penaltyLabel}>Cancellation Policy:</span>
                    <span className={`${styles.penaltyText} ${styles.textDanger}`}>
                        This ticket is <strong>non-refundable</strong>. Cancellations are not permitted.
                    </span>
                </div>
            </div>
        );

        return (
            <div className={styles.penaltiesSection}>
                <h6 className={styles.sectionTitleSerif}>Cancellation &amp; Change Policies</h6>
                <div className={styles.penaltiesGrid}>
                    {!refundPenalty ? (
                        renderNonRefundableCard()
                    ) : (
                        <div className={styles.penaltyCard}>
                            <MdCancel className={styles.penaltyIcon} />
                            <div>
                                <span className={styles.penaltyLabel}>Cancellation Policy:</span>
                                {refundPenalty.allowed ? (
                                    <span className={`${styles.penaltyText} ${styles.textSuccess}`}>
                                        {Number(refundPenalty.penalty_amount) > 0 ? (
                                            <>Cancellation allowed with a penalty fee of <strong><PriceDisplay price={refundPenalty.penalty_amount} currency={refundPenalty.penalty_currency} /></strong> before departure.</>
                                        ) : (
                                            <>Cancellation allowed at no additional cost before departure.</>
                                        )}
                                    </span>
                                ) : (
                                    <span className={`${styles.penaltyText} ${styles.textDanger}`}>This ticket is <strong>non-refundable</strong>. Cancellations are not permitted.</span>
                                )}
                            </div>
                        </div>
                    )}

                    {changePenalty && (
                        <div className={styles.penaltyCard}>
                            <MdSwapHoriz className={styles.penaltyIcon} />
                            <div>
                                <span className={styles.penaltyLabel}>Change/Exchange Policy:</span>
                                {changePenalty.allowed ? (
                                    <span className={`${styles.penaltyText} ${styles.textSuccess}`}>
                                        {Number(changePenalty.penalty_amount) > 0 ? (
                                            <>Changes allowed with a fee of <strong><PriceDisplay price={changePenalty.penalty_amount} currency={changePenalty.penalty_currency} /></strong> before departure.</>
                                        ) : (
                                            <>Changes allowed at no additional cost before departure.</>
                                        )}
                                    </span>
                                ) : (
                                    <span className={`${styles.penaltyText} ${styles.textDanger}`}>Changes are <strong>not permitted</strong> for this ticket.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderLegGroup = (group, index) => {
        const segments = group.segments;
        const firstSegment = segments[0];
        const secondSegment = segments[1];
        const lastSegment = segments[segments.length - 1];
        const dep = getAirportInfo(firstSegment.departure.airport_code);
        const arr = getAirportInfo(lastSegment.arrival.airport_code);
        const stops = segments.length - 1;
        const baggage = formatBaggageSummary(segments);

        const layoverSegment = stops > 0 ? segments[0] : null;
        const layoverAirport = layoverSegment ? getAirportInfo(layoverSegment.arrival.airport_code) : null;
        let layoverMinutes = 0;
        if (segments.length > 1) {
            layoverMinutes = moment(segments[1].departure.datetime).diff(moment(segments[0].arrival.datetime), 'minutes');
        }

        const legLabel = group.label === 'Departure' || group.label === 'Return'
            ? `${group.label} Flight`
            : group.label;

        return (
            <section key={index} className={styles.legSection}>
                <div className={styles.legSectionHead}>
                    <span className={styles.legBadge}>{legLabel}</span>
                    <span className={styles.legDate}>{moment(firstSegment.departure.datetime).format('ddd, DD MMM YYYY')}</span>
                </div>

                <div className={`${styles.overviewGrid} ${stops === 0 ? styles.overviewGridDirect : ''}`}>
                    <div className={styles.endpointCard}>
                        <span className={styles.endpointCode}>{dep.code}</span>
                        <span className={styles.endpointName}>{dep.city || dep.name}</span>
                        <span className={styles.endpointMeta}>
                            {moment(firstSegment.departure.datetime).format('h:mm A')} DEPARTURE {moment(firstSegment.departure.datetime).format('DD-MM-YYYY')}
                        </span>
                    </div>

                    {stops > 0 && layoverAirport && (
                        <div className={styles.layoverOverviewCard}>
                            <span className={styles.layoverCircle}>{layoverAirport.code}</span>
                            <span className={styles.layoverCity}>{layoverAirport.city || layoverAirport.name}</span>
                            <span className={styles.layoverDuration}>{formatDuration(layoverMinutes)} Layover</span>
                            <span className={styles.layoverNote}>
                                {moment(secondSegment.departure.datetime).format('h:mm A')} DEPARTURE {moment(secondSegment.departure.datetime).format('DD-MM-YYYY')}
                            </span>
                            <span className={styles.layoverNote}>Connection at airport</span>
                        </div>
                    )}

                    <div className={styles.endpointCard}>
                        <span className={styles.endpointCode}>{arr.code}</span>
                        <span className={styles.endpointName}>{arr.city || arr.name}</span>
                        <span className={styles.endpointMeta}>
                            {moment(lastSegment.arrival.datetime).format('h:mm A')} ARRIVAL {moment(lastSegment.arrival.datetime).format('DD-MM-YYYY')}
                        </span>
                    </div>
                </div>

                <div className={styles.routeProgress}>
                    <div className={styles.routeProgressLine} />
                    <FaPlane className={styles.routeProgressPlane} aria-hidden="true" />
                </div>

                <div className={styles.dualGrid}>
                    <div className={styles.infoCard}>
                        <FaPlane className={styles.infoCardIcon} aria-hidden="true" />
                        <h6 className={styles.infoCardTitle}>Airlines</h6>
                        <ul className={styles.infoCardList}>
                            {segments.map((seg, segIdx) => (
                                <li key={segIdx}>
                                    Leg {segIdx + 1} — {seg.airline?.name || seg.airline?.code} (Flight No: {seg.flight_number})
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.infoCard}>
                        <FaSuitcase className={styles.infoCardIcon} aria-hidden="true" />
                        <h6 className={styles.infoCardTitle}>Baggage</h6>
                        <ul className={styles.infoCardList}>
                            {baggage?.checked && <li>{baggage.checked}</li>}
                            {baggage?.cabin && <li>{baggage.cabin}</li>}
                            {!baggage && <li>Baggage allowance per airline rules</li>}
                        </ul>
                    </div>
                </div>

                <div className={styles.terminalSection}>
                    <h6 className={styles.sectionTitleSerif}>Terminal &amp; Check-In</h6>
                    <div className={styles.terminalGrid}>
                        <div className={styles.terminalChip}>
                            <strong>{dep.code}:</strong> {dep.name}{dep.city ? `, ${dep.city}` : ''}
                        </div>
                        {stops > 0 && layoverAirport && (
                            <div className={styles.terminalChip}>
                                <strong>{layoverAirport.code}:</strong> Transit — {layoverAirport.name}
                            </div>
                        )}
                        <div className={styles.terminalChip}>
                            <strong>{arr.code}:</strong> {arr.name}{arr.city ? `, ${arr.city}` : ''}
                        </div>
                    </div>
                    {/* <div className={styles.checkinGrid}>
                        <div className={styles.checkinCard}>
                            <FaCheckCircle className={styles.checkinIcon} aria-hidden="true" />
                            <div>
                                <strong>Online Check-In Available</strong>
                                <p>Opens 24 hours prior to departure.</p>
                            </div>
                        </div>
                        <div className={styles.checkinCard}>
                            <FaCheckCircle className={styles.checkinIcon} aria-hidden="true" />
                            <div>
                                <strong>Airport Desk Check-In</strong>
                                <p>Available at airline partner counters before takeoff.</p>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* <div className={styles.detailBlock}>
                    <h6 className={styles.sectionTitleSerif}>Full Itinerary</h6>
                    <div className={styles.timeline}>
                        {segments.map((segment, idx) => {
                            const depAirport = getAirportInfo(segment.departure.airport_code);
                            const arrAirport = getAirportInfo(segment.arrival.airport_code);
                            const nextSegment = segments[idx + 1];
                            let layoverMins = 0;
                            if (nextSegment) {
                                layoverMins = moment(nextSegment.departure.datetime).diff(moment(segment.arrival.datetime), 'minutes');
                            }
                            const segDayDiff = moment(segment.arrival.datetime).startOf('day').diff(moment(segment.departure.datetime).startOf('day'), 'days');

                            return (
                                <React.Fragment key={idx}>
                                    <div className={styles.timelineItem}>
                                        <div className={styles.timelineDot} />
                                        <span className={styles.fieldLabel}>Departure Airport</span>
                                        <div className={styles.airportCode}>{segment.departure.airport_code}</div>
                                        <div className={styles.airportMeta}>
                                            {depAirport.name}{depAirport.city ? `, ${depAirport.city}` : ''}
                                        </div>
                                        <div className={styles.datetimeRow}>
                                            <div>
                                                <span className={styles.fieldLabel}>Departure Date</span>
                                                <div className={styles.fieldValue}>{moment(segment.departure.datetime).format('DD MMM, YYYY')}</div>
                                            </div>
                                            <div>
                                                <span className={styles.fieldLabel}>Departure Time</span>
                                                <div className={styles.fieldValue}>{moment(segment.departure.datetime).format('LT')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.segmentCardsFull}>
                                        <div className={styles.airlineBlock}>
                                            {segment.airline?.logo_url && (
                                                <Image
                                                    src={segment.airline.logo_url}
                                                    height={36}
                                                    width={36}
                                                    quality={100}
                                                    className={styles.airlineLogo}
                                                    alt={segment.airline.code}
                                                />
                                            )}
                                            <div>
                                                <div className={styles.airlineName}>{segment.airline?.name}</div>
                                                <div className={styles.airlineClass}>{segment.cabin_class?.name || 'Economy'}</div>
                                            </div>
                                        </div>
                                        <div className={styles.segmentDetails}>
                                            <div className={styles.detailRow}><strong>Flight No:</strong> {segment.airline?.code}{segment.flight_number}</div>
                                            <div className={styles.detailRow}><strong>Duration:</strong> {formatDuration(segment.duration)}</div>
                                        </div>
                                    </div>

                                    <div className={styles.timelineItem}>
                                        <div className={styles.timelineDot} />
                                        <span className={styles.fieldLabel}>Arrival Airport</span>
                                        <div className={styles.airportCode}>
                                            {segment.arrival.airport_code}
                                            {segDayDiff > 0 && <span className={styles.dayDiff}>+{segDayDiff}</span>}
                                        </div>
                                        <div className={styles.airportMeta}>
                                            {arrAirport.name}{arrAirport.city ? `, ${arrAirport.city}` : ''}
                                        </div>
                                        <div className={styles.datetimeRow}>
                                            <div>
                                                <span className={styles.fieldLabel}>Arrival Date</span>
                                                <div className={styles.fieldValue}>{moment(segment.arrival.datetime).format('DD MMM, YYYY')}</div>
                                            </div>
                                            <div>
                                                <span className={styles.fieldLabel}>Arrival Time</span>
                                                <div className={styles.fieldValue}>{moment(segment.arrival.datetime).format('LT')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {nextSegment && (
                                        <div className={`${styles.layoverBox} ${styles.layoverFull}`}>
                                            <FaClock className={styles.layoverIcon} aria-hidden="true" />
                                            <span>
                                                Change of flight in {arrAirport.city || segment.arrival.airport_code} —{' '}
                                                <strong>Layover Time:</strong>{' '}
                                                <span className={styles.layoverTime}>{formatDuration(layoverMins)}</span>
                                            </span>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className={styles.infoGrid}>
                        {baggage && (
                            <div className={styles.infoBox}>
                                <div className={styles.infoIcon}><FaSuitcase /></div>
                                <div className={styles.infoContent}>
                                    <div className={styles.infoTitle}>Baggage</div>
                                    <div className={styles.infoText}>
                                        {[baggage.checked, baggage.cabin].filter(Boolean).join(' • ')}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={styles.infoBox}>
                            <div className={styles.infoIcon}><FaChair /></div>
                            <div className={styles.infoContent}>
                                <div className={styles.infoTitle}>Class</div>
                                <div className={styles.infoText}>{firstSegment.cabin_class?.name || 'Economy'}</div>
                            </div>
                        </div>
                    </div>
                </div> */}

                {index === legGroups.length - 1 && renderPenalties()}
            </section>
        );
    };

    return (
        <div>
            {!hideTrigger && outlineBtn !== 'umrahgetaway' && (
                <div>
                    {outlineBtn ? (
                        <button onClick={() => setModalOpen(true)} className="btn btn-outline-secondary btn-sm me-2"><FaPlane /> {outlineBtn}</button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className={styles.detailsTrigger}
                        >
                            <span>View Details</span>
                            <FaAngleDown className={styles.detailsTriggerChevron} />
                        </button>
                    )}
                </div>
            )}
            <Modal
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
                opened={modalOpen}
                onClose={handlemodalopenclose}
                size={modalSize}
                fullScreen={isMobile}
                withCloseButton={false}
                padding={0}
                radius={isMobile ? 0 : 'lg'}
                classNames={{
                    content: styles.modalContent,
                    body: styles.modalBody,
                    inner: styles.modalInner,
                }}
            >
                <div className={styles.modalWrapper}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>

                            <div>
                                <span className={styles.headerEyebrow}>
                                    <span className={styles.headerIcon}><FaPlane /></span>Flight Details
                                </span>
                                <h2 className={styles.headerTitle}>{headerMeta.title}</h2>
                                {headerMeta.subtitle && (
                                    <p className={styles.headerSubtitle}>{headerMeta.subtitle}</p>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={handlemodalopenclose} className={styles.closeBtn} aria-label="Close">
                            <IoMdClose size={20} />
                        </button>
                    </div>

                    <div className={styles.body}>
                        {legGroups.map((group, index) => renderLegGroup(group, index))}

                        {flightdata?.pricing?.total_amount != null && (
                            <section className={styles.fareSection}>
                                <h6 className={styles.sectionTitleSerif}>Fare Summary</h6>
                                <div className={styles.fareRow}>
                                    <span>Total Price</span>
                                    <span className={styles.fareValue}>
                                        <PriceDisplay price={flightdata.pricing.total_amount} currency={flightdata.pricing.currency} />
                                    </span>
                                </div>
                                <p className={styles.fareNote}>All taxes included</p>
                            </section>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.footerSecure}>
                            <FaShieldAlt aria-hidden="true" />
                            <span>Transactions encrypted &amp; protected by Holiday Well.</span>
                        </div>
                        <div className={styles.paymentBadges}>
                            <span>VISA</span>
                            <span>MC</span>
                            <span>AMEX</span>
                        </div>
                        <button type="button" onClick={handlemodalopenclose} className={styles.closeDetailsBtn}>
                            Close Flight Details
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
