'use client'

import React from 'react'
import { FaPlane } from 'react-icons/fa'
import { FiGlobe, FiClock } from 'react-icons/fi'
import styles from './FlightListingSkeletonLoader.module.css'

function FilterSidebarSkeleton() {
    return (
        <aside className={styles.filterBox} aria-hidden="true">
            <div className={styles.filterHeader}>
                <span className={`${styles.skel} ${styles.skelFilterTitle}`} />
                <span className={`${styles.skel} ${styles.skelFilterIcon}`} />
            </div>
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.filterSection}>
                    <span className={`${styles.skel} ${styles.skelSectionLabel}`} />
                    <span className={`${styles.skel} ${styles.skelSectionBlock}`} />
                </div>
            ))}
        </aside>
    )
}

function FlightCardSkeleton() {
    return (
        <article className={styles.flightCardSkel} aria-hidden="true">
            <div className={styles.flightCardTop}>
                <span className={`${styles.skel} ${styles.skelAirline}`} />
                <span className={`${styles.skel} ${styles.skelPrice}`} />
            </div>
            <div className={styles.flightCardMid}>
                <div className={styles.flightLeg}>
                    <span className={`${styles.skel} ${styles.skelTime}`} />
                    <span className={`${styles.skel} ${styles.skelCode}`} />
                </div>
                <div className={styles.flightPath}>
                    <span className={`${styles.skel} ${styles.skelPathLine}`} />
                </div>
                <div className={styles.flightLeg}>
                    <span className={`${styles.skel} ${styles.skelTime}`} />
                    <span className={`${styles.skel} ${styles.skelCode}`} />
                </div>
            </div>
            <div className={styles.flightCardBot}>
                <span className={`${styles.skel} ${styles.skelMeta}`} />
                <span className={`${styles.skel} ${styles.skelCta}`} />
            </div>
        </article>
    )
}

function SearchStatusCard() {
    return (
        <div className={styles.searchCard}>
            <div className={styles.visual} aria-hidden="true">
                <div className={styles.ring} />
                <div className={styles.ringSoft} />
                <div className={styles.iconCore}>
                    <FaPlane className={styles.coreIcon} />
                </div>
                <span className={`${styles.floatBadge} ${styles.floatA}`}>
                    <FiGlobe />
                </span>
                <span className={`${styles.floatBadge} ${styles.floatB}`}>
                    <FiClock />
                </span>
            </div>

            <p className={styles.eyebrow}>Royalane Flights</p>
            <h3 className={styles.searchTitle}>Finding your perfect route</h3>
            <p className={styles.searchText}>
                Searching live fares across 500+ airlines…
            </p>

            <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressBar} />
            </div>
        </div>
    )
}

export default function FlightListingFullLoader() {
    return (
        <div className={styles.wrapper} aria-busy="true" aria-label="Searching flights">
            <div className={`container mb-5 ${styles.resultsArea}`}>
                <div className={styles.resultsHeader} aria-hidden="true">
                    <span className={`${styles.skel} ${styles.skelResultsTitle}`} />
                    <span className={`${styles.skel} ${styles.skelResultsMeta}`} />
                </div>

                <div className={styles.mobilePills} aria-hidden="true">
                    <span className={`${styles.skel} ${styles.filterPillSkel}`} />
                </div>

                <div className="row">
                    <div className="col-lg-3 d-none d-lg-block">
                        <FilterSidebarSkeleton />
                    </div>

                    <div className="col-lg-9 col-12">
                        <div className={styles.searchCardWrap}>
                            <SearchStatusCard />
                        </div>
                        <div className={styles.cardsStack} aria-hidden="true">
                            <FlightCardSkeleton />
                            <FlightCardSkeleton />
                            <FlightCardSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
