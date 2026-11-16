import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Savings & Emergency" };

export default function SavingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Savings & Emergency"
        description="Track allocated savings, actual savings, and emergency funds without double-counting expenses."
        icon={PiggyBank}
        emptyTitle="Funds overview coming soon"
        emptyDescription="This section will separate budget allocations from real progress so totals stay accurate and clear."
        phaseNote="Dedicated savings UX — Phase 6."
      />
    </div>
  );
}
