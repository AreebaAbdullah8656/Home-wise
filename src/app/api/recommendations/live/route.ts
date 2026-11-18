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
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function readProfileLocation(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", user.id)
    .maybeSingle();
  return data?.location?.trim() || null;
}

/**
 * Live nearby recommendations.
 * Provider: OpenStreetMap by default; Google Places when GOOGLE_MAPS_API_KEY is set.
 * Never returns sample/fake store data.
 */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  const q = url.searchParams.get("q")?.trim() || "";
  const refresh = url.searchParams.get("refresh") === "1";
  const latitude = latRaw != null && latRaw !== "" ? Number(latRaw) : null;
  const longitude = lngRaw != null && lngRaw !== "" ? Number(lngRaw) : null;

  const provider = getPlacesProvider();
  const address = await readProfileLocation();
  const baseInput = {
    latitude,
    longitude,
    address,
    bypassCache: refresh,
  };

  const live = q
    ? await fetchTextSearchLivePlaces({ ...baseInput, query: q })
    : await fetchNearbyLivePlaces(baseInput);

  if (!live.ok) {
    return NextResponse.json(
      {
        ...live,
        providerLabel: placesProviderLabel(live.provider),
        sections: emptySections(),
      },
      { status: 422 }
    );
  }

  const sections = partitionLivePlaces(live.places);
  return NextResponse.json({
    ...live,
    providerLabel: placesProviderLabel(provider),
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
