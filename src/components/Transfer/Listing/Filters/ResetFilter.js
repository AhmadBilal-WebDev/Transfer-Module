'use client'
import React from 'react'
import { MdRefresh } from 'react-icons/md'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function ResetFilter({ setActiveDrawer, variant = 'sidebar' }) {
  const { resetFilters, setCurrentPage, totalTransfers } = useTransferList()

  const handleReset = () => {
    resetFilters()
    setCurrentPage?.(1)
    setActiveDrawer?.(null)
  }

  if (variant === 'apply') {
    return (
      <div className={styles.sidebarFooter}>
        <button type="button" onClick={handleReset} className={styles.applyBtn}>
          <MdRefresh className={styles.applyBtnIcon} aria-hidden="true" />
          Reset all filters
        </button>
        <p className={styles.fleetNote}>
          Displaying {totalTransfers} verified fleet vehicle{totalTransfers !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  return (
    <button type="button" onClick={handleReset} className={styles.resetLink}>
      Reset All Filters
    </button>
  )
}
