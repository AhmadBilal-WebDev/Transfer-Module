'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function PassengerCapacityFilter() {
  const { passengerCapacity, setPassengerCapacity, setCurrentPage } = useTransferList()

  const capacityRanges = [
    { value: '1-4', label: '1–4 Pax' },
    { value: '5-7', label: '5–7 Pax' },
    { value: '8-12', label: '8–12 Pax' },
    { value: '12+', label: '12+ Pax' },
  ]

  const handleToggle = (value) => {
    if (passengerCapacity.includes(value)) {
      setPassengerCapacity(passengerCapacity.filter((c) => c !== value))
    } else {
      setPassengerCapacity([...passengerCapacity, value])
    }
    setCurrentPage?.(1)
  }

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Passenger Capacity</p>
      <div className={styles.capacityGrid}>
        {capacityRanges.map((range) => {
          const active = passengerCapacity.includes(range.value)
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
