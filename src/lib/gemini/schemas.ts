import { z } from "zod";

export const billItemSchema = z.object({
  product_name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  line_total: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  category_suggestion: z.string().nullable().optional(),
});

export const billExtractionSchema = z.object({
  store_name: z.string().nullable().optional(),
  purchase_date: z
    .string()
    .nullable()
    .optional()
    .describe("YYYY-MM-DD when possible"),
  currency: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  discounts_total: z.number().nullable().optional(),
  taxes_total: z.number().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(billItemSchema).default([]),
});

export type BillExtraction = z.infer<typeof billExtractionSchema>;
export type BillItemExtraction = z.infer<typeof billItemSchema>;

export const nlExpenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category_suggestion: z.string().nullable().optional(),
  expense_date: z
    .string()
    .nullable()
    .optional()
    .describe("YYYY-MM-DD when possible"),
  payment_method: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export type NlExpenseSuggestion = z.infer<typeof nlExpenseSchema>;

export const BILL_CATEGORY_HINTS = [
  "Groceries",
  "Household expenses",
  "Electricity and utilities",
  "Clothing",
  "Transportation",
  "Healthcare",
  "Personal care",
  "Home maintenance",
  "Cleaning products",
  "Kitchen essentials",
  "Home appliances",
  "Extras",
  "Unexpected expenses",
  "Other",
] as const;
