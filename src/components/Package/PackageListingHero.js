'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSuitcaseRolling } from 'react-icons/fa';
import PackageSearch from '@/components/Home/Search/PackageSearch';

function PackageListingHeroInner({ initialCategory }) {
    const searchParams = useSearchParams();
    const initialDate = searchParams?.get('date') || null;

    return (
        <div className="package-listing-page">
            <div className="package-search-modify">
                <div className="container package-listing-hero-inner">
                    <div className="package-listing-hero-intro">
                        <span className="package-listing-hero-badge">
                            <FaSuitcaseRolling size={12} aria-hidden="true" />
                            Curated Itineraries
                        </span>
                        <h1 className="package-listing-hero-title">
                            Journeys <em>Built for</em> Discerning Travelers
                        </h1>
                        <p className="package-listing-hero-subtitle">
                            Filter through our hand-picked escapes to find the perfect harmony of adventure, culture, and quiet luxury.
                        </p>
                    </div>
                    <div className="package-listing-hero-search">
                        <PackageSearch
                            variant="listing"
                            initialCategory={initialCategory}
                            initialDate={initialDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PackageListingHero({ initialCategory }) {
    return (
        <Suspense fallback={
            <div className="package-listing-page">
                <div className="package-search-modify">
                    <div className="container package-listing-hero-inner">
                        <div className="package-listing-hero-intro">
                            <span className="package-listing-hero-badge">
                                <FaSuitcaseRolling size={12} aria-hidden="true" />
                                Curated Itineraries
                            </span>
                            <h1 className="package-listing-hero-title">
                                Journeys <em>Built for</em> Discerning Travelers
                            </h1>
                            <p className="package-listing-hero-subtitle">
                                Filter through our hand-picked escapes to find the perfect harmony of adventure, culture, and quiet luxury.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <PackageListingHeroInner initialCategory={initialCategory} />
        </Suspense>
    );
}
