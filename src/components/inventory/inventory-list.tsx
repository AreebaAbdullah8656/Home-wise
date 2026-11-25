"use client";

import { useMemo, useState, useActionState } from "react";
import {
  addInventoryToGrocery,
  deleteInventoryItem,
  type ActionState,
} from "@/app/inventory/actions";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMoney } from "@/lib/currency/provider";
import { toNumber } from "@/lib/budget-math";
import { INVENTORY_CATEGORIES } from "@/lib/finance/inventory-constants";
import type { Database } from "@/types/database";

type InventoryItemRow =
  Database["public"]["Tables"]["inventory_items"]["Row"];

const initial: ActionState = {};

type InventoryListProps = {
  items: InventoryItemRow[];
};

function stockVariant(status: string) {
  if (status === "out") return "destructive" as const;
  if (status === "low") return "secondary" as const;
  return "outline" as const;
}

export function InventoryList({ items }: InventoryListProps) {
  const { format } = useMoney();
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<InventoryItemRow | null>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteInventoryItem,
    initial
  );
  const [groceryState, groceryAction, groceryPending] = useActionState(
    addInventoryToGrocery,
    initial
  );

  const visible = useMemo(() => {
    if (category === "all") return items;
    if (category === "lowstock") {
      return items.filter(
        (i) => i.stock_status === "low" || i.stock_status === "out"
      );
    }
    return items.filter((i) => i.category === category);
  }, [items, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={category === "all" ? "default" : "outline"}
          onClick={() => setCategory("all")}
        >
          All ({items.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={category === "lowstock" ? "default" : "outline"}
          onClick={() => setCategory("lowstock")}
        >
          Low / out
        </Button>
        {INVENTORY_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            size="sm"
            variant={category === cat ? "default" : "outline"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {(deleteState.error || groceryState.error) && (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {deleteState.error || groceryState.error}
        </p>
      )}
      {(deleteState.success || groceryState.success) && (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {deleteState.success || groceryState.success}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No inventory items in this view.
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
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant={stockVariant(item.stock_status)}>
                    {item.stock_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Qty {toNumber(item.quantity)}
                  {item.price != null
                    ? ` · ${format(toNumber(item.price))}`
                    : ""}
                  {item.purchase_date ? ` · Bought ${item.purchase_date}` : ""}
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
                <form action={groceryAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={groceryPending}
                  >
                    Add to grocery
                  </Button>
                </form>
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
            <DialogTitle>Edit inventory item</DialogTitle>
            <DialogDescription>
              Update stock status, quantity, or notes.
            </DialogDescription>
          </DialogHeader>
          {editing ? <InventoryForm item={editing} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
