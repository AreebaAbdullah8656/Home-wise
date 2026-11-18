import {
  getNominatimAcceptLanguage,
  getNominatimUrl,
  getOsmUserAgent,
  NOMINATIM_CACHE_TTL_MS,
} from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import {
  assertInPakistan,
  withPakistanSuffix,
} from "@/lib/places/pakistan";
import { withNominatimRateLimit } from "@/lib/places/rate-limit";
import type { LatLng } from "@/lib/places/types";

type GeocodePayload = {
  location: LatLng;
  formattedAddress: string;
};

type GeocodeOk = GeocodePayload & {
  ok: true;
  cached: boolean;
  provider: "nominatim";
};

type GeocodeErr = {
  ok: false;
  message: string;
  httpStatus?: number;
};

export type GeocodeResult = GeocodeOk | GeocodeErr;

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

function nominatimHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Accept-Language": getNominatimAcceptLanguage(),
    "User-Agent": getOsmUserAgent(),
  };
}

/**
 * Nominatim forward geocode — server-side only.
 * Pakistan-only: countrycodes=pk + ", Pakistan" suffix + bbox reject.
 * Honors identifying User-Agent + Accept-Language, caching, and ~1 req/s.
 */
export async function geocodeWithNominatim(
  address: string
): Promise<GeocodeResult> {
  const trimmed = withPakistanSuffix(address);
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }

  const cacheKey = `osm-geo-pk:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<GeocodePayload>(cacheKey);
  if (cached) {
    return {
      ok: true,
      ...cached.value,
      cached: true,
      provider: "nominatim",
    };
  }

  return withNominatimRateLimit(async () => {
    const again = cacheGet<GeocodePayload>(cacheKey);
    if (again) {
      return {
        ok: true,
        ...again.value,
        cached: true,
        provider: "nominatim",
      };
    }

    const url = new URL(`${getNominatimUrl().replace(/\/$/, "")}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("countrycodes", "pk");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: nominatimHeaders(),
        cache: "no-store",
      });
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? `Nominatim request failed: ${error.message}`
            : "Nominatim request failed.",
      };
    }

    if (!response.ok) {
      const hint =
        response.status === 403
          ? " Access denied — check User-Agent/contact email, allow device location to skip geocoding, or wait and retry."
          : response.status === 429
            ? " Rate limited — wait a moment, allow device location to skip geocoding, or retry."
            : " Try again later or set a clearer Settings location.";
      return {
        ok: false,
        httpStatus: response.status,
        message: `Nominatim HTTP ${response.status}.${hint}`,
      };
    }

    const data = (await response.json()) as NominatimResult[];
    if (!Array.isArray(data) || data.length === 0) {
      return {
        ok: false,
        message: `Could not geocode “${trimmed}” in Pakistan via OpenStreetMap Nominatim. Try a clearer area (e.g. “Wapda Town, Gujranwala”).`,
      };
    }

    const first = data[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, message: "Nominatim returned no coordinates." };
    }

    const location = { latitude: lat, longitude: lng };
    const inPk = assertInPakistan(location);
    if (!inPk.ok) {
      return { ok: false, message: inPk.message };
    }

    const value: GeocodePayload = {
      location,
      formattedAddress: first.display_name?.trim() || trimmed,
    };
    cacheSet(cacheKey, value, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, ...value, cached: false, provider: "nominatim" };
  });
}
