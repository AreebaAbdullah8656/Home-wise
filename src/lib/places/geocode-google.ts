import {
  getGoogleMapsApiKey,
  isGooglePlacesConfigured,
} from "@/lib/places/config";
import { cacheGet, cacheKeyGeocode, cacheSet } from "@/lib/places/cache";
import type { LatLng } from "@/lib/places/types";

type GeocodeOk = {
  ok: true;
  location: LatLng;
  formattedAddress: string;
  cached: boolean;
  provider: "google";
};

type GeocodeErr = {
  ok: false;
  message: string;
  httpStatus?: number;
};

export type GeocodeResult = GeocodeOk | GeocodeErr;

export async function geocodeWithGoogle(
  address: string
): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return { ok: false, message: "Location text is empty." };
  }
  if (!isGooglePlacesConfigured()) {
    return {
      ok: false,
      message: "Google Geocoding requires GOOGLE_MAPS_API_KEY.",
    };
  }

  const key = `google-geo:${cacheKeyGeocode(trimmed)}`;
  const cached = cacheGet<Omit<GeocodeOk, "ok" | "cached">>(key);
  if (cached) {
    return {
      ok: true,
      ...cached.value,
      cached: true,
      provider: "google",
    };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", trimmed);
  url.searchParams.set("key", getGoogleMapsApiKey());

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Geocoding request failed: ${error.message}`
          : "Geocoding request failed.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      message: `Geocoding HTTP ${response.status}. Check Geocoding API is enabled for your key.`,
    };
  }

  const data = (await response.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) {
    return {
      ok: false,
      message:
        data.error_message ||
        `Could not geocode “${trimmed}” (${data.status}). Update Settings → Location with a clearer city or area.`,
    };
  }

  const first = data.results[0];
  const lat = first.geometry?.location?.lat;
  const lng = first.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { ok: false, message: "Geocoding returned no coordinates." };
  }

  const value = {
    location: { latitude: lat, longitude: lng },
    formattedAddress: first.formatted_address ?? trimmed,
  };
  cacheSet(key, value);
  return { ok: true, ...value, cached: false, provider: "google" };
}
