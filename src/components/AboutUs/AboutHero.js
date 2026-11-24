import Link from 'next/link';
import Image from 'next/image';
import { IoShieldCheckmark, IoTimeOutline } from 'react-icons/io5';
import { MdFlight, MdSwapHoriz } from 'react-icons/md';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import { playfair, inter } from '@/lib/fonts';
import styles from './AboutHero.module.css';

export default function AboutHero() {
  return (
    <section className={`${styles.hero} ${inter.className}`} aria-label="About Royalane">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copyCol}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>About Us</span>
            </nav>

            <p className={styles.eyebrow}>About Royalane</p>

            <h1 className={`${styles.title} ${playfair.className}`}>
              Moving you with care, on
              <br className={styles.titleBreak} />
              time, every time.
            </h1>

            <p className={styles.lead}>
              Reliable airport transfers and private chauffeur services for pilgrims, families,
              and business travellers, with fixed prices and no surprises.
            </p>

            <div className={styles.badges}>
              <span className={styles.badge}>
                <IoShieldCheckmark className={styles.badgeIconDesktop} aria-hidden="true" />
                <IoTimeOutline className={styles.badgeIconMobile} aria-hidden="true" />
                Punctuality Guarantee
              </span>
              <span className={styles.badge}>
                <MdFlight className={styles.badgeIconDesktop} aria-hidden="true" />
                <MdSwapHoriz className={styles.badgeIconMobile} aria-hidden="true" />
                Real-Time Flight Sync
              </span>
            </div>
          </div>

          <div className={styles.mediaCol}>
            <div className={styles.mediaFrame}>
              <div className={styles.mediaClip}>
                <Image
                  src="/updatedImages/aboutUsBanner.png"
                  alt="Premier chauffeur service at the airport terminal"
                  fill
                  priority
                  quality={90}
                  className={styles.mediaImage}
                  sizes="(max-width: 991px) 100vw, 560px"
                />
              </div>

              <div className={styles.floatCard}>
                <span className={styles.floatIcon} aria-hidden="true">
                  <HiOutlineBadgeCheck />
                </span>
                <div>
                  <p className={styles.floatEyebrow}>Official Standard</p>
                  <p className={styles.floatTitle}>Premier Chauffeur Service</p>
                </div>
              </div>

              <div className={styles.mobileBadge}>
                <span className={styles.mobileBadgeDot} aria-hidden="true" />
                Premier Chauffeur Service
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
