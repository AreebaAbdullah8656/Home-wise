import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/types/database";
import { getBills } from "@/lib/finance/bills";
import {
  fetchNearbyLivePlaces,
  fetchTextSearchLivePlaces,
} from "@/lib/places/service";
import {
  getPlacesProvider,
  placesProviderLabel,
} from "@/lib/places/config";
import type { LivePlace, LivePlacesResponse } from "@/lib/places/types";

export type SavedRecommendationRow =
  Database["public"]["Tables"]["saved_recommendations"]["Row"];

export type PlaceRecommendationPayload = {
  key: string;
  kind: "live_place" | "bill_place_match";
  placeId: string;
  place: LivePlace;
  billItemId?: string;
  billItemName?: string;
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

function payloadKey(payload: Json): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const key = (payload as { key?: unknown }).key;
  return typeof key === "string" ? key : null;
}

export const getSavedRecommendations = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as SavedRecommendationRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getDismissedRecommendationKeys = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_recommendations")
    .select("payload")
    .eq("user_id", userId)
    .eq("dismissed", true);
  if (error) throw error;
  const keys = new Set<string>();
  for (const row of data ?? []) {
    const key = payloadKey(row.payload);
    if (key) keys.add(key);
  }
  return keys;
});

export const getSavedRecommendationKeys = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_recommendations")
    .select("payload")
    .eq("user_id", userId)
    .eq("dismissed", false);
  if (error) throw error;
  const keys = new Set<string>();
  for (const row of data ?? []) {
    const key = payloadKey(row.payload);
    if (key) keys.add(key);
  }
  return keys;
});

export const getProfileLocation = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.location?.trim() || null;
});

export type BillPlaceMatch = {
  billItemId: string;
  billItemName: string;
  places: LivePlace[];
  error?: string;
};

/**
 * Live Places text search for recent confirmed bill item names.
 * Returns real places only — never sample product prices.
 */
export const getBillPlaceMatches = cache(async (): Promise<BillPlaceMatch[]> => {
  const location = await getProfileLocation();
  if (!location) return [];

  const bills = await getBills();
  const items = bills
    .flatMap((b) => b.bill_items ?? [])
    .map((item) => ({
      id: item.id,
      name: (item.product_name ?? "").trim(),
    }))
    .filter((item) => item.name.length >= 3)
    .slice(0, 5);

  const matches: BillPlaceMatch[] = [];
  for (const item of items) {
    const live = await fetchTextSearchLivePlaces({
      query: item.name,
      address: location,
    });
    if (!live.ok) {
      matches.push({
        billItemId: item.id,
        billItemName: item.name,
        places: [],
        error: live.message,
      });
      continue;
    }
    if (live.places.length === 0) continue;
    matches.push({
      billItemId: item.id,
      billItemName: item.name,
      places: live.places.slice(0, 3),
    });
  }
  return matches;
});

export async function getInitialLivePlaces(): Promise<LivePlacesResponse> {
  const location = await getProfileLocation();
  return fetchNearbyLivePlaces({ address: location });
}

export function getActivePlacesProviderLabel() {
  return placesProviderLabel(getPlacesProvider());
}
