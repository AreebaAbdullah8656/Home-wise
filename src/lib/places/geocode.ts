import {
  getPlacesProvider,
  NOMINATIM_CACHE_TTL_MS,
} from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import { geocodeWithGoogle } from "@/lib/places/geocode-google";
import { geocodeWithOpenMeteo } from "@/lib/places/geocode-open-meteo";
import { geocodeWithPhoton } from "@/lib/places/geocode-photon";
import { geocodeWithNominatim } from "@/lib/places/osm-nominatim";
import type { LatLng } from "@/lib/places/types";

export type GeocodeProvider =
  | "nominatim"
  | "photon"
  | "open-meteo"
  | "google";

type GeocodePayload = {
  location: LatLng;
  formattedAddress: string;
  provider: GeocodeProvider;
};

type GeocodeOk = GeocodePayload & {
  ok: true;
  cached: boolean;
};

type GeocodeErr = {
  ok: false;
  message: string;
  httpStatus?: number;
};

export type GeocodeResult = GeocodeOk | GeocodeErr;

const FALLBACK_STATUSES = new Set([403, 429]);

function shouldUseFallback(result: {
  ok: boolean;
  httpStatus?: number;
}): boolean {
  return (
    !result.ok &&
    result.httpStatus != null &&
    FALLBACK_STATUSES.has(result.httpStatus)
  );
}

/**
 * Geocode via active provider.
 * OSM path: Nominatim (UA + rate limit + cache) → Photon → Open-Meteo on 403/429.
 * Prefer passing device lat/lng so this is skipped entirely.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }

  if (getPlacesProvider() === "google") {
    return geocodeWithGoogle(trimmed);
  }

  const sharedKey = `geo:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<GeocodePayload>(sharedKey);
  if (cached) {
    return { ok: true, ...cached.value, cached: true };
  }

  const nominatim = await geocodeWithNominatim(trimmed);
  if (nominatim.ok) {
    const payload: GeocodePayload = {
      location: nominatim.location,
      formattedAddress: nominatim.formattedAddress,
      provider: "nominatim",
    };
    cacheSet(sharedKey, payload, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, ...payload, cached: nominatim.cached };
  }

  if (!shouldUseFallback(nominatim)) {
    return nominatim;
  }

  const photon = await geocodeWithPhoton(trimmed);
  if (photon.ok) {
    const payload: GeocodePayload = {
      location: photon.location,
      formattedAddress: photon.formattedAddress,
      provider: "photon",
    };
    cacheSet(sharedKey, payload, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, ...payload, cached: photon.cached };
  }

  const openMeteo = await geocodeWithOpenMeteo(trimmed);
  if (openMeteo.ok) {
    const payload: GeocodePayload = {
      location: openMeteo.location,
      formattedAddress: openMeteo.formattedAddress,
      provider: "open-meteo",
    };
    cacheSet(sharedKey, payload, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, ...payload, cached: openMeteo.cached };
  }

  return {
    ok: false,
    httpStatus: nominatim.httpStatus,
    message: [
      nominatim.message.trim(),
      "Fallbacks also failed:",
      photon.message,
      openMeteo.message,
      "Allow device location to skip geocoding, or set a clearer Settings → Location.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}
