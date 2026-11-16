import React from 'react'
import BrandLogo from '@/components/BrandLogo'
import styles from './HotelInvoiceLoader.module.css'

export default function HotelVoucherLoader() {
  return (
    <div
      className={styles.wrap}
      role="status"
      aria-live="polite"
      aria-label="Loading voucher"
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
          <span className={`${styles.pulse} ${styles.sideLine}`} />
          <span className={`${styles.pulse} ${styles.sideLine}`} style={{ width: '70%' }} />
          <div className={styles.badgeRow}>
            <span className={styles.badge} />
            <span className={styles.badge} />
          </div>
        </div>
        <div className={styles.qrCard}>
          <span className={`${styles.pulse} ${styles.qrBox}`} />
          <span className={`${styles.pulse} ${styles.qrCaption}`} />
        </div>
      </div>

      <div className={styles.strip}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.stripCell}>
            <span className={`${styles.pulse} ${styles.stripLabel}`} />
            <span className={`${styles.pulse} ${styles.stripValue}`} />
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <span className={`${styles.pulse} ${styles.sectionTitle}`} />
        <div className={styles.sectionRule} />
        <div className={`${styles.pulse} ${styles.routeCard}`} />
        <div className={styles.chips}>
          <span className={`${styles.pulse} ${styles.chip}`} />
          <span className={`${styles.pulse} ${styles.chip}`} />
          <span className={`${styles.pulse} ${styles.chip}`} />
          <span className={`${styles.pulse} ${styles.chip}`} />
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

      <div className={`${styles.pulse} ${styles.footerBar}`} />
    </div>
  )
}
