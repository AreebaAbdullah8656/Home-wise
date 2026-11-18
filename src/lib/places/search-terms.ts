/**
 * Single shop categories for light Overpass queries (one category per request).
 */

export type ShopCategoryId =
  | "supermarket"
  | "convenience"
  | "bakery"
  | "pharmacy"
  | "clothes"
  | "electronics"
  | "hardware"
  | "furniture";

export type ShopCategory = {
  id: ShopCategoryId;
  label: string;
  /** Overpass shop=* value, or null when amenity-only. */
  shop?: string;
  /** Overpass amenity=* value when relevant (pharmacy). */
  amenity?: string;
  /** Nominatim fallback search fragment. */
  nominatimTerm: string;
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "supermarket",
    label: "Supermarket",
    shop: "supermarket",
    nominatimTerm: "supermarket",
  },
  {
    id: "convenience",
    label: "Convenience",
    shop: "convenience",
    nominatimTerm: "convenience store",
  },
  {
    id: "bakery",
    label: "Bakery",
    shop: "bakery",
    nominatimTerm: "bakery",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    shop: "chemist",
    amenity: "pharmacy",
    nominatimTerm: "pharmacy",
  },
  {
    id: "clothes",
    label: "Clothes",
    shop: "clothes",
    nominatimTerm: "clothing store",
  },
  {
    id: "electronics",
    label: "Electronics",
    shop: "electronics",
    nominatimTerm: "electronics store",
  },
  {
    id: "hardware",
    label: "Hardware",
    shop: "hardware",
    nominatimTerm: "hardware store",
  },
  {
    id: "furniture",
    label: "Furniture",
    shop: "furniture",
    nominatimTerm: "furniture store",
  },
];

/** Default nearby categories (each as its own light Overpass request). */
export const DEFAULT_NEARBY_CATEGORIES: ShopCategoryId[] = [
  "supermarket",
  "convenience",
  "pharmacy",
];

const TERM_PATTERNS: Array<{ patterns: RegExp[]; id: ShopCategoryId }> = [
  {
    patterns: [/\bpharmac(?:y|ies)\b/i, /\bchemist\b/i, /\bmedical\s*store\b/i],
    id: "pharmacy",
  },
  {
    patterns: [/\bsupermarket\b/i, /\bgrocery\b/i, /\bhypermarket\b/i],
    id: "supermarket",
  },
  {
    patterns: [/\bconvenience\b/i, /\bgeneral\s*store\b/i, /\bkaryana\b/i],
    id: "convenience",
  },
  {
    patterns: [/\bdetergent\b/i, /\blaundry\b/i],
    id: "convenience",
  },
  {
    patterns: [/\bbakery\b/i, /\bbaker(?:y|ies)\b/i, /\bbread\b/i],
    id: "bakery",
  },
  {
    patterns: [/\bhardware\b/i, /\bdiy\b/i, /\bdo[\s-]?it[\s-]?yourself\b/i],
    id: "hardware",
  },
  {
    patterns: [/\bclothes?\b/i, /\bfashion\b/i, /\bapparel\b/i, /\bgarmen/i],
    id: "clothes",
  },
  {
    patterns: [/\belectronic/i, /\bmobile\s*shop\b/i, /\bappliance/i],
    id: "electronics",
  },
  {
    patterns: [/\bfurniture\b/i, /\bsofa\b/i, /\bhome\s*furnish/i],
    id: "furniture",
  },
];

export function getCategory(id: ShopCategoryId): ShopCategory {
  return SHOP_CATEGORIES.find((c) => c.id === id) ?? SHOP_CATEGORIES[0];
}

/** Map free-text search to one category (or null for name search). */
export function resolveSearchCategory(query: string): ShopCategory | null {
  const q = query.trim();
  if (!q) return null;
  for (const entry of TERM_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) {
      return getCategory(entry.id);
    }
  }
  return null;
}

export function isGrocerySearchTerm(query: string): boolean {
  const cat = resolveSearchCategory(query);
  if (
    cat &&
    (cat.id === "supermarket" ||
      cat.id === "convenience" ||
      cat.id === "bakery" ||
      cat.id === "pharmacy")
  ) {
    return true;
  }
  return /\b(grocery|grocer|food|milk|rice|flour|vegetable|fruit|mart)\b/i.test(
    query
  );
}
