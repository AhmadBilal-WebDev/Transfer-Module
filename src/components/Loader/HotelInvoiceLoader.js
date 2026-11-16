import React from 'react'
import BrandLogo from '@/components/BrandLogo'
import styles from './HotelInvoiceLoader.module.css'

export default function HotelInvoiceLoader() {
  return (
    <div
      className={styles.wrap}
      role="status"
      aria-live="polite"
      aria-label="Loading invoice"
    >
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logoBlock}>
            <BrandLogo className={styles.logoImg} width={150} height={36} priority />
            <span className={`${styles.pulse} ${styles.taglineBar}`} />
          </div>
          <div className={styles.contact}>
            <span className={`${styles.pulse} ${styles.pill}`} />
            <span className={`${styles.pulse} ${styles.pill}`} />
          </div>
        </div>
        <div className={styles.divider} />
      </div>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={`${styles.pulse} ${styles.eyebrow}`} />
          <span className={`${styles.pulse} ${styles.title}`} />
          <div className={styles.metaGrid}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.metaItem}>
                <span className={`${styles.pulse} ${styles.metaLabel}`} />
                <span className={`${styles.pulse} ${styles.metaValue}`} />
              </div>
            ))}
          </div>
        </div>
        <aside className={styles.sideCard}>
          <span className={`${styles.pulse} ${styles.sideLabel}`} />
          <span className={`${styles.pulse} ${styles.sideName}`} />
          <span className={`${styles.pulse} ${styles.sideLine}`} />
          <span className={`${styles.pulse} ${styles.sideLine}`} />
          <span className={`${styles.pulse} ${styles.sideLine}`} />
          <div className={styles.badgeRow}>
            <span className={styles.badge} />
            <span className={styles.badge} />
          </div>
        </aside>
      </div>

      <div className={styles.section}>
        <span className={`${styles.pulse} ${styles.sectionTitle}`} />
        <div className={styles.sectionRule} />
        <div className={styles.rows}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.row}>
              <span className={`${styles.pulse} ${styles.rowLabel}`} />
              <span className={`${styles.pulse} ${styles.rowValue}`} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={`${styles.pulse} ${styles.sectionTitle}`} />
        <div className={styles.sectionRule} />
        <div className={`${styles.pulse} ${styles.tableHead}`} />
        <div className={styles.tableRows}>
          {[0, 1].map((i) => (
            <div key={i} className={styles.tableRow}>
              <span className={`${styles.pulse} ${styles.tableCell}`} />
              <span className={`${styles.pulse} ${styles.tableCell}`} />
              <span className={`${styles.pulse} ${styles.tableCell}`} />
              <span className={`${styles.pulse} ${styles.tableCell}`} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={`${styles.pulse} ${styles.sectionTitle}`} />
        <div className={styles.sectionRule} />
        <div className={`${styles.pulse} ${styles.tableHead}`} />
        <div className={styles.tableRows}>
          <div className={styles.tableRow}>
            <span className={`${styles.pulse} ${styles.tableCell}`} />
            <span className={`${styles.pulse} ${styles.tableCell}`} />
            <span className={`${styles.pulse} ${styles.tableCell}`} />
            <span className={`${styles.pulse} ${styles.tableCell}`} />
          </div>
        </div>
      </div>

      <div className={`${styles.pulse} ${styles.footerBar}`} />
    </div>
  )
}
