import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Grocery List" };

export default function GroceryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Grocery List"
        description="Plan items, priorities, and estimated totals — then mark purchased without duplicate expenses."
        icon={ShoppingCart}
        emptyTitle="Your grocery list is empty"
        emptyDescription="Add, edit, and complete items here in Phase 7. Purchased items can become expenses once without creating duplicates."
        phaseNote="Grocery list management — Phase 7."
      />
    </div>
  );
}
