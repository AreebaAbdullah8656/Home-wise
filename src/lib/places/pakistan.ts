import type { LatLng } from "@/lib/places/types";

/**
 * Approximate Pakistan bounding box (WGS84).
 * Used to reject geocode hits that land outside the country.
 */
export const PAKISTAN_BBOX = {
  minLat: 23.6345,
  maxLat: 37.0841,
  minLng: 60.8728,
  maxLng: 77.8375,
} as const;

/** Photon bbox param: minLon,minLat,maxLon,maxLat */
export const PAKISTAN_PHOTON_BBOX = [
  PAKISTAN_BBOX.minLng,
  PAKISTAN_BBOX.minLat,
  PAKISTAN_BBOX.maxLng,
  PAKISTAN_BBOX.maxLat,
].join(",");

const OUTSIDE_PK_MESSAGE =
  "That location resolved outside Pakistan. Enter a Pakistan area (for example “Wapda Town, Gujranwala”) or pick your place on the map.";

export function isInPakistan(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PAKISTAN_BBOX.minLat &&
    lat <= PAKISTAN_BBOX.maxLat &&
    lng >= PAKISTAN_BBOX.minLng &&
    lng <= PAKISTAN_BBOX.maxLng
  );
}

export function assertInPakistan(
  location: LatLng
): { ok: true } | { ok: false; message: string } {
  if (isInPakistan(location.latitude, location.longitude)) {
    return { ok: true };
  }
  return { ok: false, message: OUTSIDE_PK_MESSAGE };
}

/** Append ", Pakistan" when the query does not already name the country. */
export function withPakistanSuffix(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  if (/\bpakistan\b/i.test(trimmed)) return trimmed;
  return `${trimmed}, Pakistan`;
}

export function outsidePakistanMessage(): string {
  return OUTSIDE_PK_MESSAGE;
}
