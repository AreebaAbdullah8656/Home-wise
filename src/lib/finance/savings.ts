import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthStartIso, toNumber } from "@/lib/budget-math";
import { getMonthlyBudget } from "@/lib/finance/queries";
import type { Database } from "@/types/database";

export type SavingsGoalRow =
  Database["public"]["Tables"]["savings_goals"]["Row"];
export type EmergencyFundRow =
  Database["public"]["Tables"]["emergency_funds"]["Row"];

/**
 * Allocated = planned set-aside (not spent).
 * Actual = money really saved (not an expense).
 * Expenses stay on the expenses table only — never summed here.
 */
export type SavingsOverview = {
  goalsAllocated: number;
  goalsActual: number;
  goalsGap: number;
  emergencyAllocated: number;
  emergencyActual: number;
  emergencyGap: number;
  budgetSavingsAllocation: number;
  budgetEmergencyAllocation: number;
  yearMonth: string;
};

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

export const getSavingsGoals = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as SavingsGoalRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getEmergencyFunds = cache(async () => {
  const userId = await requireUserId();
  if (!userId) return [] as EmergencyFundRow[];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("emergency_funds")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export function computeSavingsOverview(
  goals: SavingsGoalRow[],
  funds: EmergencyFundRow[],
  budgetSavingsAllocation: number,
  budgetEmergencyAllocation: number,
  yearMonth: string
): SavingsOverview {
  const goalsAllocated = goals.reduce(
    (s, g) => s + toNumber(g.allocated_amount),
    0
  );
  const goalsActual = goals.reduce((s, g) => s + toNumber(g.actual_amount), 0);
  const emergencyAllocated = funds.reduce(
    (s, f) => s + toNumber(f.allocated_amount),
    0
  );
  const emergencyActual = funds.reduce(
    (s, f) => s + toNumber(f.actual_amount),
    0
  );

  return {
    goalsAllocated,
    goalsActual,
    goalsGap: goalsAllocated - goalsActual,
    emergencyAllocated,
    emergencyActual,
    emergencyGap: emergencyAllocated - emergencyActual,
    budgetSavingsAllocation,
    budgetEmergencyAllocation,
    yearMonth,
  };
}

export const getSavingsPageData = cache(async () => {
  const yearMonth = monthStartIso();
  const [goals, funds, budget] = await Promise.all([
    getSavingsGoals(),
    getEmergencyFunds(),
    getMonthlyBudget(yearMonth),
  ]);
  const overview = computeSavingsOverview(
    goals,
    funds,
    toNumber(budget?.savings_allocation),
    toNumber(budget?.emergency_allocation),
    yearMonth
  );
  return { goals, funds, overview, budget };
});
