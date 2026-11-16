import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

// Session/cookie reads in AppShell — block prerender (Cache Components auth pattern).
export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
