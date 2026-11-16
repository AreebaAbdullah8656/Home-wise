import { Suspense } from "react";
import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportsPanel } from "@/components/reports/reports-panel";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { getReportsData } from "@/lib/finance/reports";

export const metadata: Metadata = { title: "Reports" };
export const instant = false;

type ReportsPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

function Fallback() {
  return (
    <EmptyState
      icon={BarChart3}
      title="Loading reports…"
      description="Fetching weekly and monthly insights for the range you chose."
    />
  );
}

async function ReportsContent({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Connect Supabase"
        description="Add your Supabase keys to view spending reports."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sign in required"
        description="Sign in to open reports. Nothing auto-opens reports for you."
      />
    );
  }

  const data = await getReportsData({ from, to });
  return <ReportsPanel data={data} />;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reports"
        description="Weekly and monthly insights with charts — only when you open this page. No pop-ups or redirects."
      />
      <Suspense fallback={<Fallback />}>
        <ReportsContent from={params.from} to={params.to} />
      </Suspense>
    </div>
  );
}
