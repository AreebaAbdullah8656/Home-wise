"use client";

import { useActionState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type ActionState,
} from "@/app/budget/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMoney } from "@/lib/currency/provider";
import { categoryProgress, toNumber } from "@/lib/budget-math";
import type { CategoryRow } from "@/lib/finance/queries";

const initial: ActionState = {};

type CategoryManagerProps = {
  categories: CategoryRow[];
  spendMap: Record<string, number>;
};

export function CategoryManager({ categories, spendMap }: CategoryManagerProps) {
  const { format } = useMoney();
  const [createState, createAction, createPending] = useActionState(
    createCategory,
    initial
  );

  return (
    <div className="space-y-6">
      <form action={createAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_140px_auto]">
        <div className="space-y-2">
          <Label htmlFor="new_category_name">New category</Label>
          <Input
            id="new_category_name"
            name="name"
            placeholder="e.g. School supplies"
            required
            disabled={createPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new_category_limit">Limit (optional)</Label>
          <Input
            id="new_category_limit"
            name="spending_limit"
            type="number"
            min={0}
            step="1"
            placeholder="Limit"
            disabled={createPending}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={createPending} className="w-full sm:w-auto">
            {createPending ? "Adding…" : "Add"}
          </Button>
        </div>
        {createState.error ? (
          <p className="sm:col-span-3 text-sm text-destructive" role="alert">
            {createState.error}
          </p>
        ) : null}
        {createState.success ? (
          <p className="sm:col-span-3 text-sm text-accent-foreground" role="status">
            {createState.success}
          </p>
        ) : null}
      </form>

      <ul className="space-y-3">
        {categories.map((cat) => {
          const spent = spendMap[cat.id] ?? 0;
          const progress = categoryProgress(cat.spending_limit, spent);
          return (
            <li
              key={cat.id}
              className="rounded-xl border border-border bg-card/80 p-4 shadow-sm"
            >
              <CategoryEditRow category={cat} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Spent this month: {format(spent)}
                  {cat.spending_limit != null
                    ? ` / ${format(toNumber(cat.spending_limit))}`
                    : " (no limit)"}
                </span>
                {progress.nearLimit ? (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    Approaching limit ({progress.percent}%)
                  </span>
                ) : null}
                {progress.overLimit ? (
                  <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">
                    Over limit ({progress.percent}%)
                  </span>
                ) : null}
                {cat.is_default ? (
                  <span className="text-muted-foreground">Default category</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryEditRow({ category }: { category: CategoryRow }) {
  const [state, action, pending] = useActionState(updateCategory, initial);
  const { toDisplay } = useMoney();

  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="id" value={category.id} />
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`name-${category.id}`} className="sr-only">
            Name
          </Label>
          <Input
            id={`name-${category.id}`}
            name="name"
            defaultValue={category.name}
            required
            disabled={pending}
          />
        </div>
        <div className="w-full space-y-1 sm:w-36">
          <Label htmlFor={`limit-${category.id}`} className="sr-only">
            Limit
          </Label>
          <Input
            id={`limit-${category.id}`}
            name="spending_limit"
            type="number"
            min={0}
            step="any"
            defaultValue={
              category.spending_limit != null
                ? toDisplay(toNumber(category.spending_limit))
                : ""
            }
            placeholder="Limit"
            disabled={pending}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
      <form action={deleteCategory}>
        <input type="hidden" name="id" value={category.id} />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          Delete category
        </Button>
      </form>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent-foreground" role="status">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
