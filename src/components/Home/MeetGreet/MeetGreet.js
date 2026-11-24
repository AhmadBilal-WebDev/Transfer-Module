'use client';

import Image from 'next/image';
import { FaPlane } from 'react-icons/fa';
import { playfair, inter } from '@/lib/fonts';
import styles from './MeetGreet.module.css';

const STEPS = [
  {
    title: 'Flight tracked live',
    text: 'Share your flight number and we monitor delays, so your pickup moves with your landing.',
  },
  {
    title: 'Met at arrivals',
    text: 'Your driver is waiting for you at arrivals, ready to help with your bags.',
  },
  {
    title: '60 minutes free waiting',
    text: 'No rush through immigration or baggage. Waiting time is on us.',
  },
  {
    title: 'Straight to your door',
    text: 'Door to door at a fixed price, with no surge and no surprises.',
  },
];

export default function MeetGreet() {
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
    <section className={`${styles.section} ${inter.className}`} aria-label="Meet and greet">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.mediaCol}>
            <div className={styles.mediaFrame}>
              <Image
                src="/updatedImages/homepagecar.png"
                alt="Guest boarding a chauffeur vehicle"
                fill
                className={styles.mediaImage}
                sizes="(max-width: 991px) 100vw, 44vw"
                priority={false}
              />

              <aside className={styles.statusCard} aria-label="Flight status">
                <span className={styles.statusIcon} aria-hidden="true">
                  <FaPlane />
                </span>
                <div className={styles.statusCopy}>
                  <p className={styles.statusLabel}>Flight status</p>
                  <p className={styles.statusValue}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    Landed · driver waiting
                  </p>
                </div>
              </aside>
            </div>
          </div>

          <div className={styles.contentCol}>
            <p className={styles.eyebrow}>Meet &amp; greet</p>

            <h2 className={`${styles.title} ${playfair.className}`}>
              From landing to your
              <br />
              door, <em className={styles.titleEm}>handled.</em>
            </h2>

            <p className={styles.subtitle}>
              Every airport transfer is built around your arrival, not a fixed pickup time.
            </p>

            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className={`${styles.step} ${index === 0 ? styles.stepActive : ''}`}
                >
                  <span className={styles.stepIndex} aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className={styles.stepBody}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <button type="button" className={styles.cta} onClick={handleBook}>
              Book a transfer
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
