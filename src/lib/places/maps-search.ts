import type { LatLng } from "@/lib/places/types";

/**
 * Google Maps search URL (no API key).
 * With coords: `name lat,lon`. Without: `name city`.
 */
export function googleMapsSearchUrl(opts: {
  name: string;
  location?: LatLng | null;
  fallbackCity?: string | null;
}): string | null {
  const name = opts.name.trim();
  if (!name) return null;

  const parts: string[] = [name];
  const lat = opts.location?.latitude;
  const lon = opts.location?.longitude;
  if (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon)
  ) {
    parts.push(`${lat},${lon}`);
  } else {
    const city = opts.fallbackCity?.trim();
    if (city) parts.push(city);
  }

  const query = parts.join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Tiny human label from OSM/Google primary type (e.g. shop:supermarket → Supermarket). */
export function formatPlaceTypeLabel(primaryType: string | null | undefined): string | null {
  if (!primaryType?.trim()) return null;
  const raw = primaryType.includes(":")
    ? primaryType.slice(primaryType.indexOf(":") + 1)
    : primaryType;
  const cleaned = raw.replace(/_/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function hasUsablePlaceName(name: string | null | undefined): boolean {
  return Boolean(name?.trim());
}
