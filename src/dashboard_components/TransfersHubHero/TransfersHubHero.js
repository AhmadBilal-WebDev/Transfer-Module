'use client';

import moment from 'moment';
import { plusJakarta } from '@/lib/fonts';
import styles from './TransfersHubHero.module.css';

function displayNameFromSession(session) {
  const email = session?.user?.email || '';
  const raw =
    session?.user?.name ||
    (email.includes('@') ? email.split('@')[0] : '') ||
    'Traveler';

  return raw
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function passengerCount(booking) {
  const criteria = booking?.booking_criteria || {};
  const adults = Number(criteria.adults ?? criteria.passengers ?? 0);
  const children = Number(criteria.children ?? 0);
  const infants = Number(criteria.infants ?? 0);
  const total = adults + children + infants;
  if (total > 0) return total;
  return Number(booking?.transfer?.vehicle_details?.passenger_capacity) || null;
}

function statusLabel(booking) {
  const status = (booking?.booking_status || '').toLowerCase();
  if (status === 'confirmed' || status === 'paid') return 'Driver assigned';
  if (status === 'tentative' || status === 'pending') return 'Awaiting confirmation';
  if (status) return status.charAt(0).toUpperCase() + status.slice(1);
  return 'Upcoming';
}

export default function TransfersHubHero({ session, nextPickup }) {
  const userName = displayNameFromSession(session);
  const userEmail = session?.user?.email || '';

  const pickup = nextPickup?.booking_criteria?.pickup_location || 'Pickup location TBC';
  const dropoff = nextPickup?.booking_criteria?.dropoff_location || 'Drop-off location TBC';
  const vehicle = nextPickup?.transfer?.vehicle_name || 'Transfer';
  const passengers = passengerCount(nextPickup);
  const pickupDate = nextPickup?.booking_criteria?.pickup_date;
  const pickupTime =
    nextPickup?.booking_criteria?.pickup_time ||
    nextPickup?.transfer?.pickup_time ||
    null;

  let when = '';
  if (pickupDate) {
    const datePart = moment(pickupDate).format('ddd, MMM D');
    const timeFromField = pickupTime
      ? moment(pickupTime, ['HH:mm:ss', 'HH:mm', moment.ISO_8601], true)
      : null;
    const timeFromDate = moment(pickupDate);
    const timePart = timeFromField?.isValid()
      ? timeFromField.format('hh:mm A')
      : timeFromDate.isValid() && timeFromDate.format('HH:mm') !== '00:00'
        ? timeFromDate.format('hh:mm A')
        : '';
    when = timePart ? `${datePart} · ${timePart}` : datePart;
  }

  const badgeText = nextPickup ? statusLabel(nextPickup) : null;
  const isAssigned =
    badgeText === 'Driver assigned' ||
    (nextPickup?.booking_status || '').toLowerCase() === 'confirmed';

  return (
    <section className={`${styles.hero} ${plusJakarta.className}`} aria-label="Transfers hub">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Your transfers hub</p>
        <h1 className={styles.title}>Welcome back, {userEmail}</h1>
        {/* {userEmail ? <p className={styles.email}>{userEmail}</p> : null} */}
        <p className={styles.subtitle}>
          Track pickups, drivers and payments for every ride you&apos;ve booked with Royalane.
        </p>
      </div>

      <aside className={styles.card} aria-label="Next pickup">
        {nextPickup ? (
          <>
            <div className={styles.cardHead}>
              <p className={styles.cardLabel}>Next pickup</p>
              <span className={`${styles.badge} ${isAssigned ? '' : styles.badgeMuted}`}>
                {badgeText}
              </span>
            </div>

            <div className={styles.route}>
              <div className={styles.rail} aria-hidden="true">
                <span className={styles.dotHollow} />
                <span className={styles.line} />
                <span className={styles.dotSolid} />
              </div>
              <div>
                <p className={styles.point}>{pickup}</p>
                <p className={styles.point}>{dropoff}</p>
              </div>
            </div>

            <div className={styles.cardFoot}>
              <span>{when || 'Date TBC'}</span>
              <span>
                {vehicle}
                {passengers ? ` · ${passengers} passenger${passengers === 1 ? '' : 's'}` : ''}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.cardHead}>
              <p className={styles.cardLabel}>Next pickup</p>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>No upcoming trip</span>
            </div>
            <p className={styles.emptyCard}>
              When you book your next transfer, the pickup details will appear here.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}
