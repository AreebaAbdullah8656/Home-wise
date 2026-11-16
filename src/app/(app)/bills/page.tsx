import type { Metadata } from "next";
import { FileStack } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "My Bills" };

export default function BillsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="My Bills"
        description="Your private digital bill wallet — confirmed bills only, secured per user."
        icon={FileStack}
        emptyTitle="No bills stored yet"
        emptyDescription="Confirmed uploads will appear here with store, date, total, items, and the original file. Manual expenses without receipts are still fully supported."
        phaseNote="Bill wallet and secure storage — Phase 5."
      />
    </div>
  );
}
