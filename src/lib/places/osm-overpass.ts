import {
  getOsmUserAgent,
  getOverpassEndpoints,
  NOMINATIM_CACHE_TTL_MS,
} from "@/lib/places/config";
import { cacheGet, cacheSet } from "@/lib/places/cache";
import { clampSearchRadiusMeters, distanceMeters } from "@/lib/places/distance";
import { searchNearbyWithNominatim } from "@/lib/places/nominatim-nearby";
import {
  DEFAULT_NEARBY_CATEGORIES,
  getCategory,
  resolveSearchCategory,
  type ShopCategory,
  type ShopCategoryId,
} from "@/lib/places/search-terms";
import type { DeliveryInfo, LatLng, LivePlace } from "@/lib/places/types";

/** Retry these statuses on the next Overpass mirror. */
const MIRROR_RETRY_STATUSES = new Set([406, 429, 503, 504]);

/** Client timeout per mirror (ms). */
const OVERPASS_FETCH_TIMEOUT_MS = 30_000;

/** Friendly user-facing message — technical detail stays in server logs. */
export const NEARBY_UNAVAILABLE_MESSAGE =
  "Nearby shops could not be loaded right now. Try again in a minute.";

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
  if (el.type === "relation") return null;
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
    return `Overpass HTTP 406 from ${endpoint}`;
  }
  if (status === 429 || status === 503 || status === 504) {
    return `Overpass HTTP ${status} from ${endpoint}`;
  }
  return `Overpass HTTP ${status} from ${endpoint}`;
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
        ? `Overpass timed out (${endpoint})`
        : error instanceof Error
          ? `Overpass failed (${endpoint}): ${error.message}`
          : `Overpass failed (${endpoint})`,
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
      message: `Overpass non-JSON from ${endpoint}`,
    };
  }
}

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
    console.warn("[overpass]", result.message);
    attempts.push(result.message);
    // Timeouts / network (status 0) and retryable HTTP → next mirror
    if (result.status !== 0 && !MIRROR_RETRY_STATUSES.has(result.status)) {
      return { ok: false, message: result.message };
    }
  }

  return {
    ok: false,
    message: attempts.join(" → ") || "Overpass unavailable",
  };
}

/** One light category query: node+way only, out center 40. */
function categoryQuery(
  center: LatLng,
  radiusMeters: number,
  category: ShopCategory
): string {
  const { latitude: lat, longitude: lon } = center;
  const r = clampSearchRadiusMeters(radiusMeters);
  const parts: string[] = [];

  if (category.shop) {
    parts.push(
      `node["shop"="${category.shop}"](around:${r},${lat},${lon});`,
      `way["shop"="${category.shop}"](around:${r},${lat},${lon});`
    );
  }
  if (category.amenity) {
    parts.push(
      `node["amenity"="${category.amenity}"](around:${r},${lat},${lon});`,
      `way["amenity"="${category.amenity}"](around:${r},${lat},${lon});`
    );
  }

  return `
[out:json][timeout:25];
(
  ${parts.join("\n  ")}
);
out center 40;
`.trim();
}

