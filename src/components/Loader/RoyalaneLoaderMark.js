import React from 'react'
import BrandLogo from '@/components/BrandLogo'

/** Shared Royalane loader markup (server-safe, no hooks). */
export default function RoyalaneLoaderMark({ exiting = false }) {
    return (
        <div
            className={`royalane-main-loader${exiting ? ' royalane-main-loader--exit' : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Loading Royalane"
        >
            <div className="royalane-main-loader__inner">
                <div className="royalane-main-loader__logo-wrap">
                    <BrandLogo
                        className="royalane-main-loader__logo"
                        width={280}
                        height={68}
                        priority
                        alt="Royalane"
                    />
                </div>

                <div className="royalane-main-loader__track" aria-hidden="true">
                    <span className="royalane-main-loader__bar" />
                </div>
            </div>
        </div>
    )
}
