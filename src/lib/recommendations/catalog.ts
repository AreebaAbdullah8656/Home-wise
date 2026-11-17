/**
 * Clearly labeled SAMPLE product discovery data (SPEC §§8–9).
 * Prices, shops, and links are demo only — never present as live offers.
 */

export const RECS_SAMPLE_LABEL =
  "Sample data — not a real price, discount, or availability";

export type ProductCategory =
  | "Cleaning products"
  | "Grocery products"
  | "Household essentials"
  | "Kitchen accessories"
  | "Bathroom fixtures"
  | "Taps and fittings"
  | "Home appliances"
  | "Furniture"
  | "Home decor"
  | "Clothing";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Cleaning products",
  "Grocery products",
  "Household essentials",
  "Kitchen accessories",
  "Bathroom fixtures",
  "Taps and fittings",
  "Home appliances",
  "Furniture",
  "Home decor",
  "Clothing",
];

export type DiscoverySection =
  | "recommended"
  | "deals"
  | "alternatives"
  | "essentials"
  | "nearby";

export type SampleProduct = {
  key: string;
  name: string;
  brand: string;
  category: ProductCategory;
  /** Demo unit price in PKR — sample only */
  samplePricePkr: number;
  /** Optional higher “compared to” sample price for savings demos */
  sampleComparePricePkr?: number;
  shopName: string;
  shopLocation: string;
  sourceLabel: string;
  /** Demo outbound URL — not a live retailer integration */
  sourceUrl: string;
  verifiedOffer: false;
  imageHint: string;
  qualityNotes: string;
  features: string[];
  sections: DiscoverySection[];
  /** Keywords used to match confirmed bill line items */
  matchKeywords: string[];
};

