/** Transfer provider name ↔ code aliases (match either). */
export const TRANSFER_PROVIDER_ALIASES = {
  custom: ['custom', 'C00H0001H'],
  synchtravel: ['synchtravel', 'S00H0002T'],
  hotelbeds: ['hotelbeds', 'H00H0003B'],
  hotelston: ['hotelston', 'H00H0004S'],
  liteapi: ['liteapi', 'L00H0005A'],
  travelenda: ['travelenda', 'T00H0006L'],
  ratehawk: ['ratehawk', 'R00H0007H'],
};

/**
 * True if `provider` equals the given provider name OR its code.
 * @param {string|null|undefined} provider
 * @param {keyof typeof TRANSFER_PROVIDER_ALIASES} name
 */
export function isTransferProvider(provider, name) {
  const value = String(provider ?? '').trim().toLowerCase();
  if (!value) return false;

  const key = String(name ?? '').trim().toLowerCase();
  const aliases = TRANSFER_PROVIDER_ALIASES[key];
  if (!aliases?.length) return value === key;

  return aliases.some((alias) => alias.toLowerCase() === value);
}
