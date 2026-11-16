'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function LuggageCapacityFilter() {
  const { luggageCapacity, setLuggageCapacity, setCurrentPage } = useTransferList()

  const capacityRanges = [
    { value: '1-2', label: '1–2 Bags' },
    { value: '3-4', label: '3–4 Bags' },
    { value: '5-6', label: '5–6 Bags' },
    { value: '6+', label: '6+ Bags' },
  ]

  const handleToggle = (value) => {
    if (luggageCapacity.includes(value)) {
      setLuggageCapacity(luggageCapacity.filter((c) => c !== value))
    } else {
      setLuggageCapacity([...luggageCapacity, value])
    }
    setCurrentPage?.(1)
  }

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Luggage Capacity</p>
      <div className={styles.capacityGrid}>
        {capacityRanges.map((range) => {
          const active = luggageCapacity.includes(range.value)
          return (
            <button
              key={range.value}
              type="button"
              className={`${styles.capacityTile} ${active ? styles.capacityTileActive : ''}`}
              onClick={() => handleToggle(range.value)}
              aria-pressed={active}
            >
              <span
                className={`${styles.capacityCheck} ${active ? styles.capacityCheckActive : ''}`}
                aria-hidden="true"
              />
              {range.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
