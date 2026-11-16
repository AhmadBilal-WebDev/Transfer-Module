import React from 'react';
import { playfair } from '@/lib/fonts';
import styles from './about.module.css';

const coreValues = [
  {
    title: 'Excellence in Curation',
    desc: 'We meticulously vet every hotel, villa, excursion, and local partner to ensure your experience meets the highest standard of comfort.',
  },
  {
    title: 'Uncompromising Trust',
    desc: 'Your safety, privacy, and peace of mind are non-negotiable. From secure bookings to 24/7 support, we stay with you every step.',
  },
  {
    title: 'Bespoke Innovation',
    desc: 'We blend intuitive technology with deep human expertise to make planning your next getaway entirely effortless.',
  },
];

export default function SectionFive() {
  return (
    <section className={styles.sectionFiveWrapper} aria-label="Our values">
      <div className={styles.shell}>
        <div className={styles.splitHeader}>
          <div className={styles.splitLead}>
            <p className={`${styles.brandMark} ${playfair.className}`}>Royalane</p>
            <h2 className={`${styles.sectionTitle} ${playfair.className}`}>
              The pillars of<br />
              our experience.
            </h2>
            <p className={styles.sectionSubtitle}>
              Three quiet standards behind every itinerary we design.
            </p>
            <div className={styles.accentBar} aria-hidden="true" />
          </div>

          <ol className={styles.valuesRail}>
            {coreValues.map((item, index) => (
              <li key={item.title} className={styles.valueItem} style={{ '--i': index }}>
                <span className={styles.valueIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={styles.valueCopy}>
                  <h3 className={styles.valueTitle}>{item.title}</h3>
                  <p className={styles.valueDesc}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
