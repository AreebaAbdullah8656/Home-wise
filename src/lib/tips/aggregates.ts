import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  computeBudgetOverview,
  endOfMonthIso,
  monthStartIso,
  toNumber,
} from "@/lib/budget-math";
import {
  getCategoriesForUser,
  getCategorySpendMap,
  getMonthlyBudget,
  getMonthExpenseTotal,
} from "@/lib/finance/queries";
import { getGroceryItems, computeGroceryTotals } from "@/lib/finance/grocery";
import { getInventoryItems, lowStockItems } from "@/lib/finance/inventory";

/** Aggregated-only household stats for Gemini — no names, bills, or PII. */
export type HouseholdTipAggregates = {
  currency: string;
  yearMonth: string;
  budgetUtilizationPercent: number;
  spendingBudget: number;
  totalExpensesThisMonth: number;
  remainingBudget: number;
  topCategories: Array<{
    categoryName: string;
    amount: number;
    percentOfSpend: number;
  }>;
  repeatedPurchaseLabels: Array<{
    label: string;
    count: number;
  }>;
  grocery: {
    pendingItemCount: number;
    estimatedPendingTotal: number;
  };
  inventory: {
    itemCount: number;
    lowStockCount: number;
  };
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

function normalizePurchaseLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 48);
}

/**
 * Build privacy-safe aggregates for AI tips.
 * Never includes store names, people names, or raw bill text.
 */
export const getHouseholdTipAggregates = cache(
  async (): Promise<HouseholdTipAggregates | null> => {
    const userId = await requireUserId();
    if (!userId) return null;

    const yearMonth = monthStartIso();
    const supabase = await createClient();

    const [
      budget,
      totalExpenses,
      categories,
      spendMap,
      groceryItems,
      inventoryItems,
      expenseNames,
      profile,
    ] = await Promise.all([
      getMonthlyBudget(yearMonth),
      getMonthExpenseTotal(yearMonth),
      getCategoriesForUser(),
      getCategorySpendMap(yearMonth),
      getGroceryItems(),
      getInventoryItems(),
      supabase
        .from("expenses")
        .select("name")
        .eq("user_id", userId)
        .gte("expense_date", yearMonth)
        .lte("expense_date", endOfMonthIso(yearMonth))
        .limit(200),
      supabase
        .from("profiles")
        .select("currency")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const overview = computeBudgetOverview({
      totalBudget: toNumber(budget?.total_amount),
      savingsAllocation: toNumber(budget?.savings_allocation),
      emergencyAllocation: toNumber(budget?.emergency_allocation),
      totalExpenses,
    });

    const categoryById = new Map(categories.map((c) => [c.id, c.name]));
    const categoryTotals = [...spendMap.entries()]
      .map(([id, amount]) => ({
        categoryName: categoryById.get(id) || "Other",
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((row) => ({
        ...row,
        percentOfSpend:
          totalExpenses > 0
            ? Math.round((row.amount / totalExpenses) * 1000) / 10
            : 0,
      }));

    const counts = new Map<string, number>();
    for (const row of expenseNames.data ?? []) {
      const label = normalizePurchaseLabel(String(row.name ?? ""));
      if (label.length < 3) continue;
      // Strip likely personal tokens (emails / long digit strings)
      if (/@/.test(label) || /\d{6,}/.test(label)) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const repeatedPurchaseLabels = [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));

    const groceryTotals = computeGroceryTotals(groceryItems);
    const lowStock = lowStockItems(inventoryItems);

    return {
      currency: (profile.data?.currency || "PKR").toUpperCase(),
      yearMonth,
      budgetUtilizationPercent: overview.utilizationPercent,
      spendingBudget: overview.spendingBudget,
      totalExpensesThisMonth: overview.totalExpenses,
      remainingBudget: overview.remaining,
      topCategories: categoryTotals,
      repeatedPurchaseLabels,
      grocery: {
        pendingItemCount: groceryTotals.pendingCount,
        estimatedPendingTotal: groceryTotals.estimatedTotal,
      },
      inventory: {
        itemCount: inventoryItems.length,
        lowStockCount: lowStock.length,
      },
    };
  }
);
