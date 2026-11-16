'use client'
import React from 'react'
import styles from './PackageDetailIteniry.module.css'

function formatDayLabel(index) {
  return `Day ${String(index + 1).padStart(2, '0')}`
}

function buildHeading(itenr) {
  const parts = [itenr?.title, itenr?.description].filter(Boolean)
  return parts.join(' — ')
}

function isHtml(value) {
  return /<[a-z][\s\S]*>/i.test(String(value || ''))
}

export default function PackageDetailIteniry({ itinrList }) {
  if (!itinrList?.length) return null

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>Day-by-Day Itinerary</p>
      <h2 className={styles.title}>Your immersive journey</h2>

      <ol className={styles.timeline}>
        {itinrList.map((itenr, index) => {
          const content = itenr?.content
          return (
            <li key={itenr?.id || index} className={styles.item}>
              <span className={styles.marker} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <article className={styles.card}>
                <h3 className={styles.cardTitle}>
                  {formatDayLabel(index)} — {buildHeading(itenr)}
                </h3>
                {content ? (
                  isHtml(content) ? (
                    <div
                      className={styles.cardBody}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className={styles.cardBody}>{content}</p>
                  )
                ) : null}
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
