import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export type InventoryItemRow =
  Database["public"]["Tables"]["inventory_items"]["Row"];

export {
  INVENTORY_CATEGORIES,
  STOCK_STATUSES,
  type InventoryCategory,
  type StockStatus,
} from "@/lib/finance/inventory-constants";

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export const getInventoryItems = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as InventoryItemRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;

  const rank: Record<string, number> = { out: 0, low: 1, ok: 2 };
  return [...(data ?? [])].sort((a, b) => {
    const ra = rank[a.stock_status] ?? 9;
    const rb = rank[b.stock_status] ?? 9;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
});

export function lowStockItems(items: InventoryItemRow[]) {
  return items.filter(
    (item) => item.stock_status === "low" || item.stock_status === "out"
  );
}
