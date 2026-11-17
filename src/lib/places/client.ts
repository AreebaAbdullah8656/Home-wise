import {
  getGoogleMapsApiKey,
  isGooglePlacesConfigured,
  missingPlacesMessage,
} from "@/lib/places/config";
import {
  FIELD_MASK_BASIC,
  FIELD_MASK_FULL,
  FIELD_MASK_NO_DELIVERY,
  NEARBY_INCLUDED_TYPES,
  normalizePlace,
} from "@/lib/places/normalize";
import type { LatLng, LivePlace } from "@/lib/places/types";

async function placesPost(
  path: "places:searchNearby" | "places:searchText",
  body: Record<string, unknown>,
  fieldMask: string
): Promise<{ ok: true; places: unknown[] } | { ok: false; message: string; status: number }> {
  if (!isGooglePlacesConfigured()) {
    return { ok: false, message: missingPlacesMessage(), status: 0 };
  }

  let response: Response;
  try {
    response = await fetch(`https://places.googleapis.com/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getGoogleMapsApiKey(),
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message:
        error instanceof Error
          ? `Places request failed: ${error.message}`
          : "Places request failed.",
    };
  }

  const raw = await response.text();
  let json: { places?: unknown[]; error?: { message?: string; status?: string } } =
    {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    return {
      ok: false,
      status: response.status,
      message: `Places returned non-JSON (HTTP ${response.status}).`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message:
        json.error?.message ||
        `Places API HTTP ${response.status}. Enable Places API (New) for this key.`,
    };
  }

  return { ok: true, places: json.places ?? [] };
}

async function placesPostWithFallback(
  path: "places:searchNearby" | "places:searchText",
  body: Record<string, unknown>
): Promise<{ ok: true; places: unknown[] } | { ok: false; message: string }> {
  const attempts = [FIELD_MASK_FULL, FIELD_MASK_NO_DELIVERY, FIELD_MASK_BASIC];
  let lastMessage = "Places API request failed.";

  for (const mask of attempts) {
    const result = await placesPost(path, body, mask);
    if (result.ok) return result;
    lastMessage = result.message;
    // Retry only on field/permission style failures
    if (result.status !== 400 && result.status !== 403) {
      return { ok: false, message: result.message };
    }
  }
  return { ok: false, message: lastMessage };
}

function mapPlaces(raw: unknown[], verifiedAt: Date): LivePlace[] {
  const out: LivePlace[] = [];
  for (const item of raw) {
    const normalized = normalizePlace(
      item as Parameters<typeof normalizePlace>[0],
      verifiedAt
    );
    if (normalized) out.push(normalized);
  }
  return out;
}

export async function searchNearbyStores(
  center: LatLng,
  radiusMeters: number,
  maxResultCount = 20
): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const body = {
    includedTypes: [...NEARBY_INCLUDED_TYPES],
    maxResultCount: Math.min(Math.max(maxResultCount, 1), 20),
    rankPreference: "DISTANCE",
    locationRestriction: {
      circle: {
        center: {
          latitude: center.latitude,
          longitude: center.longitude,
        },
        radius: radiusMeters,
      },
    },
  };

  const result = await placesPostWithFallback("places:searchNearby", body);
  if (!result.ok) return result;
  return { ok: true, places: mapPlaces(result.places, new Date()) };
}

export async function searchPlacesByText(
  textQuery: string,
  center: LatLng,
  radiusMeters: number,
  maxResultCount = 8
): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const q = textQuery.trim();
  if (!q) return { ok: true, places: [] };

  const body = {
    textQuery: q,
    maxResultCount: Math.min(Math.max(maxResultCount, 1), 20),
    locationBias: {
      circle: {
        center: {
          latitude: center.latitude,
          longitude: center.longitude,
        },
        radius: radiusMeters,
      },
    },
  };

  const result = await placesPostWithFallback("places:searchText", body);
  if (!result.ok) return result;
  return { ok: true, places: mapPlaces(result.places, new Date()) };
}
