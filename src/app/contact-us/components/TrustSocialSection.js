import React from 'react';
import { playfair } from '@/lib/fonts';
import styles from '../ContactUs.module.css';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/royalane' },
  { label: 'Facebook', href: 'https://www.facebook.com/royalane' },
  { label: 'X', href: 'https://x.com/royalane' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/royalane/' },
];

export default function TrustSocialSection() {
  return (
    <section className={styles.trustSection} aria-label="Response and social">
      <div className={styles.trustGrid}>
        <article className={styles.trustCard}>
          <span className={styles.trustTag}>Quick response</span>
          <h3 className={`${styles.trustHeading} ${playfair.className}`}>Your time is valued</h3>
          <p className={styles.trustText}>
            Expect a detailed reply from our travel team within about 4 hours during standard operational hours.
          </p>
          <div className={styles.trustStat}>
            <span className={`${styles.trustStatNum} ${playfair.className}`}>4h</span>
            <span className={styles.trustStatLabel}>average reply</span>
          </div>
        </article>

        <article className={styles.socialCard}>
          <span className={styles.socialTag}>Follow the journey</span>
          <h3 className={`${styles.socialHeading} ${playfair.className}`}>Stay inspired</h3>
          <p className={styles.socialText}>
            Destination notes, trip ideas, and updates from the Royalane team — across our channels.
          </p>
          <div className={styles.socialRow}>
            {socialLinks.map((item) => (
              <a href={item.href} aria-label={item.label} key={item.label} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
