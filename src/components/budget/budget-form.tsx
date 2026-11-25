"use client";

import { useActionState } from "react";
import {
  upsertMonthlyBudget,
  type ActionState,
} from "@/app/budget/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/lib/currency/provider";
import { monthLabel, toNumber } from "@/lib/budget-math";
import type { MonthlyBudgetRow } from "@/lib/finance/queries";

const initial: ActionState = {};

type BudgetFormProps = {
  yearMonth: string;
  budget: MonthlyBudgetRow | null;
};

export function BudgetForm({ yearMonth, budget }: BudgetFormProps) {
  const [state, action, pending] = useActionState(upsertMonthlyBudget, initial);
  const { displayCurrency, toDisplay } = useMoney();
  const code = displayCurrency;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="year_month" value={yearMonth} />
      <p className="text-sm text-muted-foreground">
        Editing budget for <span className="font-medium text-foreground">{monthLabel(yearMonth)}</span>.
        Allocations are set-asides — they are not counted as expenses.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="total_amount">Total monthly budget ({code})</Label>
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={toDisplay(toNumber(budget?.total_amount))}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="savings_allocation">Savings allocation ({code})</Label>
          <Input
            id="savings_allocation"
            name="savings_allocation"
            type="number"
            min={0}
            step="any"
            defaultValue={toDisplay(toNumber(budget?.savings_allocation))}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_allocation">Emergency allocation ({code})</Label>
          <Input
            id="emergency_allocation"
            name="emergency_allocation"
            type="number"
            min={0}
            step="any"
            defaultValue={toDisplay(toNumber(budget?.emergency_allocation))}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={budget?.notes ?? ""}
          disabled={pending}
          placeholder="Optional notes for this month"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save monthly budget"}
      </Button>
    </form>
  );
}
