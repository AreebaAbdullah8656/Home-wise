import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  computeBudgetOverview,
  endOfMonthIso,
  monthStartIso,
  startOfWeekIso,
  toNumber,
} from "@/lib/budget-math";
import type { Database } from "@/types/database";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type MonthlyBudgetRow =
  Database["public"]["Tables"]["monthly_budgets"]["Row"];

export type ExpenseWithCategory = ExpenseRow & {
  categories: Pick<CategoryRow, "id" | "name"> | null;
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export const getCategoriesForUser = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as CategoryRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const getMonthlyBudget = cache(async (yearMonth = monthStartIso()) => {
  const userId = await requireUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export type ExpenseQuery = {
  search?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export const getExpenses = cache(async (query: ExpenseQuery = {}) => {
  const userId = await requireUserId();
  if (!userId) return [] as ExpenseWithCategory[];
  const supabase = await createClient();

  let q = supabase
    .from("expenses")
    .select("*, categories(id, name)")
    .eq("user_id", userId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (query.categoryId) q = q.eq("category_id", query.categoryId);
  if (query.from) q = q.gte("expense_date", query.from);
  if (query.to) q = q.lte("expense_date", query.to);
  if (query.search?.trim()) {
    q = q.ilike("name", `%${query.search.trim()}%`);
  }
  if (query.limit) q = q.limit(query.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ExpenseWithCategory[];
});

export const getMonthExpenseTotal = cache(
  async (yearMonth = monthStartIso()) => {
    const userId = await requireUserId();
    if (!userId) return 0;
    const supabase = await createClient();
    const from = yearMonth;
    const to = endOfMonthIso(yearMonth);
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("expense_date", from)
      .lte("expense_date", to);
    if (error) throw error;
    return (data ?? []).reduce((sum, row) => sum + toNumber(row.amount), 0);
  }
);

export const getWeekExpenseTotal = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return 0;
  const supabase = await createClient();
  const from = startOfWeekIso();
  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .gte("expense_date", from);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + toNumber(row.amount), 0);
});

export const getCategorySpendMap = cache(
  async (yearMonth = monthStartIso()) => {
    const userId = await requireUserId();
    if (!userId) return new Map<string, number>();
    const supabase = await createClient();
    const from = yearMonth;
    const to = endOfMonthIso(yearMonth);
    const { data, error } = await supabase
      .from("expenses")
      .select("category_id, amount")
      .eq("user_id", userId)
      .gte("expense_date", from)
      .lte("expense_date", to);
    if (error) throw error;
    const map = new Map<string, number>();
    for (const row of data ?? []) {
      if (!row.category_id) continue;
      map.set(
        row.category_id,
        (map.get(row.category_id) ?? 0) + toNumber(row.amount)
      );
    }
    return map;
  }
);

export const getDashboardFinance = cache(async () => {
  const yearMonth = monthStartIso();
  const [budget, totalExpenses, weekTotal, categories, recent, spendMap] =
    await Promise.all([
      getMonthlyBudget(yearMonth),
      getMonthExpenseTotal(yearMonth),
      getWeekExpenseTotal(),
      getCategoriesForUser(),
      getExpenses({ limit: 8 }),
      getCategorySpendMap(yearMonth),
    ]);

  const overview = computeBudgetOverview({
    totalBudget: toNumber(budget?.total_amount),
    savingsAllocation: toNumber(budget?.savings_allocation),
    emergencyAllocation: toNumber(budget?.emergency_allocation),
    totalExpenses,
  });

  const categoryProgressRows = categories.map((cat) => {
    const spent = spendMap.get(cat.id) ?? 0;
    return {
      id: cat.id,
      name: cat.name,
      limit: cat.spending_limit === null ? null : toNumber(cat.spending_limit),
      spent,
    };
  });

  return {
    yearMonth,
    budget,
    overview,
    weekTotal,
    recent,
    categoryProgressRows,
  };
});
