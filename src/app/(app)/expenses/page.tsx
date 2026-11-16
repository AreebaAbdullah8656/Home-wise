import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Expenses"
        description="Add expenses manually or with natural language. Bill upload is never required."
        icon={Receipt}
        emptyTitle="No expenses yet"
        emptyDescription="Manual entry, smart NL parsing (with your confirmation), search, and filters arrive in Phase 4. Scanned bills join the same history after you confirm them."
        phaseNote="Expense CRUD and NL parsing (Gemini, server-side) — Phase 4."
      />
    </div>
  );
}
