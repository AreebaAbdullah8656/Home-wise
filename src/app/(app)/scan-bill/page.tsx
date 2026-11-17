import { Suspense } from "react";
import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BillScanner } from "@/components/bills/bill-scanner";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/gemini/config";

export const metadata: Metadata = { title: "Scan a Bill" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={ScanLine}
      title="Loading scanner…"
      description="Preparing bill upload."
    />
  );
}

async function ScanContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={ScanLine}
        title="Connect Supabase"
        description="Add your Supabase keys to scan and store bills."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={ScanLine}
        title="Sign in required"
        description="Sign in to upload bills. Manual expenses still work without a bill."
      />
    );
  }

  return <BillScanner geminiReady={isGeminiConfigured()} />;
}

export default function ScanBillPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Scan a Bill"
        description="Upload or capture a receipt, review OCR, then confirm. Nothing becomes an expense until you confirm."
      />
      <Suspense fallback={<Fallback />}>
        <ScanContent />
      </Suspense>
    </div>
  );
}
