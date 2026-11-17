import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export type BillRow = Database["public"]["Tables"]["bills"]["Row"];
export type BillItemRow = Database["public"]["Tables"]["bill_items"]["Row"];

export type BillWithItems = BillRow & {
  bill_items: BillItemRow[];
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export type BillQuery = {
  search?: string;
  store?: string;
  from?: string;
  to?: string;
};

export const getBills = cache(async (query: BillQuery = {}) => {
  const userId = await requireUserId();
  if (!userId) return [] as BillWithItems[];
  const supabase = await createClient();

  let q = supabase
    .from("bills")
    .select("*, bill_items(*)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (query.from) q = q.gte("purchase_date", query.from);
  if (query.to) q = q.lte("purchase_date", query.to);
  if (query.store?.trim()) {
    q = q.ilike("store_name", `%${query.store.trim()}%`);
  }
  if (query.search?.trim()) {
    q = q.or(
      `store_name.ilike.%${query.search.trim()}%,notes.ilike.%${query.search.trim()}%`
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as BillWithItems[];
});

export const getBillById = cache(async (id: string) => {
  const userId = await requireUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*, bill_items(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as BillWithItems | null;
});

export async function createSignedBillUrl(storagePath: string, expiresIn = 60) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("bills")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
