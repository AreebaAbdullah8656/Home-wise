"use client";

import { useMemo, useState, useActionState } from "react";
import {
  removeSavedRecommendation,
  type ActionState,
} from "@/app/recommendations/actions";
import { ProductCard } from "@/components/recommendations/product-card";
import { SampleBadge } from "@/components/shared/sample-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PRODUCT_CATEGORIES,
  SAMPLE_SHOPS,
  productsForSection,
  searchProducts,
  type ProductCategory,
  type SampleProduct,
} from "@/lib/recommendations/catalog";
import type { BillAlternativeSuggestion } from "@/lib/recommendations/match";
import type { SavedRecommendationRow } from "@/lib/recommendations/queries";
import { getProductByKey } from "@/lib/recommendations/catalog";

const initial: ActionState = {};

type SectionId =
  | "recommended"
  | "deals"
  | "alternatives"
  | "essentials"
  | "nearby"
  | "from-bills"
  | "saved";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "recommended", label: "Recommended for Your Home" },
  { id: "deals", label: "Deals of the Week" },
  { id: "alternatives", label: "Better Alternatives" },
  { id: "essentials", label: "Affordable Home Essentials" },
  { id: "nearby", label: "Nearby Shops" },
  { id: "from-bills", label: "From your bills" },
  { id: "saved", label: "Saved" },
];

type DiscoveryPanelProps = {
  signedIn: boolean;
  location: string | null;
  saved: SavedRecommendationRow[];
  savedKeys: string[];
  dismissedKeys: string[];
  billSuggestions: BillAlternativeSuggestion[];
};

export function DiscoveryPanel({
  signedIn,
  location,
  saved,
  savedKeys,
  dismissedKeys,
  billSuggestions,
}: DiscoveryPanelProps) {
  const [section, setSection] = useState<SectionId>("recommended");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [removeState, removeAction, removePending] = useActionState(
    removeSavedRecommendation,
    initial
  );

  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);

  const filteredBillSuggestions = useMemo(
    () =>
      billSuggestions.filter((s) => !dismissedSet.has(s.product.key)),
    [billSuggestions, dismissedSet]
  );

  const catalogProducts: SampleProduct[] = useMemo(() => {
    let list =
      section === "from-bills" || section === "saved" || section === "nearby"
        ? []
        : productsForSection(section);
    if (query.trim()) {
      list = searchProducts(query).filter((p) =>
        section === "recommended" ||
        section === "deals" ||
        section === "alternatives" ||
        section === "essentials"
          ? p.sections.includes(section)
          : true
      );
      if (
        section !== "recommended" &&
        section !== "deals" &&
        section !== "alternatives" &&
        section !== "essentials"
      ) {
        list = searchProducts(query);
      }
    }
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    return list.filter((p) => !dismissedSet.has(p.key));
  }, [section, query, category, dismissedSet]);

  const searchAll = useMemo(() => {
    if (!query.trim()) return null;
    return searchProducts(query).filter(
      (p) =>
        !dismissedSet.has(p.key) &&
        (category === "all" || p.category === category)
    );
  }, [query, dismissedSet, category]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SampleBadge />
          <span className="font-medium">Personal recommendation assistant</span>
        </div>
        <p>
          All prices, shops, and links below are <strong>sample data</strong> for
          discovery — not live discounts or inventory. HomeWise has no cart,
          checkout, or payments.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={section === s.id ? "default" : "outline"}
            onClick={() => setSection(s.id)}
          >
            {s.label}
            {s.id === "from-bills" ? ` (${filteredBillSuggestions.length})` : ""}
            {s.id === "saved" ? ` (${saved.length})` : ""}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="rec_search">Search sample products</Label>
          <Input
            id="rec_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Detergent, kettle, oil…"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rec_category">Category</Label>
          <select
            id="rec_category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ProductCategory | "all")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {searchAll && query.trim() && section !== "nearby" && section !== "saved" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">
            Search results
          </h2>
          {searchAll.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sample products match that search.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {searchAll.map((product) => (
                <ProductCard
                  key={`search-${product.key}`}
                  product={product}
                  signedIn={signedIn}
                  saved={savedSet.has(product.key)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {section === "nearby" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">Nearby Shops</h2>
          <p className="text-sm text-muted-foreground">
            {location
              ? `Using your Settings location: ${location}. Shop rows below are still sample listings.`
              : "Add an optional location in Settings to personalize this label. Shop rows are sample data only — no live map API yet."}
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {SAMPLE_SHOPS.map((shop) => (
              <li
                key={shop.key}
                className="space-y-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <SampleBadge />
                  <Badge variant="outline">{shop.focus}</Badge>
                </div>
                <h3 className="font-heading text-lg">{shop.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {shop.area} · {location || shop.cityHint}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={shop.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Open sample shop link
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section === "from-bills" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">
            From your confirmed bills
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional suggestions matched to confirmed bill lines. Dismiss any you
            do not want. Sample alternatives only — never auto-applied.
          </p>
          {filteredBillSuggestions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No matches yet. Confirm a bill with items like detergent, shampoo,
              or kitchen goods, or browse other sections.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filteredBillSuggestions.map((s) => (
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
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {section === "saved" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">Saved</h2>
          {removeState.error ? (
            <p className="text-sm text-destructive" role="alert">
              {removeState.error}
            </p>
          ) : null}
          {removeState.success ? (
            <p className="text-sm" role="status">
              {removeState.success}
            </p>
          ) : null}
          {saved.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing saved yet. Save a sample recommendation from any section.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {saved.map((row) => {
                const key =
                  row.payload &&
                  typeof row.payload === "object" &&
                  !Array.isArray(row.payload) &&
                  typeof (row.payload as { key?: unknown }).key === "string"
                    ? (row.payload as { key: string }).key
                    : null;
                const product = key ? getProductByKey(key) : undefined;
                if (!product) {
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border p-4 text-sm"
                    >
                      <p className="font-medium">{row.title}</p>
                      <form action={removeAction} className="mt-2">
                        <input type="hidden" name="id" value={row.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={removePending}
                        >
                          Remove
                        </Button>
                      </form>
                    </li>
                  );
                }
                return (
                  <li key={row.id} className="space-y-2">
                    <ProductCard
                      product={product}
                      signedIn={signedIn}
                      saved
                      showMoreLink={false}
                    />
                    <form action={removeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={removePending}
                      >
                        Remove from saved
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {section !== "nearby" &&
      section !== "from-bills" &&
      section !== "saved" &&
      !(query.trim() && searchAll) ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">
            {SECTIONS.find((s) => s.id === section)?.label}
          </h2>
          <p className="text-xs text-muted-foreground">
            Demo offers are labeled sample — not real discounts.
          </p>
          {catalogProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sample products in this view.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {catalogProducts.map((product) => (
                <ProductCard
                  key={product.key}
                  product={product}
                  signedIn={signedIn}
                  saved={savedSet.has(product.key)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
