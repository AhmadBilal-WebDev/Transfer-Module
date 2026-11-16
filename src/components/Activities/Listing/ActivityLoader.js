'use client'
import React from 'react'
import { FiCamera, FiMapPin, FiStar } from 'react-icons/fi'
import styles from './ActivityLoader.module.css'

/**
 * Royalane-themed fullscreen activity listing loader
 * Cream surface · red accents · serif headline
 */
const ActivityLoader = () => {
  return (
    <div className={styles.loaderContainer} role="status" aria-live="polite" aria-label="Loading activities">
      <div className={styles.loaderCard}>
        <div className={styles.visual}>
          <div className={styles.ring} aria-hidden="true" />
          <div className={styles.ringSoft} aria-hidden="true" />

          <div className={styles.iconCore}>
            <FiCamera className={styles.coreIcon} aria-hidden="true" />
          </div>

          <span className={`${styles.floatBadge} ${styles.floatBadgeA}`}>
            <FiMapPin aria-hidden="true" />
          </span>
          <span className={`${styles.floatBadge} ${styles.floatBadgeB}`}>
            <FiStar aria-hidden="true" />
          </span>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Royalane Experiences</p>
          <h3 className={styles.mainTitle}>Finding experiences for you</h3>
          <p className={styles.subTitle}>
            Curating the best activities from local experts…
          </p>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>
      </div>
    </div>
  )
}

export default ActivityLoader
