import React from 'react'
import styles from './ActivityDetailLoader.module.css'

export default function ActivityDetailLoader() {
  return (
    <div className={styles.page} role="status" aria-live="polite" aria-label="Loading activity details">
      <div className="container mt-4">
        <div className={styles.returnLink}>
          <span className={`${styles.skel} ${styles.skelReturn}`} />
        </div>

        {/* Gallery mosaic */}
        <div className={styles.gallery}>
          <div className={`${styles.skel} ${styles.galleryMain}`} />
          <div className={styles.gallerySide}>
            <div className={`${styles.skel} ${styles.galleryThumb}`} />
            <div className={`${styles.skel} ${styles.galleryThumb}`} />
            <div className={`${styles.skel} ${styles.galleryThumb}`} />
            <div className={`${styles.skel} ${styles.galleryThumb}`} />
          </div>
        </div>

        {/* Title / meta header */}
        <div className={styles.headerCard}>
          <div className={`${styles.skel} ${styles.skelBadge}`} />
          <div className={`${styles.skel} ${styles.skelTitle}`} />
          <div className={`${styles.skel} ${styles.skelTitleShort}`} />
          <div className={styles.metaRow}>
            <div className={`${styles.skel} ${styles.skelMeta}`} />
            <div className={`${styles.skel} ${styles.skelMeta}`} />
            <div className={`${styles.skel} ${styles.skelMeta}`} />
            <div className={`${styles.skel} ${styles.skelMetaSm}`} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            {/* Tabs */}
            <div className={styles.tabs}>
              <div className={`${styles.skel} ${styles.skelTab} ${styles.skelTabActive}`} />
              <div className={`${styles.skel} ${styles.skelTab}`} />
              <div className={`${styles.skel} ${styles.skelTab}`} />
            </div>

            <div className={`${styles.skel} ${styles.skelSectionTitle}`} />
            <div className={`${styles.skel} ${styles.skelLine}`} />
            <div className={`${styles.skel} ${styles.skelLine}`} />
            <div className={`${styles.skel} ${styles.skelLineWide}`} />
            <div className={`${styles.skel} ${styles.skelLineShort}`} />

            {/* Highlights */}
            <div className={styles.highlightsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.highlightCard}>
                  <div className={`${styles.skel} ${styles.skelIcon}`} />
                  <div className={`${styles.skel} ${styles.skelHighlightTitle}`} />
                  <div className={`${styles.skel} ${styles.skelLine}`} />
                  <div className={`${styles.skel} ${styles.skelLineShort}`} />
                </div>
              ))}
            </div>

            {/* Meeting */}
            <div className={styles.meetingCard}>
              <div className={`${styles.skel} ${styles.skelSectionTitle}`} />
              <div className={styles.meetingInner}>
                <div className={`${styles.skel} ${styles.skelLine}`} />
                <div className={`${styles.skel} ${styles.skelLineWide}`} />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <aside className={styles.sidebarCard}>
              <div className={styles.priceRow}>
                <div>
                  <div className={`${styles.skel} ${styles.skelPriceLabel}`} />
                  <div className={`${styles.skel} ${styles.skelPrice}`} />
                </div>
                <div className={`${styles.skel} ${styles.skelRefund}`} />
              </div>
              <div className={`${styles.skel} ${styles.skelField}`} />
              <div className={`${styles.skel} ${styles.skelField}`} />
              <div className={`${styles.skel} ${styles.skelField}`} />
              <div className={`${styles.skel} ${styles.skelAlert}`} />
              <div className={styles.summaryLines}>
                <div className={`${styles.skel} ${styles.skelSummary}`} />
                <div className={`${styles.skel} ${styles.skelSummary}`} />
              </div>
              <div className={`${styles.skel} ${styles.skelBookBtn}`} />
              <div className={styles.featureList}>
                <div className={`${styles.skel} ${styles.skelFeature}`} />
                <div className={`${styles.skel} ${styles.skelFeature}`} />
                <div className={`${styles.skel} ${styles.skelFeature}`} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
