import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = { title: "Scan a Bill" };

export default function ScanBillPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <FeaturePlaceholder
        title="Scan a Bill"
        description="Optional bill upload with review before anything is saved. OCR results are never final until you confirm."
        icon={ScanLine}
        emptyTitle="Bill scanner ready in a later phase"
        emptyDescription="Upload images or PDFs, capture with your camera, then review and correct extracted items before confirming. Unconfirmed OCR will not create expenses."
        phaseNote="Gemini multimodal OCR via server API routes — Phase 5. Upload stays optional forever."
      />
    </div>
  );
}
