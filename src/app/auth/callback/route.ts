import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

/**
 * Supabase email confirmation / magic-link style code exchange.
 * Confirm links land here with ?code=… then we establish a session and send
 * the user into the app (only if email_confirmed_at is set).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/dashboard";
  const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route Handler may be followed by a redirect response.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/login?error=confirm_failed`
    );
  }

  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=email_unconfirmed`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
