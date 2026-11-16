'use client';

import React from 'react';
import moment from 'moment';
import { MdCalendarMonth, MdPeople } from 'react-icons/md';
import { FaLocationDot } from 'react-icons/fa6';
import styles from './TransferInfo.module.css';

const formatTripType = (type) => {
    const labels = {
        'one-way': 'One Way',
        return: 'Return',
        'all-round': 'All Round',
    };
    return labels[type] || type;
};

export default function TransferInfo({ searchInfo }) {
    const pickupDate = searchInfo?.pickupDate
        ? moment(searchInfo.pickupDate).format('DD MMM YYYY')
        : null;
    const pickupTime = searchInfo?.pickupTime
        ? moment(searchInfo.pickupTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
        : null;
    const returnDate = searchInfo?.dropoffDate
        ? moment(searchInfo.dropoffDate).format('DD MMM YYYY')
        : null;
    const returnTime = searchInfo?.dropoffTime
        ? moment(searchInfo.dropoffTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
        : null;

    const isAllRound = searchInfo?.transferType === 'all-round';
    const passengerCount = searchInfo?.passengers || 0;
    const pickupDateTime = [pickupDate, pickupTime].filter(Boolean).join(' · ');
    const returnDateTime = [returnDate, returnTime].filter(Boolean).join(' · ');

    return (
        <div className={styles.infoBar}>
            <div className={styles.infoItem}>
                <span className={`${styles.infoIcon} ${styles.infoIconPickup}`} aria-hidden="true">
                    <FaLocationDot />
                </span>
                <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Pickup</span>
                    <p className={styles.infoValue}>{searchInfo?.pickupLocation || '—'}</p>
                </div>
            </div>

            {(!isAllRound || searchInfo?.dropoffLocation) && (
                <div className={styles.infoItem}>
                    <span className={`${styles.infoIcon} ${styles.infoIconDropoff}`} aria-hidden="true">
                        <FaLocationDot />
                    </span>
                    <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Drop-off</span>
                        <p className={styles.infoValue}>{searchInfo?.dropoffLocation || '—'}</p>
                    </div>
                </div>
            )}

            {pickupDateTime && (
                <div className={styles.infoItem}>
                    <span className={`${styles.infoIcon} ${styles.infoIconDate}`} aria-hidden="true">
                        <MdCalendarMonth />
                    </span>
                    <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Date</span>
                        <p className={styles.infoValue}>{pickupDateTime}</p>
                    </div>
                </div>
            )}

            {(searchInfo?.transferType === 'return' || isAllRound) && returnDateTime && (
                <div className={styles.infoItem}>
                    <span className={`${styles.infoIcon} ${styles.infoIconDate}`} aria-hidden="true">
                        <MdCalendarMonth />
                    </span>
                    <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Return</span>
                        <p className={styles.infoValue}>{returnDateTime}</p>
                    </div>
                </div>
            )}

            <div className={styles.infoMeta}>
                <span className={styles.passengerInfo}>
                    <MdPeople />
                    {passengerCount} Passenger{Number(passengerCount) !== 1 ? 's' : ''}
                </span>
                {searchInfo?.transferType && (
                    <span className={styles.tripBadge}>
                        {formatTripType(searchInfo.transferType)}
                    </span>
                )}
            </div>
        </div>
    );
}
