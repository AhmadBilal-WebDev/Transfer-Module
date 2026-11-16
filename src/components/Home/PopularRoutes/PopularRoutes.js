'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { FaCar, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { IoTimeOutline } from 'react-icons/io5';
import styles from './PopularRoutes.module.css';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail';
import { useTransferStore } from '@/components/Store/TransferStore';
import { formatTransferServiceValue } from '@/util/formatTransferServiceValue';
import { playfair, inter } from '@/lib/fonts';

const SEARCH_PAYLOAD = {
  adults: 1,
  children: 0,
  infants: 0,
  passengers: 1,
  pickupLocation: 'Makkah',
  dropoffLocation: 'Madinah',
  pickupLatitude: 21.4240968,
  pickupLongitude: 39.81733639999999,
  dropoffLatitude: 24.4672132,
  dropoffLongitude: 39.6024496,
  fromLat: '21.4240968',
  fromLng: '39.81733639999999',
  toLat: '24.4672132',
  toLng: '39.6024496',
  pickupTime: '00:09',
  transferType: 'one-way',
};

const ROUTE = {
  code: 'MKH',
  title: 'Makkah → Madinah',
};

const CARD_GAP = 16;

function getDailySearchPayload() {
  return {
    ...SEARCH_PAYLOAD,
    pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
  };
}

function getTransferDuration(transfer) {
  const services = Array.isArray(transfer?.service_information)
    ? transfer.service_information
    : [];
  const timeService = services.find(
    (s) =>
      s?.id === 'TRFTIME' ||
      /transfer\s*time|duration|journey\s*time/i.test(s?.name || ''),
  );
  if (!timeService) return null;

  const formatted = formatTransferServiceValue(timeService);
  if (!formatted || formatted === '—') return null;

  const mins = Number(timeService.value);
  if (!Number.isNaN(mins) && mins >= 0) {
    if (mins >= 60) {
      const hours = mins / 60;
      const label = Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
      return `~${label} hours`;
    }
    return `~${mins} mins`;
  }

  return `~${formatted}`;
}

function RouteCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={`${styles.skeletonBlock} ${styles.skeletonCode}`} />
      <div className={styles.cardMain}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
      </div>
      <div className={styles.priceCol}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonFrom}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonPrice}`} />
      </div>
      <div className={`${styles.skeletonBlock} ${styles.skeletonArrow}`} />
    </article>
  );
}

function RouteCard({ transfer, onOpen }) {
  const name = transfer.vehicle_details?.name;
  const category = transfer.vehicle_details?.category;
  const duration = getTransferDuration(transfer);
  const metaParts = [
    name || category || 'Direct highway transfer',
    duration,
  ].filter(Boolean);

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.cardHit}
        onClick={() => onOpen(transfer)}
        aria-label={`View ${ROUTE.title} — ${name || category || 'transfer'}`}
      >
        <div className={styles.codeBox} aria-hidden="true">
          <span className={styles.codeText}>{ROUTE.code}</span>
          <FaCar className={styles.codeIcon} />
        </div>

        <div className={styles.cardMain}>
          <h3 className={styles.routeTitle}>{ROUTE.title}</h3>
          <p className={styles.routeMeta}>
            <IoTimeOutline className={styles.metaIcon} aria-hidden="true" />
            <span>{metaParts.join(' · ')}</span>
          </p>
        </div>

        <div className={styles.priceCol}>
          <span className={styles.fromLabel}>From</span>
          <p className={styles.priceValue}>
            <PriceDisplay price={transfer.fare} currency={transfer.currency} />
          </p>
        </div>

        <span className={styles.arrowBtn} aria-hidden="true">
          <FaArrowRight />
        </span>
      </button>
    </article>
  );
}

export default function PopularRoutes() {
  const router = useRouter();
  const { setSelectedTransfer } = useTransferStore();
  const scrollerRef = useRef(null);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleQuantity, setVehicleQuantity] = useState(1);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getDailySearchPayload()),
          },
        );

        const result = await response.json();
        const apiTransfers = result?.data?.transfers;

        if (response.ok && result?.success && Array.isArray(apiTransfers)) {
          setTransfers(apiTransfers);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || isLoading) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [isLoading, transfers, updateScrollState]);

  if (!isLoading && (hasError || !transfers.length)) return null;

  const scrollByCard = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(`.${styles.card}`);
    const amount = card
      ? card.offsetWidth + CARD_GAP
      : Math.min(el.clientWidth * 0.8, 520);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const handleOpen = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const handleBooking = (transfer) => {
    if (!transfer) return;

    setSelectedTransfer({
      ...transfer,
      searchParams: getDailySearchPayload(),
      quantity: vehicleQuantity,
    });
    router.push('/transfers/checkout');
  };

  const showControls =
    !isLoading && transfers.length > 1 && (canScrollPrev || canScrollNext);

  return (
    <section
      className={`${styles.section} ${inter.className}`}
      aria-label="Popular routes and destinations"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}>Global Connectivity</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Popular Routes &amp; Destinations
            </h2>
          </div>

          {showControls && (
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByCard(-1)}
                disabled={!canScrollPrev}
                aria-label="Scroll routes left"
              >
                <FaArrowLeft />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByCard(1)}
                disabled={!canScrollNext}
                aria-label="Scroll routes right"
              >
                <FaArrowRight />
              </button>
            </div>
          )}
        </header>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          aria-busy={isLoading}
          aria-label="Popular transfer routes"
        >
          {isLoading ? (
            <>
              <RouteCardSkeleton />
              <RouteCardSkeleton />
              <RouteCardSkeleton />
              <RouteCardSkeleton />
            </>
          ) : (
            transfers.map((transfer) => (
              <RouteCard
                key={transfer.id}
                transfer={transfer}
                onOpen={handleOpen}
              />
            ))
          )}
        </div>
      </div>

      <VehicleDetail
        showModal={!!selectedVehicle}
        handleCloseModal={() => setSelectedVehicle(null)}
        selectedTransferDetail={selectedVehicle}
        handleBookNow={() => handleBooking(selectedVehicle)}
        vehicleQuantity={vehicleQuantity}
        setVehicleQuantity={setVehicleQuantity}
        searchParams={getDailySearchPayload()}
      />
    </section>
  );
}
