"use client";
import React, { useEffect, useState } from "react";
import { RangeSlider } from "@mantine/core";
import { useHotelList } from "../HotelListingContext";
import { useCurrency } from "@/util/currency";

export default function PriceRange() {
  const { minPrice, maxPrice, resetPrice, setPriceRange } = useHotelList();
  const { currency } = useCurrency();
  const [selectedValues, setSelectedValues] = useState([minPrice, maxPrice]);

  useEffect(() => {
    setSelectedValues([minPrice, maxPrice]);
  }, [minPrice, maxPrice, resetPrice]);

  const handleChange = (values) => {
    setSelectedValues(values);
    setPriceRange(values);
  };

  const formatPrice = (value) => {
    const amount = Number(value) || 0;
    const label = amount % 1 === 0 ? amount.toLocaleString() : amount.toFixed(2);
    return `${currency || ""} ${label}`.trim();
  };

  const safeMin = Number(minPrice) || 0;
  const safeMax = Math.max(Number(maxPrice) || 0, safeMin + 0.01);
  const safeValues = [
    Math.min(Math.max(Number(selectedValues[0]) || safeMin, safeMin), safeMax),
    Math.min(Math.max(Number(selectedValues[1]) || safeMax, safeMin), safeMax),
  ];

  return (
    <div>
      <p className="hotel-filter-section__label">Your Budget Per Night</p>
      <RangeSlider
        className="hotel-filter-slider"
        min={safeMin}
        max={safeMax}
        color="#e31c23"
        value={safeValues}
        onChange={handleChange}
        minRange={0.1}
        step={0.01}
        label={null}
      />
      <div className="hotel-filter-price-values">
        <span className="hotel-filter-price-min">{formatPrice(safeValues[0])}</span>
        {/* <span className="hotel-filter-price-current">{formatPrice(safeValues[1])}</span> */}
        <span className="hotel-filter-price-current">{formatPrice(safeValues[1])}+</span>
      </div>
    </div>
  );
}
