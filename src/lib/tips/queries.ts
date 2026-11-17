import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export type BookmarkedTipRow =
  Database["public"]["Tables"]["bookmarked_tips"]["Row"];

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export const getBookmarkedTipKeys = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarked_tips")
    .select("tip_key")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.tip_key));
});

export const getBookmarkedTips = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as BookmarkedTipRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarked_tips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});
