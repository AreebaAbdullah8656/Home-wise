/**
 * Clearly labeled SAMPLE / empty-state data for the Phase 2 dashboard shell.
 * Not real user finances. Do not present as live account data.
 */

export const SAMPLE_LABEL = "Sample preview — not your real data";

export const sampleBudgetOverview = {
  monthlyBudgetPkr: 80_000,
  totalExpensesPkr: 0,
  remainingPkr: 80_000,
  savingsAllocationPkr: 10_000,
  emergencyFundPkr: 5_000,
  utilizationPercent: 0,
};

export const sampleCategories = [
  { name: "Groceries", limitPkr: 25_000, spentPkr: 0 },
  { name: "Utilities", limitPkr: 12_000, spentPkr: 0 },
  { name: "Transport", limitPkr: 8_000, spentPkr: 0 },
  { name: "Personal care", limitPkr: 5_000, spentPkr: 0 },
];

export const sampleSavingSuggestions = [
  "Batch-cook staples on weekends to cut midweek takeaway spend.",
  "Compare unit prices on cleaning supplies before restocking.",
  "Set a soft alert at 80% of each category limit (coming in a later phase).",
];

export const sampleWeeklySnapshot = {
  weekLabel: "This week (sample)",
  totalPkr: 0,
  note: "Weekly totals will appear here after you add expenses. Detailed charts stay on Reports — they never open automatically.",
};
