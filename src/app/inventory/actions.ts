"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toNumber } from "@/lib/budget-math";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import {
  INVENTORY_CATEGORIES,
  STOCK_STATUSES,
} from "@/lib/finance/inventory-constants";

export type ActionState = {
  error?: string;
  success?: string;
};

function missingConfig(): ActionState {
  return {
    error: "Supabase is not configured. Check .env.local and restart the app.",
  };
}

async function requireUser() {
  if (!isSupabaseConfigured()) return { error: missingConfig().error } as const;
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." } as const;
  return { user } as const;
}

function parseInventoryFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const category = (INVENTORY_CATEGORIES as readonly string[]).includes(
    categoryRaw
  )
    ? categoryRaw
    : "Other essentials";
  const quantity = toNumber(formData.get("quantity"));
  const purchaseDateRaw = String(formData.get("purchase_date") ?? "").trim();
  const purchase_date = purchaseDateRaw || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? null : toNumber(priceRaw);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const stockRaw = String(formData.get("stock_status") ?? "ok").trim();
  const stock_status = (STOCK_STATUSES as readonly string[]).includes(stockRaw)
    ? stockRaw
    : "ok";
  return {
    name,
    category,
    quantity: quantity > 0 ? quantity : 1,
    purchase_date,
    price,
    notes,
    stock_status,
  };
}

function revalidateInventory() {
  revalidatePath("/inventory");
  revalidatePath("/grocery");
}

export async function createInventoryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = parseInventoryFields(formData);
  if (!fields.name) return { error: "Item name is required." };
  if (fields.price !== null && fields.price < 0) {
    return { error: "Price cannot be negative." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inventory_items").insert({
      user_id: auth.user.id,
      ...fields,
    });
    if (error) {
      logAuthFailure("createInventoryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createInventoryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidateInventory();
  return { success: "Inventory item added." };
}

export async function updateInventoryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  const fields = parseInventoryFields(formData);
  if (!fields.name) return { error: "Item name is required." };
  if (fields.price !== null && fields.price < 0) {
    return { error: "Price cannot be negative." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("inventory_items")
      .update(fields)
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("updateInventoryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateInventoryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidateInventory();
  return { success: "Inventory item updated." };
}

export async function deleteInventoryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("deleteInventoryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("deleteInventoryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidateInventory();
  return { success: "Inventory item deleted." };
}

/**
 * Add inventory item to grocery list once.
 * Skips if a pending (not purchased) grocery row already matches the name.
 */
export async function addInventoryToGrocery(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  try {
    const supabase = await createClient();
    const { data: item, error: fetchError } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (fetchError) {
      logAuthFailure("addInventoryToGrocery.fetch", fetchError);
      return { error: formatAuthError(fetchError) };
    }
    if (!item) return { error: "Inventory item not found." };

    const { data: existing } = await supabase
      .from("grocery_items")
      .select("id, is_purchased")
      .eq("user_id", auth.user.id)
      .ilike("name", item.name)
      .eq("is_purchased", false)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        success:
          "Already on your grocery list (pending) — duplicate not created.",
      };
    }

    const qty =
      item.quantity != null && Number(item.quantity) > 0
        ? String(item.quantity)
        : null;
    const estimated =
      item.price != null && Number(item.price) > 0
        ? toNumber(item.price)
        : null;

    const { error: insertError } = await supabase.from("grocery_items").insert({
      user_id: auth.user.id,
      name: item.name,
      quantity: qty,
      estimated_price: estimated,
      priority: item.stock_status === "out" ? "high" : "normal",
      is_purchased: false,
    });
    if (insertError) {
      logAuthFailure("addInventoryToGrocery.insert", insertError);
      return { error: formatAuthError(insertError) };
    }
  } catch (error) {
    logAuthFailure("addInventoryToGrocery", error);
    return { error: formatAuthError(error) };
  }

  revalidateInventory();
  return { success: "Added to grocery list." };
}
