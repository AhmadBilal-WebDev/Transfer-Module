'use client';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import Index from '@/components/Transfer/Listing/Index';
import MobileTransferHeader from '@/components/Transfer/Listing/MobileTransferHeader';
import { TransferListProvider } from '@/components/Transfer/Listing/TransferListingContext';
import RoyalaneLoaderMark from '@/components/Loader/RoyalaneLoaderMark';
import TransferModifySearch from '@/components/Home/Search/TransferModifySearch';
import { PackageModeBanner } from '@/components/Store/PackageModeHelper';

function TransferPageContent() {
    const searchParams = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());

    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTransfers = async (params) => {
        try {
            const pickupLatitude = params.pickupLatitude ?? params.fromLat ?? null;
            const pickupLongitude = params.pickupLongitude ?? params.fromLng ?? null;
            const dropoffLatitude = params.dropoffLatitude ?? params.toLat ?? null;
            const dropoffLongitude = params.dropoffLongitude ?? params.toLng ?? null;

            const adults = Number(params.adults) || 0;
            const children = Number(params.children) || 0;
            const infants = Number(params.infants) || 0;
            const passengers = Number(params.passengers) || adults + children + infants || 1;

            const toCoord = (value) => {
                if (
                    value === '' ||
                    value == null ||
                    value === 'null' ||
                    value === 'undefined'
                ) {
                    return null;
                }
                const num = Number(value);
                return Number.isFinite(num) ? num : null;
            };

            let pickupLat = toCoord(pickupLatitude);
            let pickupLng = toCoord(pickupLongitude);
            let dropoffLat = toCoord(dropoffLatitude);
            let dropoffLng = toCoord(dropoffLongitude);

            // Guard against Number(null)===0 style bad coords leaking into search
            if (pickupLat === 0 && pickupLng === 0) {
                pickupLat = null;
                pickupLng = null;
            }
            if (dropoffLat === 0 && dropoffLng === 0) {
                dropoffLat = null;
                dropoffLng = null;
            }

            const searchPayload = {
                pickupLocation: params.pickupLocation || '',
                dropoffLocation: params.dropoffLocation || '',
                pickupLatitude: pickupLat,
                pickupLongitude: pickupLng,
                dropoffLatitude: dropoffLat,
                dropoffLongitude: dropoffLng,
                pickupDate: params.pickupDate || '',
                pickupTime: params.pickupTime || '',
                passengers,
                adults: adults || passengers,
                children,
                infants,
                transferType: params.transferType || 'one-way',
            };

            if (params.dropoffDate) searchPayload.dropoffDate = params.dropoffDate;
            if (params.dropoffTime) searchPayload.dropoffTime = params.dropoffTime;

            const pickup = searchPayload.pickupLocation || '';
            if (/\b(Intl\.?|Arpt\.?)\b/i.test(pickup) && !pickup.includes(',')) {
                try {
                    const { AirportList } = await import('@/util/AirportList');
                    const airport = AirportList.find((a) => a.airportName === pickup);
                    if (airport?.cityName) {
                        searchPayload.pickupLocation = airport.cityName;
                    }
                } catch (e) {
                    console.warn('Could not resolve abbreviated pickup location', e);
                }
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                    body: JSON.stringify(searchPayload),
                }
            );

            const data = await res.json();
            return data?.data?.transfers || [];
        } catch (error) {
            console.error('Error fetching transfers:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getTransfers(params);
            setTransfers(result);
            setLoading(false);
        };

        fetchData();
    }, [searchParams]);

    return (
        <div className="transfer-listing-page">
            <PackageModeBanner serviceName="transfer" />

            {/* Desktop: modify search */}
            {!params?.packageMode && !params?.edit && (
                <div className="transfer-search-modify d-none d-md-block">
                    <div className="transfer-listing-hero-inner">
                        <div className="transfer-listing-hero-search">
                            <TransferModifySearch />
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile: step + trip summary + edit modal */}
            <MobileTransferHeader params={params} />

            {loading ? <RoyalaneLoaderMark /> : (
                <div className='container mb-5 transfer-listing-results'>
                    <TransferListProvider transfers={transfers}>
                        <Index searchParams={params} totalRawTransfers={transfers.length} />
                    </TransferListProvider>
                </div>
            )}
        </div>
    )
}

export default function page() {
    return (
        <Suspense fallback={<RoyalaneLoaderMark />}>
            <TransferPageContent />
        </Suspense>
    );
}
