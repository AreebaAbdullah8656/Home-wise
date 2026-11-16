import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ScanLine,
  FileStack,
  PiggyBank,
  ShoppingCart,
  Home,
  Lightbulb,
  Sparkles,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** SPEC §16 sidebar sections — every item must be a real route. */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your household overview",
  },
  {
    title: "My Budget",
    href: "/budget",
    icon: Wallet,
    description: "Monthly budget and categories",
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: Receipt,
    description: "Track daily spending",
  },
  {
    title: "Scan a Bill",
    href: "/scan-bill",
    icon: ScanLine,
    description: "Optional bill upload and review",
  },
  {
    title: "My Bills",
    href: "/bills",
    icon: FileStack,
    description: "Digital bill wallet",
  },
  {
    title: "Savings & Emergency",
    href: "/savings",
    icon: PiggyBank,
    description: "Savings and emergency funds",
  },
  {
    title: "Grocery List",
    href: "/grocery",
    icon: ShoppingCart,
    description: "Plan and track groceries",
  },
  {
    title: "Home Inventory",
    href: "/inventory",
    icon: Home,
    description: "Household stock and supplies",
  },
  {
    title: "Smart Saving Tips",
    href: "/tips",
    icon: Lightbulb,
    description: "Practical money-saving advice",
  },
  {
    title: "Smart Recommendations",
    href: "/recommendations",
    icon: Sparkles,
    description: "Affordable alternatives",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Open reports only when you want",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Profile and preferences",
  },
];
