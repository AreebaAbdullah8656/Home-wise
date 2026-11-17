/**
 * Google Maps / Places — server-only.
 * Never expose the key to the browser.
 */

export function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    ""
  );
}

export function isGooglePlacesConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export function missingPlacesMessage(): string {
  return (
    "Google Maps / Places API key is not set. Add GOOGLE_MAPS_API_KEY " +
    "(or GOOGLE_PLACES_API_KEY) to .env.local on the server, enable Places API (New) " +
    "and Geocoding API in Google Cloud, then restart the app. " +
    "HomeWise will not show sample or fake store data."
  );
}

/** Cache TTL for live place results (ms). Expired entries are discarded. */
export const PLACES_CACHE_TTL_MS = 5 * 60 * 1000;

/** Default search radius in meters (max 50_000). */
export const DEFAULT_NEARBY_RADIUS_M = 5000;
