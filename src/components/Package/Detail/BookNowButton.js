'use client'
import React from 'react'
import { usePackageStore } from '@/components/Store/PackageStore'
import Link from 'next/link'

export default function BookNowButton({ PackageDetail, className, label = 'Secure Your Journey →' }) {
  const { setSelectedPackage } = usePackageStore()
  const BookNow = () => {
    setSelectedPackage(PackageDetail)
  }

  return (
    <Link
      onClick={BookNow}
      href={`/${PackageDetail?.category.slug}/${PackageDetail?.slug}/selection`}
      className={className}
    >
      {label}
    </Link>
  )
}
