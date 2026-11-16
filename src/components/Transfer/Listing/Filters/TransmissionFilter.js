'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function TransmissionFilter() {
  const {
    transmissionType,
    setTransmissionType,
    availableTransmissions,
    setCurrentPage,
  } = useTransferList()

  const options = (availableTransmissions || []).filter(
    (value) => typeof value === 'string' && value.trim().length > 0
  )

  if (!options.length) return null

  const handleToggle = (value) => {
    if (transmissionType.includes(value)) {
      setTransmissionType(transmissionType.filter((t) => t !== value))
    } else {
      setTransmissionType([...transmissionType, value])
    }
    setCurrentPage?.(1)
  }

  const clearAll = () => {
    setTransmissionType([])
    setCurrentPage?.(1)
  }

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Transmission</p>
      <div className={styles.pillGroup}>
        <button
          type="button"
          className={`${styles.pill} ${transmissionType.length === 0 ? styles.pillActive : ''}`}
          onClick={clearAll}
        >
          All Types
        </button>
        {options.map((transmission) => {
          const active = transmissionType.includes(transmission)
          return (
            <button
              key={transmission}
              type="button"
              className={`${styles.pill} ${active ? styles.pillActive : ''}`}
              onClick={() => handleToggle(transmission)}
            >
              {transmission}
            </button>
          )
        })}
      </div>
    </div>
  )
}
