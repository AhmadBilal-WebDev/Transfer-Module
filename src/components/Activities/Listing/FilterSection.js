'use client'
import React, { useMemo } from "react";
import { RangeSlider } from "@mantine/core";
import { IoTimeOutline } from "react-icons/io5";
import styles from "./Activities.module.css";

const SORT_OPTIONS = [
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

function FilterSection({
  activityList = [],
  priceRange,
  setPriceRange,
  activeFilters,
  setActiveFilters,
  currency = 'GBP',
  minPrice,
  maxPrice,
  sortBy = 'recommended',
  setSortBy,
}) {
  const durationFilters = useMemo(() => {
    const counts = {};
    activityList.forEach((activity) => {
      const duration = activity.activity_duration?.trim();
      if (duration) counts[duration] = (counts[duration] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([duration, count]) => ({ duration, count }));
  }, [activityList]);

  const safeMin = minPrice ?? 0;
  const safeMax = Math.max(safeMin + 1, maxPrice ?? 1000);
  const clampedRange = [
    Math.min(Math.max(priceRange?.[0] ?? safeMin, safeMin), safeMax),
    Math.min(Math.max(priceRange?.[1] ?? safeMax, safeMin), safeMax),
  ];

  const formatPrice = (value) => {
    const rounded = Math.round(value);
    return value >= safeMax ? `${currency} ${rounded.toLocaleString()}+` : `${currency} ${rounded.toLocaleString()}`;
  };

  const toggleDuration = (duration) => {
    const id = `duration_${duration}`;
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const isBudgetActive =
    minPrice !== undefined &&
    maxPrice !== undefined &&
    (priceRange?.[0] !== minPrice || priceRange?.[1] !== maxPrice);

  const isSortActive = sortBy !== 'recommended';
  const hasActiveFilters = isBudgetActive || activeFilters.length > 0 || isSortActive;

  const clearAllFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setActiveFilters([]);
    setSortBy('recommended');
  };

  if (!activityList.length) return null;

  return (
    <aside className={styles.filterSidebar}>
      <div className={styles.filterSidebarHeader}>
        <h3 className={styles.filterSidebarTitle}>Filter By</h3>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.filterClearAllBtn}
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Budget */}
      <div className={styles.filterSidebarSection}>
        <p className={styles.filterSidebarSectionTitle}>Your Budget Per Activity</p>
        <RangeSlider
          className={styles.budgetSliderSidebar}
          value={clampedRange}
          onChange={setPriceRange}
          min={safeMin}
          max={safeMax}
          step={1}
          minRange={1}
          color="#e31c23"
          label={null}
        />
        <div className={styles.budgetRangeLabels}>
          <span>{formatPrice(clampedRange[0])}</span>
          <span>{formatPrice(clampedRange[1])}</span>
        </div>
      </div>

      {/* Duration (dynamic values from API) */}
      {durationFilters.length > 0 && (
        <div className={styles.filterSidebarSection}>
          <p className={styles.filterSidebarSectionTitle}>Duration</p>
          <div className={styles.filterCheckboxList}>
            {durationFilters.map(({ duration, count }) => {
              const isActive = activeFilters.includes(`duration_${duration}`);
              return (
                <label key={duration} className={styles.filterCheckboxItem}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDuration(duration)}
                  />
                  <span className={styles.filterCheckboxLabel}>
                    <IoTimeOutline className={styles.filterCheckboxIcon} />
                    {duration}
                  </span>
                  <span className={styles.filterCheckboxCount}>{count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort */}
      <div className={styles.filterSidebarSection}>
        <p className={styles.filterSidebarSectionTitle}>Sort By</p>
        <div className={styles.filterRadioList}>
          {SORT_OPTIONS.map((option) => (
            <label key={option.value} className={styles.filterRadioItem}>
              <input
                type="radio"
                name="activitySortBy"
                checked={sortBy === option.value}
                onChange={() => setSortBy(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FilterSection;