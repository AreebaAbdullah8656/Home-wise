import { PLACES_CACHE_TTL_MS } from "@/lib/places/config";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  verifiedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): {
  value: T;
  verifiedAt: number;
  expiresAt: number;
} | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return {
    value: entry.value as T,
    verifiedAt: entry.verifiedAt,
    expiresAt: entry.expiresAt,
  };
}

export function cacheSet<T>(key: string, value: T, ttlMs = PLACES_CACHE_TTL_MS) {
  const verifiedAt = Date.now();
  const expiresAt = verifiedAt + ttlMs;
  store.set(key, { value, expiresAt, verifiedAt });
  return { verifiedAt, expiresAt };
}

export function cacheKeyNearby(lat: number, lng: number, radius: number) {
  return `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radius)}`;
}

export function cacheKeyText(
  lat: number,
  lng: number,
  query: string,
  radius: number
) {
  return `text:${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radius)}:${query
    .trim()
    .toLowerCase()}`;
}

export function cacheKeyGeocode(address: string) {
  return `geocode:${address.trim().toLowerCase()}`;
}
