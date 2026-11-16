import { IoNavigateOutline } from 'react-icons/io5';
import { MdHub } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import Map from './Map';
import styles from './OperationsCenter.module.css';

const MAPS_URL =
  'https://maps.google.com/?q=693a+Stratford+Road+Birmingham+B11+4DX+UK';
const CALL_URL = 'tel:+441214343738';

export default function OperationsCenter() {
  return (
    <section
      className={`${styles.section} ${inter.className}`}
      aria-labelledby="operations-center-title"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.eyebrow}>UK Operations Center</p>
            <h2 id="operations-center-title" className={`${styles.title} ${playfair.className}`}>
              Precision Chauffeur Dispatch
            </h2>
            <p className={styles.leadMobile}>
              Strategically stationed along the central UK transit axis for rapid response to BHX,
              LHR, and Private FBO aprons.
            </p>
          </div>
          <p className={styles.leadDesktop}>
            Stratford Road Executive Headquarters manages real-time telemetry, chauffeur scheduling,
            and tarmac coordination for Birmingham (BHX), London Heathrow (LHR), and private FBOs.
          </p>
        </header>

        <div className={styles.mapStage}>
          <div className={styles.mapWrap}>
            <Map className={styles.mapFill} />
            <div className={styles.mapDim} aria-hidden="true" />
          </div>

          <div className={styles.coordBadge}>
            <span className={styles.coordDot} aria-hidden="true" />
            52.4485° N, 1.8596° W
            <span className={styles.coordDesktop}> · Dispatch Active</span>
          </div>

          <div className={styles.liveBadge}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live Radar
          </div>

          <article className={styles.infoCardDesktop}>
            <p className={styles.openLabel}>
              <span className={styles.openDot} aria-hidden="true" />
              Open 24 Hours · Live Center
            </p>
            <h3 className={`${styles.cardTitle} ${playfair.className}`}>
              Stratford Road Operations
            </h3>
            <p className={styles.address}>693a Stratford Road, Birmingham B11 4DX, UK</p>
            <div className={styles.cardActions}>
              <a href={MAPS_URL} target="_blank" rel="noreferrer">
                Open in Maps
                <span aria-hidden="true"> ↗</span>
              </a>
              <a href={CALL_URL}>Direct Desk Call</a>
            </div>
          </article>

          <article className={styles.infoCardMobile}>
            <span className={styles.hubIcon} aria-hidden="true">
              <MdHub />
            </span>
            <div className={styles.mobileCopy}>
              <h3 className={styles.mobileTitle}>Stratford Road Operations</h3>
              <p className={styles.mobileSub}>Open 24 Hours • Rapid Dispatch</p>
            </div>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className={styles.navBtn}
              aria-label="Open in Maps"
            >
              <IoNavigateOutline />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
