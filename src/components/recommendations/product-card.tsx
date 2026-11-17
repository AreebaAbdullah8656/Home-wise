"use client";

import { useActionState } from "react";
import {
  dismissRecommendation,
  saveRecommendation,
  type ActionState,
} from "@/app/recommendations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatPkr } from "@/lib/format";
import {
  RECS_SAMPLE_LABEL,
  type SampleProduct,
} from "@/lib/recommendations/catalog";
import { moreAlternativesForProduct } from "@/lib/recommendations/match";

const initial: ActionState = {};

type ProductCardProps = {
  product: SampleProduct;
  signedIn: boolean;
  saved?: boolean;
  dismissed?: boolean;
  kind?: "discovery" | "bill_alternative";
  billItemId?: string;
  billItemName?: string;
  billItemPrice?: number | null;
  sampleEstimatedSavingsPkr?: number | null;
  reason?: string;
  showMoreLink?: boolean;
};

export function ProductCard({
  product,
  signedIn,
  saved = false,
  dismissed = false,
  kind = "discovery",
  billItemId,
  billItemName,
  billItemPrice,
  sampleEstimatedSavingsPkr,
  reason,
  showMoreLink = true,
}: ProductCardProps) {
  const [saveState, saveAction, savePending] = useActionState(
    saveRecommendation,
    initial
  );
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissRecommendation,
    initial
  );
  const more = showMoreLink
    ? moreAlternativesForProduct(product.key, 2)
    : [];

  const state = saveState.success || saveState.error ? saveState : dismissState;
  const pending = savePending || dismissPending;

  if (dismissed) return null;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SampleBadge />
        <Badge variant="outline">{product.category}</Badge>
        {saved ? <Badge variant="secondary">Saved</Badge> : null}
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.imageHint}
        </p>
        <h3 className="font-heading text-lg text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground">
          {product.brand} · {product.shopName}
        </p>
      </div>

      {billItemName ? (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Compared to your bill item: <span className="text-foreground">{billItemName}</span>
          {billItemPrice != null ? ` (${formatPkr(billItemPrice)})` : ""}
        </p>
      ) : null}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Sample price</dt>
          <dd className="font-medium text-foreground">
            {formatPkr(product.samplePricePkr)}
          </dd>
        </div>
        {product.sampleComparePricePkr != null ? (
          <div>
            <dt className="text-muted-foreground">Sample compare-at</dt>
            <dd className="text-foreground">
              {formatPkr(product.sampleComparePricePkr)}
            </dd>
          </div>
        ) : null}
        {sampleEstimatedSavingsPkr != null && sampleEstimatedSavingsPkr > 0 ? (
          <div>
            <dt className="text-muted-foreground">Sample estimated savings</dt>
            <dd className="text-foreground">
              {formatPkr(sampleEstimatedSavingsPkr)}
            </dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Quality notes</dt>
          <dd className="text-foreground">{product.qualityNotes}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Features</dt>
          <dd className="text-foreground">{product.features.join(" · ")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd className="text-foreground">{product.sourceLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Location</dt>
          <dd className="text-foreground">{product.shopLocation}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">{RECS_SAMPLE_LABEL}</p>
      {reason ? (
        <p className="text-xs text-muted-foreground">{reason}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Verified offer: no — sample listing only. No cart or checkout in HomeWise.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          Open sample source link
        </Button>
        {signedIn ? (
          <>
            <form action={saveAction}>
              <input type="hidden" name="product_key" value={product.key} />
              <input type="hidden" name="kind" value={kind} />
              {billItemId ? (
                <input type="hidden" name="bill_item_id" value={billItemId} />
              ) : null}
              {billItemName ? (
                <input
                  type="hidden"
                  name="bill_item_name"
                  value={billItemName}
                />
              ) : null}
              <Button type="submit" size="sm" disabled={pending || saved}>
                {saved ? "Saved" : savePending ? "Saving…" : "Save"}
              </Button>
            </form>
            <form action={dismissAction}>
              <input type="hidden" name="product_key" value={product.key} />
              <input type="hidden" name="kind" value={kind} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={pending}
              >
                {dismissPending ? "…" : "Dismiss"}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sign in to save or dismiss suggestions.
          </p>
        )}
      </div>

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

      {more.length > 0 ? (
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            More sample alternatives in {product.category}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {more.map((alt) => (
              <li key={alt.key}>
                {alt.brand} — {alt.name} ({formatPkr(alt.samplePricePkr)} sample)
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
