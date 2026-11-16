import React from "react";
import styles from "./HotelDetailLoader.module.css";

function Skel({ className }) {
  return <span className={`${styles.skel} ${className || ""}`} aria-hidden="true" />;
}

export default function HotelDetailLoader() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-label="Loading hotel details">
      <div className={styles.statusCard}>
        <div className={styles.spinner} />
        <div className={styles.statusText}>
          <p className={styles.statusTitle}>Loading hotel details</p>
          <p className={styles.statusSub}>Preparing rooms, amenities, and property info…</p>
        </div>
      </div>

      <Skel className={styles.returnSkel} />

      <div className={styles.gallery}>
        <Skel className={styles.galleryMain} />
        <div className={styles.gallerySide}>
          <Skel className={styles.galleryThumb} />
          <Skel className={styles.galleryThumb} />
          <Skel className={styles.galleryThumb} />
          <Skel className={styles.galleryThumb} />
        </div>
      </div>

      <div className={styles.card}>
        <Skel className={styles.titleSkel} />
        <Skel className={styles.locSkel} />
        <Skel className={`${styles.line} ${styles.lineWide}`} />
        <Skel className={`${styles.line} ${styles.lineMed}`} />
        <Skel className={`${styles.line} ${styles.lineShort}`} />

        <div style={{ marginTop: "1.15rem" }}>
          <Skel className={styles.sectionTitle} />
          <div className={styles.amenityRow}>
            <Skel className={styles.amenityPill} />
            <Skel className={styles.amenityPill} />
            <Skel className={styles.amenityPill} />
            <Skel className={styles.amenityPill} />
            <Skel className={styles.amenityPill} />
            <Skel className={styles.amenityPill} />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <Skel className={styles.sectionTitle} />
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.roomCard}>
            <Skel className={styles.roomMedia} />
            <div className={styles.roomBody}>
              <Skel className={styles.roomTitle} />
              <Skel className={styles.roomMeta} />
              <Skel className={`${styles.line} ${styles.lineMed}`} />
              <div className={styles.roomFooter}>
                <Skel className={styles.roomPrice} />
                <Skel className={styles.roomCta} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <Skel className={styles.sectionTitle} />
        <Skel className={`${styles.line} ${styles.lineWide}`} />
        <Skel className={styles.mapSkel} />
      </div>

      <span className="visually-hidden">Loading hotel details…</span>
    </div>
  );
}
