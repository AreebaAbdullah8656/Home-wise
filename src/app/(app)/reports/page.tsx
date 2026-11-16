import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Reports"
        description="Weekly and monthly insights with charts — only when you open this page. Nothing auto-opens or interrupts your flow."
        icon={BarChart3}
        emptyTitle="Reports stay quiet until you visit"
        emptyDescription="Choose a date range and explore category breakdowns here in Phase 9. Adding an expense will never redirect you into reports."
        phaseNote="Detailed reports + Recharts — Phase 9. Never auto-open (SPEC §13)."
      />
    </div>
  );
}
