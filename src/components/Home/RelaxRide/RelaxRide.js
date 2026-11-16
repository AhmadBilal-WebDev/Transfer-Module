'use client';

import Image from 'next/image';
import { playfair, inter } from '@/lib/fonts';
import styles from './RelaxRide.module.css';

export default function RelaxRide() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-label="Step in, relax, enjoy the ride">
      <div className={styles.media}>
        <Image
          src="/updatedImages/relexImg.jpg"
          alt="Luxury vehicle cabin with quilted leather seats"
          fill
          className={styles.mediaImage}
          sizes="100vw"
          priority={false}
        />
        <div className={styles.overlay} aria-hidden="true" />
      </div>

      <div className={styles.shell}>
        <h2 className={`${styles.title} ${playfair.className}`}>
          <span className={styles.titleMain}>Step in. Relax.</span>{' '}
          <em className={styles.titleEm}>Enjoy the ride.</em>
        </h2>

        <div className={styles.card}>
          <h3 className={`${styles.cardTitle} ${playfair.className}`}>
            Your journey, our priority.
          </h3>
          <p className={styles.cardText}>
            Experience comfortable, reliable and hassle-free transfers with professional drivers and premium vehicles.
          </p>
        </div>
      </div>
    </section>
  );
}
