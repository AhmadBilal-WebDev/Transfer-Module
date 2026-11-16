'use client';

import Image from 'next/image';
import {
  FiClock,
  FiCreditCard,
  FiRefreshCw,
  FiZap,
  FiShield,
  FiHeadphones,
} from 'react-icons/fi';
import { playfair, inter } from '@/lib/fonts';
import styles from './WhyTravelers.module.css';

const FEATURES = [
  {
    title: 'Free Waiting Time',
    text: '60 minutes included for all airport pickups; 15 complimentary minutes for city rides.',
    icon: FiClock,
    featured: true,
  },
  {
    title: 'Secure Cashless Payment',
    text: 'Seamless automated invoicing and corporate billing with zero hidden surcharges.',
    icon: FiCreditCard,
  },
  {
    title: 'Free Cancellation',
    text: 'Full refund with no questions asked when cancelled up to 24 hours prior to pickup.',
    icon: FiRefreshCw,
  },
  {
    title: 'Rapid 60-Sec Booking',
    text: 'Book directly on web or concierge desk without complex verification steps.',
    icon: FiZap,
  },
  {
    title: 'Vetted Professional Drivers',
    text: 'Licensed, fully insured, background-checked, English-speaking drivers.',
    icon: FiShield,
  },
  {
    title: '24/7 Dedicated Support',
    text: 'Multilingual concierge desk ready on call, email, and WhatsApp around the clock.',
    icon: FiHeadphones,
  },
];

export default function WhyTravelers() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Why travelers choose Royalane">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}>Uncompromising service</p>
            <h2 className={`${styles.title} ${playfair.className}`}>
              Why Travelers
              <br />
              Choose Royalane
            </h2>
            <p className={styles.subtitle}>
              Built around the needs of business travelers and international families.
            </p>

            <div className={styles.media}>
              <Image
                src="/updatedImages/whyTraveller.jpg"
                alt="Premium vehicle cabin interior"
                fill
                className={styles.mediaImage}
                sizes="(max-width: 991px) 100vw, 340px"
              />
              <div className={styles.mediaCaption}>
                <span className={styles.mediaIcon} aria-hidden="true">
                  <FiShield />
                </span>
                <p className={styles.mediaText}>
                  Licensed, insured, background-checked
                  <br />
                  drivers
                </p>
              </div>
            </div>
          </div>

          <div className={styles.cards}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`${styles.card} ${feature.featured ? styles.cardFeatured : ''}`}
                >
                  <span className={styles.cardIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <h3 className={`${styles.cardTitle} ${playfair.className}`}>
                    {feature.title}
                  </h3>
                  <p className={styles.cardText}>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
