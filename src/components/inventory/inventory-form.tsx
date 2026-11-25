"use client";

import { useActionState } from "react";
import {
  createInventoryItem,
  updateInventoryItem,
  type ActionState,
} from "@/app/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INVENTORY_CATEGORIES } from "@/lib/finance/inventory-constants";
import { useMoney } from "@/lib/currency/provider";
import { todayIso, toNumber } from "@/lib/budget-math";
import type { Database } from "@/types/database";

type InventoryItemRow =
  Database["public"]["Tables"]["inventory_items"]["Row"];

const initial: ActionState = {};

type InventoryFormProps = {
  item?: InventoryItemRow | null;
};

export function InventoryForm({ item = null }: InventoryFormProps) {
  const action = item ? updateInventoryItem : createInventoryItem;
  const [state, formAction, pending] = useActionState(action, initial);
  const { displayCurrency, toDisplay } = useMoney();
  const code = displayCurrency;

  return (
    <form action={formAction} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="inv_name">Item name</Label>
          <Input
            id="inv_name"
            name="name"
            required
            defaultValue={item?.name ?? ""}
            placeholder="e.g. Dish soap"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv_category">Category</Label>
          <select
            id="inv_category"
            name="category"
            defaultValue={item?.category ?? "Kitchen"}
            disabled={pending}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {INVENTORY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv_stock">Stock status</Label>
          <select
            id="inv_stock"
            name="stock_status"
            defaultValue={item?.stock_status ?? "ok"}
            disabled={pending}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="ok">OK</option>
            <option value="low">Low</option>
            <option value="out">Out</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv_qty">Quantity</Label>
          <Input
            id="inv_qty"
            name="quantity"
            type="number"
            min={0}
            step="0.001"
            defaultValue={item?.quantity ?? 1}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv_price">Price ({code})</Label>
          <Input
            id="inv_price"
            name="price"
            type="number"
            min={0}
            step="any"
            defaultValue={
              item?.price != null ? toDisplay(toNumber(item.price)) : ""
            }
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv_purchase">Purchase date</Label>
          <Input
            id="inv_purchase"
            name="purchase_date"
            type="date"
            defaultValue={item?.purchase_date ?? todayIso()}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="inv_notes">Notes (optional)</Label>
          <Textarea
            id="inv_notes"
            name="notes"
            rows={2}
            defaultValue={item?.notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : item ? "Update item" : "Add to inventory"}
      </Button>
    </form>
  );
}
