/**
 * Map common household search phrases to Overpass tag filters.
 * Queries always run with `(around:radius,lat,lon)` — never city/bbox fallbacks.
 */

export type OsmTagFilter =
  | { kind: "shop"; values: string[] }
  | { kind: "amenity"; values: string[] }
  | { kind: "shop_or_amenity"; shop: string[]; amenity: string[] };

export type MappedSearchTerm = {
  /** Normalized key used for online-store grocery detection. */
  key: string;
  label: string;
  filter: OsmTagFilter;
  /** Also run a name~ fragment when useful (e.g. detergent). */
  nameHint?: string;
};

const TERM_MAP: Array<{
  patterns: RegExp[];
  mapped: MappedSearchTerm;
}> = [
  {
    patterns: [/\bpharmac(?:y|ies)\b/i, /\bchemist\b/i, /\bmedical\s*store\b/i],
    mapped: {
      key: "pharmacy",
      label: "Pharmacy",
      filter: {
        kind: "shop_or_amenity",
        shop: ["chemist"],
        amenity: ["pharmacy"],
      },
    },
  },
  {
    patterns: [/\bsupermarket\b/i, /\bgrocery\b/i, /\bhypermarket\b/i],
    mapped: {
      key: "supermarket",
      label: "Supermarket",
      filter: { kind: "shop", values: ["supermarket", "convenience", "general"] },
    },
  },
  {
    patterns: [/\bdetergent\b/i, /\blaundry\b/i, /\bsoap\s*store\b/i],
    mapped: {
      key: "detergent",
      label: "Detergent / houseware",
      filter: {
        kind: "shop",
        values: ["houseware", "chemist", "supermarket", "convenience", "laundry"],
      },
      nameHint: "detergent",
    },
  },
  {
    patterns: [/\bbakery\b/i, /\bbaker(?:y|ies)\b/i, /\bbread\b/i],
    mapped: {
      key: "bakery",
      label: "Bakery",
      filter: { kind: "shop", values: ["bakery"] },
    },
  },
  {
    patterns: [/\bhardware\b/i, /\bdiy\b/i, /\bdo[\s-]?it[\s-]?yourself\b/i],
    mapped: {
      key: "hardware",
      label: "Hardware",
      filter: { kind: "shop", values: ["hardware", "doityourself"] },
    },
  },
  {
    patterns: [/\bclothes?\b/i, /\bfashion\b/i, /\bapparel\b/i, /\bgarmen/i],
    mapped: {
      key: "clothes",
      label: "Clothes",
      filter: { kind: "shop", values: ["clothes", "fashion", "shoes"] },
    },
  },
  {
    patterns: [/\belectronic/i, /\bmobile\s*shop\b/i, /\bappliance/i],
    mapped: {
      key: "electronics",
      label: "Electronics",
      filter: { kind: "shop", values: ["electronics", "appliance", "mobile_phone"] },
    },
  },
  {
    patterns: [/\bfurniture\b/i, /\bsofa\b/i, /\bhome\s*furnish/i],
    mapped: {
      key: "furniture",
      label: "Furniture",
      filter: {
        kind: "shop",
        values: ["furniture", "bathroom_furnishing", "houseware"],
      },
    },
  },
];

export function mapSearchTerm(query: string): MappedSearchTerm | null {
  const q = query.trim();
  if (!q) return null;
  for (const entry of TERM_MAP) {
    if (entry.patterns.some((re) => re.test(q))) return entry.mapped;
  }
  return null;
}

const GROCERY_KEYS = new Set([
  "supermarket",
  "detergent",
  "bakery",
  "pharmacy",
]);

export function isGrocerySearchTerm(query: string): boolean {
  const mapped = mapSearchTerm(query);
  if (mapped && GROCERY_KEYS.has(mapped.key)) return true;
  return /\b(grocery|grocer|food|milk|rice|flour|vegetable|fruit|mart)\b/i.test(
    query
  );
}
