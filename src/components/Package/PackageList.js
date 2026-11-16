'use client'
import React, { useEffect, useMemo, useState } from 'react'
import PackageCard from './PackageCard'
import PackageCardLoader from '../Loader/PackageCardLoader'
import { useSearchParams, useParams } from 'next/navigation'
import PackagePagination from './PackagePagination'
import Link from 'next/link'
import { FaAngleDown, FaHome } from 'react-icons/fa'
import { Select } from '@mantine/core'
import Filter from './Filter'
import { ConvertPrice } from '../Currency/ConvertPrice'
import { useCurrency } from '@/util/currency'
import { playfair } from '@/lib/fonts'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

function getMinPrice(item) {
  const validPrices = item?.price_Details?.filter((p) => p.type !== 'without_beds')
  if (!validPrices?.length) return 0
  return validPrices.reduce(
    (min, p) => (Number(p.sale_per_person) < min ? Number(p.sale_per_person) : min),
    Number(validPrices[0]?.sale_per_person) || 0
  )
}

export default function PackageList({ category_slug }) {
  const searchParams = useSearchParams()
  const params = useParams()
  const { currency, rates } = useCurrency()
  const [packageResponse, setPackageResponse] = useState({})
  const [packageList, setPackageList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [sortBy, setSortBy] = useState('recommended')

  useEffect(() => {
    let progressInterval
    async function getPackages() {
      setIsLoading(true)
      setProgress(0)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 200)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?category_slug=${category_slug !== 'umrah-packages' ? params.slug : category_slug}&${searchParams}`,
          {
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        const response = await res.json()
        setProgress(100)
        setTimeout(() => {
          setIsLoading(false)
        }, 300)
        if (response.Success) {
          setPackageResponse(response?.Content)
          setPackageList(response?.Content?.packages || [])
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        setIsLoading(false)
        console.log(error)
      } finally {
        clearInterval(progressInterval)
      }
    }
    getPackages()
    return () => clearInterval(progressInterval)
  }, [searchParams, category_slug, params.slug])

  const getDisplayMinPrice = (item) => {
    const raw = getMinPrice(item)
    if (!raw) return 0
    try {
      const { newprice } = ConvertPrice(raw, item?.currency_code, currency, rates)
      return Number(newprice) || 0
    } catch {
      return Number(raw) || 0
    }
  }

  const sortedPackages = useMemo(() => {
    if (!packageList?.length) return []

    const minPriceParam = searchParams.get('min_price')
    const maxPriceParam = searchParams.get('max_price')
    let next = [...packageList]

    if (minPriceParam != null && maxPriceParam != null) {
      const minP = Number(minPriceParam)
      const maxP = Number(maxPriceParam)
      if (!Number.isNaN(minP) && !Number.isNaN(maxP)) {
        next = next.filter((item) => {
          const price = getDisplayMinPrice(item)
          if (!price) return true
          return price >= minP && price <= maxP
        })
      }
    }

    if (sortBy === 'recommended') return next
    next.sort((a, b) => {
      const priceA = getDisplayMinPrice(a)
      const priceB = getDisplayMinPrice(b)
      return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA
    })
    return next
  }, [packageList, sortBy, searchParams, currency, rates])

  const total =
    searchParams.get('min_price') != null && searchParams.get('max_price') != null
      ? sortedPackages.length
      : (packageResponse?.pagination?.total ?? packageList.length)
  const itineraryLabel = total === 1 ? 'ITINERARY' : 'ITINERARIES'

  return (
    <div className="container my-4 my-md-5 package-listing-layout">
      <header className="package-results-header" aria-live="polite">
        <div className="package-results-header__copy">
          <span className="package-results-header__eyebrow">
            {isLoading ? 'SEARCHING ITINERARIES' : `SHOWING ${total} ${itineraryLabel}`}
          </span>
          <h2 className={`package-results-header__title`}>
            Refine your escape
          </h2>
        </div>
        <div className="package-results-header__sort">
          <span className="package-results-header__sort-label">Sort:</span>
          <Select
            className="package-results-header__sort-select"
            variant="unstyled"
            value={sortBy}
            onChange={(value) => setSortBy(value || 'recommended')}
            data={SORT_OPTIONS}
            allowDeselect={false}
            rightSection={<FaAngleDown size={14} />}
            comboboxProps={{ withinPortal: true, width: 'auto', position: 'bottom-end' }}
          />
        </div>
      </header>

      <div className="row g-4">
        <div className="col-xl-3 col-lg-4 col-md-12">
          <Filter />
        </div>
        <div className="col-xl-9 col-lg-8 col-md-12">
          {isLoading ? (
            <div>
              <div className="mb-3 hotel-search-loader">
                <div className="mb-2">
                  <div className="spinner-border spinner-border-sm text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>{' '}
                  Searching Packages
                </div>
                <div className="progress" style={{ height: '5px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <PackageCardLoader />
            </div>
          ) : sortedPackages.length === 0 ? (
            <div className="text-center packge-card-notfound">
              <h3 className={playfair.className}>No Packages Found</h3>
              <p>
                We couldn’t find any packages matching your search criteria. Try adjusting your
                filters or search again with different dates.
              </p>
              <Link href="/">
                <button className="hotel-filter-apply__btn mx-auto" style={{ maxWidth: 220 }}>
                  <FaHome /> Go Back Home
                </button>
              </Link>
            </div>
          ) : (
            <div>
              <PackageCard packageList={sortedPackages} />
              {!(searchParams.get('min_price') != null && searchParams.get('max_price') != null) &&
                packageResponse?.pagination?.last_page > 1 && (
                <PackagePagination pdata={packageResponse.pagination} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
