"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

type MobileNavProps = {
  email?: string | null;
  displayName?: string | null;
  configured: boolean;
};

export function MobileNav({ email, displayName, configured }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(email);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
      <BrandMark />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Open menu" />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-[min(100%,20rem)] flex-col gap-0 bg-sidebar p-0"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <BrandMark />
          </SheetHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
          <div className="mt-auto space-y-2 border-t border-sidebar-border p-4">
            {signedIn ? (
              <>
                <div>
                  <p className="truncate text-sm font-medium">
                    {displayName || "Signed in"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
                <SignOutButton className="w-full" />
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {configured
                    ? "Sign in to sync your data."
                    : "Configure Supabase in .env.local to enable auth."}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/login" onClick={() => setOpen(false)} />}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
