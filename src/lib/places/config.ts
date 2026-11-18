/**
 * Live recommendations providers — server-only.
 * Default: OpenStreetMap (Nominatim + Overpass), free, no API key.
 * Optional: Google Places when GOOGLE_MAPS_API_KEY / GOOGLE_PLACES_API_KEY is set.
 */

export type PlacesProvider = "osm" | "google";

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

/** Provider selection: Google only when a Maps/Places key is set; otherwise OSM. */
export function getPlacesProvider(): PlacesProvider {
  return isGooglePlacesConfigured() ? "google" : "osm";
}

/** Live recommendations always have a provider (OSM needs no key). */
export function isLiveRecommendationsAvailable(): boolean {
  return true;
}

export function placesProviderLabel(provider: PlacesProvider = getPlacesProvider()): string {
  return provider === "google" ? "Google Places" : "OpenStreetMap";
}

export function missingGoogleKeyHint(): string {
  return (
    "Optional: add GOOGLE_MAPS_API_KEY (or GOOGLE_PLACES_API_KEY) to .env.local " +
    "and enable Places API (New) + Geocoding to use Google instead of OpenStreetMap."
  );
}

/** @deprecated Prefer getPlacesProvider / honest empty states — OSM needs no key. */
export function missingPlacesMessage(): string {
  return (
    "Live recommendations use OpenStreetMap by default (no key). " +
    missingGoogleKeyHint()
  );
}

/** Nearby / Overpass / Places result cache TTL. */
export const PLACES_CACHE_TTL_MS = 10 * 60 * 1000;

/** Nominatim geocode cache — longer to respect usage policy. */
export const NOMINATIM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Default search radius in meters. */
export const DEFAULT_NEARBY_RADIUS_M = 5000;

/**
 * Nominatim requires a valid identifying User-Agent.
 * Override with NOMINATIM_USER_AGENT in .env.local if you have a contact URL/email.
 */
export function getNominatimUserAgent(): string {
  return (
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    "HomeWise/1.0 (household budget companion; server-side; https://github.com/local/homewise)"
  );
}

export function getOverpassUrl(): string {
  return (
    process.env.OVERPASS_API_URL?.trim() ||
    "https://overpass-api.de/api/interpreter"
  );
}

export function getNominatimUrl(): string {
  return (
    process.env.NOMINATIM_URL?.trim() ||
    "https://nominatim.openstreetmap.org"
  );
}