export type SampleShop = {
  key: string;
  name: string;
  area: string;
  cityHint: string;
  focus: string;
  sourceUrl: string;
};

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    key: "clean-detergent-value",
    name: "Concentrated laundry detergent 1L",
    brand: "HomeCare Value",
    category: "Cleaning products",
    samplePricePkr: 650,
    sampleComparePricePkr: 980,
    shopName: "Neighborhood Mart (sample)",
    shopLocation: "Sample city — local aisle",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/detergent",
    verifiedOffer: false,
    imageHint: "Laundry bottle",
    qualityNotes:
      "Comparable wash load count to mid-tier brands when diluted per label; fragrance is milder.",
    features: ["Concentrated formula", "Gentle on colors", "Clear dilution ratio"],
    sections: ["recommended", "alternatives", "deals", "essentials"],
    matchKeywords: ["detergent", "laundry", "ariel", "surf", "bonus", "wash powder"],
  },
  {
    key: "clean-shampoo-gentle",
    name: "Gentle daily shampoo 400ml",
    brand: "SoftStrand",
    category: "Household essentials",
    samplePricePkr: 420,
    sampleComparePricePkr: 890,
    shopName: "Family Care Store (sample)",
    shopLocation: "Sample city — personal care",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/shampoo",
    verifiedOffer: false,
    imageHint: "Shampoo bottle",
    qualityNotes:
      "Sulfate-free claim on label for demo; suitable everyday wash, not a treatment product.",
    features: ["Daily use", "Mild scent", "Family size"],
    sections: ["recommended", "alternatives", "essentials"],
    matchKeywords: ["shampoo", "hair wash", "conditioner", "pantene", "head & shoulders"],
  },
  {
    key: "clean-floor-vinegar",
    name: "Multi-surface cleaner concentrate 500ml",
    brand: "ClearFloor",
    category: "Cleaning products",
    samplePricePkr: 310,
    sampleComparePricePkr: 560,
    shopName: "Household Hub (sample)",
    shopLocation: "Sample city — cleaning aisle",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/cleaner",
    verifiedOffer: false,
    imageHint: "Spray bottle",
    qualityNotes:
      "Works on sealed floors and counters when diluted; not for natural stone.",
    features: ["Dilutable", "Low residue", "Neutral scent option"],
    sections: ["alternatives", "deals", "essentials"],
    matchKeywords: ["cleaner", "floor cleaner", "disinfectant", "phenyl", "harpic", "toilet"],
  },
  {
    key: "kitchen-sponge-pack",
    name: "Scrub sponge pack (6)",
    brand: "ScrubLite",
    category: "Kitchen accessories",
    samplePricePkr: 180,
    sampleComparePricePkr: 320,
    shopName: "Kitchen Corner (sample)",
    shopLocation: "Sample city — kitchenware",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/sponges",
    verifiedOffer: false,
    imageHint: "Sponge pack",
    qualityNotes: "Dual soft/abrasive sides; replace when frayed for hygiene.",
    features: ["6-pack", "Dual texture", "Dish-safe"],
    sections: ["essentials", "deals"],
    matchKeywords: ["sponge", "scrubber", "dish wash", "scotch"],
  },
  {
    key: "kitchen-steel-pot",
    name: "Stainless steel cooking pot 3L",
    brand: "CookSteady",
    category: "Kitchen accessories",
    samplePricePkr: 2_450,
    sampleComparePricePkr: 3_800,
    shopName: "Home Goods Plaza (sample)",
    shopLocation: "Sample city — cookware",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/pot",
    verifiedOffer: false,
    imageHint: "Steel pot",
    qualityNotes:
      "Food-grade stainless sample listing; check base thickness in-store before buying.",
    features: ["3L capacity", "Oven-safe lid demo", "Induction-friendly claim (sample)"],
    sections: ["recommended", "alternatives"],
    matchKeywords: ["pot", "cookware", "pan", "karahi", "saucepan"],
  },
  {
    key: "bath-tap-aerator",
    name: "Water-saving tap aerator",
    brand: "FlowWise",
    category: "Taps and fittings",
    samplePricePkr: 390,
    sampleComparePricePkr: 750,
    shopName: "Fittings Depot (sample)",
    shopLocation: "Sample city — plumbing",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/aerator",
    verifiedOffer: false,
    imageHint: "Tap aerator",
    qualityNotes: "Reduces flow without changing fixture; verify thread size first.",
    features: ["Easy install", "Chrome finish (sample)", "Lower water use"],
    sections: ["recommended", "essentials", "nearby"],
    matchKeywords: ["tap", "faucet", "aerator", "mixer", "fitting"],
  },
  {
    key: "appliance-kettle",
    name: "Electric kettle 1.7L",
    brand: "BoilEasy",
    category: "Home appliances",
    samplePricePkr: 3_200,
    sampleComparePricePkr: 4_900,
    shopName: "Appliance Lane (sample)",
    shopLocation: "Sample city — small appliances",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/kettle",
    verifiedOffer: false,
    imageHint: "Kettle",
    qualityNotes:
      "Auto shut-off and boil-dry protection listed on sample spec — confirm warranty in store.",
    features: ["1.7L", "Auto shut-off", "Cordless base"],
    sections: ["recommended", "alternatives", "deals"],
    matchKeywords: ["kettle", "electric kettle", "jug"],
  },
  {
    key: "furniture-shelf",
    name: "Open storage shelf (3-tier)",
    brand: "SpaceNest",
    category: "Furniture",
    samplePricePkr: 4_800,
    sampleComparePricePkr: 7_200,
    shopName: "Furnish Local (sample)",
    shopLocation: "Sample city — furniture",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/shelf",
    verifiedOffer: false,
    imageHint: "Shelf unit",
    qualityNotes: "Lightweight particle board sample; better for light storage than heavy loads.",
    features: ["3 tiers", "Tool-assisted assembly", "Compact footprint"],
    sections: ["recommended", "alternatives"],
    matchKeywords: ["shelf", "rack", "storage unit", "bookshelf"],
  },
  {
    key: "decor-curtain",
    name: "Blackout curtain panel pair",
    brand: "ShadeSoft",
    category: "Home decor",
    samplePricePkr: 1_650,
    sampleComparePricePkr: 2_900,
    shopName: "Decor Walk (sample)",
    shopLocation: "Sample city — soft furnishings",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/curtains",
    verifiedOffer: false,
    imageHint: "Curtains",
    qualityNotes: "Blocks most daylight in demo photos; measure window before ordering.",
    features: ["Pair of panels", "Machine washable (sample care)", "Neutral tone"],
    sections: ["deals", "essentials"],
    matchKeywords: ["curtain", "blinds", "drape"],
  },
  {
    key: "grocery-oil-canola",
    name: "Canola cooking oil 1L",
    brand: "PantryPick",
    category: "Grocery products",
    samplePricePkr: 520,
    sampleComparePricePkr: 780,
    shopName: "Fresh Basket (sample)",
    shopLocation: "Sample city — grocery",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/oil",
    verifiedOffer: false,
    imageHint: "Oil bottle",
    qualityNotes: "Everyday cooking oil sample; compare unit price per litre in aisle.",
    features: ["1L", "Sealed cap", "Neutral taste"],
    sections: ["essentials", "deals", "nearby"],
    matchKeywords: ["oil", "cooking oil", "ghee", "olive oil", "sunflower"],
  },
  {
    key: "cloth-towel-set",
    name: "Cotton bath towel set (2)",
    brand: "SoftLoom",
    category: "Clothing",
    samplePricePkr: 1_100,
    sampleComparePricePkr: 1_850,
    shopName: "Linen Lane (sample)",
    shopLocation: "Sample city — textiles",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/towels",
    verifiedOffer: false,
    imageHint: "Towels",
    qualityNotes: "Mid-weight cotton sample; absorbency improves after first washes.",
    features: ["2-pack", "Cotton", "Quick-dry weave (sample)"],
    sections: ["essentials", "recommended"],
    matchKeywords: ["towel", "bath towel", "hand towel"],
  },
  {
    key: "bath-showerhead",
    name: "Handheld shower head",
    brand: "RainDrop Basic",
    category: "Bathroom fixtures",
    samplePricePkr: 1_350,
    sampleComparePricePkr: 2_400,
    shopName: "Bath & Tile (sample)",
    shopLocation: "Sample city — bathroom",
    sourceLabel: "Sample catalog",
    sourceUrl: "https://example.com/sample/shower",
    verifiedOffer: false,
    imageHint: "Shower head",
    qualityNotes: "Adjustable spray modes on sample listing; check hose compatibility.",
    features: ["Handheld", "Chrome finish (sample)", "Tool-light install"],
    sections: ["alternatives", "nearby"],
    matchKeywords: ["shower", "shower head", "bathroom fixture"],
  },
];

