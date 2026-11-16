import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/**
 * Deploy-ready sidebar only — unfinished SPEC sections stay out of nav
 * (Scan a Bill, My Bills, Savings, Inventory, Tips, Recommendations).
 */
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
    title: "Grocery List",
    href: "/grocery",
    icon: ShoppingCart,
    description: "Plan and track groceries",
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

/** Routes hidden from nav until their phases ship. Direct visits redirect home. */
export const HIDDEN_FEATURE_ROUTES = [
  "/scan-bill",
  "/bills",
  "/savings",
  "/inventory",
  "/tips",
  "/recommendations",
] as const;
