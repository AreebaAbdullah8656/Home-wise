"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/recommendations/product-card";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/shared/sample-badge";
import { matchBillAlternatives } from "@/lib/recommendations/match";
import type { BillItemRow } from "@/lib/finance/bills";

type BillItemSuggestionsProps = {
  items: BillItemRow[];
  signedIn: boolean;
  savedKeys?: string[];
  dismissedKeys?: string[];
};

/**
 * Optional, user-controlled sample alternatives for a confirmed bill’s items.
 * Hidden until the user expands — never auto-interrupts.
 */
export function BillItemSuggestions({
  items,
  signedIn,
  savedKeys = [],
  dismissedKeys = [],
}: BillItemSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);

  const suggestions = useMemo(
    () =>
      matchBillAlternatives(items, { limitPerItem: 1, maxSuggestions: 6 }).filter(
        (s) => !dismissedSet.has(s.product.key)
      ),
    [items, dismissedSet]
  );

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SampleBadge />
          <p className="text-sm font-medium text-foreground">
            Optional sample alternatives
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide suggestions" : `Show suggestions (${suggestions.length})`}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Matched from confirmed line items. Sample prices only — ignore or dismiss
        anytime. Full discovery lives under Smart Recommendations.
      </p>
      {open ? (
        <ul className="grid gap-3">
          {suggestions.map((s) => (
            <ProductCard
              key={`${s.billItemId}-${s.product.key}`}
              product={s.product}
              signedIn={signedIn}
              saved={savedSet.has(s.product.key)}
              kind="bill_alternative"
              billItemId={s.billItemId}
              billItemName={s.billItemName}
              billItemPrice={s.billItemPrice}
              sampleEstimatedSavingsPkr={s.sampleEstimatedSavingsPkr}
              reason={s.reason}
              showMoreLink={false}
            />
          ))}
        </ul>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        nativeButton={false}
        render={<Link href="/recommendations" />}
      >
        Open Smart Recommendations
      </Button>
    </div>
  );
}
