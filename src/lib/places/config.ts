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
 * Contact email embedded in Nominatim/Overpass User-Agent (usage policy).
 * Nominatim returns HTTP 403 for missing UA or placeholder example.com contacts.
 */
export const DEFAULT_NOMINATIM_CONTACT_EMAIL =
  "abdulahad.abdullah8656@gmail.com";

export function getNominatimContactEmail(): string {
  return (
    process.env.NOMINATIM_CONTACT_EMAIL?.trim() ||
    DEFAULT_NOMINATIM_CONTACT_EMAIL
  );
}

/** Accept-Language for Nominatim (and shared OSM geocode fetches). */
export function getNominatimAcceptLanguage(): string {
  return process.env.NOMINATIM_ACCEPT_LANGUAGE?.trim() || "en";
}

/**
 * OSM/Nominatim/Overpass identifying User-Agent.
 * Missing / non-identifying UA → Nominatim 403; Overpass 406.
 * Full override: NOMINATIM_USER_AGENT or OVERPASS_USER_AGENT.
 * Otherwise: HomeWise/1.0 (contact: <NOMINATIM_CONTACT_EMAIL>).
 */
export function getOsmUserAgent(): string {
  return (
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    process.env.OVERPASS_USER_AGENT?.trim() ||
    `HomeWise/1.0 (contact: ${getNominatimContactEmail()})`
  );
}

/** @deprecated Use getOsmUserAgent — same identifying string for Nominatim + Overpass. */
export function getNominatimUserAgent(): string {
  return getOsmUserAgent();
}

export const OVERPASS_DEFAULT_URL =
  "https://overpass-api.de/api/interpreter";

export const OVERPASS_MIRROR_URLS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;

export function getOverpassUrl(): string {
  return process.env.OVERPASS_API_URL?.trim() || OVERPASS_DEFAULT_URL;
}

/** Primary + mirrors (primary first; env override still tried first). */
export function getOverpassEndpoints(): string[] {
  const primary = getOverpassUrl();
  const rest = [OVERPASS_DEFAULT_URL, ...OVERPASS_MIRROR_URLS].filter(
    (url) => url !== primary
  );
  return [primary, ...rest];
}

export function getNominatimUrl(): string {
  return (
    process.env.NOMINATIM_URL?.trim() ||
    "https://nominatim.openstreetmap.org"
  );
}
