"use client";

import { useMemo, useState, useActionState } from "react";
import {
  deleteGroceryItem,
  markGroceryPurchased,
  unmarkGroceryPurchased,
  type ActionState,
} from "@/app/grocery/actions";
import { GroceryForm } from "@/components/grocery/grocery-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPkr } from "@/lib/format";
import { toNumber } from "@/lib/budget-math";
import type { GroceryItemRow, GroceryTotals } from "@/lib/finance/grocery";

const initial: ActionState = {};

type GroceryListProps = {
  items: GroceryItemRow[];
  totals: GroceryTotals;
};

function priorityVariant(priority: string) {
  if (priority === "high") return "destructive" as const;
  if (priority === "low") return "secondary" as const;
  return "outline" as const;
}

export function GroceryList({ items, totals }: GroceryListProps) {
  const [filter, setFilter] = useState<"pending" | "purchased" | "all">(
    "pending"
  );
  const [editing, setEditing] = useState<GroceryItemRow | null>(null);
  const [purchasing, setPurchasing] = useState<GroceryItemRow | null>(null);

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteGroceryItem,
    initial
  );
  const [purchaseState, purchaseAction, purchasePending] = useActionState(
    markGroceryPurchased,
    initial
  );
  const [unmarkState, unmarkAction, unmarkPending] = useActionState(
    unmarkGroceryPurchased,
    initial
  );

  const visible = useMemo(() => {
    if (filter === "pending") return items.filter((i) => !i.is_purchased);
    if (filter === "purchased") return items.filter((i) => i.is_purchased);
    return items;
  }, [items, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["pending", `Pending (${totals.pendingCount})`],
              ["purchased", `Purchased (${totals.purchasedCount})`],
              ["all", `All (${items.length})`],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Est. total{" "}
          <span className="font-medium text-foreground">
            {formatPkr(totals.estimatedTotal)}
          </span>
          {" · "}
          Actual purchased{" "}
          <span className="font-medium text-foreground">
            {formatPkr(totals.actualTotal)}
          </span>
        </div>
      </div>

      {(deleteState.error ||
        purchaseState.error ||
        unmarkState.error) && (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {deleteState.error || purchaseState.error || unmarkState.error}
        </p>
      )}
      {(deleteState.success ||
        purchaseState.success ||
        unmarkState.success) && (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {deleteState.success ||
            purchaseState.success ||
            unmarkState.success}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No items in this view. Add groceries above.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {visible.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <Badge variant={priorityVariant(item.priority)}>
                    {item.priority}
                  </Badge>
                  {item.is_purchased ? (
                    <Badge variant="secondary">Purchased</Badge>
                  ) : null}
                  {item.expense_id ? (
                    <Badge variant="outline">Expense linked</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.quantity ? `Qty ${item.quantity} · ` : ""}
                  Est.{" "}
                  {item.estimated_price != null
                    ? formatPkr(toNumber(item.estimated_price))
                    : "—"}
                  {item.actual_price != null
                    ? ` · Actual ${formatPkr(toNumber(item.actual_price))}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(item)}
                >
                  Edit
                </Button>
                {item.is_purchased ? (
                  <form action={unmarkAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={unmarkPending}
                    >
                      Mark pending
                    </Button>
                  </form>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPurchasing(item)}
                  >
                    Mark purchased
                  </Button>
                )}
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={deletePending}
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit grocery item</DialogTitle>
            <DialogDescription>
              Update name, quantity, priority, or prices.
            </DialogDescription>
          </DialogHeader>
          {editing ? <GroceryForm item={editing} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(purchasing)}
        onOpenChange={(open) => {
          if (!open) setPurchasing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark purchased</DialogTitle>
            <DialogDescription>
              Optionally record one expense. Items already linked to an expense
              will not create a duplicate.
            </DialogDescription>
          </DialogHeader>
          {purchasing ? (
            <form
              action={purchaseAction}
              className="space-y-4"
              onSubmit={() => {
                // close after submit starts; success message shows in list
                setTimeout(() => setPurchasing(null), 0);
              }}
            >
              <input type="hidden" name="id" value={purchasing.id} />
              <div className="space-y-2">
                <Label htmlFor="purchase_actual_price">
                  Actual price (PKR)
                </Label>
                <Input
                  id="purchase_actual_price"
                  name="actual_price"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={
                    purchasing.actual_price ??
                    purchasing.estimated_price ??
                    ""
                  }
                  disabled={purchasePending}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="create_expense"
                  value="on"
                  defaultChecked={!purchasing.expense_id}
                  disabled={Boolean(purchasing.expense_id) || purchasePending}
                  className="size-4 rounded border-input"
                />
                {purchasing.expense_id
                  ? "Already linked to an expense (duplicate blocked)"
                  : "Record as expense (once)"}
              </label>
              <Button type="submit" disabled={purchasePending}>
                {purchasePending ? "Saving…" : "Confirm purchased"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
