"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useMoney } from "@/lib/currency/provider";
import type { ExpenseWithCategory } from "@/lib/finance/queries";

type RecentTransactionsProps = {
  expenses: ExpenseWithCategory[];
};

export function RecentTransactions({ expenses }: RecentTransactionsProps) {
  const { format } = useMoney();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Recent transactions</CardTitle>
        <CardDescription>
          Latest expenses with name, category, amount, date, and payment method.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add an expense manually anytime. Bill upload is never required."
          >
            <Button nativeButton={false} render={<Link href="/expenses" />}>
              Add expense
            </Button>
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3 ring-1 ring-border/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{expense.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {expense.categories?.name ?? "Uncategorized"} ·{" "}
                    {expense.expense_date}
                    {expense.payment_method ? ` · ${expense.payment_method}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-heading font-semibold">
                  {format(Number(expense.amount))}
                </p>
              </li>
            ))}
            <li>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/expenses" />}
              >
                View all expenses
              </Button>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
