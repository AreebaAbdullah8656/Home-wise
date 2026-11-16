import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  return (
    <aside className="hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 shadow-sm md:flex">
      <div className="border-b border-sidebar-border px-4 py-5">
        <BrandMark />
      </div>
      <SidebarNav />
      <div className="mt-auto space-y-2 border-t border-sidebar-border p-4">
        <p className="px-1 text-xs text-muted-foreground">
          Sign-in will connect to Supabase in Phase 3.
        </p>
        <Button
          variant="outline"
          className="w-full justify-center"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Sign in
        </Button>
      </div>
    </aside>
  );
}
