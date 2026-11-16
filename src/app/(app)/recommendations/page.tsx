import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Smart Recommendations" };

export default function RecommendationsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Smart Recommendations"
        description="Affordable alternatives and home discovery — not a store. No cart, checkout, or payments."
        icon={Sparkles}
        emptyTitle="Recommendations coming later"
        emptyDescription="When real product APIs are unavailable, any demo offers will be clearly labeled as sample data. Prices and discounts will never be invented as if they were real."
        phaseNote="Alternatives & discovery — Phase 8."
      />
    </div>
  );
}
