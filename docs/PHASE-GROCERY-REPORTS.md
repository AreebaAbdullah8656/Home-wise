# HomeWise — Grocery List, Reports & Nav Cleanup

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-16  
**Scope:** SPEC §10 Grocery + SPEC §13 Reports + deploy nav cleanup (not full Phase 5)

---

## SPEC coverage

### §10 Grocery List

| Requirement | Status |
|-------------|--------|
| Dedicated grocery list | **Done** |
| Name, quantity, estimated price, priority, purchased | **Done** |
| Add / edit / delete | **Done** |
| Mark purchased | **Done** |
| View pending items | **Done** (filter tabs) |
| Estimated total | **Done** |
| Actual total | **Done** (purchased items) |
| Purchased → expense without duplicates | **Done** (`expense_id` link + match guard) |

### §13 Reports

| Requirement | Status |
|-------------|--------|
| Dedicated Reports section | **Done** |
| Never auto-open / pop-ups / redirect after expense | **Done** |
| Sidebar Reports tab only | **Done** |
| Detailed reports load only on Reports page | **Done** |
| Weekly: total, categories, highest, vs previous, savings | **Done** |
| Monthly: budget, expenses, remaining, savings/emergency, categories, utilization | **Done** |
| Date range picker | **Done** |
| Clean charts (Recharts) | **Done** |
| Optional small dashboard snapshot | **Done** (existing weekly snapshot; no detailed charts) |

### Nav cleanup (deploy)

| Hidden (redirect → `/dashboard`) | Kept |
|----------------------------------|------|
| Scan a Bill, My Bills, Savings & Emergency, Home Inventory, Smart Saving Tips, Smart Recommendations | Dashboard, My Budget, Expenses, Grocery List, Reports, Settings (+ auth) |

Quick Actions no longer link to unfinished routes. Dashboard tips card has no dead “Browse all tips” button.

---

## Duplicate prevention (grocery → expense)

1. If `grocery_items.expense_id` is set → never insert another expense.
2. Else, before insert, look for same-day matching expense (name + amount + category).
3. Link found or new expense id back onto the grocery row.
4. Unmark purchased keeps `expense_id` so remaking cannot double-count.

Allocations (savings/emergency) remain set-asides and are not counted as expenses in reports.

---

## How to run / test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm run dev
```

### Exact user test steps

1. Sign in. Confirm sidebar shows only: Dashboard, My Budget, Expenses, Grocery List, Reports, Settings.
2. Visit `/scan-bill`, `/bills`, `/savings`, `/inventory`, `/tips`, `/recommendations` → each redirects to Dashboard.
3. **Grocery:** Add item (name, qty, priority, estimated price) → appears under Pending.
4. Edit item; delete another item.
5. Mark purchased with actual price + “Record as expense” → expense appears under Expenses / Dashboard; grocery shows “Expense linked”.
6. Mark purchased again on same item (or unmark → remake) → no second expense.
7. Confirm estimated vs actual totals update.
8. **Reports:** Open Reports from sidebar only (not after adding expense). Set date range → Update range.
9. See weekly + monthly stats and Recharts charts. Confirm adding an expense does not open Reports.
10. Quick Actions: Add expense, Set monthly budget, Add grocery item, Open reports — all live.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| Overlay / lints | 0 issues |

---

## SPEC checklist

| Area | Status |
|------|--------|
| §10 Grocery List | **Done** |
| §13 Reports | **Done** |
| Nav hide unfinished | **Done** |
| Bill OCR / inventory / tips / recommendations | **Skipped** (out of scope) |

---

*Stop for approval. No further phases until approved.*
