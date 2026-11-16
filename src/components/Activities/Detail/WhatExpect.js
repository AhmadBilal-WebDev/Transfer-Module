'use client'
import React from 'react'
import styles from './ActivityDetail.module.css'
import { htmlToPlainText } from '@/util/htmlPlainText'

export default function WhatExpect({ expectData = [] }) {
    if (!expectData?.length) return null;

    return (
        <section id="expectation" className={styles.expectPanel}>
            <h5 className={styles.panelTitle}>What to Expect</h5>
            <div className={styles.expectCards}>
                {expectData.map((item, index) => (
                    <article className={styles.expectCard} key={index}>
                        <div className={styles.expectNum} aria-hidden="true">
                            {index + 1}
                        </div>
                        <div className={styles.expectCardBody}>
                            <h6 className={styles.expectCardTitle}>{item.title}</h6>
                            {item.content ? (
                                <p className={styles.expectCardText}>
                                    {htmlToPlainText(item.content)}
                                </p>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
