import {
  getOsmUserAgent,
  getOverpassEndpoints,
  PLACES_CACHE_TTL_MS,
} from "@/lib/places/config";
import {
  cacheGet,
  cacheKeyNearby,
  cacheKeyText,
  cacheSet,
} from "@/lib/places/cache";
import type { DeliveryInfo, LatLng, LivePlace } from "@/lib/places/types";

/** OSM shop / amenity values for household discovery. */
const SHOP_VALUES = [
  "supermarket",
  "convenience",
  "greengrocer",
  "bakery",
  "butcher",
  "chemist",
  "hardware",
  "doityourself",
  "clothes",
  "fashion",
  "shoes",
  "furniture",
  "electronics",
  "appliance",
  "houseware",
  "bathroom_furnishing",
  "department_store",
  "variety_store",
  "general",
  "wholesale",
  "laundry",
  "dry_cleaning",
  "stationery",
  "gift",
].join("|");

/** Retry these statuses on the next Overpass mirror. */
const MIRROR_RETRY_STATUSES = new Set([406, 429, 503, 504]);

/** Per-endpoint fetch budget (ms) — avoids hanging on a slow mirror. */
const OVERPASS_FETCH_TIMEOUT_MS = 28_000;

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function unavailableDelivery(): DeliveryInfo {
  return {
    status: "unavailable",
    label: "Delivery information unavailable",
    detail:
      "OpenStreetMap does not reliably confirm delivery or free delivery for this place.",
  };
}

function formatAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:neighbourhood"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:postcode"],
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return tags["addr:full"]?.trim() || null;
}

function primaryTypeFromTags(tags: Record<string, string>): string | null {
  if (tags.shop) return `shop:${tags.shop}`;
  if (tags.amenity) return `amenity:${tags.amenity}`;
  if (tags.craft) return `craft:${tags.craft}`;
  return null;
}

function normalizeElement(
  el: OverpassElement,
  verifiedAt: Date
): LivePlace | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim() || tags.brand?.trim() || tags.operator?.trim();
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const location: LatLng | null =
    typeof lat === "number" && typeof lon === "number"
      ? { latitude: lat, longitude: lon }
      : null;

  const placeId = `osm:${el.type}/${el.id}`;
  const mapsUrl =
    location != null
      ? `https://www.openstreetmap.org/${el.type}/${el.id}#map=18/${location.latitude}/${location.longitude}`
      : `https://www.openstreetmap.org/${el.type}/${el.id}`;

  const website =
    tags.website?.trim() ||
    tags["contact:website"]?.trim() ||
    tags.url?.trim() ||
    null;
  const phone =
    tags.phone?.trim() || tags["contact:phone"]?.trim() || null;

  const types: string[] = [];
  if (tags.shop) types.push(`shop:${tags.shop}`);
  if (tags.amenity) types.push(`amenity:${tags.amenity}`);

  return {
    placeId,
    name,
    address: formatAddress(tags),
    primaryType: primaryTypeFromTags(tags),
    types,
    rating: null,
    userRatingCount: null,
    businessStatus: tags.opening_hours ? "HAS_HOURS" : null,
    websiteUrl: website,
    mapsUrl,
    phone,
    location,
    delivery: unavailableDelivery(),
    verifiedProductPrice: null,
    source: "OpenStreetMap",
    attributions: ["© OpenStreetMap contributors"],
    lastVerifiedAt: verifiedAt.toISOString(),
  };
}

function statusMessage(status: number, endpoint: string): string {
  if (status === 406) {
    return `Overpass HTTP 406 from ${endpoint} (Not Acceptable — usually missing/rejected User-Agent or Accept).`;
  }
  if (status === 429 || status === 503 || status === 504) {
    return `Overpass HTTP ${status} from ${endpoint}. The server may be busy — try again shortly.`;
  }
  return `Overpass HTTP ${status} from ${endpoint}.`;
}

async function postOverpass(
  endpoint: string,
  query: string
): Promise<
  | { ok: true; elements: OverpassElement[]; endpoint: string }
  | { ok: false; status: number; message: string; endpoint: string }
