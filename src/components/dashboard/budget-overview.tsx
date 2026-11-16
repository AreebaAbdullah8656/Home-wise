import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatPkr } from "@/lib/format";
import { sampleBudgetOverview } from "@/lib/sample-dashboard";

export function BudgetOverview() {
  const data = sampleBudgetOverview;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-heading text-xl">Budget overview</CardTitle>
          <CardDescription>
            Monthly totals at a glance. Live numbers arrive with Phase 4.
          </CardDescription>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total monthly budget" value={formatPkr(data.monthlyBudgetPkr)} />
          <Metric label="Total expenses" value={formatPkr(data.totalExpensesPkr)} />
          <Metric label="Remaining balance" value={formatPkr(data.remainingPkr)} />
          <Metric
            label="Savings allocation"
            value={formatPkr(data.savingsAllocationPkr)}
          />
          <Metric label="Emergency fund" value={formatPkr(data.emergencyFundPkr)} />
          <Metric label="Budget used" value={`${data.utilizationPercent}%`} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget utilization</span>
            <span className="font-medium">{data.utilizationPercent}%</span>
          </div>
          <Progress value={data.utilizationPercent} aria-label="Budget utilization" />
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