function nameQuery(
  center: LatLng,
  radiusMeters: number,
  nameFragment: string
): string {
  const { latitude: lat, longitude: lon } = center;
  const r = clampSearchRadiusMeters(radiusMeters);
  const safe = nameFragment
    .replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
    .trim()
    .slice(0, 48);
  return `
[out:json][timeout:25];
(
  node["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});
  way["name"~"${safe}",i]["shop"](around:${r},${lat},${lon});
);
out center 40;
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

function categoryCacheKey(
  center: LatLng,
  radiusMeters: number,
  categoryId: string
) {
  return `osm-cat:${center.latitude.toFixed(3)}:${center.longitude.toFixed(3)}:${clampSearchRadiusMeters(radiusMeters)}:${categoryId}`;
}

function mergePlaces(lists: LivePlace[][]): LivePlace[] {
  const seen = new Set<string>();
  const out: LivePlace[] = [];
  for (const list of lists) {
    for (const place of list) {
      if (seen.has(place.placeId)) continue;
      seen.add(place.placeId);
      out.push(place);
    }
  }
  out.sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
  );
  return out;
}

async function fetchCategory(
  center: LatLng,
  radiusMeters: number,
  category: ShopCategory,
  bypassCache: boolean
): Promise<{ places: LivePlace[]; fromCache: boolean; overpassOk: boolean }> {
  const key = categoryCacheKey(center, radiusMeters, category.id);
  if (!bypassCache) {
    const cached = cacheGet<LivePlace[]>(key);
    if (cached) {
      return { places: cached.value, fromCache: true, overpassOk: true };
    }
  }

  const result = await runOverpass(
    categoryQuery(center, radiusMeters, category)
  );
  if (result.ok) {
    const places = mapElements(result.elements, center, radiusMeters);
    cacheSet(key, places, NOMINATIM_CACHE_TTL_MS);
    return { places, fromCache: false, overpassOk: true };
  }

  // Prefer stale/fresh cache over hard failure
  const stale = cacheGet<LivePlace[]>(key);
  if (stale) {
    return { places: stale.value, fromCache: true, overpassOk: false };
  }

  const nominatim = await searchNearbyWithNominatim({
    center,
    radiusMeters,
    term: category.nominatimTerm,
    categoryKey: category.id,
  });
  if (nominatim.ok && nominatim.places.length) {
    cacheSet(key, nominatim.places, NOMINATIM_CACHE_TTL_MS);
    return { places: nominatim.places, fromCache: false, overpassOk: false };
  }

  console.warn(
    "[overpass] category failed; nominatim empty:",
    category.id,
    result.message
  );
  return { places: [], fromCache: false, overpassOk: false };
}

export async function searchNearbyOsmStores(
  center: LatLng,
  radiusMeters: number,
  opts?: { bypassCache?: boolean; categories?: ShopCategoryId[] }
): Promise<
  | { ok: true; places: LivePlace[]; cached: boolean }
  | { ok: false; message: string }
> {
  const radius = clampSearchRadiusMeters(radiusMeters);
  const categoryIds = opts?.categories ?? DEFAULT_NEARBY_CATEGORIES;
  const bypassCache = opts?.bypassCache === true;

  const results = await Promise.all(
    categoryIds.map((id) =>
      fetchCategory(center, radius, getCategory(id), bypassCache)
    )
  );

  const places = mergePlaces(results.map((r) => r.places)).slice(0, 40);
  const anyOk = results.some((r) => r.places.length > 0 || r.overpassOk);
  const allCached = results.every((r) => r.fromCache);

  if (places.length === 0 && !anyOk) {
    return { ok: false, message: NEARBY_UNAVAILABLE_MESSAGE };
  }

  return { ok: true, places, cached: allCached };
}

export async function searchOsmPlacesByText(
  query: string,
  center: LatLng,
  radiusMeters: number,
  opts?: { bypassCache?: boolean }
): Promise<
  | { ok: true; places: LivePlace[]; cached: boolean }
  | { ok: false; message: string }
> {
  const q = query.trim();
  if (!q) return { ok: true, places: [], cached: false };

  const radius = clampSearchRadiusMeters(radiusMeters);
  const bypassCache = opts?.bypassCache === true;
  const category = resolveSearchCategory(q);

  if (category) {
    const result = await fetchCategory(center, radius, category, bypassCache);
    if (result.places.length === 0 && !result.overpassOk && !result.fromCache) {
      return { ok: false, message: NEARBY_UNAVAILABLE_MESSAGE };
    }
    return {
      ok: true,
      places: result.places.slice(0, 30),
      cached: result.fromCache,
    };
  }

  // Free-text name search — light Overpass, then Nominatim
  const key = categoryCacheKey(center, radius, `name:${q.toLowerCase()}`);
  if (!bypassCache) {
    const cached = cacheGet<LivePlace[]>(key);
    if (cached) return { ok: true, places: cached.value, cached: true };
  }

  const overpass = await runOverpass(nameQuery(center, radius, q));
  if (overpass.ok) {
    const places = mapElements(overpass.elements, center, radius).slice(0, 30);
    cacheSet(key, places, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, places, cached: false };
  }

  console.warn("[overpass] name search failed:", overpass.message);
  const stale = cacheGet<LivePlace[]>(key);
  if (stale) return { ok: true, places: stale.value, cached: true };

  const nominatim = await searchNearbyWithNominatim({
    center,
    radiusMeters: radius,
    term: q,
    categoryKey: `name:${q.toLowerCase()}`,
  });
  if (nominatim.ok) {
    const places = nominatim.places.slice(0, 30);
    cacheSet(key, places, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, places, cached: false };
  }

  return { ok: false, message: NEARBY_UNAVAILABLE_MESSAGE };
}
