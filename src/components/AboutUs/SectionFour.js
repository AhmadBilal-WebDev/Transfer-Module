import React from 'react';
import Image from 'next/image';
import { playfair } from '@/lib/fonts';
import styles from './about.module.css';

const stats = [
  { value: '50K+', label: 'Discerning travelers served' },
  { value: '200+', label: 'Vetted global destinations' },
  { value: '12+', label: 'Years of curating travel' },
  { value: '99%', label: 'Customer satisfaction rate' },
];

export default function SectionFour() {
  return (
    <section className={styles.sectionFourWrapper} aria-label="Our story">
      <div className={styles.shell}>
        <div className={styles.statsRail}>
          {stats.map((item, index) => (
            <div key={item.label} className={styles.statItem}>
              <span className={styles.statIndex} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className={`${styles.statValue} ${playfair.className}`}>{item.value}</h2>
              <p className={styles.statLabel}>{item.label}</p>
            </div>
          ))}
        </div>

        <article className={styles.storyPanel}>
          <div className={styles.storyMedia}>
            <Image
              src="/images/about/journey.jpg"
              alt="The journey behind Royalane"
              fill
              className={styles.storyImage}
              sizes="(max-width: 991px) 100vw, 55vw"
            />
            <span className={styles.storyBadge} aria-hidden="true">01</span>
          </div>

          <div className={styles.storyBody}>
            <p className={styles.chipLabel}>A passion for meaningful travel</p>
            <h2 className={`${styles.storyTitle} ${playfair.className}`}>
              The journey behind Royalane
            </h2>
            <p className={styles.storyCopy}>
              Founded on the belief that travel should be both exhilarating and deeply restorative,
              Royalane emerged to fill a gap in modern tourism. True luxury isn&apos;t just about
              five-star stays — it&apos;s the luxury of time, peace of mind, and flawless execution.
            </p>
            <p className={styles.storyCopy}>
              What started as a boutique passion project has grown into a premier travel platform.
              Today our team designs itineraries that let you step away from the noise and into the
              world&apos;s most memorable destinations.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
