import {
  getNominatimAcceptLanguage,
  getNominatimUrl,
  getOsmUserAgent,
  NOMINATIM_CACHE_TTL_MS,
} from "@/lib/places/config";
import { cacheGet, cacheSet } from "@/lib/places/cache";
import {
  clampSearchRadiusMeters,
  distanceMeters,
  metersToDegLat,
  metersToDegLng,
} from "@/lib/places/distance";
import { isInPakistan, withPakistanSuffix } from "@/lib/places/pakistan";
import { withNominatimRateLimit } from "@/lib/places/rate-limit";
import type { DeliveryInfo, LatLng, LivePlace } from "@/lib/places/types";

type NominatimSearchHit = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
};

function unavailableDelivery(): DeliveryInfo {
  return {
    status: "unavailable",
    label: "Delivery information unavailable",
    detail:
      "OpenStreetMap does not reliably confirm delivery or free delivery for this place.",
  };
}

function nominatimHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Accept-Language": getNominatimAcceptLanguage(),
    "User-Agent": getOsmUserAgent(),
  };
}

function primaryTypeFromHit(hit: NominatimSearchHit): string | null {
  if (hit.class === "shop" && hit.type) return `shop:${hit.type}`;
  if (hit.class === "amenity" && hit.type) return `amenity:${hit.type}`;
  if (hit.type) return hit.type;
  return null;
}

function placeName(hit: NominatimSearchHit, fallbackTerm: string): string | null {
  const fromDisplay = hit.display_name?.split(",")[0]?.trim();
  const name = hit.name?.trim() || fromDisplay || null;
  if (!name) return null;
  // Skip pure address-looking hits with no shop identity.
  if (name.toLowerCase() === fallbackTerm.toLowerCase()) return name;
  return name;
}

/**
 * Nominatim bounded search near a point — Overpass fallback.
 * Pakistan-only via countrycodes=pk + viewbox + distance filter.
 */
export async function searchNearbyWithNominatim(input: {
  center: LatLng;
  radiusMeters: number;
  term: string;
  categoryKey?: string;
}): Promise<{ ok: true; places: LivePlace[] } | { ok: false; message: string }> {
  const term = withPakistanSuffix(input.term.trim());
  if (!term) return { ok: true, places: [] };

  const radius = clampSearchRadiusMeters(input.radiusMeters);
  const cat = input.categoryKey ?? "general";
  const cacheKey = `nominatim-near:${input.center.latitude.toFixed(3)}:${input.center.longitude.toFixed(3)}:${radius}:${cat}:${term.toLowerCase()}`;
  const cached = cacheGet<LivePlace[]>(cacheKey);
  if (cached) return { ok: true, places: cached.value };

  const dLat = metersToDegLat(radius);
  const dLng = metersToDegLng(radius, input.center.latitude);
  // viewbox: left,top,right,bottom = minLon,maxLat,maxLon,minLat
  const viewbox = [
    input.center.longitude - dLng,
    input.center.latitude + dLat,
    input.center.longitude + dLng,
    input.center.latitude - dLat,
  ].join(",");

  return withNominatimRateLimit(async () => {
    const again = cacheGet<LivePlace[]>(cacheKey);
    if (again) return { ok: true, places: again.value };

    const url = new URL(`${getNominatimUrl().replace(/\/$/, "")}/search`);
    url.searchParams.set("q", term);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "20");
    url.searchParams.set("countrycodes", "pk");
    url.searchParams.set("viewbox", viewbox);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("addressdetails", "0");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: nominatimHeaders(),
        cache: "no-store",
      });
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? `Nominatim nearby failed: ${error.message}`
            : "Nominatim nearby failed.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        message: `Nominatim nearby HTTP ${response.status}.`,
      };
    }

    const data = (await response.json()) as NominatimSearchHit[];
    const verifiedAt = new Date();
    const seen = new Set<string>();
    const places: LivePlace[] = [];

    for (const hit of Array.isArray(data) ? data : []) {
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (!isInPakistan(lat, lng)) continue;
      const location = { latitude: lat, longitude: lng };
      const dist = distanceMeters(input.center, location);
      if (dist > radius) continue;
      const name = placeName(hit, input.term);
      if (!name) continue;
      const osmType = hit.osm_type || "node";
      const osmId = hit.osm_id ?? hit.place_id;
      const placeId =
        osmId != null ? `nominatim:${osmType}/${osmId}` : `nominatim:${lat},${lng}`;
      if (seen.has(placeId)) continue;
      seen.add(placeId);

      places.push({
        placeId,
        name,
        address: hit.display_name?.trim() || null,
        primaryType: primaryTypeFromHit(hit),
        types: primaryTypeFromHit(hit) ? [primaryTypeFromHit(hit)!] : [],
        rating: null,
        userRatingCount: null,
        businessStatus: null,
        websiteUrl: null,
        mapsUrl:
          osmId != null
            ? `https://www.openstreetmap.org/${osmType}/${osmId}`
            : null,
        phone: null,
        location,
        distanceMeters: Math.round(dist),
        delivery: unavailableDelivery(),
        verifiedProductPrice: null,
        source: "OpenStreetMap",
        attributions: ["© OpenStreetMap contributors"],
        lastVerifiedAt: verifiedAt.toISOString(),
      });
    }

    places.sort(
      (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
    );
    cacheSet(cacheKey, places, NOMINATIM_CACHE_TTL_MS);
    return { ok: true, places };
  });
}
