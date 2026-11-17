import Link from 'next/link';
import { FaCheck } from 'react-icons/fa6';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { IoTimeOutline } from 'react-icons/io5';
import { MdFlight } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import styles from './RoyalaneStandard.module.css';

const features = [
  {
    title: 'Fixed prices shown upfront',
    desc: 'No metering, surge, or unexpected toll charges.',
    mobileTitle: 'Fixed prices shown upfront',
  },
  {
    title: 'Complimentary wait time',
    desc: '60 minutes free at airport arrivals after landing.',
    mobileTitle: 'Complimentary wait time',
  },
  {
    title: 'Free cancellation',
    desc: 'Cancel up to 24 hours prior without penalty.',
    mobileTitle: 'Free cancellation options',
  },
  {
    title: 'Secure card payment',
    desc: '256-bit encrypted checkout with immediate receipt.',
    mobileTitle: 'Secure card payment',
  },
  {
    title: 'Private and shared options',
    desc: 'Choose exclusive VIP limos or premium shuttles.',
    mobileTitle: 'Private and shared options',
  },
  {
    title: 'English-speaking support',
    desc: 'Multilingual concierge reachable 24/7 via WhatsApp or call.',
    mobileTitle: 'English-speaking concierge support',
  },
];

export default function RoyalaneStandard() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="royalane-standard-title">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copyCol}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDesktop}>The Royalane Standard</span>
              <span className={styles.eyebrowMobile}>Client Assurance</span>
            </p>

            <h2 id="royalane-standard-title" className={`${styles.title} ${playfair.className}`}>
              Why discerning travellers choose Royalane
            </h2>

            <p className={styles.lead}>
              Designed from the wheels up for zero stress, frictionless transfers, and discreet
              executive comfort.
            </p>

            <ul className={styles.features}>
              {features.map((item) => (
                <li key={item.title} className={styles.feature}>
                  <span className={styles.check} aria-hidden="true">
                    <FaCheck />
                  </span>
                  <div className={styles.featureCopy}>
                    <p className={styles.featureTitleDesktop}>{item.title}</p>
                    <p className={styles.featureTitleMobile}>{item.mobileTitle}</p>
                    <p className={styles.featureDesc}>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mediaCol}>
            <div className={styles.quoteFrame}>
              <article className={styles.quoteCard}>
                <div className={styles.quoteTop}>
                  <span className={styles.quoteBadge}>
                    <span className={styles.quoteBadgeDesktop}>Confirmed Quote</span>
                    <span className={styles.quoteBadgeMobile}>Confirmed Quote Spec</span>
                  </span>
                  <span className={styles.quoteStatusDesktop}>Instant Confirmation</span>
                  <span className={styles.quoteStatusMobile}>Instant Lock</span>
                </div>

                <h3 className={`${styles.quoteTitle} ${playfair.className}`}>
                  Executive Airport Shuttle
                </h3>
                <p className={styles.quoteVehicle}>Mercedes-Benz V-Class or EQV</p>

                <div className={styles.routeBox}>
                  <div className={styles.routeItem}>
                    <span className={`${styles.routeDot} ${styles.routeDotStart}`} aria-hidden="true" />
                    <div>
                      <p className={styles.routeNameDesktop}>Jeddah Airport (JED) Terminal 1</p>
                      <p className={styles.routeNameMobile}>Jeddah Int&apos;l Airport (JED)</p>
                    </div>
                  </div>
                  <div className={styles.routeItem}>
                    <span className={`${styles.routeDot} ${styles.routeDotEnd}`} aria-hidden="true" />
                    <div>
                      <p className={styles.routeName}>Makkah Clock Royal Tower Hotel</p>
                    </div>
                  </div>
                </div>

                <div className={styles.metaDesktop}>
                  <div className={styles.metaPills}>
                    <span><GoPerson aria-hidden="true" /> 4 Passengers</span>
                    <span><PiSuitcaseRolling aria-hidden="true" /> 4 Luggage</span>
                  </div>
                  <div className={styles.metaExtras}>
                    <span><IoTimeOutline aria-hidden="true" /> Complimentary 60m Wait</span>
                    <span><MdFlight aria-hidden="true" /> Flight Tracking</span>
                  </div>
                </div>

                <div className={styles.quoteFooterDesktop}>
                  <p className={`${styles.price} ${playfair.className}`}>GBP £50.26</p>
                  <Link href="/" className={styles.detailBtn}>
                    View Detail
                  </Link>
                </div>

                <div className={styles.quoteFooterMobile}>
                  <div className={styles.metaMobileCounts}>
                    <span><GoPerson aria-hidden="true" /> 4</span>
                    <span><PiSuitcaseRolling aria-hidden="true" /> 4</span>
                  </div>
                  <div className={styles.priceBlockMobile}>
                    <span className={styles.fixedFare}>Fixed Fare</span>
                    <p className={`${styles.priceMobile} ${playfair.className}`}>GBP £50.26</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
