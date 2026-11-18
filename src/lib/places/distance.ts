import type { LatLng } from "@/lib/places/types";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in meters (Haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Format meters as "0.8 km" / "1.2 km" for shop cards. */
export function formatDistanceKm(meters: number | null | undefined): string | null {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export const RADIUS_KM_OPTIONS = [1, 3, 5, 10] as const;
export type RadiusKm = (typeof RADIUS_KM_OPTIONS)[number];

export function normalizeRadiusKm(value: number | null | undefined): RadiusKm {
  if (value === 1 || value === 3 || value === 5 || value === 10) return value;
  return 3;
}

export function radiusKmToMeters(km: RadiusKm): number {
  return km * 1000;
}
