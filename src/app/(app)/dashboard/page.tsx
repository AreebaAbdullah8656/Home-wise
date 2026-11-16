import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { SavingSuggestions } from "@/components/dashboard/saving-suggestions";
import { WeeklySnapshot } from "@/components/dashboard/weekly-snapshot";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dashboard"
        description="Your household control panel — informative, not overcrowded. Sample figures are labeled until your real budget connects."
        actions={
          <Button variant="outline" render={<Link href="/budget" />}>
            Update monthly budget
          </Button>
        }
      />

      <div className="grid gap-6">
        <BudgetOverview />
        <QuickActions />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions />
          <BudgetProgress />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SavingSuggestions />
          <WeeklySnapshot />
        </div>
      </div>
    </div>
  );
}
