import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/format";
import type { BudgetOverviewResult } from "@/lib/budget-math";
import { monthLabel } from "@/lib/budget-math";

type BudgetOverviewProps = {
  yearMonth: string;
  overview: BudgetOverviewResult;
  hasBudgetRow: boolean;
};

export function BudgetOverview({
  yearMonth,
  overview,
  hasBudgetRow,
}: BudgetOverviewProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-heading text-xl">Budget overview</CardTitle>
          <CardDescription>
            {monthLabel(yearMonth)}. Allocations are set-asides — not counted as
            expenses.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/budget" />}
        >
          {hasBudgetRow ? "Edit budget" : "Set monthly budget"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasBudgetRow ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No monthly budget yet. Set one to track remaining balance and utilization.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total monthly budget" value={formatPkr(overview.totalBudget)} />
          <Metric label="Total expenses" value={formatPkr(overview.totalExpenses)} />
          <Metric label="Remaining to spend" value={formatPkr(overview.remaining)} />
          <Metric
            label="Savings allocation"
            value={formatPkr(overview.savingsAllocation)}
          />
          <Metric
            label="Emergency allocation"
            value={formatPkr(overview.emergencyAllocation)}
          />
          <Metric label="Budget used" value={`${overview.utilizationPercent}%`} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Utilization of spending budget ({formatPkr(overview.spendingBudget)})
            </span>
            <span className="font-medium">{overview.utilizationPercent}%</span>
          </div>
          <Progress
            value={Math.min(100, overview.utilizationPercent)}
            aria-label="Budget utilization"
          />
          {overview.nearLimit ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Subtle alert: you are at or above 80% of this month&apos;s spending
              budget.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
