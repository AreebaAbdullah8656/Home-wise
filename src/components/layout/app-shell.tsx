import { Suspense, type ReactNode } from "react";
import {
  AuthMobileNav,
  AuthMobileNavFallback,
  AuthSidebar,
  AuthSidebarFallback,
} from "@/components/layout/auth-chrome";
import { CurrencyChrome } from "@/components/layout/currency-chrome";
import { ConfigBanner } from "@/components/shared/config-banner";

/**
 * Static shell + Suspense for auth chrome.
 * Do not await session at the layout top level — that blocks {children} and
 * trips Cache Components when Supabase auth calls Date.now() during prerender.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <Suspense fallback={<AuthSidebarFallback />}>
        <AuthSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<AuthMobileNavFallback />}>
          <AuthMobileNav />
        </Suspense>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <ConfigBanner />
          <CurrencyChrome>{children}</CurrencyChrome>
        </main>
      </div>
    </div>
  );
}
