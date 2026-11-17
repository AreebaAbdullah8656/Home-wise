import {
  DEFAULT_NEARBY_RADIUS_M,
  isGooglePlacesConfigured,
  missingPlacesMessage,
} from "@/lib/places/config";
import {
  cacheGet,
  cacheKeyNearby,
  cacheKeyText,
  cacheSet,
} from "@/lib/places/cache";
import { geocodeAddress } from "@/lib/places/geocode";
import { searchNearbyStores, searchPlacesByText } from "@/lib/places/client";
import type {
  LatLng,
  LivePlace,
  LivePlacesResponse,
} from "@/lib/places/types";
import { partitionLivePlaces } from "@/lib/places/partition";

export { partitionLivePlaces };

function validateCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

type ResolveOk = {
  ok: true;
  center: LatLng;
  locationSource: "device" | "profile" | "query";
  locationLabel: string | null;
};

type ResolveErr = {
  ok: false;
  errorCode:
    | "missing_location"
    | "geocode_failed"
    | "invalid_coordinates"
    | "missing_api_key";
  message: string;
};

export async function resolveCenter(input: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}): Promise<ResolveOk | ResolveErr> {
  if (!isGooglePlacesConfigured()) {
    return {
      ok: false,
      errorCode: "missing_api_key",
      message: missingPlacesMessage(),
    };
  }

  if (
    input.latitude != null &&
    input.longitude != null &&
    validateCoords(input.latitude, input.longitude)
  ) {
    return {
      ok: true,
      center: { latitude: input.latitude, longitude: input.longitude },
      locationSource: "device",
      locationLabel: null,
    };
  }

  if (
    input.latitude != null &&
    input.longitude != null &&
    !validateCoords(input.latitude, input.longitude)
  ) {
    return {
      ok: false,
      errorCode: "invalid_coordinates",
      message: "Invalid coordinates provided.",
    };
  }

  const address = input.address?.trim();
  if (!address) {
    return {
      ok: false,
      errorCode: "missing_location",
      message:
        "No location available. Allow device location or set an optional city/area in Settings, then reload.",
    };
  }

  const geo = await geocodeAddress(address);
  if (!geo.ok) {
    return { ok: false, errorCode: "geocode_failed", message: geo.message };
  }

  return {
    ok: true,
    center: geo.location,
    locationSource: "profile",
    locationLabel: geo.formattedAddress,
  };
}

export async function fetchNearbyLivePlaces(input: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radiusMeters?: number;
  bypassCache?: boolean;
}): Promise<LivePlacesResponse> {
  const now = new Date().toISOString();
  const resolved = await resolveCenter(input);
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.errorCode,
      message: resolved.message,
      lastVerifiedAt: now,
    };
  }

  const radius = input.radiusMeters ?? DEFAULT_NEARBY_RADIUS_M;
  const key = cacheKeyNearby(
    resolved.center.latitude,
    resolved.center.longitude,
    radius
  );

  if (!input.bypassCache) {
    const cached = cacheGet<LivePlace[]>(key);
    if (cached) {
      return {
        ok: true,
        places: cached.value,
        center: resolved.center,
        radiusMeters: radius,
        locationSource: resolved.locationSource,
        locationLabel: resolved.locationLabel,
        lastVerifiedAt: new Date(cached.verifiedAt).toISOString(),
        cached: true,
        cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      };
    }
  }

  const result = await searchNearbyStores(resolved.center, radius);
  if (!result.ok) {
    return {
      ok: false,
      code: "places_failed",
      message: result.message,
      lastVerifiedAt: now,
    };
  }

  const { verifiedAt, expiresAt } = cacheSet(key, result.places);
  return {
    ok: true,
    places: result.places,
    center: resolved.center,
    radiusMeters: radius,
    locationSource: resolved.locationSource,
    locationLabel: resolved.locationLabel,
    lastVerifiedAt: new Date(verifiedAt).toISOString(),
    cached: false,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function fetchTextSearchLivePlaces(input: {
  query: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radiusMeters?: number;
  bypassCache?: boolean;
}): Promise<LivePlacesResponse> {
  const now = new Date().toISOString();
  const query = input.query.trim();
  if (!query) {
    return {
      ok: false,
      code: "places_failed",
      message: "Search query is empty.",
      lastVerifiedAt: now,
    };
  }

  const resolved = await resolveCenter(input);
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.errorCode,
      message: resolved.message,
      lastVerifiedAt: now,
    };
  }

  const radius = input.radiusMeters ?? DEFAULT_NEARBY_RADIUS_M;
  const key = cacheKeyText(
    resolved.center.latitude,
    resolved.center.longitude,
    query,
    radius
  );

  if (!input.bypassCache) {
    const cached = cacheGet<LivePlace[]>(key);
    if (cached) {
      return {
        ok: true,
        places: cached.value,
        center: resolved.center,
        radiusMeters: radius,
        locationSource: resolved.locationSource,
        locationLabel: resolved.locationLabel,
        lastVerifiedAt: new Date(cached.verifiedAt).toISOString(),
        cached: true,
        cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      };
    }
  }

  const result = await searchPlacesByText(query, resolved.center, radius);
  if (!result.ok) {
    return {
      ok: false,
      code: "places_failed",
      message: result.message,
      lastVerifiedAt: now,
    };
  }

  const { verifiedAt, expiresAt } = cacheSet(key, result.places);
  return {
    ok: true,
    places: result.places,
    center: resolved.center,
    radiusMeters: radius,
    locationSource: resolved.locationSource,
    locationLabel: resolved.locationLabel,
    lastVerifiedAt: new Date(verifiedAt).toISOString(),
    cached: false,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
}

