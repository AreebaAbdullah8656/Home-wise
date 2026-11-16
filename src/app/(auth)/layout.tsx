import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-sidebar/80 px-4 py-4 backdrop-blur md:px-8">
        <BrandMark />
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
