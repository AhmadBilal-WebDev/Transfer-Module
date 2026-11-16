'use client';

import { FiGlobe, FiShield } from 'react-icons/fi';
import { MdOutlineDirectionsCar } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import styles from './RoyalaneStandard.module.css';

const CARDS = [
  {
    key: 'worldwide',
    title: 'Available worldwide',
    text: 'Experienced local drivers wherever you land.',
    icon: FiGlobe,
    featured: false,
  },
  {
    key: 'vehicles',
    title: 'High-end vehicles',
    text: 'Only the best recent models.',
    icon: MdOutlineDirectionsCar,
    featured: true,
  },
  {
    key: 'safe',
    title: 'Safe travels',
    text: 'Trained professionals and reliable pickups.',
    icon: FiShield,
    featured: false,
  },
];

export default function RoyalaneStandard() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="The Royalane standard">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>The Royalane standard</p>
          <h2 className={`${styles.title} ${playfair.className}`}>Expect excellence.</h2>
          <p className={styles.subtitle}>Leave the car refreshed and ready for what&apos;s next.</p>
        </header>

        <div className={styles.cards}>
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.key}
                className={`${styles.card} ${card.featured ? styles.cardFeatured : ''}`}
              >
                <span className={styles.decor} aria-hidden="true" />
                <span className={styles.icon} aria-hidden="true">
                  <Icon />
                </span>
                <h3 className={`${styles.cardTitle} ${playfair.className}`}>{card.title}</h3>
                <p className={styles.cardText}>{card.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
