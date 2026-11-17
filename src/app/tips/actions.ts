"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { getTipByKey } from "@/lib/tips/catalog";

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

export async function toggleTipBookmark(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const tipKey = String(formData.get("tip_key") ?? "").trim();
  const tip = getTipByKey(tipKey);
  if (!tip) return { error: "Unknown tip." };

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
      tip_key: tip.key,
      tip_title: tip.title,
    });
    if (error) {
      logAuthFailure("toggleTipBookmark.insert", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("toggleTipBookmark", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/tips");
  revalidatePath("/dashboard");
  return { success: "Tip bookmarked." };
}
