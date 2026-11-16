'use client'
import React from 'react'
import Image from 'next/image'
import styles from './herosection.module.css'

export default function HeroSection() {
    return (
        <div className={styles.heroSwiperWrapper}>
            <div className={styles.heroSlide}>
                <Image
                    src="/updatedImages/nextTrip.jpg"
                    alt="Airport private transfer"
                    fill
                    priority
                    sizes="100vw"
                    style={{ objectFit: 'cover', objectPosition: 'center center' }}
                    quality={90}
                />
                <div className={styles.heroImageShade} aria-hidden="true" />
            </div>
        </div>
    )
}
