/**
 * Budget math helpers — never double-count allocations as expenses.
 *
 * - totalBudget: monthly envelope the user set
 * - savingsAllocation / emergencyAllocation: money set aside (not spent)
 * - spendingBudget: amount available for category spending
 * - totalExpenses: sum of expense rows only
 * - remaining: spendingBudget - totalExpenses
 * - actualSavings: tracked separately on savings_goals (Phase 6 UI); not summed into expenses
 */

export type BudgetOverviewInput = {
  totalBudget: number;
  savingsAllocation: number;
  emergencyAllocation: number;
  totalExpenses: number;
};

export type BudgetOverviewResult = {
  totalBudget: number;
  savingsAllocation: number;
  emergencyAllocation: number;
  spendingBudget: number;
  totalExpenses: number;
  remaining: number;
  utilizationPercent: number;
  nearLimit: boolean;
};

export function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function computeBudgetOverview(
  input: BudgetOverviewInput
): BudgetOverviewResult {
  const totalBudget = Math.max(0, toNumber(input.totalBudget));
  const savingsAllocation = Math.max(0, toNumber(input.savingsAllocation));
  const emergencyAllocation = Math.max(0, toNumber(input.emergencyAllocation));
  const totalExpenses = Math.max(0, toNumber(input.totalExpenses));

  const reserved = savingsAllocation + emergencyAllocation;
  const spendingBudget = Math.max(0, totalBudget - reserved);
  const remaining = spendingBudget - totalExpenses;
  const utilizationPercent =
    spendingBudget > 0
      ? Math.min(999, Math.round((totalExpenses / spendingBudget) * 100))
      : totalExpenses > 0
        ? 100
        : 0;

  return {
    totalBudget,
    savingsAllocation,
    emergencyAllocation,
    spendingBudget,
    totalExpenses,
    remaining,
    utilizationPercent,
    nearLimit: spendingBudget > 0 && utilizationPercent >= 80,
  };
}

export function categoryProgress(
  limit: number | null | undefined,
  spent: number
): { percent: number; nearLimit: boolean; overLimit: boolean } {
  const lim = toNumber(limit);
  const s = Math.max(0, toNumber(spent));
  if (lim <= 0) {
    return { percent: 0, nearLimit: false, overLimit: false };
  }
  const percent = Math.round((s / lim) * 100);
  return {
    percent,
    nearLimit: percent >= 80 && percent < 100,
    overLimit: percent >= 100,
  };
}

/** First calendar day of the month (YYYY-MM-01). */
export function monthStartIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function monthLabel(yearMonth: string): string {
  const d = new Date(`${yearMonth}T00:00:00`);
  if (Number.isNaN(d.getTime())) return yearMonth;
  return d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

/** Monday-start week date (YYYY-MM-DD). */
export function startOfWeekIso(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function todayIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dayNum = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function endOfMonthIso(yearMonth: string): string {
  const d = new Date(`${yearMonth}T00:00:00`);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const dayNum = String(end.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}
