"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { getTipByKey, TIP_CATEGORIES, type TipCategory } from "@/lib/tips/catalog";
import { refreshAiSavingTips } from "@/lib/tips/ai-tips";

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

function isTipCategory(value: string): value is TipCategory {
  return (TIP_CATEGORIES as string[]).includes(value);
}

export async function toggleTipBookmark(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const tipKey = String(formData.get("tip_key") ?? "").trim();
  if (!tipKey) return { error: "Unknown tip." };

  const curated = getTipByKey(tipKey);
  const isAi = tipKey.startsWith("ai-");
  const titleFromForm = String(formData.get("tip_title") ?? "").trim();
  const bodyFromForm = String(formData.get("tip_body") ?? "").trim();
  const categoryFromForm = String(formData.get("tip_category") ?? "").trim();

  const tipTitle = curated?.title || titleFromForm;
  const tipBody = curated?.body || bodyFromForm || null;
  const tipCategory =
    curated?.category ||
    (isTipCategory(categoryFromForm) ? categoryFromForm : null);

  if (!tipTitle) return { error: "Unknown tip." };
  if (!curated && !isAi) return { error: "Unknown tip." };

  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("bookmarked_tips")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("tip_key", tipKey)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bookmarked_tips")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", auth.user.id);
      if (error) {
        logAuthFailure("toggleTipBookmark.delete", error);
        return { error: formatAuthError(error) };
      }
      revalidatePath("/tips");
      revalidatePath("/dashboard");
      return { success: "Bookmark removed." };
    }

    const { error } = await supabase.from("bookmarked_tips").insert({
      user_id: auth.user.id,
      tip_key: tipKey,
      tip_title: tipTitle,
      tip_body: tipBody,
      tip_category: tipCategory,
    });
    if (error) {
      // Migration may not have snapshot columns yet — fall back to key/title only.
      const legacy = await supabase.from("bookmarked_tips").insert({
        user_id: auth.user.id,
        tip_key: tipKey,
        tip_title: tipTitle,
      });
      if (legacy.error) {
        logAuthFailure("toggleTipBookmark.insert", error);
        return { error: formatAuthError(error) };
      }
    }
  } catch (error) {
    logAuthFailure("toggleTipBookmark", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/tips");
  revalidatePath("/dashboard");
  return { success: "Tip bookmarked." };
}

export async function refreshPersonalizedTips(
  _prev: ActionState = {},
  _formData: FormData = new FormData()
): Promise<ActionState> {
  void _prev;
  void _formData;
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  try {
    const result = await refreshAiSavingTips();
    revalidatePath("/tips");
    revalidatePath("/dashboard");
    if (!result.ok) return { error: result.message };
    return { success: result.message };
  } catch (error) {
    logAuthFailure("refreshPersonalizedTips", error);
    return {
      error:
        "Personalized tips could not be refreshed right now. Try again in a minute.",
    };
  }
}
