import { playfair } from "@/lib/fonts";
import styles from "../ContactUs.module.css";
import Map from "./Map";

export default function LocationSection() {
  return (
    <section className={styles.mapSection} aria-label="Our location">
      <header className={styles.mapHeading}>
        <span className={styles.mapTag}>Find us</span>
        <h2 className={`${styles.mapTitle} ${playfair.className}`}>Our location</h2>
      </header>

      <div className={styles.mapWrapper}>
        <Map />

        <div className={styles.mapOverlay}>
          <span className={styles.mapOverlayTag}>UK office</span>
          <h4 className={playfair.className}>Royalane · Birmingham</h4>
          <p>693a Stratford Road, Birmingham B11 4DX, UK</p>
        </div>

        <a
          className={styles.mapDirectionsBtn}
          href="https://maps.google.com/?q=693a+Stratford+Road+Birmingham+B11+4DX+UK"
          target="_blank"
          rel="noreferrer"
        >
          Get directions
        </a>
      </div>

      <div className={styles.trustBar}>
        <div className={styles.trustBarLeft}>
          <span className={styles.trustBarTag}>Handled by travel experts</span>
          <h3 className={playfair.className}>Trusted by 50,000+ travelers.</h3>
        </div>
        <div className={styles.trustBarStats}>
          <div className={styles.trustBarStat}>
            <span className={`${styles.trustBarStatNum} ${playfair.className}`}>4.9 / 5</span>
            <span className={styles.trustBarStatLabel}>Traveler satisfaction</span>
          </div>
          <div className={styles.trustBarStat}>
            <span className={`${styles.trustBarStatNum} ${playfair.className}`}>24 / 7</span>
            <span className={styles.trustBarStatLabel}>Support while you travel</span>
          </div>
        </div>
      </div>
    </section>
  );
}
