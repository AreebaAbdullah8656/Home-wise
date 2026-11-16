import { Suspense } from "react";
import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetForm } from "@/components/budget/budget-form";
import { CategoryManager } from "@/components/budget/category-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import {
  getCategoriesForUser,
  getCategorySpendMap,
  getMonthlyBudget,
  getMonthExpenseTotal,
} from "@/lib/finance/queries";
import {
  computeBudgetOverview,
  monthLabel,
  monthStartIso,
  toNumber,
} from "@/lib/budget-math";
import { formatPkr } from "@/lib/format";

export const metadata: Metadata = { title: "My Budget" };

function Fallback() {
  return (
    <EmptyState
      icon={Wallet}
      title="Loading budget…"
      description="Fetching your monthly budget and categories."
    />
  );
}

async function BudgetContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={Wallet}
        title="Connect Supabase"
        description="Add your Supabase keys to .env.local to manage budgets."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sign in required"
        description="Sign in to set your monthly budget and categories."
      />
    );
  }

  const yearMonth = monthStartIso();
  const [budget, categories, spendMap, totalExpenses] = await Promise.all([
    getMonthlyBudget(yearMonth),
    getCategoriesForUser(),
    getCategorySpendMap(yearMonth),
    getMonthExpenseTotal(yearMonth),
  ]);

  const overview = computeBudgetOverview({
    totalBudget: toNumber(budget?.total_amount),
    savingsAllocation: toNumber(budget?.savings_allocation),
    emergencyAllocation: toNumber(budget?.emergency_allocation),
    totalExpenses,
  });

  const spendRecord: Record<string, number> = {};
  spendMap.forEach((value, key) => {
    spendRecord[key] = value;
  });

  return (
    <div className="space-y-6">
      {overview.nearLimit ? (
        <p className="rounded-xl border border-border bg-secondary/70 px-4 py-3 text-sm text-secondary-foreground">
          Subtle alert: you have used {overview.utilizationPercent}% of this
          month&apos;s spending budget. Allocations are not counted as expenses.
        </p>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Monthly budget · {monthLabel(yearMonth)}
          </CardTitle>
          <CardDescription>
            Change anytime. Savings and emergency amounts are allocations, not
            spending.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total budget" value={formatPkr(overview.totalBudget)} />
            <Metric
              label="Available to spend"
              value={formatPkr(overview.spendingBudget)}
            />
            <Metric label="Expenses so far" value={formatPkr(overview.totalExpenses)} />
            <Metric label="Remaining" value={formatPkr(overview.remaining)} />
          </div>
          <BudgetForm yearMonth={yearMonth} budget={budget} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Categories</CardTitle>
          <CardDescription>
            Rename, set optional limits, or add custom categories. Defaults can be
            edited or removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} spendMap={spendRecord} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3 ring-1 ring-border/60">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-sage-deep">{value}</p>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My Budget"
        description="Set your monthly envelope, optional allocations, and category limits — never forced."
      />
      <Suspense fallback={<Fallback />}>
        <BudgetContent />
      </Suspense>
    </div>
  );
}
