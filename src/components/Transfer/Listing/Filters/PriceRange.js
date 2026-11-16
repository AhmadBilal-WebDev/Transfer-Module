'use client'
import React, { useEffect, useState } from 'react'
import { RangeSlider } from '@mantine/core'
import { useTransferList } from '../TransferListingContext'
import { useCurrency } from '@/util/currency'
import styles from '../TransferFilters.module.css'

function clampRange(values, min, max) {
  const low = Math.min(Math.max(Number(values?.[0]) || min, min), max)
  const high = Math.min(Math.max(Number(values?.[1]) || max, min), max)
  return [Math.min(low, high), Math.max(low, high)]
}

export default function PriceRange() {
  const {
    minPrice,
    maxPrice,
    priceRange,
    resetPrice,
    setPriceRange,
    setCurrentPage,
  } = useTransferList()
  const { currency } = useCurrency()

  const safeMin = Number(minPrice) || 0
  const safeMax = Math.max(Number(maxPrice) || 0, safeMin + 0.01)
  const initialRange = clampRange(
    Array.isArray(priceRange) && priceRange[1] > 0 ? priceRange : [safeMin, safeMax],
    safeMin,
    safeMax,
  )

  const [selectedValues, setSelectedValues] = useState(initialRange)

  // Keep local slider in sync with applied context range (incl. explicit reset),
  // not with absolute min/max bounds — otherwise reopening the mobile drawer
  // remounts this component and wipes the user's selection.
  useEffect(() => {
    if (!(maxPrice > 0)) return
    const next = clampRange(
      Array.isArray(priceRange) && priceRange[1] > 0 ? priceRange : [minPrice, maxPrice],
      Number(minPrice) || 0,
      Math.max(Number(maxPrice) || 0, (Number(minPrice) || 0) + 0.01),
    )
    setSelectedValues(next)
  }, [priceRange, minPrice, maxPrice, resetPrice])

  const handleChange = (values) => {
    const next = clampRange(values, safeMin, safeMax)
    setSelectedValues(next)
    setPriceRange(next)
    setCurrentPage?.(1)
  }

  const formatPrice = (value) => {
    const amount = Number(value) || 0
    const label = amount % 1 === 0 ? amount.toLocaleString() : amount.toFixed(2)
    return `${currency || ''} ${label}`.trim()
  }

  if (!(maxPrice > 0)) return null

  const safeValues = clampRange(selectedValues, safeMin, safeMax)

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Budget (Per Transfer)</p>
      <p className={styles.priceValue}>
        {formatPrice(safeValues[0])} – {formatPrice(safeValues[1])}
      </p>
      <RangeSlider
        className={styles.priceSlider}
        min={safeMin}
        max={safeMax}
        value={safeValues}
        onChange={handleChange}
        minRange={0.1}
        step={0.01}
        label={null}
        color="#014B95"
      />
      <div className={styles.priceMeta}>
        <span className={styles.priceMin}>Min: {formatPrice(safeMin)}</span>
        <span className={styles.priceMax}>Max: {formatPrice(safeMax)}</span>
      </div>
    </div>
  )
}
