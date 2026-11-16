import type { Metadata } from "next";
import { Home } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Home Inventory" };

export default function InventoryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Home Inventory"
        description="Kitchen, cleaning, bathroom, laundry, appliances, and more — with low-stock reminders."
        icon={Home}
        emptyTitle="No inventory items yet"
        emptyDescription="Record quantities, purchase dates, and stock status here. Low-stock items will be easy to send to your grocery list."
        phaseNote="Household inventory — Phase 7."
      />
    </div>
  );
}
