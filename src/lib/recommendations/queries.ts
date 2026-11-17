import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/types/database";
import { getBills } from "@/lib/finance/bills";
import { matchBillAlternatives } from "@/lib/recommendations/match";

export type SavedRecommendationRow =
  Database["public"]["Tables"]["saved_recommendations"]["Row"];

export type RecommendationPayload = {
  key: string;
  kind: "discovery" | "bill_alternative";
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
  const key = (payload as RecommendationPayload).key;
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

/** Optional bill-based sample suggestions from recent confirmed bills. */
export const getBillAlternativeSuggestions = cache(async () => {
  const bills = await getBills();
  const items = bills.flatMap((b) => b.bill_items ?? []).slice(0, 40);
  return matchBillAlternatives(items, { limitPerItem: 2, maxSuggestions: 10 });
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