export const SAMPLE_SHOPS: SampleShop[] = [
  {
    key: "shop-mart",
    name: "Neighborhood Mart (sample)",
    area: "Central market",
    cityHint: "Uses your Settings location when set; otherwise sample city",
    focus: "Groceries & cleaning",
    sourceUrl: "https://example.com/sample/shops/mart",
  },
  {
    key: "shop-care",
    name: "Family Care Store (sample)",
    area: "Personal care row",
    cityHint: "Sample nearby listing",
    focus: "Personal & household care",
    sourceUrl: "https://example.com/sample/shops/care",
  },
  {
    key: "shop-fittings",
    name: "Fittings Depot (sample)",
    area: "Hardware lane",
    cityHint: "Sample nearby listing",
    focus: "Taps, aerators, small plumbing",
    sourceUrl: "https://example.com/sample/shops/fittings",
  },
  {
    key: "shop-fresh",
    name: "Fresh Basket (sample)",
    area: "Grocery plaza",
    cityHint: "Sample nearby listing",
    focus: "Pantry staples",
    sourceUrl: "https://example.com/sample/shops/fresh",
  },
];

export function getProductByKey(key: string): SampleProduct | undefined {
  return SAMPLE_PRODUCTS.find((p) => p.key === key);
}

export function productsForSection(section: DiscoverySection): SampleProduct[] {
  return SAMPLE_PRODUCTS.filter((p) => p.sections.includes(section));
}

export function searchProducts(query: string): SampleProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return SAMPLE_PRODUCTS;
  return SAMPLE_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.matchKeywords.some((k) => k.includes(q) || q.includes(k))
  );
}
