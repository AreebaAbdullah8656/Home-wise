import {
  DEFAULT_NEARBY_RADIUS_M,
  getPlacesProvider,
  placesProviderLabel,
  type PlacesProvider,
} from "@/lib/places/config";
import {
  cacheGet,
  cacheKeyNearby,
  cacheKeyText,
  cacheSet,
} from "@/lib/places/cache";
import { distanceMeters } from "@/lib/places/distance";
import { geocodeAddress } from "@/lib/places/geocode";
import { searchNearbyStores, searchPlacesByText } from "@/lib/places/client";
import {
  searchNearbyOsmStores,
  searchOsmPlacesByText,
} from "@/lib/places/osm-overpass";
import { assertInPakistan } from "@/lib/places/pakistan";
import type {
  LatLng,
  LivePlace,
  LivePlacesResponse,
  LocationSource,
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
  locationSource: LocationSource;
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
  httpStatus?: number;
};

function withDistances(
  places: LivePlace[],
  center: LatLng,
  radiusMeters: number
): LivePlace[] {
  const out: LivePlace[] = [];
  for (const place of places) {
    if (!place.location) continue;
    const dist =
      place.distanceMeters ??
      Math.round(distanceMeters(center, place.location));
    if (dist > radiusMeters) continue;
    out.push({ ...place, distanceMeters: dist });
  }
  out.sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
  );
  return out;
}

export async function resolveCenter(input: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  locationSource?: LocationSource | null;
  locationLabel?: string | null;
}): Promise<ResolveOk | ResolveErr> {
  if (
    input.latitude != null &&
    input.longitude != null &&
    validateCoords(input.latitude, input.longitude)
  ) {
    const center = {
      latitude: input.latitude,
      longitude: input.longitude,
    };
    const inPk = assertInPakistan(center);
    if (!inPk.ok) {
      return {
        ok: false,
        errorCode: "invalid_coordinates",
        message: inPk.message,
      };
    }
    const source: LocationSource =
      input.locationSource === "saved" ||
      input.locationSource === "device" ||
      input.locationSource === "query"
        ? input.locationSource
        : "device";
    return {
      ok: true,
      center,
      locationSource: source,
      locationLabel: input.locationLabel?.trim() || null,
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
        "No location available. Pick your area on the map, allow device location, or set a city/area in Settings.",
    };
  }

  const geo = await geocodeAddress(address);
  if (!geo.ok) {
    return {
      ok: false,
      errorCode: "geocode_failed",
      message: geo.message,
      httpStatus: geo.httpStatus,
    };
  }

  return {
    ok: true,
    center: geo.location,
    locationSource: input.locationSource === "query" ? "query" : "profile",
    locationLabel: geo.formattedAddress,
  };
}

function providerPrefix(provider: PlacesProvider) {
  return provider === "google" ? "google" : "osm";
}

export async function fetchNearbyLivePlaces(input: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radiusMeters?: number;
  bypassCache?: boolean;
  locationSource?: LocationSource | null;
  locationLabel?: string | null;
}): Promise<LivePlacesResponse> {
  const now = new Date().toISOString();
  const provider = getPlacesProvider();
  const resolved = await resolveCenter(input);
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.errorCode,
      message: resolved.message,
      httpStatus: resolved.httpStatus,
      provider,
      lastVerifiedAt: now,
    };
  }

  const radius = input.radiusMeters ?? DEFAULT_NEARBY_RADIUS_M;
  const key = `${providerPrefix(provider)}:${cacheKeyNearby(
    resolved.center.latitude,
    resolved.center.longitude,
    radius
  )}`;

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
        provider,
        lastVerifiedAt: new Date(cached.verifiedAt).toISOString(),
        cached: true,
        cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      };
    }
  }

  const result =
    provider === "google"
      ? await searchNearbyStores(resolved.center, radius)
      : await searchNearbyOsmStores(resolved.center, radius);

  if (!result.ok) {
    return {
      ok: false,
      code: "places_failed",
      message: `${placesProviderLabel(provider)}: ${result.message}`,
      provider,
      lastVerifiedAt: now,
    };
  }

  const places = withDistances(result.places, resolved.center, radius);
  const { verifiedAt, expiresAt } = cacheSet(key, places);
  return {
    ok: true,
    places,
    center: resolved.center,
    radiusMeters: radius,
    locationSource: resolved.locationSource,
    locationLabel: resolved.locationLabel,
    provider,
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
  locationSource?: LocationSource | null;
  locationLabel?: string | null;
}): Promise<LivePlacesResponse> {
  const now = new Date().toISOString();
  const provider = getPlacesProvider();
  const query = input.query.trim();
  if (!query) {
    return {
      ok: false,
      code: "places_failed",
      message: "Search query is empty.",
      provider,
      lastVerifiedAt: now,
    };
  }

  const resolved = await resolveCenter(input);
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.errorCode,
      message: resolved.message,
      httpStatus: resolved.httpStatus,
      provider,
      lastVerifiedAt: now,
    };
  }

  const radius = input.radiusMeters ?? DEFAULT_NEARBY_RADIUS_M;
  const key = `${providerPrefix(provider)}:${cacheKeyText(
    resolved.center.latitude,
    resolved.center.longitude,
    query,
    radius
  )}`;

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
        provider,
        lastVerifiedAt: new Date(cached.verifiedAt).toISOString(),
        cached: true,
        cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      };
    }
  }

  const result =
    provider === "google"
      ? await searchPlacesByText(query, resolved.center, radius)
      : await searchOsmPlacesByText(query, resolved.center, radius);

  if (!result.ok) {
    return {
      ok: false,
      code: "places_failed",
      message: `${placesProviderLabel(provider)}: ${result.message}`,
      provider,
      lastVerifiedAt: now,
    };
  }

  const places = withDistances(result.places, resolved.center, radius);
  const { verifiedAt, expiresAt } = cacheSet(key, places);
  return {
    ok: true,
    places,
    center: resolved.center,
    radiusMeters: radius,
    locationSource: resolved.locationSource,
    locationLabel: resolved.locationLabel,
    provider,
    lastVerifiedAt: new Date(verifiedAt).toISOString(),
    cached: false,
    cacheExpiresAt: new Date(expiresAt).toISOString(),
  };
}
