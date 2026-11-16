import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Smart Saving Tips" };

export default function TipsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Smart Saving Tips"
        description="Practical advice for groceries, utilities, kitchen, cleaning, DIY, and budget-friendly shopping."
        icon={Lightbulb}
        emptyTitle="Tip library arrives in Phase 9"
        emptyDescription="Browse actionable tips and bookmark the ones that fit your household. The dashboard keeps only a small suggestion strip."
        phaseNote="Smart Saving Tips + bookmarks — Phase 9."
      />
    </div>
  );
}
