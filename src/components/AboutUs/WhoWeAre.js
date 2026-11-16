import Image from 'next/image';
import { MdFlight, MdVerifiedUser } from 'react-icons/md';
import { IoLockClosedOutline } from 'react-icons/io5';
import { playfair, inter } from '@/lib/fonts';
import styles from './WhoWeAre.module.css';

const features = [
  {
    label: 'Flight Tracking Included',
    Icon: MdFlight,
  },
  {
    label: 'Professional Greeters',
    Icon: MdVerifiedUser,
  },
  {
    label: 'Zero Surge Pricing',
    Icon: IoLockClosedOutline,
  },
];

export default function WhoWeAre() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="who-we-are-title">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.copyCol}>
            <p className={styles.eyebrow}>Who We Are</p>

            <h2 id="who-we-are-title" className={`${styles.title} ${playfair.className}`}>
              Getting from the airport to your hotel should be the easiest part of the journey.
            </h2>

            <div className={styles.copy}>
              <p>
                Royalane started with a simple idea: your journey should feel calm from the moment
                you land. Whether you are arriving in Jeddah for Umrah, flying into London Heathrow
                for corporate summits, or travelling with your family, an elite chauffeur is already
                waiting for you at a fixed price established before you board.
              </p>
              <p>
                We partner exclusively with licensed local chauffeurs who know every terminal shortcut,
                every hotel entrance, and every traffic pattern. From executive saloons to spacious
                SUVs and passenger vans — every ride is confirmed, tracked, and delivered with quiet
                confidence.
              </p>
            </div>

            <ul className={styles.features}>
              {features.map(({ label, Icon }) => (
                <li key={label} className={styles.feature}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.featureLabel}>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mediaCol}>
            <div className={styles.desktopMedia}>
              <div className={styles.mainShot}>
                <Image
                  src="/updatedImages/section2_img_2.jpg"
                  alt="Chauffeur meet and greet at the airport"
                  fill
                  className={styles.shotImage}
                  sizes="(max-width: 991px) 0px, 42vw"
                />
              </div>
              <div className={styles.insetShot}>
                <Image
                  src="/updatedImages/section2_img_1.jpg"
                  alt="Passenger in a premium chauffeur vehicle"
                  fill
                  className={styles.shotImage}
                  sizes="(max-width: 991px) 0px, 260px"
                />
              </div>
            </div>

            <div className={styles.mobileMedia}>
              <Image
                src="/updatedImages/section2_img_1.jpg"
                alt="Traveller greeted by chauffeur at arrivals"
                fill
                className={styles.mobileImage}
                sizes="(max-width: 991px) 100vw, 0px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
