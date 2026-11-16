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

export function MobileNav() {
  const [open, setOpen] = useState(false);

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
          <div className="mt-auto border-t border-sidebar-border p-4">
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/login" onClick={() => setOpen(false)} />}
            >
              Sign in
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
