import React from 'react';
import { playfair } from '@/lib/fonts';
import styles from './about.module.css';

const steps = [
  {
    number: '01',
    title: 'Discover',
    desc: 'Explore curated destinations or use smart search to find the backdrop that fits your next trip.',
  },
  {
    number: '02',
    title: 'Tailor',
    desc: 'Shape your itinerary with transfers, stays, and experiences that match how you actually travel.',
  },
  {
    number: '03',
    title: 'Immerse',
    desc: 'Book securely in minutes and step into a journey handled by professionals from start to finish.',
  },
];

export default function SectionSix() {
  return (
    <section className={styles.sectionSixWrapper} aria-label="How it works">
      <div className={styles.shell}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.chipLabel}>Travel planning made effortless</p>
            <h2 className={`${styles.sectionTitle} ${playfair.className}`}>
              Your journey in three simple steps
            </h2>
          </div>
        </header>

        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <article key={step.number} className={styles.stepPanel}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={`${styles.stepTitle} ${playfair.className}`}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
