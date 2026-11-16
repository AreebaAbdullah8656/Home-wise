# HomeWise — Savings & Emergency + Home Inventory

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-16  
**Scope:** SPEC savings/emergency funds + §11 inventory (unhide nav)

---

## Migration

**None required.** Tables `savings_goals`, `emergency_funds`, and `inventory_items` (with RLS) already exist from the initial schema. No new SQL to paste.

---

## SPEC coverage

### Savings & Emergency

| Requirement | Status |
|-------------|--------|
| Dedicated Savings & Emergency section | **Done** |
| Allocated vs actual tracked separately | **Done** |
| Not double-counted as expenses | **Done** (never writes expense rows) |
| Shows monthly budget set-asides for context | **Done** (read-only link to My Budget) |
| CRUD savings goals | **Done** |
| CRUD emergency funds | **Done** |
| Sidebar item unhidden | **Done** |

### §11 Home Inventory

| Requirement | Status |
|-------------|--------|
| Categories (Kitchen, Cleaning, Bathroom, Laundry, Appliances, Furniture, Home maintenance, Other) | **Done** |
| Name, quantity, purchase date, price, notes, stock status | **Done** |
| Low-stock reminders | **Done** (`low` / `out` banner + filter) |
| Add to grocery without duplicates | **Done** (skips if pending grocery with same name) |
| Sidebar item unhidden | **Done** |

### Still hidden (out of scope)

Scan a Bill, My Bills, Smart Saving Tips, Smart Recommendations — still redirect to Dashboard.

---

## No double-counting rules

1. **Allocated** = planned set-aside on goals/funds (and/or monthly budget envelopes).
2. **Actual** = money really saved on goals/funds.
3. **Expenses** = only `expenses` table rows (manual, bill, grocery).
4. Saving/emergency actions never insert into `expenses`.

---

## How to run / test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm run dev
```

### Exact user test steps

1. Sign in → sidebar includes **Savings & Emergency** and **Home Inventory** (plus existing live sections).
2. **Savings:** Add a savings goal (target / allocated / actual) → appears in list; edit; delete.
3. Add an emergency fund → edit; delete.
4. Confirm overview shows allocated vs actual separately; open **Edit monthly budget** link works.
5. Confirm adding savings does **not** create an expense on Expenses/Dashboard totals.
6. **Inventory:** Add item (e.g. Kitchen, stock `low`) → low-stock reminder appears.
7. Click **Add to grocery** → item on Grocery List; click again → “Already on your grocery list” (no duplicate).
8. Edit stock to `ok`; delete an item.
9. Quick Actions: Savings & emergency / Home inventory navigate correctly (no dead buttons).
10. `/tips` and `/scan-bill` still redirect to Dashboard.

---

## Verification

| Check | Result |
|-------|--------|
| New SQL migration | **None** |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| Overlay / lints | 0 issues |

---

## SPEC checklist

| Area | Status |
|------|--------|
| Savings & Emergency | **Done** |
| Home Inventory §11 | **Done** |
| Nav unhide for both | **Done** |
| Bill OCR / tips / recommendations | **Skipped** |

---

*Stop for approval.*
