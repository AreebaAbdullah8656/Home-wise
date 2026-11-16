import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "My Budget" };

export default function BudgetPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="My Budget"
        description="Set your monthly budget, category limits, savings, and emergency allocations — on your terms."
        icon={Wallet}
        emptyTitle="Budget tools coming next"
        emptyDescription="You will soon create custom categories, adjust limits anytime, and see remaining balances without forced allocations."
        phaseNote="Full budget management ships in Phase 4."
      />
    </div>
  );
}