> {
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_FETCH_TIMEOUT_MS);
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, */*",
        "User-Agent": getOsmUserAgent(),
      },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted;
    return {
      ok: false,
      status: 0,
      endpoint,
      message: aborted
        ? `Overpass request timed out (${endpoint}).`
        : error instanceof Error
          ? `Overpass request failed (${endpoint}): ${error.message}`
          : `Overpass request failed (${endpoint}).`,
    };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      endpoint,
      message: statusMessage(response.status, endpoint),
    };
  }

  try {
    const data = (await response.json()) as { elements?: OverpassElement[] };
    return {
      ok: true,
      elements: data.elements ?? [],
      endpoint,
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      endpoint,
      message: `Overpass returned non-JSON from ${endpoint}.`,
    };
  }
}

/**
 * POST Overpass with identifying User-Agent.
 * On 406/429/503/504 or timeout/network failure, try configured mirrors.
 */
async function runOverpass(
  query: string
): Promise<{ ok: true; elements: OverpassElement[] } | { ok: false; message: string }> {
  const endpoints = getOverpassEndpoints();
  const attempts: string[] = [];

  for (const endpoint of endpoints) {
    const result = await postOverpass(endpoint, query);
    if (result.ok) {
      return { ok: true, elements: result.elements };
    }
    attempts.push(result.message);
    if (result.status !== 0 && !MIRROR_RETRY_STATUSES.has(result.status)) {
      // Non-retryable HTTP (e.g. 400 query error) — stop early
      return { ok: false, message: result.message };
    }
  }

  return {
    ok: false,
    message: attempts.join(" → "),
  };
}

function nearbyQuery(center: LatLng, radiusMeters: number): string {
  const { latitude: lat, longitude: lon } = center;
  const r = Math.min(Math.max(Math.round(radiusMeters), 100), 15000);
  return `
[out:json][timeout:25];
(
  node["shop"~"^(${SHOP_VALUES})$"](around:${r},${lat},${lon});
  way["shop"~"^(${SHOP_VALUES})$"](around:${r},${lat},${lon});
  node["amenity"="pharmacy"](around:${r},${lat},${lon});
  way["amenity"="pharmacy"](around:${r},${lat},${lon});
  node["amenity"="marketplace"](around:${r},${lat},${lon});
);
out center tags;
`.trim();
}

function textQuery(
  center: LatLng,
  radiusMeters: number,
  nameFragment: string
): string {
  const { latitude: lat, longitude: lon } = center;
  const r = Math.min(Math.max(Math.round(radiusMeters), 100), 15000);
  const safe = nameFragment
    .replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
    .trim()
    .slice(0, 64);
  return `
[out:json][timeout:25];
(
  node["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});
  way["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});
  node["name"~"${safe}",i]["amenity"~"^(pharmacy|marketplace)$"](around:${r},${lat},${lon});
  way["name"~"${safe}",i]["amenity"~"^(pharmacy|marketplace)$"](around:${r},${lat},${lon});
  node["brand"~"${safe}",i]["shop"](around:${r},${lat},${lon});
);
out center tags;
`.trim();
}

function mapElements(elements: OverpassElement[]): LivePlace[] {
  const verifiedAt = new Date();
  const seen = new Set<string>();
  const out: LivePlace[] = [];
  for (const el of elements) {
    const place = normalizeElement(el, verifiedAt);
    if (!place || seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    out.push(place);
  }
  return out;
}

export async function searchNearbyOsmStores(
  center: LatLng,
  radiusMeters: number
): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const key = `osm:${cacheKeyNearby(center.latitude, center.longitude, radiusMeters)}`;
  const cached = cacheGet<LivePlace[]>(key);
  if (cached) {
    return { ok: true, places: cached.value };
  }

  const result = await runOverpass(nearbyQuery(center, radiusMeters));
  if (!result.ok) return result;
  const places = mapElements(result.elements);
  cacheSet(key, places, PLACES_CACHE_TTL_MS);
  return { ok: true, places };
}

export async function searchOsmPlacesByText(
  query: string,
  center: LatLng,
  radiusMeters: number
): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const q = query.trim();
  if (!q) return { ok: true, places: [] };

  const key = `osm:${cacheKeyText(center.latitude, center.longitude, q, radiusMeters)}`;
  const cached = cacheGet<LivePlace[]>(key);
  if (cached) {
    return { ok: true, places: cached.value };
  }

  const result = await runOverpass(textQuery(center, radiusMeters, q));
  if (!result.ok) return result;
  const places = mapElements(result.elements).slice(0, 30);
  cacheSet(key, places, PLACES_CACHE_TTL_MS);
  return { ok: true, places };
}
