'use client'

import React, { useEffect, useState } from 'react'
import { FiShield } from 'react-icons/fi'
import styles from './search.module.css'
import { inter, playfair } from '@/lib/fonts'

export default function HeroIntro() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className={`${styles.heroIntro} ${inter.className} ${visible ? styles.heroIntroVisible : ''}`}>
      <p className={styles.heroBadge}>
        <FiShield className={styles.heroBadgeIcon} aria-hidden="true" />
        <span>Fixed prices · Meet &amp; greet included</span>
      </p>

      <h1 className={`${styles.heroTitle} ${playfair.className}`}>
        <span className={styles.heroTitleLine}>Airport transfers,</span>
        <em className={styles.heroTitleEm}>done right.</em>
      </h1>

      <p className={styles.heroSubtitle}>
        Private, fixed-price rides from arrivals to your door, with live
        flight tracking, free waiting time and 24/7 dispatch.
      </p>
    </div>
  )
}
