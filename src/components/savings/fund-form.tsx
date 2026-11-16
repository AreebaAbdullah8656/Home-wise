"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/savings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = {};

type FundLike = {
  id: string;
  name: string;
  target_amount: number;
  allocated_amount: number;
  actual_amount: number;
  notes: string | null;
};

type FundFormProps = {
  kind: "savings" | "emergency";
  item?: FundLike | null;
  createAction: (
    prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  updateAction: (
    prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

export function FundForm({
  kind,
  item = null,
  createAction,
  updateAction,
}: FundFormProps) {
  const action = item ? updateAction : createAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const defaultName =
    item?.name ?? (kind === "emergency" ? "Emergency fund" : "");

  return (
    <form action={formAction} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${kind}_name`}>Name</Label>
          <Input
            id={`${kind}_name`}
            name="name"
            required
            defaultValue={defaultName}
            placeholder={
              kind === "savings" ? "e.g. New fridge fund" : "Emergency fund"
            }
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${kind}_target`}>Target (PKR)</Label>
          <Input
            id={`${kind}_target`}
            name="target_amount"
            type="number"
            min={0}
            step="1"
            defaultValue={item?.target_amount ?? 0}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${kind}_allocated`}>Allocated (PKR)</Label>
          <Input
            id={`${kind}_allocated`}
            name="allocated_amount"
            type="number"
            min={0}
            step="1"
            defaultValue={item?.allocated_amount ?? 0}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Planned set-aside — not an expense.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${kind}_actual`}>Actual saved (PKR)</Label>
          <Input
            id={`${kind}_actual`}
            name="actual_amount"
            type="number"
            min={0}
            step="1"
            defaultValue={item?.actual_amount ?? 0}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Money really put aside — still not an expense.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${kind}_notes`}>Notes (optional)</Label>
          <Textarea
            id={`${kind}_notes`}
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
        {pending
          ? "Saving…"
          : item
            ? "Update"
            : kind === "savings"
              ? "Add savings goal"
              : "Add emergency fund"}
      </Button>
    </form>
  );
}
