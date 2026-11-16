import { connection } from "next/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";

async function loadAuthChrome() {
  // Ensure this tree runs at request time (Supabase auth uses Date.now()).
  await connection();

  const configured = isSupabaseConfigured();
  const user = await getSessionUser();

  let displayName: string | null = null;
  if (user && configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      displayName = data?.display_name ?? null;
    } catch {
      displayName = null;
    }
  }

  return {
    configured,
    email: user?.email ?? null,
    displayName,
  };
}

export async function AuthSidebar() {
  const chrome = await loadAuthChrome();
  return (
    <AppSidebar
      email={chrome.email}
      displayName={chrome.displayName}
      configured={chrome.configured}
    />
  );
}

export async function AuthMobileNav() {
  const chrome = await loadAuthChrome();
  return (
    <MobileNav
      email={chrome.email}
      displayName={chrome.displayName}
      configured={chrome.configured}
    />
  );
}

export function AuthSidebarFallback() {
  return <AppSidebar configured={isSupabaseConfigured()} />;
}

export function AuthMobileNavFallback() {
  return <MobileNav configured={isSupabaseConfigured()} />;
}
