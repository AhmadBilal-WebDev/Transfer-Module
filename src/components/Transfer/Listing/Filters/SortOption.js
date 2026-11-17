'use client'
import React from 'react'
import { FaSort } from 'react-icons/fa'
import { useTransferList } from '../TransferListingContext'
import styles from '../TransferFilters.module.css'

export default function SortOption({ variant = 'filter' }) {
  const { sort, setSort, setCurrentPage } = useTransferList()
  const isHeader = variant === 'header'

  return (
    <div
      className={
        isHeader ? styles.headerSort : styles.filterSection
      }
    >
      {!isHeader && <p className={styles.filterSectionTitle}>Sort By</p>}
      {isHeader && (
        <span className={styles.headerSortLabel}>Sort:</span>
      )}
      <div
        className={
          isHeader ? styles.headerSortSelectWrap : styles.filterSelectWrap
        }
      >
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setCurrentPage?.(1)
          }}
          className={
            isHeader ? styles.headerSortSelect : styles.filterSelect
          }
          aria-label="Sort by"
        >
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Vehicle Name: A-Z</option>
        </select>
        <span
          className={
            isHeader ? styles.headerSortIcon : styles.filterSelectIcon
          }
          aria-hidden="true"
        >
          <FaSort />
        </span>
      </div>
    </div>
  )
}
