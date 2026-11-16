'use client';

import Image from 'next/image';
import { FiClock } from 'react-icons/fi';
import { playfair, inter } from '@/lib/fonts';
import styles from './TransferServices.module.css';

const SERVICES = [
  {
    key: 'airport',
    badge: 'Most popular',
    title: 'Airport Transfers',
    text: 'Flight tracking, meet & greet and 60 minutes of free waiting. Door to door, from arrivals to your hotel or home.',
    image: '/updatedImages/everJornary.jpg',
    variant: 'hero',
  },
  {
    key: 'city',
    badge: 'In town',
    title: 'City Rides',
    text: 'Point-to-point rides for meetings, shopping and dinners. Private, unrushed and always on time.',
    image: '/updatedImages/cityRide.jpg',
    variant: 'image',
  },
  {
    key: 'hotel',
    badge: 'Hotel Pick & Drop',
    title: 'Hotel Chauffeur',
    text: 'A dedicated private driver and vehicle for as long as you need it. Multi-stop itineraries are welcome.',
    variant: 'gradient',
  },
];

export default function TransferServices() {
  const handleLearnMore = () => {
    if (typeof window === 'undefined') return;
    const target =
      document.getElementById('transfer-tab-pane') ||
      document.getElementById('searchTabs') ||
      document.getElementById('scrool');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Our transfer services">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Our transfer services</p>
          <h2 className={`${styles.title} ${playfair.className}`}>
            A transfer for every journey
          </h2>
          <p className={styles.subtitle}>
            Every booking is matched to your schedule, with live flight tracking and vetted,
            professional drivers.
          </p>
        </header>

        <div className={styles.grid}>
          {SERVICES.map((service) => (
            <article
              key={service.key}
              className={`${styles.card} ${styles[`card_${service.variant}`]}`}
            >
              {service.image && (
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className={styles.cardImage}
                  sizes={
                    service.variant === 'hero'
                      ? '(max-width: 991px) 100vw, 55vw'
                      : '(max-width: 991px) 100vw, 40vw'
                  }
                />
              )}

              {service.variant === 'gradient' && (
                <div className={styles.decor} aria-hidden="true">
                  <span className={styles.decorRing} />
                  <span className={styles.decorRing} />
                  <span className={styles.decorClock}>
                    <FiClock />
                  </span>
                </div>
              )}

              <div className={styles.cardOverlay} />

              <div className={styles.cardContent}>
                <span className={styles.badge}>{service.badge}</span>
                <h3 className={`${styles.cardTitle} ${playfair.className}`}>
                  {service.title}
                </h3>
                <p className={styles.cardText}>{service.text}</p>
                <button type="button" className={styles.cta} onClick={handleLearnMore}>
                  Learn more
                  <span aria-hidden="true"> →</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
