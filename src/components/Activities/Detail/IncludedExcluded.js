import React from 'react'
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5'
import styles from './ActivityDetail.module.css'

function stripTags(html) {
    return String(html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function extractItems(html) {
    if (!html || !String(html).trim()) return [];

    const source = String(html);
    const items = [];

    const liMatches = [...source.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    if (liMatches.length) {
        liMatches.forEach((match) => {
            const text = stripTags(match[1]).replace(/^[-–—•]\s*/, '').trim();
            if (text) items.push(text);
        });
        if (items.length) return items;
    }

    const pMatches = [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    if (pMatches.length) {
        pMatches.forEach((match) => {
            const text = stripTags(match[1]).replace(/^[-–—•]\s*/, '').trim();
            if (text) items.push(text);
        });
        if (items.length) return items;
    }

    const divMatches = [...source.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)];
    if (divMatches.length) {
        divMatches.forEach((match) => {
            const text = stripTags(match[1]).replace(/^[-–—•]\s*/, '').trim();
            if (text) items.push(text);
        });
        if (items.length) return items;
    }

    return source
        .split(/<br\s*\/?>|\n+/gi)
        .map((part) => stripTags(part).replace(/^[-–—•]\s*/, '').trim())
        .filter(Boolean);
}

export default function IncludedExcluded({ included, excluded }) {
    const includedItems = extractItems(included);
    const excludedItems = extractItems(excluded);

    if (!includedItems.length && !excludedItems.length) return null;

    return (
        <section id="includeexclude" className={styles.includeSection}>
            <h5 className={styles.includeSectionTitle}>Inclusions &amp; Exclusions</h5>
            <div className={styles.includeGrid}>
                {includedItems.length > 0 && (
                    <div className={`${styles.includeCard} ${styles.includeCardWarm}`}>
                        <div className={styles.includeHeadSerif}>
                            <IoCheckmarkCircle className={styles.includeHeadIcon} aria-hidden="true" />
                            <em>What&apos;s Included</em>
                        </div>
                        <ul className={styles.includeList}>
                            {includedItems.map((item, index) => (
                                <li key={`included-${index}`} className={styles.includeItem}>
                                    <IoCheckmarkCircle className={styles.includeItemIcon} aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {excludedItems.length > 0 && (
                    <div className={`${styles.excludeCard} ${styles.excludeCardPlain}`}>
                        <div className={styles.excludeHeadSerif}>
                            <IoCloseCircle className={styles.excludeHeadIcon} aria-hidden="true" />
                            <em>Not Included</em>
                        </div>
                        <ul className={styles.excludeList}>
                            {excludedItems.map((item, index) => (
                                <li key={`excluded-${index}`} className={styles.excludeItem}>
                                    <IoCloseCircle className={styles.excludeItemIcon} aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    )
}
