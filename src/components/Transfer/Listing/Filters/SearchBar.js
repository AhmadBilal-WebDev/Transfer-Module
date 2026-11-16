'use client'
import React from 'react'
import { useTransferList } from '../TransferListingContext'
import { Autocomplete } from '@mantine/core'
import { FaSearch } from 'react-icons/fa'
import styles from '../TransferFilters.module.css'

export default function SearchBar() {
  const { vehicleNames, setSearch, search, setCurrentPage } = useTransferList()

  return (
    <div className={styles.filterSection}>
      <p className={styles.filterSectionTitle}>Search Model</p>
      <Autocomplete
        className={styles.filterInput}
        value={search || ''}
        onChange={(value) => {
          setSearch(value)
          setCurrentPage?.(1)
        }}
        placeholder="Mercedes S-Class, GMC"
        data={vehicleNames || []}
        leftSection={<FaSearch size={12} />}
        leftSectionPointerEvents="none"
        searchable
        withScrollArea={false}
        maxDropdownHeight={200}
        comboboxProps={{
          withinPortal: false,
          zIndex: 10000,
          transitionProps: { duration: 0 },
        }}
      />
    </div>
  )
}
