"use client";

import { useActionState } from "react";
import {
  createExpense,
  updateExpense,
  type ActionState,
} from "@/app/expenses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/lib/currency/provider";
import { todayIso, toNumber } from "@/lib/budget-math";
import type { CategoryRow, ExpenseRow } from "@/lib/finance/queries";

const initial: ActionState = {};

const PAYMENT_METHODS = [
  "Cash",
  "JazzCash",
  "EasyPaisa",
  "Card",
  "Bank transfer",
  "Other",
] as const;

type ExpenseFormProps = {
  categories: CategoryRow[];
  expense?: ExpenseRow | null;
  onDone?: () => void;
};

export function ExpenseForm({ categories, expense = null }: ExpenseFormProps) {
  const action = expense ? updateExpense : createExpense;
  const [state, formAction, pending] = useActionState(action, initial);
  const { displayCurrency, toDisplay } = useMoney();
  const code = displayCurrency;

  return (
    <form action={formAction} className="space-y-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Expense name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={expense?.name ?? ""}
            placeholder="e.g. Weekly groceries"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({code})</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={
              expense != null ? toDisplay(toNumber(expense.amount)) : ""
            }
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense_date">Date</Label>
          <Input
            id="expense_date"
            name="expense_date"
            type="date"
            required
            defaultValue={expense?.expense_date ?? todayIso()}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={expense?.category_id ?? ""}
            disabled={pending}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment method</Label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue={expense?.payment_method ?? ""}
            disabled={pending}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={expense?.notes ?? ""}
            placeholder="No receipt required — bill upload is always optional."
            disabled={pending}
          />
        </div>
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
        {pending
          ? "Saving…"
          : expense
            ? "Update expense"
            : "Save expense"}
      </Button>
    </form>
  );
}
