import { NextResponse } from "next/server";
import {
  fetchNearbyLivePlaces,
  fetchTextSearchLivePlaces,
  partitionLivePlaces,
} from "@/lib/places/service";
import { isGooglePlacesConfigured, missingPlacesMessage } from "@/lib/places/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { connection } from "next/server";

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
 * Live nearby recommendations from Google Places.
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

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_api_key",
        message: missingPlacesMessage(),
        lastVerifiedAt: new Date().toISOString(),
        sections: emptySections(),
      },
      { status: 503 }
    );
  }

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
        sections: emptySections(),
      },
      { status: live.code === "missing_api_key" ? 503 : 422 }
    );
  }

  const sections = partitionLivePlaces(live.places);
  return NextResponse.json({
    ...live,
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
