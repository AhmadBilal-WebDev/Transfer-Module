'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
export default function TransferAiSearch({ searchResponse }) {
    const router = useRouter()

    useEffect(() => {
        if (searchResponse) {
            navigateToTransfer()
        }
    }, [searchResponse])

    const navigateToTransfer = () => {

        const queryParams = new URLSearchParams();
        queryParams.append('transferType', searchResponse.transferType);
        queryParams.append('fromLat', searchResponse.fromLat);
        queryParams.append('fromLng', searchResponse.fromLng);
        queryParams.append('pickupLocation', searchResponse.pickupLocation);
        queryParams.append('fromCountry', searchResponse.fromCountry);
        queryParams.append('toLat', searchResponse.toLat);
        queryParams.append('toLng', searchResponse.toLng);
        queryParams.append('dropoffLocation', searchResponse.dropoffLocation);
        queryParams.append('pickupDate', searchResponse.pickupDate);
        queryParams.append('pickupTime', searchResponse.pickupTime);
        if (searchResponse?.dropoffDate) {
            queryParams.append('dropoffDate', searchResponse.dropoffDate);
            queryParams.append('dropoffTime', searchResponse.dropoffTime);
        }
        const adults = Number(searchResponse.adults) || 1;
        const children = Number(searchResponse.children) || 0;
        const infants = Number(searchResponse.infants) || 0;
        const passengers = Number(searchResponse.passengers) || (adults + children + infants);

        queryParams.append('adults', String(adults));
        queryParams.append('children', String(children));
        queryParams.append('infants', String(infants));
        queryParams.append('passengers', String(passengers));

        router.push(`/transfers?${queryParams.toString()}`);
    }


    return null;
}
