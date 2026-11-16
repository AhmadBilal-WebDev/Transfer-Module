'use client';

import React from 'react';
import moment from 'moment';
import { IoTimeOutline } from 'react-icons/io5';
import { GoPerson } from 'react-icons/go';
import { MdVerified } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import styles from './TransferSummary.module.css';

const formatTripType = (type) => {
  const labels = {
    'one-way': 'One Way',
    one_way: 'One Way',
    return: 'Return',
    'all-round': 'All Round',
  };
  return labels[type] || String(type || '').replace(/_/g, ' ') || 'One Way';
};

const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const buildVehicleTitle = (transfer) => {
  const name = capitalize(transfer?.vehicle_details?.name);
  const category = capitalize(
    transfer?.vehiclecategory?.name || transfer?.vehicle_details?.category || '',
  );
  if (name && category && !name.toLowerCase().includes(category.toLowerCase())) {
    return `${name} – ${category}`;
  }
  return name || category || 'Transfer';
};

export default function TransferSummary({
  transfer,
  searchParams,
  onContinue,
  isContinuing = false,
}) {
  if (!transfer) return null;

  const location = transfer?.locations?.[0];
  const pickup =
    location?.pickup_title ||
    location?.pickup_address ||
    searchParams?.pickupLocation ||
    '';
  const dropoff =
    location?.dropoff_title ||
    location?.dropoff_address ||
    searchParams?.dropoffLocation ||
    '';
  const pickupNote =
    location?.pickup_description ||
    location?.pickup_instructions ||
    location?.pickup_meeting_point ||
    '';
  const dropoffNote =
    location?.dropoff_description ||
    location?.dropoff_instructions ||
    location?.dropoff_meeting_point ||
    '';

  const pickupDate =
    searchParams?.pickupDate ||
    transfer?.search_criteria?.pickup_date ||
    transfer?.pickup_date;
  const pickupTime =
    searchParams?.pickupTime ||
    transfer?.search_criteria?.pickup_time ||
    transfer?.pickup_time;

  let dateTimeLabel = '';
  if (pickupDate) {
    dateTimeLabel = moment(pickupDate).format('DD MMM YYYY');
    if (pickupTime) {
      const time = moment(pickupTime, ['HH:mm:ss', 'HH:mm'], true);
      if (time.isValid()) {
        dateTimeLabel += ` · ${time.format('hh:mm A')}`;
      }
    }
  }

  const adults = Number(searchParams?.adults) || 0;
  const children = Number(searchParams?.children) || 0;
  const infants = Number(searchParams?.infants) || 0;
  const passengers =
    Number(searchParams?.passengers) ||
    adults + children + infants ||
    Number(transfer?.search_criteria?.passengers) ||
    1;

  const currency = transfer?.convertedCurrency || transfer?.currency || '';
  const price =
    transfer?.convertedPrice != null
      ? Number(transfer.convertedPrice).toFixed(2)
      : transfer?.fare != null
        ? Number(transfer.fare).toFixed(2)
        : transfer?.price != null
          ? Number(transfer.price).toFixed(2)
          : null;

  const tripType = formatTripType(
    searchParams?.transferType || transfer?.trip_type,
  );
  const typeCode = transfer?.transfer_type_code
    ? String(transfer.transfer_type_code).replace(/_/g, ' ')
    : '';

  const vehicleTitle = buildVehicleTitle(transfer);
  const shortName = capitalize(transfer?.vehicle_details?.name) || 'Transfer';

  const cancelPolicy = String(transfer?.cancel_policy || '').toLowerCase();
  const isRefundable = cancelPolicy === 'refundable';
  const freeUntil = transfer?.cancellation_policies?.[0]?.from
    ? moment(transfer.cancellation_policies[0].from).format('DD MMM YYYY')
    : null;

  return (
    <aside className={`${styles.card} ${inter.className}`} aria-live="polite">
      <div className={styles.header}>
        <h3 className={`${styles.title} ${playfair.className}`}>
          Your Transfer Summary
        </h3>
        <span className={styles.tripBadge}>{tripType}</span>
      </div>

      {(pickup || dropoff) && (
        <div className={styles.timeline}>
          {pickup && (
            <div className={styles.timelineItem}>
              <div className={styles.rail}>
                <span className={styles.dot} />
                {dropoff && <span className={styles.line} aria-hidden="true" />}
              </div>
              <div className={styles.body}>
                <span className={styles.label}>Pickup Point</span>
                <p className={styles.place}>{pickup}</p>
                {pickupNote && <p className={styles.note}>{pickupNote}</p>}
              </div>
            </div>
          )}
          {dropoff && (
            <div className={styles.timelineItem}>
              <div className={styles.rail}>
                <span className={`${styles.dot} ${styles.dotEnd}`} />
              </div>
              <div className={styles.body}>
                <span className={styles.label}>Destination Point</span>
                <p className={styles.place}>{dropoff}</p>
                {dropoffNote && <p className={styles.note}>{dropoffNote}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {(dateTimeLabel || passengers) && (
        <div className={styles.metaBar}>
          {dateTimeLabel && (
            <span className={styles.metaItem}>
              <IoTimeOutline aria-hidden="true" />
              {dateTimeLabel}
            </span>
          )}
          <span className={styles.metaItem}>
            <GoPerson aria-hidden="true" />
            {passengers} Passenger{Number(passengers) !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className={styles.transportCard}>
        <div className={styles.transportTop}>
          <span className={styles.transportLabel}>Selected Transport</span>
          {typeCode && <span className={styles.typeBadge}>{typeCode}</span>}
        </div>
        <div className={styles.transportRow}>
          <p className={`${styles.vehicleName} ${playfair.className}`}>
            {vehicleTitle}
          </p>
          {(currency || price != null) && (
            <div className={styles.priceWrap}>
              <p className={`${styles.price} ${playfair.className}`}>
                {currency} {price ?? '—'}
              </p>
              <p className={styles.priceVat}>VAT &amp; taxes included</p>
            </div>
          )}
        </div>
      </div>

      {isRefundable && (
        <div className={styles.guarantee}>
          <MdVerified className={styles.guaranteeIcon} aria-hidden="true" />
          <p className={styles.guaranteeText}>
            <strong>Free cancellation</strong>
            {freeUntil ? ` before ${freeUntil}` : ' available on this transfer'}
          </p>
        </div>
      )}

      <button
        type="button"
        className={styles.continueBtn}
        onClick={onContinue}
        disabled={isContinuing}
      >
        {isContinuing
          ? 'Continuing…'
          : `Continue with ${shortName}${price != null ? ` — ${currency} ${price}` : ''} →`}
      </button>
    </aside>
  );
}
