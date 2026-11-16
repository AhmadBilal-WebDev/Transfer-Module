'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaPlane } from 'react-icons/fa';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling, PiCalendarBlank } from 'react-icons/pi';
import styles from './PrivateTransfer.module.css';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail';
import { useTransferStore } from '@/components/Store/TransferStore';
import { playfair, inter } from '@/lib/fonts';

const SEARCH_PAYLOAD = {
  pickupLocation: 'Hotel Barcelona Princess',
  dropoffLocation: 'Port of Barcelona',
  pickupLatitude: 41.4109339,
  pickupLongitude: 2.2186667,
  dropoffLatitude: 41.3483803,
  dropoffLongitude: 2.1677247,
  fromLat: '41.4109339',
  fromLng: '2.2186667',
  toLat: '41.3483803',
  toLng: '2.1677247',
  passengers: 1,
  adults: 1,
  children: 0,
  infants: 0,
  pickupTime: '17:15',
  transferType: 'one-way',
};

function getDailySearchPayload() {
  return {
    ...SEARCH_PAYLOAD,
    pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
  };
}

const ROUTE = {
  fromCode: 'HBP',
  fromLabel: 'Hotel Barcelona Princess',
  toCode: 'PORT',
  toLabel: 'Port of Barcelona',
  serviceMeta: 'Direct · One-way · Private',
};

function ShuttleCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={styles.cardTop}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
      </div>
      <div className={styles.routeRow}>
        <div className={styles.routeEnd}>
          <span className={`${styles.skeletonBlock} ${styles.skeletonCode}`} />
          <span className={`${styles.skeletonBlock} ${styles.skeletonPlace}`} />
        </div>
        <div className={styles.routeMid} />
        <div className={`${styles.routeEnd} ${styles.routeEndTo}`}>
          <span className={`${styles.skeletonBlock} ${styles.skeletonCode}`} />
          <span className={`${styles.skeletonBlock} ${styles.skeletonPlace}`} />
        </div>
      </div>
      <div className={styles.cardDivider} />
      <div className={styles.capacityRow}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.fareBlock}>
          <span className={`${styles.skeletonBlock} ${styles.skeletonFareLabel}`} />
          <span className={`${styles.skeletonBlock} ${styles.skeletonFare}`} />
        </div>
        <span className={`${styles.skeletonBlock} ${styles.skeletonBtn}`} />
      </div>
    </article>
  );
}

function ShuttleCard({ transfer, onViewDetail }) {
  const name = transfer.vehicle_details?.name;
  const category = transfer.vehicle_details?.category || 'Shuttle';
  const pax = transfer.vehicle_details?.passenger_capacity;
  const bags = transfer.vehicle_details?.luggage_capacity;
  const serviceMeta =
    transfer.vehicle_details?.similar_vehicles ||
    `${category} · ${ROUTE.serviceMeta}`;

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.shuttleBadge}>Shuttle</span>
        <span className={styles.serviceMeta}>{serviceMeta}</span>
      </div>

      <div className={styles.routeRow}>
        <div className={styles.routeEnd}>
          <p className={`${styles.routeCode} ${playfair.className}`}>{ROUTE.fromCode}</p>
          <p className={styles.routePlace}>{ROUTE.fromLabel}</p>
        </div>

        <div className={styles.routeMid} aria-hidden="true">
          <span className={styles.routeLine} />
          <span className={styles.routePlane}>
            <FaPlane />
          </span>
          <span className={styles.routeLine} />
        </div>

        <div className={`${styles.routeEnd} ${styles.routeEndTo}`}>
          <p className={`${styles.routeCodeTo} ${playfair.className}`}>{ROUTE.toCode}</p>
          <p className={styles.routePlace}>{ROUTE.toLabel}</p>
        </div>
      </div>

      {(name || category) && (
        <p className={styles.vehicleHint}>{name || category}</p>
      )}

      <div className={styles.cardDivider} aria-hidden="true" />

      <div className={styles.capacityRow}>
        {pax != null && pax !== '' && (
          <span className={styles.capacityItem}>
            <GoPerson aria-hidden="true" />
            1–{pax} Pax
          </span>
        )}
        {bags != null && bags !== '' && (
          <span className={styles.capacityItem}>
            <PiSuitcaseRolling aria-hidden="true" />
            {bags} Bags
          </span>
        )}
        <span className={styles.capacityItem}>
          <PiCalendarBlank aria-hidden="true" />
          Daily 24/7 Available
        </span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.fareBlock}>
          <p className={styles.fareLabel}>Total Fare</p>
          <p className={styles.fareValue}>
            <PriceDisplay price={transfer.fare} currency={transfer.currency} />
          </p>
          <p className={styles.fareNote}>VAT &amp; taxes included</p>
        </div>

        <button
          type="button"
          className={styles.detailBtn}
          onClick={() => onViewDetail(transfer)}
        >
          View Detail
        </button>
      </div>
    </article>
  );
}

export default function PrivateTransfer() {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(getDailySearchPayload()),
        });

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
    const gap = 20;
    const amount = card ? card.offsetWidth + gap : Math.min(el.clientWidth * 0.8, 340);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const handleViewDetail = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const handleBooking = (transfer) => {
    if (!transfer) return;

    const searchParams = getDailySearchPayload();

    setSelectedTransfer({
      ...transfer,
      searchParams,
      quantity: vehicleQuantity,
    });
    router.push('/transfers/checkout');
  };

  const showControls = !isLoading && transfers.length > 1 && (canScrollPrev || canScrollNext);

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Featured transfers and private shuttles">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}>Pre-arranged shuttles</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Featured transfers &amp; private
              <br />
              shuttles
            </h2>
          </div>

          <div className={styles.headerRight}>
            <p className={styles.subtitle}>
              Fixed fares, set baggage allowances and verified hotel pickup points.
            </p>

            {showControls && (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => scrollByCard(-1)}
                  disabled={!canScrollPrev}
                  aria-label="Scroll shuttles left"
                >
                  <FaArrowLeft />
                </button>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => scrollByCard(1)}
                  disabled={!canScrollNext}
                  aria-label="Scroll shuttles right"
                >
                  <FaArrowRight />
                </button>
              </div>
            )}
          </div>
        </header>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          aria-busy={isLoading}
          aria-label="Featured shuttle transfers"
        >
          {isLoading ? (
            <>
              <ShuttleCardSkeleton />
              <ShuttleCardSkeleton />
              <ShuttleCardSkeleton />
            </>
          ) : (
            transfers.map((transfer) => (
              <ShuttleCard
                key={transfer.id}
                transfer={transfer}
                onViewDetail={handleViewDetail}
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
      />
    </section>
  );
}
