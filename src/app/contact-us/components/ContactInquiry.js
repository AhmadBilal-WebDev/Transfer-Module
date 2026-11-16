import { IoFlashOutline, IoShieldCheckmarkOutline, IoLocationOutline } from 'react-icons/io5';
import { MdFlight } from 'react-icons/md';
import { playfair, inter } from '@/lib/fonts';
import Form from './Form';
import styles from './ContactInquiry.module.css';

export default function ContactInquiry() {
  return (
    <section className={`${styles.section} ${inter.className}`} aria-labelledby="contact-inquiry-title">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div className={styles.infoCol}>
            <p className={styles.eyebrowDesktop}>Direct Assistance</p>
            <p className={styles.eyebrowMobile}>
              <span className={styles.protocolIcon} aria-hidden="true">⚙</span>
              Dispatch Protocol
            </p>

            <h2 id="contact-inquiry-title" className={`${styles.title} ${playfair.className}`}>
              Send us a message
            </h2>

            <p className={styles.leadDesktop}>
              Tell us how we can assist your journey. Our senior transfer specialists and fleet
              controllers monitor incoming requests in real-time.
            </p>
            <p className={styles.leadMobile}>
              Our central flight-sync coordinators track domestic and transatlantic schedules
              continuously.
            </p>

            <div className={styles.responsePill}>
              <IoFlashOutline aria-hidden="true" />
              Average response time: 8 minutes
            </div>

            <div className={styles.mobileStats}>
              <div className={styles.statCard}>
                <IoFlashOutline aria-hidden="true" />
                <div>
                  <p className={styles.statLabel}>Latency</p>
                  <p className={styles.statValue}>8 min</p>
                  <p className={styles.statSub}>Average response</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <IoShieldCheckmarkOutline aria-hidden="true" />
                <div>
                  <p className={styles.statLabel}>Discretion</p>
                  <p className={styles.statValue}>100%</p>
                  <p className={styles.statSub}>Private manifest</p>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoBlock}>
                <p className={styles.infoHeadingDesktop}>Global Chauffeur Dispatch</p>
                <p className={styles.infoHeadingMobile}>
                  <IoLocationOutline aria-hidden="true" />
                  Central Operations Desk
                </p>
                <p className={styles.infoText}>
                  693a Stratford Road, Birmingham B11 4DX, United Kingdom
                </p>
              </div>
              <div className={styles.infoBlock}>
                <p className={styles.infoHeadingDesktop}>Operating Hours</p>
                <p className={styles.infoText}>
                  <MdFlight className={styles.inlineIcon} aria-hidden="true" />
                  Live Operations: 24/7 Synchronized Real-time Flight Monitoring
                </p>
              </div>
              <div className={`${styles.infoBlock} ${styles.hubsDesktop}`}>
                <p className={styles.infoHeadingDesktop}>Hub Availability</p>
                <p className={styles.infoText}>
                  United Kingdom · Saudi Arabia · United Arab Emirates · Western Europe
                </p>
              </div>
            </div>

            <div className={styles.trustRow}>
              <div className={styles.trustCard}>
                <IoShieldCheckmarkOutline aria-hidden="true" />
                <div>
                  <p className={styles.trustTitle}>Discreet &amp; Secure</p>
                  <p className={styles.trustText}>Complete NDA adherence</p>
                </div>
              </div>
              <div className={styles.trustCard}>
                <MdFlight aria-hidden="true" />
                <div>
                  <p className={styles.trustTitle}>Flight Monitoring</p>
                  <p className={styles.trustText}>No delay surcharge</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCol}>
            <Form />
          </div>
        </div>
      </div>
    </section>
  );
}
