'use client'
import React from 'react';
import { useCurrency } from '@/util/currency';

const CurrencySelector = ({ width }) => {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      className={width || ''}
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Select currency"
    >
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
      <option value="SAR">SAR</option>
    </select>
  );
};

export default CurrencySelector;
