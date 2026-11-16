/** City aliases so Google names like "Mecca" still match "Makkah". */
const CITY_ALIASES = {
  makkah: ['makkah', 'mecca', 'makka', 'makkah al mukarramah'],
  madinah: ['madinah', 'medina', 'al madinah', 'al-madinah', 'madina'],
  jeddah: ['jeddah', 'jidda', 'jedda'],
  riyadh: ['riyadh', 'ar riyadh'],
  taif: ['taif', "ta'if", 'at taif'],
  yanbu: ['yanbu', 'yenbo'],
  abha: ['abha'],
  dammam: ['dammam', 'ad dammam'],
};

export const CITY_RESTRICT_RADIUS_M = 45000;

export function normalizeCityKey(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCityAliasList(cityName) {
  const normalized = normalizeCityKey(cityName);
  if (!normalized) return [];

  for (const aliases of Object.values(CITY_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))) {
      return aliases;
    }
  }

  // Use first meaningful token for names like "Makkah, Saudi Arabia"
  const firstToken = normalized.split(',')[0]?.trim();
  return firstToken ? [firstToken] : [normalized];
}

function textMatchesCity(text, aliases) {
  const hay = normalizeCityKey(text);
  if (!hay) return false;
  return aliases.some((alias) => hay.includes(alias) || alias.includes(hay));
}

/**
 * Returns true when place/address belongs to the given search city.
 * If cityName is empty, always allows.
 */
export function placeBelongsToCity(place, cityName) {
  const aliases = getCityAliasList(cityName);
  if (!aliases.length) return true;

  if (typeof place === 'string') {
    return textMatchesCity(place, aliases);
  }

  const components = place?.address_components || [];
  const cityTypes = [
    'locality',
    'postal_town',
    'administrative_area_level_2',
    'administrative_area_level_1',
    'sublocality',
    'sublocality_level_1',
  ];

  const componentHit = components.some((component) => {
    const isCityLike = component.types?.some((type) => cityTypes.includes(type));
    if (!isCityLike) return false;
    return (
      textMatchesCity(component.long_name, aliases) ||
      textMatchesCity(component.short_name, aliases)
    );
  });

  if (componentHit) return true;

  return (
    textMatchesCity(place?.formatted_address, aliases) ||
    textMatchesCity(place?.name, aliases) ||
    textMatchesCity(place?.address, aliases)
  );
}

export function parseCoord(val) {
  if (val == null || val === '' || val === 'null') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/** Approx circle as LatLngBoundsLiteral for Places Autocomplete strictBounds. */
export function buildCityBoundsLiteral(lat, lng, radiusM = CITY_RESTRICT_RADIUS_M) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const latDelta = radiusM / 111320;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusM / (111320 * Math.max(cosLat, 0.2));
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

export function isWithinCityRadius(lat, lng, centerLat, centerLng, radiusM = CITY_RESTRICT_RADIUS_M) {
  if (![lat, lng, centerLat, centerLng].every(Number.isFinite)) return true;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat - centerLat);
  const dLng = toRad(lng - centerLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(centerLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  return distance <= radiusM;
}
