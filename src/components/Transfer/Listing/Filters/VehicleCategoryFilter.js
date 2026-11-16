'use client'
import React from 'react'
import { Checkbox } from '@mantine/core'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function VehicleCategoryFilter() {
  const {
    vehicleCategory,
    setVehicleCategory,
    availableCategories,
    setCurrentPage,
    allTransferCount,
  } = useTransferList()

  const handleCheckboxChange = (value) => {
    if (vehicleCategory.includes(value)) {
      setVehicleCategory(vehicleCategory.filter((c) => c !== value))
    } else {
      setVehicleCategory([...vehicleCategory, value])
    }
    setCurrentPage?.(1)
  }

  const clearAll = () => {
    setVehicleCategory([])
    setCurrentPage?.(1)
  }

  if (!availableCategories?.length) return null

  const allActive = vehicleCategory.length === 0

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Vehicle Category</p>

      {/* Desktop: checkbox list */}
      <div className={`${styles.filterOptionList} ${styles.desktopFilterOnly}`}>
        {availableCategories.map((category, index) => (
          <div key={index} className={styles.filterOptionRow}>
            <Checkbox
              checked={vehicleCategory.includes(category)}
              onChange={() => handleCheckboxChange(category)}
              className={styles.filterCheckbox}
              color="#014B95"
              icon={() => null}
              label={category?.charAt(0).toUpperCase() + category?.slice(1)}
            />
          </div>
        ))}
      </div>

      {/* Mobile: horizontal chips */}
      <div className={styles.mobileChipScroll} role="list">
        <button
          type="button"
          role="listitem"
          className={`${styles.mobileChip} ${allActive ? styles.mobileChipActive : ''}`}
          onClick={clearAll}
          aria-pressed={allActive}
        >
          All{allTransferCount > 0 ? ` (${allTransferCount})` : ''}
        </button>
        {availableCategories.map((category) => {
          const active = vehicleCategory.includes(category)
          const label = category?.charAt(0).toUpperCase() + category?.slice(1)
          return (
            <button
              key={category}
              type="button"
              role="listitem"
              className={`${styles.mobileChip} ${active ? styles.mobileChipActive : ''}`}
              onClick={() => handleCheckboxChange(category)}
              aria-pressed={active}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
