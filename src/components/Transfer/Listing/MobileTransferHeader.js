'use client';

import React, { useState } from 'react';
import moment from 'moment';
import { Modal } from '@mantine/core';
import { IoTimeOutline, IoArrowForward } from 'react-icons/io5';
import { GoPerson } from 'react-icons/go';
import { MdEditCalendar } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';
import TransferModifySearch from '@/components/Home/Search/TransferModifySearch';
import { inter, playfair } from '@/lib/fonts';
import styles from './MobileTransferHeader.module.css';

const formatTripType = (type) => {
  const labels = {
    'one-way': 'One-Way Transfer',
    one_way: 'One-Way Transfer',
    return: 'Return Transfer',
    'all-round': 'All-Round Transfer',
  };
  return labels[type] || 'One-Way Transfer';
};

const splitLocation = (value) => {
  const text = String(value || '').trim();
  if (!text) return { title: '', subtitle: '' };
  const comma = text.indexOf(',');
  if (comma === -1) return { title: text, subtitle: '' };
  return {
    title: text.slice(0, comma).trim(),
    subtitle: text.slice(comma + 1).trim(),
  };
};

export default function MobileTransferHeader({ params }) {
  const [editOpen, setEditOpen] = useState(false);

  const pickup = splitLocation(params?.pickupLocation);
  const dropoff = splitLocation(params?.dropoffLocation);

  const adults = Number(params?.adults || 0);
  const children = Number(params?.children || 0);
  const infants = Number(params?.infants || 0);
  const passengers =
    Number(params?.passengers) || adults + children + infants || 1;

  let dateTimeLabel = '';
  if (params?.pickupDate) {
    dateTimeLabel = moment(params.pickupDate).format('DD MMM YYYY');
    if (params?.pickupTime) {
      dateTimeLabel += `, ${moment(params.pickupTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')}`;
    }
  }

  const canEdit = !params?.packageMode && !params?.edit;

  return (
    <div className={`${styles.wrap} ${inter.className} d-block d-md-none`}>
      <div className={styles.stepRow}>
        <div className={styles.stepLeft}>
          <span className={styles.stepNum}>1</span>
          <p className={styles.stepTitle}>Select Transfer</p>
        </div>
        <div className={styles.stepRight}>
          <span className={styles.stepDots} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dotActive}`} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
          <span className={styles.stepMeta}>Step 1 of 3</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardAccent} aria-hidden="true" />

        <div className={styles.cardTop}>
          <span className={styles.tripPill}>
            <IoArrowForward size={12} aria-hidden="true" />
            {formatTripType(params?.transferType)}
          </span>

          {canEdit && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setEditOpen(true)}
              aria-label="Edit search"
            >
              <MdEditCalendar size={18} />
            </button>
          )}
        </div>

        <div className={styles.timeline}>
          {pickup.title && (
            <div className={styles.timelineItem}>
              <div className={styles.rail}>
                <span className={styles.dotPickup} />
                {dropoff.title && <span className={styles.line} aria-hidden="true" />}
              </div>
              <div className={styles.body}>
                <span className={styles.label}>Pickup</span>
                <p className={`${styles.placeTitle} ${playfair.className}`}>
                  {pickup.title}
                </p>
                {pickup.subtitle && (
                  <p className={styles.placeSub}>{pickup.subtitle}</p>
                )}
              </div>
            </div>
          )}

          {dropoff.title && (
            <div className={styles.timelineItem}>
              <div className={styles.rail}>
                <span className={styles.dotDrop} />
              </div>
              <div className={styles.body}>
                <span className={styles.label}>Destination</span>
                <p className={`${styles.placeTitle} ${playfair.className}`}>
                  {dropoff.title}
                </p>
                {dropoff.subtitle && (
                  <p className={styles.placeSub}>{dropoff.subtitle}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.metaBar}>
          {dateTimeLabel ? (
            <span className={styles.metaItem}>
              <IoTimeOutline aria-hidden="true" />
              {dateTimeLabel}
            </span>
          ) : (
            <span />
          )}
          <span className={styles.metaItem}>
            <GoPerson aria-hidden="true" />
            {passengers} Pax
          </span>
        </div>
      </div>

      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        withCloseButton={false}
        padding={0}
        centered={false}
        size="100%"
        zIndex={12000}
        lockScroll
        classNames={{
          content: styles.modalContent,
          body: styles.modalBody,
          inner: styles.modalInner,
        }}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 4,
        }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Modify Search</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={() => setEditOpen(false)}
            aria-label="Close"
          >
            <IoMdClose size={18} />
          </button>
        </div>
        <div className={styles.modalSearch}>
          <TransferModifySearch onSearch={() => setEditOpen(false)} />
        </div>
      </Modal>
    </div>
  );
}
