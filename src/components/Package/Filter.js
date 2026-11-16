'use client'
import React, { useEffect, useState } from 'react'
import { MdFilterListAlt } from 'react-icons/md'
import { Checkbox, RangeSlider, Select } from '@mantine/core'
import { useSearchParams, useRouter } from 'next/navigation'
import { DatePicker } from '@mantine/dates'
import moment from 'moment'
import PackageFilterLoader from '../Loader/PackageFilterLoader'
import { ConvertPrice } from '../Currency/ConvertPrice'
import { useCurrency } from '@/util/currency'
import { LiaAngleDownSolid } from 'react-icons/lia'
import { Drawer } from '@mantine/core'

const drawerStyles = {
  title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' },
  header: { borderBottom: '1px solid #eceae5', paddingBottom: '0.75rem' },
  body: { paddingTop: '1rem' },
}

export default function Filter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currency, rates } = useCurrency()
  const [searchDate, setSearchDate] = useState(moment())
  const [flightFilter, setFlightFilter] = useState([])
  const [durationFilter, setDurationFilter] = useState([])
  const [activeDrawer, setActiveDrawer] = useState(null)
  const [priceRange, setPriceRange] = useState([0, 0])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [selectedDurations, setSelectedDurations] = useState(null)
  const [selectedDepartures, setSelectedDepartures] = useState(null)
  const [selectedRating, setSelectedRating] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFilters()
  }, [])

  useEffect(() => {
    const urlDate = searchParams.get('date')
    if (urlDate) setSearchDate(urlDate)

    const durationsFromURL = searchParams.get('duration')
    const departuresFromURL = searchParams.get('flight_departure')
    const ratingFromURL = searchParams.getAll('star_rating[]')
    const minPriceFromURL = searchParams.get('min_price')
    const maxPriceFromURL = searchParams.get('max_price')

    if (durationsFromURL) setSelectedDurations(durationsFromURL)
    else setSelectedDurations(null)

    if (departuresFromURL) setSelectedDepartures(departuresFromURL)
    else setSelectedDepartures(null)

    if (ratingFromURL) setSelectedRating(ratingFromURL)

    if (minPriceFromURL != null && maxPriceFromURL != null) {
      setPriceRange([Number(minPriceFromURL), Number(maxPriceFromURL)])
    }
  }, [searchParams])

  async function getFilters() {
    setIsLoading(true)
    const urlDate = searchParams.get('date')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/packages/filters?date=${urlDate}`,
        {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const response = await res.json()
      setIsLoading(false)
      if (response.Success) {
        const ListDuration = response.Content.durations.map((item) => ({
          value: String(item.days),
          label: item.label,
        }))
        const ListDeparture = response.Content.flight_departures.map((item) => ({
          value: item.departure,
          label: item.departure,
        }))
        setFlightFilter(ListDeparture)
        setDurationFilter(ListDuration)
        const { newprice: minPriceConverted } = ConvertPrice(
          response.Content?.price_range.min_price,
          response.Content?.currency_code,
          currency,
          rates
        )
        const { newprice: maxPriceConverted } = ConvertPrice(
          response.Content?.price_range.max_price,
          response.Content?.currency_code,
          currency,
          rates
        )
        setMinPrice(minPriceConverted)
        setMaxPrice(maxPriceConverted)

        const minPriceFromURL = searchParams.get('min_price')
        const maxPriceFromURL = searchParams.get('max_price')
        if (minPriceFromURL != null && maxPriceFromURL != null) {
          setPriceRange([Number(minPriceFromURL), Number(maxPriceFromURL)])
        } else {
          setPriceRange([minPriceConverted, maxPriceConverted])
        }
      }
    } catch (error) {
      setIsLoading(false)
      console.log(error)
    }
  }

  const handleDateChange = (date) => {
    const params = new URLSearchParams(searchParams)
    params.set('date', date)
    router.push(`?${decodeURIComponent(params.toString())}`)
  }

  const handleDurationChange = (value) => {
    const params = new URLSearchParams(searchParams)
    if (value === null) {
      params.delete('duration')
    } else {
      params.set('duration', value)
    }
    router.push(`?${decodeURIComponent(params.toString())}`)
    setSelectedDurations(value)
  }

  const handleDepartureChange = (departure) => {
    const params = new URLSearchParams(searchParams)
    if (departure === null) {
      params.delete('flight_departure')
    } else {
      params.set('flight_departure', departure)
    }
    router.push(`?${decodeURIComponent(params.toString())}`)
    setSelectedDepartures(departure)
  }

  const handleRatingChange = (event) => {
    const updated = selectedRating.includes(event.target.value)
      ? selectedRating.filter((d) => d !== event.target.value)
      : [...selectedRating, event.target.value]
    updateURL({ star_rating: updated })
    setSelectedRating(updated)
  }

  const updateURL = (newParams) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newParams).forEach(([key, value]) => {
      params.delete(`${key}[]`)

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v) params.append(`${key}[]`, v)
        })
      } else if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`?${decodeURIComponent(params.toString())}`)
  }

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams)
    const dateParam = params.get('date')
    params.delete('duration')
    params.delete('flight_departure')
    params.delete('star_rating[]')
    params.delete('min_price')
    params.delete('max_price')

    setSelectedDurations(null)
    setSelectedDepartures(null)
    setSelectedRating([])
    setPriceRange([minPrice, maxPrice])

    const newParams = dateParam ? `date=${dateParam}` : ''
    router.push(`?${newParams}`)
    setActiveDrawer(null)
  }

  const applyPriceToURL = (range = priceRange) => {
    const params = new URLSearchParams(searchParams)
    const [minVal, maxVal] = range
    const isFullRange =
      Number(minVal) <= Number(minPrice) && Number(maxVal) >= Number(maxPrice)

    if (isFullRange) {
      params.delete('min_price')
      params.delete('max_price')
    } else {
      params.set('min_price', String(Math.round(Number(minVal))))
      params.set('max_price', String(Math.round(Number(maxVal))))
    }
    router.push(`?${decodeURIComponent(params.toString())}`)
  }

  const handlePriceRangeChange = (value) => {
    setPriceRange(value)
  }

  const handlePriceRangeChangeEnd = (value) => {
    setPriceRange(value)
    applyPriceToURL(value)
  }

  const handleApplyFilters = () => {
    applyPriceToURL(priceRange)
    setActiveDrawer(null)
  }

  const formatPrice = (value) => {
    const amount = Number(value) || 0
    const label = amount % 1 === 0 ? amount.toLocaleString() : amount.toFixed(2)
    return `${currency || ''} ${label}`.trim()
  }

  const safeMin = Number(minPrice) || 0
  const safeMax = Math.max(Number(maxPrice) || 0, safeMin + 0.01)
  const safePriceRange = [
    Math.min(Math.max(Number(priceRange[0]) || safeMin, safeMin), safeMax),
    Math.min(Math.max(Number(priceRange[1]) || safeMax, safeMin), safeMax),
  ]

  const starOptions = [
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
  ]

  const renderPriceSection = () => (
    <div>
      <p className="hotel-filter-section__label">Price Range</p>
      <RangeSlider
        className="hotel-filter-slider"
        pushOnOverlap={false}
        value={safePriceRange}
        onChange={handlePriceRangeChange}
        onChangeEnd={handlePriceRangeChangeEnd}
        min={safeMin}
        max={safeMax}
        color="#e31c23"
        step={1}
        label={null}
      />
      <div className="hotel-filter-price-values">
        <span className="hotel-filter-price-min">{formatPrice(safePriceRange[0])}</span>
        <span className="hotel-filter-price-max">{formatPrice(safePriceRange[1])}+</span>
      </div>
    </div>
  )

  const renderStarsSection = () => (
    <div>
      <p className="hotel-filter-section__label">Accommodation Tier</p>
      <div className="hotel-filter-checkbox-group">
        {starOptions.map((opt) => (
          <Checkbox
            key={opt.value}
            onChange={handleRatingChange}
            checked={selectedRating.includes(opt.value)}
            className="hotel-filter-checkbox"
            value={opt.value}
            label={opt.label}
          />
        ))}
      </div>
    </div>
  )

  const renderDurationSection = () => (
    <div>
      <p className="hotel-filter-section__label">Duration</p>
      <Select
        searchable
        clearable
        data={durationFilter}
        value={selectedDurations}
        onChange={handleDurationChange}
        placeholder="Select Duration"
        classNames={{ input: 'hotel-filter-select' }}
      />
    </div>
  )

  const renderDepartureSection = () => (
    <div>
      <p className="hotel-filter-section__label">Departure From</p>
      <Select
        searchable
        clearable
        data={flightFilter}
        value={selectedDepartures}
        onChange={handleDepartureChange}
        placeholder="Select Departure From"
        classNames={{ input: 'hotel-filter-select' }}
      />
    </div>
  )

  const renderDateSection = () => (
    <div>
      <p className="hotel-filter-section__label">Travel Date</p>
      <div className="package-date-filter">
        <DatePicker minDate={Date()} value={searchDate} onChange={handleDateChange} />
      </div>
    </div>
  )

  const renderApplyFooter = (variant = 'apply') => (
    <div className={variant === 'drawer-apply' ? 'hotel-filter-drawer-actions' : 'hotel-filter-reset'}>
      {variant === 'drawer-apply' && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="hotel-filter-reset__link hotel-filter-reset__link--end"
        >
          Reset filters
        </button>
      )}
      <button type="button" onClick={handleApplyFilters} className="hotel-filter-apply__btn">
        Apply Filters
      </button>
      {variant === 'apply' && (
        <button type="button" onClick={handleResetFilters} className="hotel-filter-reset__link">
          Reset All Filters
        </button>
      )}
    </div>
  )

  return (
    <div>
      <div className="filter-scroll d-flex gap-2 d-md-none mb-3" style={{ marginTop: '-15px' }}>
        <button onClick={() => setActiveDrawer('date')} className="filter-pill hotel-filter-pill">
          Date <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
        <button onClick={() => setActiveDrawer('price')} className="filter-pill hotel-filter-pill">
          Price <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
        <button onClick={() => setActiveDrawer('rating')} className="filter-pill hotel-filter-pill">
          Rating <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
        <button onClick={() => setActiveDrawer('duration')} className="filter-pill hotel-filter-pill">
          Duration <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
        <button onClick={() => setActiveDrawer('departure')} className="filter-pill hotel-filter-pill">
          Departure From <span className="arrow"><LiaAngleDownSolid /></span>
        </button>
      </div>

      <aside className="filter_box hotel-filter-sidebar d-none d-md-block">
        <div className="hotel-filter-sidebar__header">
          <p className="hotel-filter-sidebar__title">Filter By</p>
          <MdFilterListAlt className="hotel-filter-sidebar__icon" size={20} />
        </div>

        {isLoading ? (
          <PackageFilterLoader />
        ) : (
          <>
            <div className="hotel-filter-sidebar__section">{renderDateSection()}</div>
            <div className="hotel-filter-sidebar__section">{renderPriceSection()}</div>
            <div className="hotel-filter-sidebar__section">{renderStarsSection()}</div>
            <div className="hotel-filter-sidebar__section">{renderDurationSection()}</div>
            <div className="hotel-filter-sidebar__section">{renderDepartureSection()}</div>
            <div className="hotel-filter-sidebar__footer">{renderApplyFooter('apply')}</div>
          </>
        )}
      </aside>

      <Drawer
        opened={activeDrawer === 'date'}
        onClose={() => setActiveDrawer(null)}
        title="Travel Date"
        position="bottom"
        size="60%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: 'hotel-filter-drawer' }}
        styles={drawerStyles}
      >
        <div className="text-center d-flex justify-content-center">{renderDateSection()}</div>
        {renderApplyFooter('drawer-apply')}
      </Drawer>

      <Drawer
        opened={activeDrawer === 'price'}
        onClose={() => setActiveDrawer(null)}
        title="Price Range"
        position="bottom"
        size="40%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: 'hotel-filter-drawer' }}
        styles={drawerStyles}
      >
        {renderPriceSection()}
        {renderApplyFooter('drawer-apply')}
      </Drawer>

      <Drawer
        opened={activeDrawer === 'rating'}
        onClose={() => setActiveDrawer(null)}
        title="Accommodation Tier"
        position="bottom"
        size="45%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        classNames={{ content: 'hotel-filter-drawer' }}
        styles={drawerStyles}
      >
        {renderStarsSection()}
        {renderApplyFooter('drawer-apply')}
      </Drawer>

      <Drawer
        opened={activeDrawer === 'duration'}
        onClose={() => setActiveDrawer(null)}
        title="Duration"
        position="bottom"
        size="40%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        transitionProps={{ duration: 200 }}
        withinPortal={true}
        lockScroll={true}
        trapFocus={false}
        classNames={{ content: 'hotel-filter-drawer' }}
        styles={drawerStyles}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Select
            searchable
            clearable
            data={durationFilter}
            value={selectedDurations}
            onChange={handleDurationChange}
            placeholder="Select Duration"
            withScrollArea={false}
            maxDropdownHeight={200}
            classNames={{ input: 'hotel-filter-select' }}
            comboboxProps={{
              withinPortal: false,
              zIndex: 10000,
              transitionProps: { duration: 0 },
            }}
          />
        </div>
        {renderApplyFooter('drawer-apply')}
      </Drawer>

      <Drawer
        opened={activeDrawer === 'departure'}
        onClose={() => setActiveDrawer(null)}
        title="Departure From"
        position="bottom"
        size="40%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
        transitionProps={{ duration: 200 }}
        withinPortal={true}
        lockScroll={true}
        trapFocus={false}
        classNames={{ content: 'hotel-filter-drawer' }}
        styles={drawerStyles}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Select
            searchable
            clearable
            data={flightFilter}
            value={selectedDepartures}
            onChange={handleDepartureChange}
            placeholder="Select Departure From"
            withScrollArea={false}
            maxDropdownHeight={200}
            classNames={{ input: 'hotel-filter-select' }}
            comboboxProps={{
              withinPortal: false,
              zIndex: 10000,
              transitionProps: { duration: 0 },
            }}
          />
        </div>
        {renderApplyFooter('drawer-apply')}
      </Drawer>
    </div>
  )
}
