import { toNumber } from "@/lib/budget-math";
import {
  SAMPLE_PRODUCTS,
  type SampleProduct,
} from "@/lib/recommendations/catalog";
import type { BillItemRow } from "@/lib/finance/bills";

export type BillAlternativeSuggestion = {
  billItemId: string;
  billItemName: string;
  billItemPrice: number | null;
  product: SampleProduct;
  /** Sample estimated savings vs bill line — demo math only */
  sampleEstimatedSavingsPkr: number | null;
  reason: string;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s&]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreMatch(itemName: string, product: SampleProduct): number {
  const name = normalize(itemName);
  if (!name) return 0;
  let score = 0;
  for (const keyword of product.matchKeywords) {
    const k = normalize(keyword);
    if (!k) continue;
    if (name.includes(k) || k.includes(name)) score += k.length >= 5 ? 3 : 2;
  }
  if (name.includes(normalize(product.name))) score += 4;
  if (name.includes(normalize(product.brand))) score += 2;
  return score;
}

/**
 * Suggest sample alternatives for confirmed bill line items.
 * Never invents real prices — uses labeled sample catalog only.
 */
export function matchBillAlternatives(
  items: Pick<BillItemRow, "id" | "product_name" | "unit_price" | "line_total">[],
  options: { limitPerItem?: number; maxSuggestions?: number } = {}
): BillAlternativeSuggestion[] {
  const limitPerItem = options.limitPerItem ?? 2;
  const maxSuggestions = options.maxSuggestions ?? 12;
  const out: BillAlternativeSuggestion[] = [];

  for (const item of items) {
    const name = item.product_name?.trim() ?? "";
    if (!name) continue;

    const ranked = SAMPLE_PRODUCTS.map((product) => ({
      product,
      score: scoreMatch(name, product),
    }))
      .filter((row) => row.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerItem);

    const currentPrice =
      item.line_total != null
        ? toNumber(item.line_total)
        : item.unit_price != null
          ? toNumber(item.unit_price)
          : null;

    for (const { product } of ranked) {
      // Prefer products that are not recommended solely for being cheaper:
      // require quality notes + features; optionally show savings only when sample compare exists.
      const sampleEstimatedSavingsPkr =
        currentPrice != null && currentPrice > product.samplePricePkr
          ? Math.round(currentPrice - product.samplePricePkr)
          : product.sampleComparePricePkr != null
            ? Math.round(product.sampleComparePricePkr - product.samplePricePkr)
            : null;

      out.push({
        billItemId: item.id,
        billItemName: name,
        billItemPrice: currentPrice,
        product,
        sampleEstimatedSavingsPkr,
        reason:
          "Matched on product type keywords from your confirmed bill line — sample alternative only, not a live price check.",
      });
    }
  }

  return out.slice(0, maxSuggestions);
}

export function moreAlternativesForProduct(
  productKey: string,
  limit = 3
): SampleProduct[] {
  const base = SAMPLE_PRODUCTS.find((p) => p.key === productKey);
  if (!base) return SAMPLE_PRODUCTS.slice(0, limit);
  return SAMPLE_PRODUCTS.filter(
    (p) => p.key !== productKey && p.category === base.category
  ).slice(0, limit);
}
