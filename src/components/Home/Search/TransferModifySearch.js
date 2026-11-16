'use client';

import TransferSearch from './TransferSearch';

/**
 * Listing / modify search — listing-only card UI (home search unchanged).
 */
export default function TransferModifySearch({ onSearch }) {
  return <TransferSearch onSearch={onSearch} variant="listing" />;
}
