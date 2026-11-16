import { cache } from "react";
import {
  addDaysIso,
  computeBudgetOverview,
  daysInMonth,
  endOfMonthIso,
  monthStartIso,
  startOfWeekIso,
  todayIso,
  toNumber,
} from "@/lib/budget-math";
import {
  getExpenses,
  getMonthlyBudget,
  type ExpenseWithCategory,
} from "@/lib/finance/queries";

export type CategorySpend = {
  categoryId: string | null;
  name: string;
  amount: number;
};

export type WeeklyReport = {
  from: string;
  to: string;
  totalExpenses: number;
  previousFrom: string;
  previousTo: string;
  previousTotal: number;
  deltaVsPrevious: number;
  categoryBreakdown: CategorySpend[];
  highestCategory: CategorySpend | null;
  weeklyBudgetShare: number;
  weeklySavings: number;
};

export type MonthlyReport = {
  yearMonth: string;
  totalBudget: number;
  savingsAllocation: number;
  emergencyAllocation: number;
  spendingBudget: number;
  totalExpenses: number;
  remaining: number;
  utilizationPercent: number;
  categoryBreakdown: CategorySpend[];
};

export type ReportsPayload = {
  from: string;
  to: string;
  rangeTotal: number;
  rangeCategoryBreakdown: CategorySpend[];
  weekly: WeeklyReport;
  monthly: MonthlyReport;
};

function sumExpenses(rows: ExpenseWithCategory[]): number {
  return rows.reduce((sum, row) => sum + toNumber(row.amount), 0);
}

function breakdownByCategory(rows: ExpenseWithCategory[]): CategorySpend[] {
  const map = new Map<string, CategorySpend>();
  for (const row of rows) {
    const key = row.category_id ?? "uncategorized";
    const name = row.categories?.name ?? "Uncategorized";
    const prev = map.get(key);
    if (prev) {
      prev.amount += toNumber(row.amount);
    } else {
      map.set(key, {
        categoryId: row.category_id,
        name,
        amount: toNumber(row.amount),
      });
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function resolveReportRange(params: {
  from?: string;
  to?: string;
}): { from: string; to: string } {
  const today = todayIso();
  const monthStart = monthStartIso();
  const from =
    params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
      ? params.from
      : monthStart;
  const to =
    params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : today;
  if (from > to) return { from: to, to: from };
  return { from, to };
}

export const getReportsData = cache(
  async (
    params: { from?: string; to?: string } = {}
  ): Promise<ReportsPayload> => {
    const { from, to } = resolveReportRange(params);
    const weekEnd = to;
    const weekStart = startOfWeekIso(new Date(`${weekEnd}T00:00:00`));
    const previousTo = addDaysIso(weekStart, -1);
    const previousFrom = addDaysIso(previousTo, -6);
    const yearMonth = `${weekEnd.slice(0, 7)}-01`;
    const monthEnd = endOfMonthIso(yearMonth);

    const [
      rangeExpenses,
      weekExpenses,
      prevWeekExpenses,
      monthExpenses,
      budget,
    ] = await Promise.all([
      getExpenses({ from, to, limit: 1000 }),
      getExpenses({ from: weekStart, to: weekEnd, limit: 1000 }),
      getExpenses({ from: previousFrom, to: previousTo, limit: 1000 }),
      getExpenses({ from: yearMonth, to: monthEnd, limit: 1000 }),
      getMonthlyBudget(yearMonth),
    ]);

    const monthTotal = sumExpenses(monthExpenses);
    const overview = computeBudgetOverview({
      totalBudget: toNumber(budget?.total_amount),
      savingsAllocation: toNumber(budget?.savings_allocation),
      emergencyAllocation: toNumber(budget?.emergency_allocation),
      totalExpenses: monthTotal,
    });

    const weekTotal = sumExpenses(weekExpenses);
    const previousTotal = sumExpenses(prevWeekExpenses);
    const weekBreakdown = breakdownByCategory(weekExpenses);
    const days = daysInMonth(yearMonth);
    const weeklyBudgetShare =
      days > 0 ? (overview.spendingBudget / days) * 7 : 0;

    return {
      from,
      to,
      rangeTotal: sumExpenses(rangeExpenses),
      rangeCategoryBreakdown: breakdownByCategory(rangeExpenses),
      weekly: {
        from: weekStart,
        to: weekEnd,
        totalExpenses: weekTotal,
        previousFrom,
        previousTo,
        previousTotal,
        deltaVsPrevious: weekTotal - previousTotal,
        categoryBreakdown: weekBreakdown,
        highestCategory: weekBreakdown[0] ?? null,
        weeklyBudgetShare,
        weeklySavings: weeklyBudgetShare - weekTotal,
      },
      monthly: {
        yearMonth,
        totalBudget: overview.totalBudget,
        savingsAllocation: overview.savingsAllocation,
        emergencyAllocation: overview.emergencyAllocation,
        spendingBudget: overview.spendingBudget,
        totalExpenses: overview.totalExpenses,
        remaining: overview.remaining,
        utilizationPercent: overview.utilizationPercent,
        categoryBreakdown: breakdownByCategory(monthExpenses),
      },
    };
  }
);
