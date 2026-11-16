import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { SavingSuggestions } from "@/components/dashboard/saving-suggestions";
import { WeeklySnapshot } from "@/components/dashboard/weekly-snapshot";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { getDashboardFinance } from "@/lib/finance/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

function Fallback() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Loading dashboard…"
      description="Fetching your budget and recent expenses."
    />
  );
}

async function DashboardContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Connect Supabase"
        description="Add keys to .env.local to see live budget data."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Sign in required"
        description="Sign in to view your household dashboard."
      />
    );
  }

  const data = await getDashboardFinance();

  return (
    <div className="grid gap-6">
      <BudgetOverview
        yearMonth={data.yearMonth}
        overview={data.overview}
        hasBudgetRow={Boolean(data.budget)}
      />
      <QuickActions />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions expenses={data.recent} />
        <BudgetProgress rows={data.categoryProgressRows} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SavingSuggestions />
        <WeeklySnapshot weekTotal={data.weekTotal} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dashboard"
        description="Your household control panel — live budget and expenses under RLS."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/budget" />}
            >
              Set monthly budget
            </Button>
            <Button nativeButton={false} render={<Link href="/expenses" />}>
              Add expense
            </Button>
          </div>
        }
      />
      <Suspense fallback={<Fallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
