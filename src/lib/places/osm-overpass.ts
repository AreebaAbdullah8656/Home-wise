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
import { distanceMeters } from "@/lib/places/distance";
import { mapSearchTerm } from "@/lib/places/search-terms";
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
  "mobile_phone",
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
  verifiedAt: Date,
  center: LatLng,
  radiusMeters: number
): LivePlace | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim() || tags.brand?.trim() || tags.operator?.trim();
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const location: LatLng = { latitude: lat, longitude: lon };
  const dist = distanceMeters(center, location);
  if (dist > radiusMeters) return null;

  const placeId = `osm:${el.type}/${el.id}`;
  const mapsUrl = `https://www.openstreetmap.org/${el.type}/${el.id}#map=18/${location.latitude}/${location.longitude}`;

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
    distanceMeters: Math.round(dist),
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
      return { ok: false, message: result.message };
    }
  }

  return {
    ok: false,
    message: attempts.join(" → "),
  };
}

function clampRadius(radiusMeters: number): number {
  return Math.min(Math.max(Math.round(radiusMeters), 100), 15_000);
}

/** Radius-only nearby query — never city or bounding-box fallbacks. */
function nearbyQuery(center: LatLng, radiusMeters: number): string {
  const { latitude: lat, longitude: lon } = center;
  const r = clampRadius(radiusMeters);
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

function escapeOverpassRegex(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").trim().slice(0, 64);
}

function tagSearchQuery(
  center: LatLng,
  radiusMeters: number,
  shopValues: string[],
  amenityValues: string[],
  nameHint?: string
): string {
  const { latitude: lat, longitude: lon } = center;
  const r = clampRadius(radiusMeters);
  const parts: string[] = [];
  if (shopValues.length) {
    const shopRe = shopValues.map(escapeOverpassRegex).join("|");
    parts.push(
      `node["shop"~"^(${shopRe})$"](around:${r},${lat},${lon});`,
      `way["shop"~"^(${shopRe})$"](around:${r},${lat},${lon});`
    );
  }
  if (amenityValues.length) {
    const amenityRe = amenityValues.map(escapeOverpassRegex).join("|");
    parts.push(
      `node["amenity"~"^(${amenityRe})$"](around:${r},${lat},${lon});`,
      `way["amenity"~"^(${amenityRe})$"](around:${r},${lat},${lon});`
    );
  }
  if (nameHint) {
    const safe = escapeOverpassRegex(nameHint);
    parts.push(
      `node["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});`,
      `way["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});`
    );
  }
  return `
[out:json][timeout:25];
(
  ${parts.join("\n  ")}
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
  const r = clampRadius(radiusMeters);
  const safe = escapeOverpassRegex(nameFragment);
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

function mapElements(
  elements: OverpassElement[],
  center: LatLng,
  radiusMeters: number
): LivePlace[] {
  const verifiedAt = new Date();
  const seen = new Set<string>();
  const out: LivePlace[] = [];
  for (const el of elements) {
    const place = normalizeElement(el, verifiedAt, center, radiusMeters);
    if (!place || seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    out.push(place);
  }
  out.sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
  );
  return out;
}

export async function searchNearbyOsmStores(
  center: LatLng,
  radiusMeters: number
): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const radius = clampRadius(radiusMeters);
  const key = `osm:${cacheKeyNearby(center.latitude, center.longitude, radius)}`;
  const cached = cacheGet<LivePlace[]>(key);
  if (cached) {
    return { ok: true, places: cached.value };
  }

  const result = await runOverpass(nearbyQuery(center, radius));
  if (!result.ok) return result;
  const places = mapElements(result.elements, center, radius);
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

  const radius = clampRadius(radiusMeters);
  const key = `osm:${cacheKeyText(center.latitude, center.longitude, q, radius)}`;
  const cached = cacheGet<LivePlace[]>(key);
  if (cached) {
    return { ok: true, places: cached.value };
  }

  const mapped = mapSearchTerm(q);
  const overpassQuery = mapped
    ? tagSearchQuery(
        center,
        radius,
        mapped.filter.kind === "amenity" ? [] : mapped.filter.kind === "shop"
          ? mapped.filter.values
          : mapped.filter.shop,
        mapped.filter.kind === "shop" ? [] : mapped.filter.kind === "amenity"
          ? mapped.filter.values
          : mapped.filter.amenity,
        mapped.nameHint
      )
    : textQuery(center, radius, q);

  const result = await runOverpass(overpassQuery);
  if (!result.ok) return result;
  const places = mapElements(result.elements, center, radius).slice(0, 30);
  cacheSet(key, places, PLACES_CACHE_TTL_MS);
  return { ok: true, places };
}
