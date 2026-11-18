import { NOMINATIM_CACHE_TTL_MS } from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import type { LatLng } from "@/lib/places/types";

type GeocodeOk = {
  ok: true;
  location: LatLng;
  formattedAddress: string;
  cached: boolean;
  provider: "photon";
};

type GeocodeErr = {
  ok: false;
  message: string;
  httpStatus?: number;
};

export type PhotonGeocodeResult = GeocodeOk | GeocodeErr;

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function formatPhotonAddress(props: PhotonFeature["properties"], fallback: string) {
  if (!props) return fallback;
  const parts = [
    [props.housenumber, props.street].filter(Boolean).join(" "),
    props.city,
    props.state,
    props.country,
  ].filter((p) => p && String(p).trim());
  if (parts.length) return parts.join(", ");
  return props.name?.trim() || fallback;
}

/** Photon (Komoot) forward geocode — Nominatim fallback. */
export async function geocodeWithPhoton(
  address: string
): Promise<PhotonGeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }

  const cacheKey = `photon-geo:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<Omit<GeocodeOk, "ok" | "cached">>(cacheKey);
  if (cached) {
    return { ok: true, ...cached.value, cached: true };
  }

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "1");

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
          ? `Photon geocode failed: ${error.message}`
          : "Photon geocode failed.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      message: `Photon HTTP ${response.status}.`,
    };
  }

  const data = (await response.json()) as PhotonResponse;
  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!feature || !Array.isArray(coords) || coords.length < 2) {
    return {
      ok: false,
      message: `Could not geocode “${trimmed}” via Photon.`,
    };
  }

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: "Photon returned no coordinates." };
  }

  const payload = {
    location: { latitude: lat, longitude: lng },
    formattedAddress: formatPhotonAddress(feature.properties, trimmed),
  };
  const value = { ...payload, provider: "photon" as const };
  cacheSet(cacheKey, value, NOMINATIM_CACHE_TTL_MS);
  return { ok: true, ...value, cached: false };
}
