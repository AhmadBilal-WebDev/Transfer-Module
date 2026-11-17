'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import Image from 'next/image';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { FaCar, FaCheckCircle, FaUsers } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { IoTimeOutline, IoWarningOutline, IoInformationCircleOutline, IoArrowForward } from 'react-icons/io5';
import { MdOutlineShield } from 'react-icons/md';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { useCurrency } from '@/util/currency';
import { formatTransferServiceValue } from '@/util/formatTransferServiceValue';
import { isTransferProvider } from '@/util/transferProviders';
import moment from 'moment';
import { playfair, inter } from '@/lib/fonts';
import styles from './VehicleDetail.module.css';

const formatTripType = (type) => {
    const labels = {
        'one-way': 'one way',
        return: 'return',
        'all-round': 'all round',
        one_way: 'one way',
    };
    return labels[type] || String(type || '').replace(/_/g, ' ') || 'one way';
};

const shortPlace = (value) => {
    const text = String(value || '').trim();
    if (!text) return '';
    const comma = text.indexOf(',');
    return comma === -1 ? text : text.slice(0, comma).trim();
};

const getServiceIcon = (service) => {
    const key = `${service?.id || ''} ${service?.name || ''}`.toLowerCase();
    if (key.includes('time') || key.includes('trftime') || key.includes('duration')) {
        return IoTimeOutline;
    }
    if (key.includes('pax') || key.includes('passenger') || key.includes('min')) {
        return GoPerson;
    }
    if (key.includes('luggage') || key.includes('bag') || key.includes('suitcase')) {
        return PiSuitcaseRolling;
    }
    if (key.includes('capac') || key.includes('max')) {
        return FaUsers;
    }
    return FaCheckCircle;
};

