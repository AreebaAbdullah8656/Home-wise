"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { getProductByKey } from "@/lib/recommendations/catalog";
import type { Json } from "@/types/database";
import type { RecommendationPayload } from "@/lib/recommendations/queries";

export type ActionState = {
  error?: string;
  success?: string;
};

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Check .env.local and restart the app.",
    } as const;
  }
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." } as const;
  return { user } as const;
}

function buildPayload(formData: FormData): RecommendationPayload | null {
  const key = String(formData.get("product_key") ?? "").trim();
  if (!getProductByKey(key)) return null;
  const kindRaw = String(formData.get("kind") ?? "discovery");
  const kind: RecommendationPayload["kind"] =
    kindRaw === "bill_alternative" ? "bill_alternative" : "discovery";
  const billItemId = String(formData.get("bill_item_id") ?? "").trim();
  const billItemName = String(formData.get("bill_item_name") ?? "").trim();
  return {
    key,
    kind,
    ...(billItemId ? { billItemId } : {}),
    ...(billItemName ? { billItemName } : {}),
  };
}

async function upsertRecommendation(
  userId: string,
  title: string,
  payload: RecommendationPayload,
  dismissed: boolean
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_recommendations")
    .select("id, payload")
    .eq("user_id", userId)
    .eq("is_sample", true);

  const match = (existing ?? []).find((row) => {
    const p = row.payload as RecommendationPayload | null;
    return p && typeof p === "object" && p.key === payload.key;
  });

  if (match) {
    const { error } = await supabase
      .from("saved_recommendations")
      .update({
        title,
        payload: payload as unknown as Json,
        dismissed,
        is_sample: true,
      })
      .eq("id", match.id)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("saved_recommendations").insert({
    user_id: userId,
    title,
    payload: payload as unknown as Json,
    is_sample: true,
    dismissed,
  });
  if (error) throw error;
}

export async function saveRecommendation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const payload = buildPayload(formData);
  if (!payload) return { error: "Unknown sample product." };
  const product = getProductByKey(payload.key)!;

  try {
    await upsertRecommendation(
      auth.user.id,
      product.name,
      payload,
      false
    );
  } catch (error) {
    logAuthFailure("saveRecommendation", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/recommendations");
  revalidatePath("/bills");
  return { success: "Saved to your recommendations." };
}

export async function dismissRecommendation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const payload = buildPayload(formData);
  if (!payload) return { error: "Unknown sample product." };
  const product = getProductByKey(payload.key)!;

  try {
    await upsertRecommendation(
      auth.user.id,
      product.name,
      payload,
      true
    );
  } catch (error) {
    logAuthFailure("dismissRecommendation", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/recommendations");
  revalidatePath("/bills");
  return { success: "Suggestion dismissed." };
}

export async function removeSavedRecommendation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing recommendation id." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("saved_recommendations")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("removeSavedRecommendation", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("removeSavedRecommendation", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/recommendations");
  return { success: "Removed from saved." };
}
