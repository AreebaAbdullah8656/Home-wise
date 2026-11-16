import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

type AppSidebarProps = {
  email?: string | null;
  displayName?: string | null;
  configured: boolean;
};

export function AppSidebar({ email, displayName, configured }: AppSidebarProps) {
  const signedIn = Boolean(email);

  return (
    <aside className="hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 shadow-sm md:flex">
      <div className="border-b border-sidebar-border px-4 py-5">
        <BrandMark />
      </div>
      <SidebarNav />
      <div className="mt-auto space-y-2 border-t border-sidebar-border p-4">
        {signedIn ? (
          <>
            <div className="px-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName || "Signed in"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <SignOutButton className="w-full justify-center" />
          </>
        ) : (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              {configured
                ? "Sign in with email and password to sync your household data."
                : "Add Supabase keys in .env.local to enable authentication."}
            </p>
            <Button
              variant="outline"
              className="w-full justify-center"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
