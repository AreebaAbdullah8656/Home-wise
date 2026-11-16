"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateRangePickerProps = {
  from: string;
  to: string;
};

export function DateRangePicker({ from, to }: DateRangePickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromValue) params.set("from", fromValue);
    if (toValue) params.set("to", toValue);
    startTransition(() => {
      router.push(`/reports?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div className="space-y-1">
        <Label htmlFor="report_from">From</Label>
        <Input
          id="report_from"
          type="date"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="report_to">To</Label>
        <Input
          id="report_to"
          type="date"
          value={toValue}
          onChange={(e) => setToValue(e.target.value)}
          disabled={pending}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Loading…" : "Update range"}
      </Button>
    </form>
  );
}
