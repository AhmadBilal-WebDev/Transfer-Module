'use client';

import React from 'react';
import { FaMapLocationDot, FaLocationDot } from 'react-icons/fa6';
import styles from './TransferRouteMap.module.css';

export default function TransferRouteMap({ searchParams /* , transferCount = 0 */ }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const fromLat = searchParams?.pickupLatitude ?? searchParams?.fromLat;
    const fromLng = searchParams?.pickupLongitude ?? searchParams?.fromLng;
    const toLat = searchParams?.dropoffLatitude ?? searchParams?.toLat;
    const toLng = searchParams?.dropoffLongitude ?? searchParams?.toLng;

    const pickupLocation = searchParams?.pickupLocation?.trim() || '';
    const dropoffLocation = searchParams?.dropoffLocation?.trim() || '';

    const hasRouteCoords = Boolean(fromLat && fromLng && toLat && toLng);
    const hasPickupOnly = Boolean(fromLat && fromLng);
    const hasCoords = hasRouteCoords || hasPickupOnly;

    // All-round should still show full route + distance when both points exist.
    const mapSrc = !apiKey
        ? null
        : hasRouteCoords
            ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=driving`
            : hasPickupOnly
                ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${fromLat},${fromLng}&zoom=14`
                : null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.mapCard}>
                {hasCoords && mapSrc ? (
                    <iframe
                        src={mapSrc}
                        title="Transfer route map"
                        className={styles.mapFrame}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                ) : (
                    <div className={styles.emptyState}>
                        <FaMapLocationDot />
                        <span>Map preview unavailable</span>
                    </div>
                )}

                {(pickupLocation || dropoffLocation) && (
                    <div className={styles.locationBar}>
                        {pickupLocation && (
                            <div className={styles.locationItem}>
                                <FaLocationDot className={styles.locationIconPickup} aria-hidden="true" />
                                <span className={styles.locationText} title={pickupLocation}>
                                    {pickupLocation}
                                </span>
                            </div>
                        )}
                        {dropoffLocation && (
                            <div className={styles.locationItem}>
                                <FaLocationDot className={styles.locationIconDropoff} aria-hidden="true" />
                                <span className={styles.locationText} title={dropoffLocation}>
                                    {dropoffLocation}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
