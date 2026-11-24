'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiCheck } from 'react-icons/fi';
import { playfair, inter } from '@/lib/fonts';
import styles from './DepartureCTA.module.css';

const PERKS = ['Fixed price', 'Free cancellation', 'Meet & greet'];

export default function DepartureCTA() {
  const handleBook = () => {
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
    <section className={`${styles.section} ${inter.className}`} aria-label="Ready for effortless departure">
      <div className={styles.shell}>
        <div className={styles.banner}>
          <div className={styles.media}>
            <Image
              src="/updatedImages/nextTrip2.png"
              alt="Luxury private transfer vehicle on city road"
              fill
              className={styles.mediaImage}
              sizes="(max-width: 991px) 100vw, 504px"
              priority={false}
            />
            <div className={styles.mediaShade} aria-hidden="true" />
          </div>

          <div className={styles.content}>
            <p className={styles.badge}>Ready for effortless departure</p>

            <h2 className={`${styles.title} ${playfair.className}`}>
              Your next trip, <em className={styles.titleEm}>sorted</em>
              <br />
              in 1 minute.
            </h2>

            <p className={styles.subtitle}>
              Punctual, fixed-price private transfers at airports worldwide,
              with a guaranteed meet-and-greet.
            </p>

            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={handleBook}>
                Book your transfer
                <span aria-hidden="true"> →</span>
              </button>
              <Link href="/contact-us" className={styles.secondaryBtn}>
                Corporate Desk Inquiry
              </Link>
            </div>

            <ul className={styles.perks}>
              {PERKS.map((perk) => (
                <li key={perk} className={styles.perk}>
                  <FiCheck className={styles.perkIcon} aria-hidden="true" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
