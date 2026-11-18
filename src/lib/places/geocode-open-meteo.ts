import { NOMINATIM_CACHE_TTL_MS } from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import type { LatLng } from "@/lib/places/types";

type GeocodeOk = {
  ok: true;
  location: LatLng;
  formattedAddress: string;
  cached: boolean;
  provider: "open-meteo";
};

type GeocodeErr = {
  ok: false;
  message: string;
  httpStatus?: number;
};

export type OpenMeteoGeocodeResult = GeocodeOk | GeocodeErr;

type OpenMeteoResult = {
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country?: string;
};

type OpenMeteoResponse = {
  results?: OpenMeteoResult[];
};

function formatOpenMeteoAddress(row: OpenMeteoResult, fallback: string) {
  const parts = [row.name, row.admin1, row.country].filter(
    (p) => p && String(p).trim()
  );
  return parts.length ? parts.join(", ") : fallback;
}

/** Open-Meteo geocoding API — Nominatim / Photon fallback. */
export async function geocodeWithOpenMeteo(
  address: string
): Promise<OpenMeteoGeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }

  const cacheKey = `open-meteo-geo:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<Omit<GeocodeOk, "ok" | "cached">>(cacheKey);
  if (cached) {
    return { ok: true, ...cached.value, cached: true };
  }

  // Open-Meteo matches place names best when given the primary locality.
  const nameHint = trimmed.split(",")[0]?.trim() || trimmed;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", nameHint);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Open-Meteo geocode failed: ${error.message}`
          : "Open-Meteo geocode failed.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      message: `Open-Meteo HTTP ${response.status}.`,
    };
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const first = data.results?.[0];
  const lat = first?.latitude;
  const lng = first?.longitude;
  if (
    !first ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return {
      ok: false,
      message: `Could not geocode “${trimmed}” via Open-Meteo.`,
    };
  }

  const payload = {
    location: { latitude: lat, longitude: lng },
    formattedAddress: formatOpenMeteoAddress(first, trimmed),
  };
  const value = { ...payload, provider: "open-meteo" as const };
  cacheSet(cacheKey, value, NOMINATIM_CACHE_TTL_MS);
  return { ok: true, ...value, cached: false };
}
