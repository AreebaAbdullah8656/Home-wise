import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toNumber } from "@/lib/budget-math";
import type { Database } from "@/types/database";

export type GroceryItemRow =
  Database["public"]["Tables"]["grocery_items"]["Row"];

export type GroceryTotals = {
  estimatedTotal: number;
  actualTotal: number;
  pendingCount: number;
  purchasedCount: number;
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export const getGroceryItems = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as GroceryItemRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const priorityRank: Record<string, number> = {
    high: 0,
    normal: 1,
    low: 2,
  };
  return [...(data ?? [])].sort((a, b) => {
    if (a.is_purchased !== b.is_purchased) {
      return a.is_purchased ? 1 : -1;
    }
    const pa = priorityRank[a.priority] ?? 9;
    const pb = priorityRank[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return b.created_at.localeCompare(a.created_at);
  });
});

export function computeGroceryTotals(items: GroceryItemRow[]): GroceryTotals {
  let actualTotal = 0;
  let pendingCount = 0;
  let purchasedCount = 0;

  for (const item of items) {
    const est = toNumber(item.estimated_price);
    const act = toNumber(item.actual_price);
    if (item.is_purchased) {
      purchasedCount += 1;
      actualTotal += act > 0 ? act : est;
    } else {
      pendingCount += 1;
    }
  }

  // Estimated total for the whole list (pending estimates + purchased actual/est)
  const fullEstimated = items.reduce(
    (sum, item) => sum + toNumber(item.estimated_price),
    0
  );

  return {
    estimatedTotal: fullEstimated,
    actualTotal,
    pendingCount,
    purchasedCount,
  };
}

export const PRIORITY_ORDER = ["high", "normal", "low"] as const;
export type GroceryPriority = (typeof PRIORITY_ORDER)[number];
