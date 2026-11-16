"use client";

import { useMemo, useState } from "react";
import { deleteExpense } from "@/app/expenses/actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPkr } from "@/lib/format";
import type { CategoryRow, ExpenseWithCategory } from "@/lib/finance/queries";

type ExpenseListProps = {
  expenses: ExpenseWithCategory[];
  categories: CategoryRow[];
  initialSearch?: string;
  initialCategoryId?: string;
  initialFrom?: string;
  initialTo?: string;
};

export function ExpenseList({
  expenses,
  categories,
  initialSearch = "",
  initialCategoryId = "",
  initialFrom = "",
  initialTo = "",
}: ExpenseListProps) {
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((expense) => {
      if (
        search &&
        !expense.name.toLowerCase().includes(search.toLowerCase()) &&
        !(expense.notes ?? "").toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (categoryId && expense.category_id !== categoryId) return false;
      if (from && expense.expense_date < from) return false;
      if (to && expense.expense_date > to) return false;
      return true;
    });
  }, [expenses, search, categoryId, from, to]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="filter_search">Search</Label>
          <Input
            id="filter_search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or notes"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter_category">Category</Label>
          <select
            id="filter_category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="filter_from">From</Label>
            <Input
              id="filter_from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter_to">To</Label>
            <Input
              id="filter_to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No expenses match your filters. Add one above — bill upload is never required.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((expense) => (
            <li
              key={expense.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              {editingId === expense.id ? (
                <div className="space-y-3">
                  <ExpenseForm categories={categories} expense={expense} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel edit
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-heading text-lg font-medium text-sage-deep">
                      {expense.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {expense.categories?.name ?? "Uncategorized"} ·{" "}
                      {expense.expense_date}
                      {expense.payment_method
                        ? ` · ${expense.payment_method}`
                        : ""}
                    </p>
                    {expense.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {expense.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="font-heading text-xl font-semibold">
                      {formatPkr(Number(expense.amount))}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(expense.id)}
                      >
                        Edit
                      </Button>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={expense.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