export default function VehicleDetail({
    showModal,
    handleCloseModal,
    selectedTransferDetail,
    handleBookNow,
    type,
    isPackageMode,
    isEditMode,
    vehicleQuantity,
    setVehicleQuantity,
    isSelecting = false,
    searchParams,
}) {
    const { currency, rates } = useCurrency();

    const isCustom =
        isTransferProvider(selectedTransferDetail?.provider, 'custom') ||
        String(selectedTransferDetail?.transfer_type_code || '').toUpperCase() === 'CUSTOM';

    const serviceInfo = Array.isArray(selectedTransferDetail?.service_information)
        ? selectedTransferDetail.service_information.filter(
            (s) => s && (s.name || s.value != null && s.value !== ''),
        )
        : [];

    const [modalSize, setModalSize] = useState('680px');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateSize = () => {
            const mobile = window.innerWidth <= 640;
            setIsMobile(mobile);
            setModalSize(mobile ? '100%' : '680px');
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (!showModal) return;

        const root = document.documentElement;
        const syncViewportHeight = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            root.style.setProperty('--vehicle-detail-vh', `${Math.round(height)}px`);
        };

        syncViewportHeight();
        window.visualViewport?.addEventListener('resize', syncViewportHeight);
        window.visualViewport?.addEventListener('scroll', syncViewportHeight);
        window.addEventListener('resize', syncViewportHeight);

        return () => {
            window.visualViewport?.removeEventListener('resize', syncViewportHeight);
            window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
            window.removeEventListener('resize', syncViewportHeight);
            root.style.removeProperty('--vehicle-detail-vh');
        };
    }, [showModal]);

    const vehicle = selectedTransferDetail?.vehicle_details;
    const firstLocation = selectedTransferDetail?.locations?.[0];
    const category =
        selectedTransferDetail?.vehiclecategory?.name ||
        vehicle?.category ||
        vehicle?.vehicle_type ||
        '';

    const pickupTitle =
        firstLocation?.pickup_title ||
        firstLocation?.pickup_address ||
        searchParams?.pickupLocation ||
        '';
    const dropoffTitle =
        firstLocation?.dropoff_title ||
        firstLocation?.dropoff_address ||
        searchParams?.dropoffLocation ||
        '';
    const pickupNote =
        firstLocation?.pickup_description ||
        firstLocation?.pickup_instructions ||
        firstLocation?.pickup_meeting_point ||
        '';
    const dropoffNote =
        firstLocation?.dropoff_description ||
        firstLocation?.dropoff_instructions ||
        firstLocation?.dropoff_meeting_point ||
        '';

    // Always convert from original fare so home (TopTransfers / PrivateTransfer)
    // and listing both follow the selected site currency.
    const { unitPrice, totalCurrency } = useMemo(() => {
        const originalPrice =
            selectedTransferDetail?.fare ?? selectedTransferDetail?.price;
        const originalCurrency = selectedTransferDetail?.currency;

        if (originalPrice != null && originalPrice !== '' && originalCurrency) {
            const { newcurrency, newprice } = ConvertPrice(
                originalPrice,
                originalCurrency,
                currency,
                rates,
            );
            return { unitPrice: newprice, totalCurrency: newcurrency };
        }

        if (
            selectedTransferDetail?.convertedCurrency &&
            selectedTransferDetail?.convertedPrice != null
        ) {
            return {
                unitPrice: selectedTransferDetail.convertedPrice,
                totalCurrency: selectedTransferDetail.convertedCurrency,
            };
        }

        return {
            unitPrice: originalPrice,
            totalCurrency: originalCurrency,
        };
    }, [selectedTransferDetail, currency, rates]);

    const qty = Math.max(
        1,
        Number(vehicleQuantity) || Number(selectedTransferDetail?.quantity) || 1,
    );
    const totalPrice =
        unitPrice != null && unitPrice !== ''
            ? Number((Number(unitPrice) * qty).toFixed(2))
            : null;

    const amenities = Array.isArray(vehicle?.amenities)
        ? vehicle.amenities.filter((item) => typeof item === 'string' && item.trim())
        : [];

    // Same rules as Alhijaz: cancel_policy string + cancellation_policies[]
    const cancelPolicy = selectedTransferDetail?.cancel_policy;
    const isRefundable = cancelPolicy === 'refundable';
    const policies = Array.isArray(selectedTransferDetail?.cancellation_policies)
        ? selectedTransferDetail.cancellation_policies
        : [];
    const freeUntil = useMemo(() => {
        if (!isRefundable || !policies.length) return null;
        const sorted = [...policies].sort(
            (a, b) => moment(a.from).valueOf() - moment(b.from).valueOf(),
        );
        return sorted[0]?.from ? moment(sorted[0].from) : null;
    }, [isRefundable, policies]);

    const transferTimeService = serviceInfo.find(
        (s) =>
            s?.id === 'TRFTIME' ||
            /transfer\s*time|duration|journey\s*time/i.test(s?.name || ''),
    );
    const distanceService = serviceInfo.find((s) =>
        /distance|km|mileage/i.test(`${s?.id || ''} ${s?.name || ''}`),
    );
    const minPaxService = serviceInfo.find((s) =>
        /min(imum)?\s*pax|minimum\s*passenger/i.test(`${s?.id || ''} ${s?.name || ''}`),
    );

    const journeyMetaParts = [
        distanceService ? formatTransferServiceValue(distanceService) : null,
        transferTimeService
            ? `Approx ${formatTransferServiceValue(transferTimeService)}`
            : null,
    ].filter(Boolean);

    const detailCards = [];

    if (transferTimeService) {
        detailCards.push({
            key: 'time',
            icon: IoTimeOutline,
            label: transferTimeService.name || 'Transfer Time',
            value: formatTransferServiceValue(transferTimeService),
            hint: 'Estimated journey time',
        });
    }

    if (minPaxService) {
        detailCards.push({
            key: 'min-pax',
            icon: GoPerson,
            label: minPaxService.name || 'Minimum Pax',
            value: formatTransferServiceValue(minPaxService),
            hint: null,
        });
    }

    const hasVehicleMaxPax =
        vehicle?.passenger_capacity != null && vehicle.passenger_capacity !== '';
    const hasVehicleLuggage =
        vehicle?.luggage_capacity != null && vehicle.luggage_capacity !== '';

    if (hasVehicleMaxPax) {
        detailCards.push({
            key: 'capacity',
            icon: FaUsers,
            label: 'Maximum Pax',
            value: `${vehicle.passenger_capacity} passenger${Number(vehicle.passenger_capacity) !== 1 ? 's' : ''}`,
            hint: 'Vehicle passenger capacity',
        });
    }

    if (hasVehicleLuggage) {
        detailCards.push({
            key: 'luggage',
            icon: PiSuitcaseRolling,
            label: 'Luggage Policy',
            value: `${vehicle.luggage_capacity} case${Number(vehicle.luggage_capacity) !== 1 ? 's' : ''}`,
            hint: 'Permitted luggage capacity',
        });
    }

    if (vehicle?.transmission_type) {
        detailCards.push({
            key: 'transmission',
            icon: FaCar,
            label: 'Transmission',
            value: vehicle.transmission_type,
            hint: 'Vehicle transmission type',
        });
    }

    const isMaxPaxService = (service) =>
        /max(imum)?\s*pax|max(imum)?\s*passenger|passenger\s*capacity/i.test(
            `${service?.id || ''} ${service?.name || ''}`,
        );
    const isLuggageService = (service) =>
        /luggage|suitcase|baggage/i.test(
            `${service?.id || ''} ${service?.name || ''}`,
        );

    serviceInfo.forEach((service, index) => {
        const isDuplicateTime =
            transferTimeService &&
            (service === transferTimeService ||
                service?.id === transferTimeService?.id);
        const isDuplicateDistance =
            distanceService &&
            (service === distanceService || service?.id === distanceService?.id);
        const isDuplicateMinPax =
            minPaxService &&
            (service === minPaxService || service?.id === minPaxService?.id);
        // Skip API service rows already covered by vehicle capacity/luggage cards
        const isDuplicateMaxPax = hasVehicleMaxPax && isMaxPaxService(service);
        const isDuplicateLuggage = hasVehicleLuggage && isLuggageService(service);

        if (
            isDuplicateTime ||
            isDuplicateDistance ||
            isDuplicateMinPax ||
            isDuplicateMaxPax ||
            isDuplicateLuggage
        ) {
            return;
        }
        if (detailCards.length >= 6) return;

        const value = formatTransferServiceValue(service);
        if (!service?.name && (value == null || value === '—')) return;

        detailCards.push({
            key: service?.id || `svc-${index}`,
            icon: getServiceIcon(service),
            label: service?.name || 'Service detail',
            value,
            hint: null,
        });
    });

    const showJourney = Boolean(pickupTitle || dropoffTitle);
    const showCancellation = Boolean(cancelPolicy);
    const showIncluded = amenities.length > 0;

    const routePickup = shortPlace(searchParams?.pickupLocation || pickupTitle);
    const routeDropoff = shortPlace(searchParams?.dropoffLocation || dropoffTitle);
    const routeLabel =
        routePickup && routeDropoff
            ? `${routePickup} to ${routeDropoff}`
            : routePickup || routeDropoff || '';
    const searchDateLabel = searchParams?.pickupDate
        ? moment(searchParams.pickupDate).format('DD MMM YYYY')
        : '';

    const vehicleModel =
        vehicle?.model ||
        vehicle?.make_model ||
        vehicle?.vehicle_model ||
        '';

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const fromLat = searchParams?.pickupLatitude ?? searchParams?.fromLat;
    const fromLng = searchParams?.pickupLongitude ?? searchParams?.fromLng;
    const toLat = searchParams?.dropoffLatitude ?? searchParams?.toLat;
    const toLng = searchParams?.dropoffLongitude ?? searchParams?.toLng;
    const hasRouteCoords = Boolean(fromLat && fromLng && toLat && toLng);
    const hasPickupOnly = Boolean(fromLat && fromLng);
    const mapSrc = apiKey
        ? (hasRouteCoords
            ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=driving`
            : hasPickupOnly
                ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${fromLat},${fromLng}&zoom=14`
                : null)
        : null;

    const bookLabel = isSelecting
        ? 'Selecting…'
        : isPackageMode || isEditMode
            ? 'Select Transfer'
            : 'Book This Transfer';

    const badges = (
        <div className={styles.badgeRow}>
            {category && (
                <span className={styles.badge}>{String(category)}</span>
            )}
            {cancelPolicy ? (
                <span
                    className={`${styles.badge} ${
                        isRefundable ? styles.badgeRefund : styles.badgeNonRefund
                    }`}
                >
                    {isRefundable ? 'Fully Refundable' : 'Non Refundable'}
                </span>
            ) : null}
        </div>
    );

    const priceBlock = (totalCurrency || totalPrice != null) && (
        <div className={styles.priceBlock}>
            <span className={styles.priceFrom}>From</span>
            <p className={`${styles.priceValue} ${playfair.className}`}>
                {totalCurrency}{' '}
                {unitPrice != null ? Number(unitPrice).toFixed(2) : '—'}
            </p>
            <span className={styles.priceNote}>
                per vehicle · {formatTripType(selectedTransferDetail?.trip_type)}
            </span>
        </div>
    );

    return (
        <Modal
            opened={showModal}
            onClose={handleCloseModal}
            size={modalSize}
            fullScreen={false}
            withCloseButton={false}
            padding={0}
            radius={isMobile ? 0 : 'lg'}
            centered={!isMobile}
            lockScroll
            zIndex={11000}
            overlayProps={{
                className: styles.modalOverlay,
                blur: 24,
                backgroundOpacity: 1,
                color: 'transparent',
            }}
            classNames={{
                content: `${styles.modalContent} ${isMobile ? styles.modalContentMobile : ''}`,
                body: styles.modalBody,
                inner: `${styles.modalInner} ${isMobile ? styles.modalInnerMobile : ''}`,
                overlay: styles.modalOverlay,
            }}
        >
            <div className={`${styles.wrapper} ${inter.className}`}>
                {isMobile && (routeLabel || searchDateLabel || vehicle?.name) && (
                    <div className={styles.mobilePeek}>
                        {(routeLabel || searchDateLabel) && (
                            <div className={styles.peekSearch}>
                                <div className={styles.peekSearchLeft}>
                                    <span className={styles.peekEyebrow}>Search Results</span>
                                    {routeLabel && (
                                        <p className={`${styles.peekRoute} ${playfair.className}`}>
                                            {routeLabel}
                                        </p>
                                    )}
                                </div>
                                {searchDateLabel && (
                                    <span className={styles.peekDate}>{searchDateLabel}</span>
                                )}
                            </div>
                        )}

                        <div className={styles.peekVehicle}>
                            <div className={styles.peekVehicleLeft}>
                                <span className={styles.peekCarIcon} aria-hidden="true">
                                    <FaCar />
                                </span>
                                <div className={styles.peekVehicleText}>
                                    <p className={styles.peekVehicleName}>
                                        {category || vehicle?.name || 'Transfer'}
                                    </p>
                                    {(vehicleModel || vehicle?.name) && (
                                        <p className={styles.peekVehicleModel}>
                                            {vehicleModel || vehicle?.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {(totalCurrency || unitPrice != null) && (
                                <p className={`${styles.peekPrice} ${playfair.className}`}>
                                    {totalCurrency}{' '}
                                    {unitPrice != null ? Number(unitPrice).toFixed(2) : '—'}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.scrollArea}>
                    {isMobile && <div className={styles.dragHandle} aria-hidden="true" />}

                    <div className={styles.hero}>
                        {selectedTransferDetail?.vehicle_image ? (
                            <Image
                                src={selectedTransferDetail.vehicle_image}
                                alt={vehicle?.name || 'Transfer vehicle'}
                                fill
                                sizes="(max-width: 640px) 100vw, 680px"
                                quality={100}
                                className={styles.heroImage}
                                priority
                            />
                        ) : (
                            <div className={styles.heroPlaceholder} aria-hidden="true">
                                <FaCar />
                            </div>
                        )}
                        <div className={styles.heroScrim} aria-hidden="true" />

                        <div className={styles.heroTop}>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className={styles.closeBtn}
                                aria-label="Close"
                            >
                                <IoMdClose size={18} />
                            </button>
                        </div>

                        {isMobile ? (
                            <div className={styles.heroBadgesMobile}>{badges}</div>
                        ) : (
                            <div className={styles.heroContent}>
                                <div className={styles.heroLeft}>
                                    {badges}
                                    <h2 className={`${styles.heroTitle} ${playfair.className}`}>
                                        {vehicle?.name || 'Transfer Vehicle'}
                                    </h2>
                                    {vehicle?.vehicle_description && (
                                        <p className={styles.heroSubtitle}>
                                            {vehicle.vehicle_description}
                                        </p>
                                    )}
                                </div>
                                {(totalCurrency || totalPrice != null) && (
                                    <div className={styles.heroPrice}>
                                        FROM{' '}
                                        <span className={styles.heroPriceStrong}>
                                            {totalCurrency}{' '}
                                            {unitPrice != null ? Number(unitPrice).toFixed(2) : '—'}
                                        </span>
                                        <br />
                                        per vehicle · {formatTripType(selectedTransferDetail?.trip_type)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={styles.body}>
                        {isMobile && (
                            <section className={styles.mobileIntro}>
                                <div className={styles.mobileIntroLeft}>
                                    <h2 className={`${styles.mobileTitle} ${playfair.className}`}>
                                        {vehicle?.name || 'Transfer Vehicle'}
                                    </h2>
                                    {vehicle?.vehicle_description && (
                                        <p className={styles.mobileSubtitle}>
                                            {vehicle.vehicle_description}
                                        </p>
                                    )}
                                </div>
                                {priceBlock}
                            </section>
                        )}

                        {detailCards.length > 0 && (
                            <section className={styles.section}>
                                {!isMobile && (
                                    <div className={styles.sectionHead}>
                                        <h3 className={styles.sectionTitle}>Service Details</h3>
                                    </div>
                                )}
                                <div className={styles.detailGrid}>
                                    {detailCards.map(({ key, icon: Icon, label, value, hint }) => (
                                        <div key={key} className={styles.detailCard}>
                                            <span className={styles.detailIcon} aria-hidden="true">
                                                <Icon />
                                            </span>
                                            <div className={styles.detailText}>
                                                <span className={styles.detailLabel}>{label}</span>
                                                <span className={styles.detailValue}>{value}</span>
                                                {!isMobile && hint && (
                                                    <span className={styles.detailHint}>{hint}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {showJourney && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h3 className={`${styles.sectionTitle} ${styles.sectionTitleSerif} ${playfair.className}`}>
                                        Your Journey
                                    </h3>
                                    {/* {journeyMetaParts.length > 0 && (
                                        <span className={styles.journeyMeta}>
                                            {journeyMetaParts.join(' · ')}
                                        </span>
                                    )} */}
                                </div>

                                <div className={styles.journeyCard}>
                                    <div className={styles.timeline}>
                                        {pickupTitle && (
                                            <div className={styles.timelineItem}>
                                                <div className={styles.timelineRail}>
                                                    <span className={styles.timelineDot} />
                                                    {dropoffTitle && (
                                                        <span className={styles.timelineLine} aria-hidden="true" />
                                                    )}
                                                </div>
                                                <div className={styles.timelineBody}>
                                                    <span className={styles.timelineLabel}>Pickup Point</span>
                                                    <p className={styles.timelineTitle}>{pickupTitle}</p>
                                                    {pickupNote && (
                                                        <p className={styles.timelineNoteCallout}>{pickupNote}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {dropoffTitle && (
                                            <div className={styles.timelineItem}>
                                                <div className={styles.timelineRail}>
                                                    <span className={`${styles.timelineDot} ${styles.timelineDotEnd}`} />
                                                </div>
                                                <div className={styles.timelineBody}>
                                                    <span className={styles.timelineLabel}>Dropoff Destination</span>
                                                    <p className={styles.timelineTitle}>{dropoffTitle}</p>
                                                    {dropoffNote && (
                                                        <p className={styles.timelineNote}>{dropoffNote}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {isMobile && mapSrc && (
                            <section className={styles.section}>
                                <div className={styles.mapCard}>
                                    <iframe
                                        src={mapSrc}
                                        title="Transfer route map"
                                        className={styles.mapFrame}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </section>
                        )}

                        {showCancellation && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h3 className={styles.sectionTitle}>
                                        {isMobile ? 'Flexible Terms' : 'Cancellation Policy'}
                                    </h3>
                                </div>
                                <div className={styles.policyStack}>
                                    {isRefundable ? (
                                        <>
                                            {freeUntil?.isValid() ? (
                                                <div className={`${styles.policyCard} ${styles.policyFree}`}>
                                                    <span className={styles.policyIcon} aria-hidden="true">
                                                        <FaCheckCircle />
                                                    </span>
                                                    <div>
                                                        <p className={styles.policyTitle}>
                                                            Free cancellation before{' '}
                                                            {freeUntil.format('DD MMM YYYY')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {policies.map((policy, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`${styles.policyCard} ${styles.policyPaid}`}
                                                >
                                                    <span className={styles.policyIcon} aria-hidden="true">
                                                        <IoInformationCircleOutline />
                                                    </span>
                                                    <div>
                                                        <p className={styles.policyTitle}>
                                                            From{' '}
                                                            {moment(policy.from).format('DD MMM YYYY')}:
                                                            cancellation fee applies
                                                        </p>
                                                        <p className={styles.policyText}>
                                                            A cancellation fee of{' '}
                                                            <strong>
                                                                <PriceDisplay
                                                                    price={
                                                                        Number(policy.amount || 0) * qty
                                                                    }
                                                                    currency={
                                                                        selectedTransferDetail?.currency
                                                                    }
                                                                />
                                                            </strong>{' '}
                                                            may apply.
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {!policies.length ? (
                                                <div className={`${styles.policyCard} ${styles.policyFree}`}>
                                                    <span className={styles.policyIcon} aria-hidden="true">
                                                        <FaCheckCircle />
                                                    </span>
                                                    <div>
                                                        <p className={styles.policyTitle}>
                                                            This transfer is fully refundable.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className={`${styles.policyCard} ${styles.policyPaid}`}>
                                            <span className={styles.policyIcon} aria-hidden="true">
                                                <IoWarningOutline />
                                            </span>
                                            <div>
                                                <p className={styles.policyTitle}>
                                                    Non-refundable transfer
                                                </p>
                                                <p className={styles.policyText}>
                                                    This transfer is non-refundable. No refund will be
                                                    issued in case of cancellation.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isMobile && amenities.length > 0 && (
                                        <div className={`${styles.policyCard} ${styles.policyFree}`}>
                                            <span className={styles.policyIcon} aria-hidden="true">
                                                <MdOutlineShield />
                                            </span>
                                            <div>
                                                <p className={styles.policyTitle}>
                                                    Chauffeur Standard
                                                </p>
                                                <p className={styles.policyText}>
                                                    {amenities.slice(0, 3).join(', ')}
                                                    {amenities.length > 3 ? ' & more.' : '.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {showIncluded && !isMobile && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h3 className={styles.sectionTitle}>What&apos;s Included</h3>
                                </div>
                                <div className={styles.includedCard}>
                                    <ul className={styles.includedList}>
                                        {amenities.map((label) => (
                                            <li key={label} className={styles.includedItem}>
                                                <FaCheckCircle aria-hidden="true" />
                                                <span>{label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )}
                    </div>

                    {type !== 'checkout' && (
                        <div className={`${styles.footer} ${inter.className}`}>
                            <div className={styles.footerLeft}>
                                {/* {!isMobile && ( */}
                                    <span className={styles.footerLabel}>Total Fare</span>
                                {/* )} */}
                                <div className={styles.footerPriceRow}>
                                    <p className={styles.footerPrice}>
                                        {totalCurrency}{' '}
                                        {totalPrice != null ? Number(totalPrice).toFixed(2) : '—'}
                                    </p>
                                </div>
                                <span className={styles.footerNote}>VAT &amp; taxes included</span>
                                {isCustom && !isPackageMode && !isEditMode && setVehicleQuantity && (
                                    <div className={styles.qtyWrap}>
                                        <label htmlFor="vehicleQuantity" className={styles.qtyLabel}>
                                            Quantity
                                        </label>
                                        <select
                                            id="vehicleQuantity"
                                            className={styles.qtySelect}
                                            value={vehicleQuantity}
                                            onChange={(e) => setVehicleQuantity(Number(e.target.value))}
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className={styles.footerActions}>
                                {!isMobile && (
                                    <button
                                        type="button"
                                        className={styles.backBtn}
                                        onClick={handleCloseModal}
                                    >
                                        Back to Results
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.bookBtn}
                                    onClick={() => handleBookNow(vehicleQuantity)}
                                    disabled={isSelecting}
                                >
                                    <span>{bookLabel}</span>
                                    {!isSelecting && <IoArrowForward aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
