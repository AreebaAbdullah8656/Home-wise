"use client";

import { useActionState } from "react";
import {
  createGroceryItem,
  updateGroceryItem,
  type ActionState,
} from "@/app/grocery/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GroceryItemRow } from "@/lib/finance/grocery";

const initial: ActionState = {};

type GroceryFormProps = {
  item?: GroceryItemRow | null;
};

export function GroceryForm({ item = null }: GroceryFormProps) {
  const action = item ? updateGroceryItem : createGroceryItem;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Item name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={item?.name ?? ""}
            placeholder="e.g. Milk 1L"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            defaultValue={item?.quantity ?? ""}
            placeholder="e.g. 2 packs"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={item?.priority ?? "normal"}
            disabled={pending}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_price">Estimated price (PKR)</Label>
          <Input
            id="estimated_price"
            name="estimated_price"
            type="number"
            min={0}
            step="1"
            defaultValue={item?.estimated_price ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual_price">Actual price (PKR)</Label>
          <Input
            id="actual_price"
            name="actual_price"
            type="number"
            min={0}
            step="1"
            defaultValue={item?.actual_price ?? ""}
            disabled={pending}
            placeholder="Optional until purchased"
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
        {pending ? "Saving…" : item ? "Update item" : "Add to list"}
      </Button>
    </form>
  );
}
