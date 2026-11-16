'use client'
import React from 'react'
import { FaSort } from 'react-icons/fa'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function SortOption() {
  const { sort, setSort, setCurrentPage } = useTransferList()

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Sort By</p>
      <div className={styles.filterSelectWrap}>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setCurrentPage?.(1)
          }}
          className={styles.filterSelect}
          aria-label="Sort by"
        >
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Vehicle Name: A-Z</option>
        </select>
        <span className={styles.filterSelectIcon} aria-hidden="true">
          <FaSort />
        </span>
      </div>
    </div>
  )
}
