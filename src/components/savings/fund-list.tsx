"use client";

import { useState, useActionState } from "react";
import type { ActionState } from "@/app/savings/actions";
import { FundForm } from "@/components/savings/fund-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPkr } from "@/lib/format";
import { toNumber } from "@/lib/budget-math";

const initial: ActionState = {};

type FundLike = {
  id: string;
  name: string;
  target_amount: number;
  allocated_amount: number;
  actual_amount: number;
  notes: string | null;
};

type FundListProps = {
  kind: "savings" | "emergency";
  items: FundLike[];
  createAction: (
    prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  updateAction: (
    prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  deleteAction: (
    prev: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

export function FundList({
  kind,
  items,
  createAction,
  updateAction,
  deleteAction,
}: FundListProps) {
  const [editing, setEditing] = useState<FundLike | null>(null);
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    initial
  );

  return (
    <div className="space-y-4">
      {deleteState.error ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {deleteState.error}
        </p>
      ) : null}
      {deleteState.success ? (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {deleteState.success}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No {kind === "savings" ? "savings goals" : "emergency funds"} yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => {
            const target = toNumber(item.target_amount);
            const actual = toNumber(item.actual_amount);
            const allocated = toNumber(item.allocated_amount);
            const pct =
              target > 0 ? Math.min(999, Math.round((actual / target) * 100)) : 0;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Allocated {formatPkr(allocated)} · Actual{" "}
                    {formatPkr(actual)} · Target {formatPkr(target)} ({pct}%)
                  </p>
                  {item.notes ? (
                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                  ) : null}
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
                  <form action={deleteFormAction}>
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
            );
          })}
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
            <DialogTitle>
              Edit {kind === "savings" ? "savings goal" : "emergency fund"}
            </DialogTitle>
            <DialogDescription>
              Allocated and actual stay separate from expenses.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <FundForm
              kind={kind}
              item={editing}
              createAction={createAction}
              updateAction={updateAction}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
