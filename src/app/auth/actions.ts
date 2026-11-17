"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function missingConfigState(): AuthActionState {
  return {
    error:
      "Supabase is not configured. Copy .env.example to .env.local (must be a file, not a folder) and add NEXT_PUBLIC_SUPABASE_URL plus NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY).",
  };
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return missingConfigState();
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logAuthFailure("signIn", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("signIn", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return missingConfigState();
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || undefined,
        },
      },
    });

    if (error) {
      logAuthFailure("signUp", error);
      return { error: formatAuthError(error) };
    }

    // Email confirmation may be required depending on Supabase project settings.
    if (!data.session) {
      return {
        success:
          "Account created. Check your email to confirm, then sign in. (If email confirmation is disabled in Supabase, you can sign in immediately.)",
      };
    }
  } catch (error) {
    logAuthFailure("signUp", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    logAuthFailure("signOut", error);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfile(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return missingConfigState();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) logAuthFailure("updateProfile.getUser", userError);
      return { error: "You must be signed in to update your profile." };
    }

    const displayName = String(formData.get("display_name") ?? "").trim();
    const currency =
      String(formData.get("currency") ?? "PKR").trim().toUpperCase() || "PKR";
    const location = String(formData.get("location") ?? "").trim();

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        currency,
        location: location || null,
      })
      .eq("id", user.id);

    if (error) {
      logAuthFailure("updateProfile", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateProfile", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Profile saved." };
}
