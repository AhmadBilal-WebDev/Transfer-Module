'use client'

import React, { useEffect, useState } from 'react'
import RoyalaneLoaderMark from '@/components/Loader/RoyalaneLoaderMark'

/**
 * Shows Royalane splash on hard refresh / first paint.
 * Root layout persists across client navigations, so this only remounts on full reloads.
 */
export default function RoyalaneBootLoader() {
    const [visible, setVisible] = useState(true)
    const [exiting, setExiting] = useState(false)

    useEffect(() => {
        const MIN_MS = 850
        const start = Date.now()
        let cancelled = false
        let finished = false
        let exitTimer
        let hideTimer
        let safetyTimer

        const beginExit = () => {
            if (cancelled || finished) return
            finished = true
            const wait = Math.max(0, MIN_MS - (Date.now() - start))
            exitTimer = setTimeout(() => {
                if (cancelled) return
                setExiting(true)
                hideTimer = setTimeout(() => {
                    if (!cancelled) setVisible(false)
                }, 320)
            }, wait)
        }

        if (document.readyState === 'complete') {
            beginExit()
        } else {
            window.addEventListener('load', beginExit)
            safetyTimer = setTimeout(beginExit, 2000)
        }

        return () => {
            cancelled = true
            window.removeEventListener('load', beginExit)
            clearTimeout(exitTimer)
            clearTimeout(hideTimer)
            clearTimeout(safetyTimer)
        }
    }, [])

    if (!visible) return null
    return <RoyalaneLoaderMark exiting={exiting} />
}
