"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { isEmailConfirmed } from "@/lib/supabase/email-confirmed";
import { getSiteUrl } from "@/lib/site-url";

export type AuthActionState = {
  error?: string;
  success?: string;
  /** When true, login UI should offer "Resend confirmation email". */
  needsConfirmation?: boolean;
  email?: string;
};

function missingConfigState(): AuthActionState {
  return {
    error:
      "Supabase is not configured. Copy .env.example to .env.local (must be a file, not a folder) and add NEXT_PUBLIC_SUPABASE_URL plus NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY).",
  };
}

function mapSignInError(message: string, email: string): AuthActionState {
  if (/email not confirmed|confirm your email|email_not_confirmed/i.test(message)) {
    return {
      error:
        "Your email is not confirmed yet. Check your inbox for the confirmation link, or resend it below.",
      needsConfirmation: true,
      email,
    };
  }
  if (/invalid login credentials|invalid credentials|wrong password/i.test(message)) {
    return {
      error: "Incorrect email or password. Please try again.",
    };
  }
  return { error: message };
}

function mapSignUpError(message: string): AuthActionState {
  if (
    /already registered|already been registered|user already|already exists/i.test(
      message
    )
  ) {
    return {
      error: "An account already exists for this email, please log in.",
    };
  }
  return { error: message };
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logAuthFailure("signIn", error);
      return mapSignInError(formatAuthError(error), email);
    }

    const user = data.user;
    if (!isEmailConfirmed(user)) {
      await supabase.auth.signOut();
      return {
        error:
          "Your email is not confirmed yet. Check your inbox for the confirmation link, or resend it below.",
        needsConfirmation: true,
        email,
      };
    }
  } catch (error) {
    logAuthFailure("signIn", error);
    return mapSignInError(formatAuthError(error), email);
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

  const siteUrl = getSiteUrl();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          display_name: displayName || undefined,
        },
      },
    });

    if (error) {
      logAuthFailure("signUp", error);
      return mapSignUpError(formatAuthError(error));
    }

    // Supabase may return a user with empty identities when the email is taken
    // (to avoid leaking account existence in some configurations).
    const identities = data.user?.identities;
    if (data.user && Array.isArray(identities) && identities.length === 0) {
      return {
        error: "An account already exists for this email, please log in.",
      };
    }

    // Always require confirmation before app access. If a session slipped through
    // (Confirm email OFF), sign out so the user still sees the confirm path.
    if (data.session) {
      if (!isEmailConfirmed(data.user)) {
        await supabase.auth.signOut();
      } else {
        // Project likely has Confirm email disabled — still tell them to confirm
        // per product requirement, but they can sign in if already confirmed.
        await supabase.auth.signOut();
      }
    }

    return {
      success: "Check your email to confirm your account.",
      needsConfirmation: true,
      email,
    };
  } catch (error) {
    logAuthFailure("signUp", error);
    return mapSignUpError(formatAuthError(error));
  }
}

export async function resendConfirmationEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return missingConfigState();
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email to resend the confirmation link." };
  }

  const siteUrl = getSiteUrl();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      logAuthFailure("resendConfirmation", error);
      return {
        error: formatAuthError(error),
        needsConfirmation: true,
        email,
      };
    }

    return {
      success: "Confirmation email sent. Check your inbox (and spam folder).",
      needsConfirmation: true,
      email,
    };
  } catch (error) {
    logAuthFailure("resendConfirmation", error);
    return {
      error: formatAuthError(error),
      needsConfirmation: true,
      email,
    };
  }
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

    if (!isEmailConfirmed(user)) {
      return {
        error:
          "Confirm your email before updating your profile. Check your inbox or resend from the sign-in page.",
        needsConfirmation: true,
        email: user.email ?? undefined,
      };
    }

    const displayName = String(formData.get("display_name") ?? "").trim();
    const currency =
      String(formData.get("currency") ?? "PKR").trim().toUpperCase() || "PKR";
    const location = String(formData.get("location") ?? "").trim();
    const latRaw = String(formData.get("location_lat") ?? "").trim();
    const lngRaw = String(formData.get("location_lng") ?? "").trim();
    const lat = latRaw !== "" ? Number(latRaw) : null;
    const lng = lngRaw !== "" ? Number(lngRaw) : null;
    const hasCoords =
      lat != null &&
      lng != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    // Display-currency only — does not rewrite stored amounts (see permanent convert).
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        currency,
        location: location || null,
        location_lat: hasCoords ? lat : null,
        location_lng: hasCoords ? lng : null,
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
  revalidatePath("/", "layout");
  return {
    success:
      "Profile saved. Money amounts are shown in your selected currency using the live rate (stored originals stay unchanged until you permanently convert).",
  };
}
