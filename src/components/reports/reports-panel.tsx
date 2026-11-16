import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { formatPkr } from "@/lib/format";
import { monthLabel } from "@/lib/budget-math";
import type { ReportsPayload } from "@/lib/finance/reports";

type ReportsPanelProps = {
  data: ReportsPayload;
};

export function ReportsPanel({ data }: ReportsPanelProps) {
  const { weekly, monthly } = data;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Date range</CardTitle>
          <CardDescription>
            Reports load only on this page. Changing the range never auto-opens
            charts elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DateRangePicker from={data.from} to={data.to} />
          <p className="text-sm text-muted-foreground">
            Selected range total:{" "}
            <span className="font-medium text-foreground">
              {formatPkr(data.rangeTotal)}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Weekly report</CardTitle>
          <CardDescription>
            {weekly.from} → {weekly.to} · compared with {weekly.previousFrom} →{" "}
            {weekly.previousTo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="This week" value={formatPkr(weekly.totalExpenses)} />
            <Stat
              label="Previous week"
              value={formatPkr(weekly.previousTotal)}
            />
            <Stat
              label="Change vs previous"
              value={formatPkr(weekly.deltaVsPrevious)}
              hint={
                weekly.deltaVsPrevious > 0
                  ? "Spent more than last week"
                  : weekly.deltaVsPrevious < 0
                    ? "Spent less than last week"
                    : "Same as last week"
              }
            />
            <Stat
              label="Weekly savings vs share"
              value={formatPkr(weekly.weeklySavings)}
              hint={`Week share of spending budget: ${formatPkr(weekly.weeklyBudgetShare)}`}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Highest category:{" "}
            <span className="font-medium text-foreground">
              {weekly.highestCategory
                ? `${weekly.highestCategory.name} (${formatPkr(weekly.highestCategory.amount)})`
                : "No spending this week"}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Monthly report</CardTitle>
          <CardDescription>{monthLabel(monthly.yearMonth)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Total monthly budget"
              value={formatPkr(monthly.totalBudget)}
            />
            <Stat
              label="Total expenses"
              value={formatPkr(monthly.totalExpenses)}
            />
            <Stat
              label="Remaining (spending budget)"
              value={formatPkr(monthly.remaining)}
            />
            <Stat
              label="Savings allocation"
              value={formatPkr(monthly.savingsAllocation)}
              hint="Set-aside — not an expense"
            />
            <Stat
              label="Emergency allocation"
              value={formatPkr(monthly.emergencyAllocation)}
              hint="Set-aside — not an expense"
            />
            <Stat
              label="Budget utilization"
              value={`${monthly.utilizationPercent}%`}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Charts</CardTitle>
          <CardDescription>
            Clean visuals for category and week comparison. Opened only here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsCharts
            weeklyCategories={weekly.categoryBreakdown}
            monthlyCategories={monthly.categoryBreakdown}
            weeklyComparison={[
              { label: "Previous", amount: weekly.previousTotal },
              { label: "This week", amount: weekly.totalExpenses },
            ]}
            utilizationPercent={monthly.utilizationPercent}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 px-4 py-3 ring-1 ring-border/60">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl text-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
