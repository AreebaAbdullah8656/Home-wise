"use client";

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
import { useMoney } from "@/lib/currency/provider";
import { categoryProgress } from "@/lib/budget-math";

type CategoryProgressRow = {
  id: string;
  name: string;
  limit: number | null;
  spent: number;
};

type BudgetProgressProps = {
  rows: CategoryProgressRow[];
};

export function BudgetProgress({ rows }: BudgetProgressProps) {
  const { format } = useMoney();
  const withLimits = rows.filter((row) => row.limit != null && row.limit > 0);
  const display = (withLimits.length > 0 ? withLimits : rows).slice(0, 6);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-heading text-xl">Budget progress</CardTitle>
          <CardDescription>Category spending this month.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/budget" />}
        >
          Manage categories
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {display.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Categories will appear here after signup defaults load.
          </p>
        ) : (
          display.map((category) => {
            const progress = categoryProgress(category.limit, category.spent);
            return (
              <div key={category.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground">
                    {format(category.spent)}
                    {category.limit != null
                      ? ` / ${format(category.limit)}`
                      : ""}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, progress.percent)}
                  aria-label={`${category.name} progress`}
                />
                {progress.nearLimit || progress.overLimit ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {progress.overLimit
                      ? `Over limit (${progress.percent}%).`
                      : `Approaching limit (${progress.percent}%).`}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
