'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import styles from './TopTransfers.module.css';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail';
import { useTransferStore } from '@/components/Store/TransferStore';
import { playfair, inter } from '@/lib/fonts';

const SEARCH_PAYLOAD = {
  dropoffLocation: 'Makkah',
  fromCountry: 'Saudi Arabia',
  fromLat: '21.4240968',
  fromLng: '39.81733639999999',
  passengers: '1',
  adults: '1',
  children: '0',
  infants: '0',
  pickupLocation: 'Jeddah',
  pickupTime: '00:00:00',
  toLat: '24.4672132',
  toLng: '39.6024496',
  transferType: 'one-way',
};

function TransferCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={`${styles.media} ${styles.skeletonMedia}`} />
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonAlt}`} />
        <div className={styles.metaRow}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
        </div>
        <div className={styles.divider} />
        <div className={styles.priceBlock}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonPriceLabel}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonPrice}`} />
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBtn}`} />
      </div>
    </article>
  );
}

function TransferCard({ transfer, onViewDetail }) {
  const name = transfer.vehicle_details?.name;
  const category = transfer.vehicle_details?.category;
  const pax = transfer.vehicle_details?.passenger_capacity;
  const bags = transfer.vehicle_details?.luggage_capacity;
  const similar = transfer.vehicle_details?.similar_vehicles;

  return (
    <article className={styles.card}>
      <div
        className={styles.media}
        onClick={() => onViewDetail(transfer)}
        onKeyDown={(e) => e.key === 'Enter' && onViewDetail(transfer)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${name}`}
      >
        <Image
          src={transfer.vehicle_image}
          alt={name || 'Transfer vehicle'}
          width={280}
          height={200}
          className={styles.cardImage}
          sizes="(max-width: 767px) 78vw, (max-width: 1199px) 40vw, 260px"
        />
        {category && (
          <span className={styles.categoryBadge}>{category}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={`${styles.vehicleName} ${playfair.className}`}>{name}</h3>
        {similar && <p className={styles.vehicleAlt}>{similar}</p>}

        <div className={styles.metaRow}>
          {pax != null && pax !== '' && (
            <span className={styles.metaItem}>
              <GoPerson className={styles.metaIcon} aria-hidden="true" />
              {pax} passengers
            </span>
          )}
          {bags != null && bags !== '' && (
            <span className={styles.metaItem}>
              <PiSuitcaseRolling className={styles.metaIcon} aria-hidden="true" />
              {bags} suitcases
            </span>
          )}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.priceBlock}>
          <p className={styles.priceLabel}>Starting rate</p>
          <p className={styles.priceValue}>
            <span className={styles.priceFrom}>from </span>
            <PriceDisplay price={transfer.fare} currency={transfer.currency} />
          </p>
          <p className={styles.priceNote}>VAT and taxes included</p>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(transfer)}
          className={styles.bookBtn}
        >
          Book vehicle
        </button>
      </div>
    </article>
  );
}

export default function TopTransfers() {
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
          body: JSON.stringify({
            ...SEARCH_PAYLOAD,
            pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          }),
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
    const amount = card ? card.offsetWidth + gap : Math.min(el.clientWidth * 0.8, 300);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const handleViewDetail = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const handleBooking = (transfer) => {
    if (!transfer) return;

    const searchParams = {
      ...SEARCH_PAYLOAD,
      pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
    };

    setSelectedTransfer({
      ...transfer,
      searchParams,
      quantity: vehicleQuantity,
    });
    router.push('/transfers/checkout');
  };

  const showControls = !isLoading && transfers.length > 1 && (canScrollPrev || canScrollNext);

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Vehicles for every transfer">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}>Choose your ride</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Vehicles for every transfer
            </h2>
          </div>

          <div className={styles.headerRight}>
            {/* <p className={styles.subtitle}>
              Late-model German-engineered vehicles, maintained
              to factory standards and stocked with onboard
              refreshments.
            </p> */}

            {showControls && (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => scrollByCard(-1)}
                  disabled={!canScrollPrev}
                  aria-label="Scroll fleet left"
                >
                  <FaArrowLeft />
                </button>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => scrollByCard(1)}
                  disabled={!canScrollNext}
                  aria-label="Scroll fleet right"
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
          aria-label="Transfer vehicles"
        >
          {isLoading ? (
            <>
              <TransferCardSkeleton />
              <TransferCardSkeleton />
              <TransferCardSkeleton />
              <TransferCardSkeleton />
            </>
          ) : (
            transfers.map((transfer) => (
              <TransferCard
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
