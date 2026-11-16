"use client";
import { useEffect } from "react";
import { createContext, useContext, useState, useMemo } from "react";
const HotelListContext = createContext();
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";
export function HotelListProvider({ children, hotels, place }) {
    const [convertedHotels, setConvertedHotels] = useState([]);
    const [search, setSearch] = useState(null);
    const { currency, rates } = useCurrency();
    const [star, setStar] = useState([]);
    const [hotelNames, setHotelNames] = useState([]);
    const [sort, setSort] = useState("price-asc");
    const [meal, setMeal] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [resetPrice, setResetPrice] = useState(0);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [visibleCount, setVisibleCount] = useState(10);
    const itemsPerPage = 10;
    useEffect(() => {
        if (hotels && hotels.length > 0) {
            const hotelListNew = hotels.map((item) => {
                const { newcurrency, newprice } = ConvertPrice(item.metadata?.min_price, item.metadata?.currency, currency, rates);
                return {
                    ...item,
                    'currency': newcurrency,
                    'price': newprice,
                };
            });
            const prices = hotelListNew.map((h) => h?.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange([min, max]);
            const hotelNames = [...new Set(hotelListNew.map((h) => h.name))];
            setHotelNames(hotelNames);
            setConvertedHotels(hotelListNew);
        } else {
            setConvertedHotels([]);
        }
    }, [hotels, rates, currency]);

    const resetFilters = () => {
        setSearch(null);
        setStar([]);
        setMeal([]);
        setSort("price-asc");
        setPriceRange([minPrice, maxPrice]);
        setResetPrice(resetPrice + 1);
        setVisibleCount(10);
    };


    const filteredHotels = useMemo(() => {
        let result = [...convertedHotels];
        const searchQuery = search?.trim() || "";

        // Price
        result = result.filter(
            (h) => h.price >= priceRange[0] && h.price <= priceRange[1]
        );

        // Star Rating
        if (star.length > 0) {
            result = result.filter((h) => {
                const starValue = Math.round(Number(h.metadata?.stars));
                const isNumericStar = !isNaN(starValue) && starValue >= 1 && starValue <= 5;

                // If star includes 0 → allow hotels with non-numeric or out-of-range star values
                if (star.includes(0) && (!isNumericStar)) {
                    return true;
                }

                // Otherwise, normal 1–5 filtering
                return star.includes(starValue);
            });
        }


        // Meal
        if (meal.length > 0) {
            result = result.filter((h) =>
                h.rooms?.some((room) =>
                    room.rates?.some((rate) =>
                        meal.includes(rate.board_name.toLowerCase())
                    )
                )
            );
        }

        // Sort — sidebar name search or top search place: show all, best matches first
        const relevanceQuery = searchQuery || place?.trim() || "";

        if (relevanceQuery) {
            result.sort((a, b) => {
                const scoreA = getMatchScore(relevanceQuery, a.name);
                const scoreB = getMatchScore(relevanceQuery, b.name);
                if (scoreB !== scoreA) return scoreB - scoreA;
                if (a.provider === "custom" && b.provider !== "custom") return -1;
                if (a.provider !== "custom" && b.provider === "custom") return 1;
                if (sort === "price-asc") return a?.price - b?.price;
                if (sort === "price-desc") return b?.price - a?.price;
                if (sort === "name-asc") return a.name.localeCompare(b.name);
                return 0;
            });
        } else {
            if (sort === "price-asc") result.sort((a, b) => a?.price - b?.price);
            if (sort === "price-desc") result.sort((a, b) => b?.price - a?.price);
            if (sort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [convertedHotels, search, priceRange, star, meal, sort, place, minPrice, maxPrice]);

    function getMatchScore(place, hotelName) {
        if (!place || !hotelName) return 0;

        const placeLower = place.toLowerCase().trim();
        const hotelLower = hotelName.toLowerCase().trim();

        if (hotelLower === placeLower) return 100;

        if (hotelLower.includes(placeLower)) return 50 + placeLower.length;

        if (placeLower.includes(hotelLower)) return 40 + hotelLower.length;

        const placeWords = placeLower.split(/\s+/).filter(Boolean);
        const hotelWords = hotelLower.split(/\s+/);

        let score = 0;
        placeWords.forEach(word => {
            if (hotelWords.includes(word)) {
                score += 2;
            } else if (hotelLower.includes(word)) {
                score += 1;
            }
        });

        return score;
    }
    useEffect(() => {
        setVisibleCount(10);
    }, [search, star, meal, priceRange, sort]);

    const visibleHotels = useMemo(() => {
        return filteredHotels.slice(0, visibleCount);
    }, [filteredHotels, visibleCount]);

    const hasMore = visibleCount < filteredHotels.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredHotels.length));
    };

    return (
        <HotelListContext.Provider
            value={{
                hotels: visibleHotels,
                totalHotels: filteredHotels.length,
                setSearch,
                setPriceRange,
                setStar,
                setSort,
                setMeal,
                hasMore,
                loadMore,
                itemsPerPage,
                minPrice,
                maxPrice,
                sort,
                star,
                meal,
                search,
                priceRange,
                hotelNames,
                resetPrice,
                resetFilters,
            }}
        >
            {children}
        </HotelListContext.Provider>
    );
}

export function useHotelList() {
    return useContext(HotelListContext);
}
