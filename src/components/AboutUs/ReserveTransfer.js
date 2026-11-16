import Link from 'next/link';
import { IoStarOutline } from 'react-icons/io5';
import { playfair, inter } from '@/lib/fonts';
import styles from './ReserveTransfer.module.css';

export default function ReserveTransfer() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="reserve-transfer-title">
      <div className={styles.shell}>
        <div className={styles.card}>
          <span className={styles.starBadge} aria-hidden="true">
            <IoStarOutline />
          </span>

          <p className={styles.eyebrow}>Reserve Your Private Transfer</p>

          <h2 id="reserve-transfer-title" className={`${styles.title} ${playfair.className}`}>
            Ready to book your
            <br />
            transfer?
          </h2>

          <p className={styles.leadDesktop}>
            Experience punctual, discreet chauffeur travel tailored to your schedule.
            <br />
            Instant confirmations with no surge pricing.
          </p>

          <p className={styles.leadMobile}>
            Reserve your chauffeur in seconds. Guaranteed fixed rate and real-time flight tracking
            included with every transfer.
          </p>

          <div className={styles.actions}>
            <Link href="/transfers" className={styles.primaryBtn}>
              Search transfers
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
            <Link href="/contact-us" className={styles.secondaryBtn}>
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
