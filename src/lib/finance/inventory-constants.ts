export const INVENTORY_CATEGORIES = [
  "Kitchen",
  "Cleaning",
  "Bathroom",
  "Laundry",
  "Appliances",
  "Furniture",
  "Home maintenance",
  "Other essentials",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const STOCK_STATUSES = ["ok", "low", "out"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];
