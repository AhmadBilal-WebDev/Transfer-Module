'use client';

import { playfair, inter } from '@/lib/fonts';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    num: '01',
    title: 'Search Route',
    text: 'Instant guaranteed quote with no surge multipliers applied.',
    accent: true,
  },
  {
    num: '02',
    title: 'Choose Vehicle',
    text: 'Select between Executive, First Class Sedan, or Multi-Pax Vans.',
  },
  {
    num: '03',
    title: 'Enter Details',
    text: 'Provide flight number for complimentary radar tracking.',
  },
  {
    num: '04',
    title: 'Enjoy Your Ride',
    text: 'Meet your driver at arrivals and travel in comfort.',
  },
];

export default function HowItWorks() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="How Royalane works">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Simplicity &amp; transparency</p>
          <h2 className={`${styles.title} ${playfair.className}`}>How Royalane Works</h2>
          <p className={styles.subtitle}>
            Four intuitive steps to secure premier ground transportation worldwide.
          </p>
        </header>

        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.num} className={styles.step}>
              <div
                className={`${styles.badge} ${step.accent ? styles.badgeAccent : ''} ${playfair.className}`}
                aria-hidden="true"
              >
                {step.num}
              </div>
              <h3 className={`${styles.stepTitle} ${playfair.className}`}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
