import { NextResponse } from "next/server";
import { connection } from "next/server";
import {
  fetchNearbyLivePlaces,
  fetchTextSearchLivePlaces,
  partitionLivePlaces,
} from "@/lib/places/service";
import {
  getPlacesProvider,
  placesProviderLabel,
} from "@/lib/places/config";
import {
  normalizeRadiusKm,
  radiusKmToMeters,
} from "@/lib/places/distance";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LocationSource } from "@/lib/places/types";

async function readProfileLocation(): Promise<{
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}> {
  if (!isSupabaseConfigured()) {
    return { address: null, latitude: null, longitude: null };
  }
  const user = await getSessionUser();
  if (!user) {
    return { address: null, latitude: null, longitude: null };
  }
  const supabase = await createClient();
  const withCoords = await supabase
    .from("profiles")
    .select("location, location_lat, location_lng")
    .eq("id", user.id)
    .maybeSingle();
  if (!withCoords.error) {
    const lat = withCoords.data?.location_lat;
    const lng = withCoords.data?.location_lng;
    return {
      address: withCoords.data?.location?.trim() || null,
      latitude: typeof lat === "number" && Number.isFinite(lat) ? lat : null,
      longitude: typeof lng === "number" && Number.isFinite(lng) ? lng : null,
    };
  }
  const legacy = await supabase
    .from("profiles")
    .select("location")
    .eq("id", user.id)
    .maybeSingle();
  return {
    address: legacy.data?.location?.trim() || null,
    latitude: null,
    longitude: null,
  };
}

function parseLocationSource(raw: string | null): LocationSource | null {
  if (
    raw === "saved" ||
    raw === "device" ||
    raw === "profile" ||
    raw === "query"
  ) {
    return raw;
  }
  return null;
}

/**
 * Live nearby recommendations.
 * Provider: OpenStreetMap by default; Google Places when GOOGLE_MAPS_API_KEY is set.
 * Never returns sample/fake store data. Overpass queries are radius-only.
 */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  const q = url.searchParams.get("q")?.trim() || "";
  const refresh = url.searchParams.get("refresh") === "1";
  const addressOverride = url.searchParams.get("address")?.trim() || "";
  const labelOverride = url.searchParams.get("label")?.trim() || "";
  const radiusKm = normalizeRadiusKm(
    Number(url.searchParams.get("radiusKm") ?? "3")
  );
  const locationSourceParam = parseLocationSource(
    url.searchParams.get("source")
  );
  const latitude = latRaw != null && latRaw !== "" ? Number(latRaw) : null;
  const longitude = lngRaw != null && lngRaw !== "" ? Number(lngRaw) : null;

  const provider = getPlacesProvider();
  const profile = await readProfileLocation();

  const hasRequestCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  // Priority when client omits coords: saved profile point → Settings city text.
  const resolvedLat = hasRequestCoords
    ? latitude
    : locationSourceParam === "profile"
      ? null
      : profile.latitude;
  const resolvedLng = hasRequestCoords
    ? longitude
    : locationSourceParam === "profile"
      ? null
      : profile.longitude;
  const address =
    addressOverride ||
    profile.address ||
    null;
  const locationSource: LocationSource | null =
    locationSourceParam ??
    (hasRequestCoords
      ? "device"
      : resolvedLat != null && resolvedLng != null
        ? "saved"
        : "profile");

  const baseInput = {
    latitude: resolvedLat,
    longitude: resolvedLng,
    address,
    radiusMeters: radiusKmToMeters(radiusKm),
    bypassCache: refresh,
    locationSource,
    locationLabel: labelOverride || profile.address || addressOverride || null,
  };

  const live = q
    ? await fetchTextSearchLivePlaces({ ...baseInput, query: q })
    : await fetchNearbyLivePlaces(baseInput);

  if (!live.ok) {
    return NextResponse.json(
      {
        ...live,
        providerLabel: placesProviderLabel(live.provider),
        radiusKm,
        sections: emptySections(),
        onlineQuery: q || null,
      },
      { status: 422 }
    );
  }

  const sections = partitionLivePlaces(live.places);
  return NextResponse.json({
    ...live,
    providerLabel: placesProviderLabel(provider),
    radiusKm,
    onlineQuery: q || null,
    sections: {
      nearbyStores: sections.nearby,
      bestLocalOptions: sections.bestLocal,
      freeHomeDelivery: sections.freeDelivery,
      verifiedOnlineStores: sections.verifiedOnline,
      lowestAvailablePrice: sections.lowestVerifiedPrice,
    },
  });
}

function emptySections() {
  return {
    nearbyStores: [] as [],
    bestLocalOptions: [] as [],
    freeHomeDelivery: [] as [],
    verifiedOnlineStores: [] as [],
    lowestAvailablePrice: [] as [],
  };
}
