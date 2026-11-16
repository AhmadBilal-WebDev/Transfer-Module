import Link from 'next/link';
import Image from 'next/image';
import { MdPhoneInTalk } from 'react-icons/md';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import { playfair, inter } from '@/lib/fonts';
import styles from './ContactHero.module.css';

export default function ContactHero() {
  return (
    <section className={`${styles.hero} ${inter.className}`} aria-label="Contact Royalane">
      <div className={styles.shell}>
        <div className={styles.mobileTop}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className={styles.crumbSepDesktop} aria-hidden="true">/</span>
            <span className={styles.crumbSepMobile} aria-hidden="true">&gt;</span>
            <span>Contact Us</span>
          </nav>
          <span className={styles.contactPill}>
            <MdPhoneInTalk aria-hidden="true" />
            Contact
          </span>
        </div>

        <div className={styles.grid}>
          <div className={styles.copyCol}>
            <nav className={`${styles.breadcrumb} ${styles.breadcrumbDesktop}`} aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Contact Us</span>
            </nav>

            <p className={styles.eyebrow}>Contact Royalane</p>

            <h1 className={`${styles.title} ${playfair.className}`}>
              We are here to help.
            </h1>

            <p className={styles.leadDesktop}>
              Questions about a booking, a route, or a bespoke chauffeur assignment? Our dedicated
              dispatch and hospitality team replies quickly, 24/7.
            </p>

            <p className={styles.leadMobile}>
              Questions about a booking, a route, or a bespoke flight-synchronized transfer? Our elite
              chauffeur dispatch team replies with utmost precision, 24/7.
            </p>

            <div className={styles.liveBadge}>
              <span className={styles.liveDot} aria-hidden="true" />
              Live Global Dispatch Desk: Active
            </div>
          </div>

          <div className={styles.mediaCol}>
            <div className={styles.mediaFrame}>
              <Image
                src="/updatedImages/contactus-img.jpg"
                alt="Royalane dispatch team supporting travellers"
                fill
                priority
                quality={90}
                className={styles.mediaImage}
                sizes="(max-width: 991px) 100vw, 520px"
              />
              <div className={styles.mediaShade} aria-hidden="true" />

              <div className={styles.licenceCard}>
                <span className={styles.licenceIcon} aria-hidden="true">
                  <HiOutlineBadgeCheck />
                </span>
                <div className={styles.licenceCopy}>
                  <p className={styles.licenceEyebrow}>Licenced Operators</p>
                  <p className={styles.licenceTitle}>TFL &amp; Saudi Transport Authority</p>
                </div>
                <span className={styles.licencePill}>UK &amp; KSA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
