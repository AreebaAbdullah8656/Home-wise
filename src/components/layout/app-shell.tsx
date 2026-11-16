import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ConfigBanner } from "@/components/shared/config-banner";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export async function AppShell({ children }: { children: ReactNode }) {
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

  const email = user?.email ?? null;

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar
        email={email}
        displayName={displayName}
        configured={configured}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav
          email={email}
          displayName={displayName}
          configured={configured}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <ConfigBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
