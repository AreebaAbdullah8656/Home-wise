import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/format";
import { monthLabel } from "@/lib/budget-math";
import type { SavingsOverview } from "@/lib/finance/savings";

type SavingsOverviewCardsProps = {
  overview: SavingsOverview;
};

export function SavingsOverviewCards({ overview }: SavingsOverviewCardsProps) {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">How counting works</CardTitle>
          <CardDescription>
            Allocated = planned set-aside. Actual = money really saved. Neither
            is an expense — spending stays on the Expenses page only.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Savings goals — allocated"
            value={formatPkr(overview.goalsAllocated)}
          />
          <Stat
            label="Savings goals — actual"
            value={formatPkr(overview.goalsActual)}
          />
          <Stat
            label="Gap (allocated − actual)"
            value={formatPkr(overview.goalsGap)}
          />
          <Stat
            label="Emergency — allocated"
            value={formatPkr(overview.emergencyAllocated)}
          />
          <Stat
            label="Emergency — actual"
            value={formatPkr(overview.emergencyActual)}
          />
          <Stat
            label="Emergency gap"
            value={formatPkr(overview.emergencyGap)}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            This month’s budget set-asides
          </CardTitle>
          <CardDescription>
            From My Budget for {monthLabel(overview.yearMonth)}. These envelope
            amounts are not double-counted as expenses or as goal actuals.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Budget savings allocation:{" "}
            <span className="font-medium text-foreground">
              {formatPkr(overview.budgetSavingsAllocation)}
            </span>
            {" · "}
            Budget emergency allocation:{" "}
            <span className="font-medium text-foreground">
              {formatPkr(overview.budgetEmergencyAllocation)}
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/budget" />}
          >
            Edit monthly budget
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-4 py-3 ring-1 ring-border/60">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl text-foreground">{value}</p>
    </div>
  );
}
