export type TipCategory =
  | "Grocery"
  | "Electricity"
  | "Water"
  | "Kitchen"
  | "Cleaning"
  | "DIY"
  | "Organization"
  | "Shopping";

export type Tip = {
  key: string;
  category: TipCategory;
  title: string;
  body: string;
};

/** Practical household tips — static catalog (SPEC §12). */
export const TIP_CATEGORIES: TipCategory[] = [
  "Grocery",
  "Electricity",
  "Water",
  "Kitchen",
  "Cleaning",
  "DIY",
  "Organization",
  "Shopping",
];

export const SAVING_TIPS: Tip[] = [
  {
    key: "grocery-list-before-shop",
    category: "Grocery",
    title: "Shop with a written list",
    body: "Write your grocery list from tonight’s meal plan. Stick to it in the aisle to avoid impulse buys.",
  },
  {
    key: "grocery-unit-price",
    category: "Grocery",
    title: "Compare unit prices",
    body: "Check price per kg or per litre, not just pack price. Bulk is not always cheaper once you waste leftovers.",
  },
  {
    key: "grocery-seasonal",
    category: "Grocery",
    title: "Buy seasonal produce",
    body: "Local seasonal fruit and vegetables usually cost less and last longer than out-of-season imports.",
  },
  {
    key: "electricity-peak",
    category: "Electricity",
    title: "Shift heavy loads off peak",
    body: "Run washing machines and irons outside peak tariff hours when your utility offers time-of-use rates.",
  },
  {
    key: "electricity-standby",
    category: "Electricity",
    title: "Unplug idle chargers",
    body: "Phone and appliance chargers still draw power when plugged in. Unplug them overnight.",
  },
  {
    key: "electricity-ac",
    category: "Electricity",
    title: "Raise AC by one degree",
    body: "Each degree higher on the AC can cut cooling cost. Use fans with AC for comfort at a milder setting.",
  },
  {
    key: "water-leak",
    category: "Water",
    title: "Fix dripping taps quickly",
    body: "A slow drip wastes litres every day. Replace washers early — cheaper than a higher water bill.",
  },
  {
    key: "water-bath",
    category: "Water",
    title: "Shorter showers",
    body: "Cut shower time by two minutes. Keep a bucket for cold water that runs before hot water arrives.",
  },
  {
    key: "kitchen-batch",
    category: "Kitchen",
    title: "Batch-cook staples",
    body: "Cook dal, rice, or chicken in batches on weekends to reduce weekday takeaway spend.",
  },
  {
    key: "kitchen-leftovers",
    category: "Kitchen",
    title: "Plan leftover nights",
    body: "Designate one dinner each week for leftovers so food does not spoil unused.",
  },
  {
    key: "cleaning-concentrate",
    category: "Cleaning",
    title: "Dilute concentrates correctly",
    body: "Follow label ratios for floor cleaners and detergents. Overusing product wastes money and residue.",
  },
  {
    key: "cleaning-vinegar",
    category: "Cleaning",
    title: "Vinegar for glass and scale",
    body: "White vinegar and water clean glass and kettle scale without specialty sprays.",
  },
  {
    key: "diy-furniture",
    category: "DIY",
    title: "Repair before replace",
    body: "Tighten loose screws, glue minor cracks, and re-cover cushions before buying new furniture.",
  },
  {
    key: "diy-storage",
    category: "DIY",
    title: "Reuse jars for pantry storage",
    body: "Clean glass jars organise spices and dry goods without buying matching plastic sets.",
  },
  {
    key: "org-zones",
    category: "Organization",
    title: "Create kitchen zones",
    body: "Keep cooking, cleaning, and snack items in fixed zones so you stop buying duplicates you cannot find.",
  },
  {
    key: "org-inventory",
    category: "Organization",
    title: "Check inventory before shopping",
    body: "Glance at Home Inventory and the pantry before you leave — restock only what is low or out.",
  },
  {
    key: "shop-wait",
    category: "Shopping",
    title: "24-hour wait on non-essentials",
    body: "For non-urgent buys over a set amount, wait one day. Many impulse wants fade.",
  },
  {
    key: "shop-cash-envelope",
    category: "Shopping",
    title: "Use a weekly cash envelope",
    body: "Set a weekly discretionary envelope. When it is empty, pause optional shopping until next week.",
  },
];

export function getTipByKey(key: string): Tip | undefined {
  return SAVING_TIPS.find((t) => t.key === key);
}
