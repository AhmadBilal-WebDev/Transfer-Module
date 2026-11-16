'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useHotelList } from '../HotelListingContext'

export default function StarFilter() {
  const { star, setStar } = useHotelList();

  const handleCheckboxChange = (value) => {
    if (star.includes(value)) {
      // Remove if already selected
      setStar(star.filter((s) => s !== value));
    } else {
      // Add if not selected
      setStar([...star, value]);
    }
  };

  return (
    <div>
      <p className='hotel-filter-section__label'>Property Rating</p>
      <div className="hotel-filter-checkbox-group">
        <Checkbox checked={star.includes(5)} onChange={() => handleCheckboxChange(5)} className='hotel-filter-checkbox' label="5 Stars" />
        <Checkbox checked={star.includes(4)} onChange={() => handleCheckboxChange(4)} className='hotel-filter-checkbox' label="4 Stars" />
        <Checkbox checked={star.includes(3)} onChange={() => handleCheckboxChange(3)} className='hotel-filter-checkbox' label="3 Stars" />
        <Checkbox checked={star.includes(2)} onChange={() => handleCheckboxChange(2)} className='hotel-filter-checkbox' label="2 Stars" />
        <Checkbox checked={star.includes(1)} onChange={() => handleCheckboxChange(1)} className='hotel-filter-checkbox' label="1 Star" />
        <Checkbox checked={star.includes(0)} onChange={() => handleCheckboxChange(0)} className='hotel-filter-checkbox' label="Other" />
      </div>
    </div>
  )
}
