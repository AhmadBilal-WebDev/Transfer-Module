"use client";
import { useEffect, useCallback } from "react";
import { createContext, useContext, useState, useMemo } from "react";
const TransferListContext = createContext();
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";

export function TransferListProvider({ children, transfers }) {
    const [convertedTransfers, setConvertedTransfers] = useState([]);
    const [search, setSearch] = useState(null);
    const { currency, rates } = useCurrency();
    
    // Filter states
    const [vehicleCategory, setVehicleCategory] = useState([]);
    const [transmissionType, setTransmissionType] = useState([]);
    const [passengerCapacity, setPassengerCapacity] = useState([]);
    const [luggageCapacity, setLuggageCapacity] = useState([]);
    const [sort, setSort] = useState("price-asc");
    
    // Price range states
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    
    // Infinite scroll — show 10 at a time
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;
    const setCurrentPage = () => setVisibleCount(itemsPerPage);
    
    // Available options
    const [vehicleNames, setVehicleNames] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableTransmissions, setAvailableTransmissions] = useState([]);

    // Convert transfers prices to selected currency
    useEffect(() => {
        if (transfers && transfers.length > 0) {
            const transferListNew = transfers.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(
                    item.fare, 
                    item.currency, 
                    currency, 
                    rates
                );
                return {
                    ...item,
                    convertedCurrency: newcurrency,
                    convertedPrice: newprice,
                };
            });

            // Set absolute bounds; only reset applied range when it was still
            // at the previous full span (or unset). Preserve user selection.
            const prices = transferListNew.map((t) => t?.convertedPrice);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange((prev) => {
                const prevIsUnset =
                    !Array.isArray(prev) ||
                    prev[1] <= 0 ||
                    (prev[0] === 0 && prev[1] === 0);
                const prevWasFullSpan =
                    !prevIsUnset &&
                    Math.abs(prev[0] - minPrice) < 0.001 &&
                    Math.abs(prev[1] - maxPrice) < 0.001;
                if (
                    prevIsUnset ||
                    prevWasFullSpan ||
                    (minPrice === 0 && maxPrice === 0)
                ) {
                    return [min, max];
                }
                const low = Math.min(Math.max(prev[0], min), max);
                const high = Math.min(Math.max(prev[1], min), max);
                return [Math.min(low, high), Math.max(low, high)];
            });

            // Extract unique values for filters
            const vehicleNames = [...new Set(transferListNew.map((t) => t.vehicle_details?.name))];
            const categories = [...new Set(transferListNew.map((t) => t.vehiclecategory?.name))];
            const transmissions = [
                ...new Set(
                    transferListNew
                        .map((t) => t.vehicle_details?.transmission_type)
                        .filter((value) => typeof value === 'string' && value.trim().length > 0)
                        .map((value) => value.trim())
                ),
            ];

            setVehicleNames(vehicleNames);
            setAvailableCategories(categories);
            setAvailableTransmissions(transmissions);
            if (transmissions.length === 0) {
                setTransmissionType([]);
            }
            setConvertedTransfers(transferListNew);
        } else {
            setConvertedTransfers([]);
            setAvailableTransmissions([]);
            setTransmissionType([]);
        }
    }, [transfers, rates, currency]);

    const resetFilters = () => {
        setSearch(null);
        setVehicleCategory([]);
        setTransmissionType([]);
        setPassengerCapacity([]);
        setLuggageCapacity([]);
        setSort("price-asc");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setVisibleCount(itemsPerPage);
    };

    const filteredTransfers = useMemo(() => {
        let result = [...convertedTransfers];

        // Search by vehicle name
        if (search !== null && search !== '') {
            result = result.filter((t) =>
                t.vehicle_details?.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Price filter
        result = result.filter(
            (t) => t.convertedPrice >= priceRange[0] && t.convertedPrice <= priceRange[1]
        );

        // Vehicle Category filter
        if (vehicleCategory.length > 0) {
            result = result.filter((t) =>
                vehicleCategory.includes(t.vehiclecategory?.name)
            );
        }

        // Transmission Type filter
        if (transmissionType.length > 0) {
            result = result.filter((t) =>
                transmissionType.includes(t.vehicle_details?.transmission_type)
            );
        }

        // Passenger Capacity filter
        if (passengerCapacity.length > 0) {
            result = result.filter((t) => {
                const capacity = t.vehicle_details?.passenger_capacity;
                return passengerCapacity.some(range => {
                    if (range === '1-4') return capacity >= 1 && capacity <= 4;
                    if (range === '5-7') return capacity >= 5 && capacity <= 7;
                    if (range === '8-12') return capacity >= 8 && capacity <= 12;
                    if (range === '12+') return capacity > 12;
                    return false;
                });
            });
        }

        // Luggage Capacity filter
        if (luggageCapacity.length > 0) {
            result = result.filter((t) => {
                const capacity = t.vehicle_details?.luggage_capacity;
                return luggageCapacity.some(range => {
                    if (range === '1-2') return capacity >= 1 && capacity <= 2;
                    if (range === '3-4') return capacity >= 3 && capacity <= 4;
                    if (range === '5-6') return capacity >= 5 && capacity <= 6;
                    if (range === '6+') return capacity > 6;
                    return false;
                });
            });
        }
        // Sort
        if (sort === "price-asc") result.sort((a, b) => a?.convertedPrice - b?.convertedPrice);
        if (sort === "price-desc") result.sort((a, b) => b?.convertedPrice - a?.convertedPrice);
        if (sort === "name-asc") result.sort((a, b) => a.vehicle_details?.name?.localeCompare(b.vehicle_details?.name));

        return result;
    }, [convertedTransfers, search, priceRange, vehicleCategory, transmissionType, passengerCapacity, luggageCapacity, sort]);

    // Reset loaded count whenever the filtered list changes
    useEffect(() => {
        setVisibleCount(itemsPerPage);
    }, [filteredTransfers]);

    const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage) || 1;
    const currentPage = Math.ceil(visibleCount / itemsPerPage) || 1;
    const hasMore = visibleCount < filteredTransfers.length;

    const paginatedTransfers = useMemo(() => {
        return filteredTransfers.slice(0, visibleCount);
    }, [filteredTransfers, visibleCount]);

    const loadMore = useCallback(() => {
        setVisibleCount((prev) =>
            Math.min(prev + itemsPerPage, filteredTransfers.length)
        );
    }, [filteredTransfers.length]);

    return (
        <TransferListContext.Provider
            value={{
                transfers: paginatedTransfers,
                totalTransfers: filteredTransfers.length,
                allTransferCount: convertedTransfers.length,
                setSearch,
                setPriceRange,
                setVehicleCategory,
                setTransmissionType,
                setPassengerCapacity,
                setLuggageCapacity,
                setSort,
                totalPages,
                currentPage,
                setCurrentPage,
                itemsPerPage,
                hasMore,
                loadMore,
                visibleCount,
                minPrice,
                maxPrice,
                sort,
                vehicleCategory,
                transmissionType,
                passengerCapacity,
                luggageCapacity,
                search,
                priceRange,
                vehicleNames,
                availableCategories,
                availableTransmissions,
                resetPrice,
                resetFilters,
            }}
        >
            {children}
        </TransferListContext.Provider>
    );
}

export function useTransferList() {
    return useContext(TransferListContext);
}
