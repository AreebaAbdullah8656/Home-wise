import {
  getNominatimUrl,
  getOsmUserAgent,
  NOMINATIM_CACHE_TTL_MS,
} from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import { withNominatimRateLimit } from "@/lib/places/rate-limit";
import type { LatLng } from "@/lib/places/types";

type GeocodeOk = {
  ok: true;
  location: LatLng;
  formattedAddress: string;
  cached: boolean;
};

type GeocodeErr = {
  ok: false;
  message: string;
};

export type GeocodeResult = GeocodeOk | GeocodeErr;

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

/**
 * Nominatim forward geocode — server-side only.
 * Honors User-Agent, caching, and ~1 req/s rate limit.
 */
export async function geocodeWithNominatim(
  address: string
): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }

  const cacheKey = `osm-geo:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<Omit<GeocodeOk, "ok" | "cached">>(cacheKey);
  if (cached) {
    return { ok: true, ...cached.value, cached: true };
  }

  return withNominatimRateLimit(async () => {
    const url = new URL(`${getNominatimUrl().replace(/\/$/, "")}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "0");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": getOsmUserAgent(),
        },
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
      return {
        ok: false,
        message: `Nominatim HTTP ${response.status}. Try again later or set a clearer Settings location.`,
      };
    }

    const data = (await response.json()) as NominatimResult[];
    if (!Array.isArray(data) || data.length === 0) {
      return {
        ok: false,
        message: `Could not geocode “${trimmed}” via OpenStreetMap Nominatim. Update Settings → Location with a clearer city or area.`,
      };
    }

    const first = data[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, message: "Nominatim returned no coordinates." };
    }

    const value = {
      location: { latitude: lat, longitude: lng },
      formattedAddress: first.display_name?.trim() || trimmed,
    };
    cacheSet(cacheKey, value, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, ...value, cached: false };
  });
}
