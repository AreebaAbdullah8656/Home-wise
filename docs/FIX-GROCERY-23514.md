# Fix: Grocery 23514 CHECK constraint

**Date:** 2026-11-16  
**Commit branch:** `cursor/grocery-reports-nav-7352`

## Exact constraint

| Field | Value |
|-------|--------|
| Postgres code | `23514` (`check_violation`) |
| Table | `public.expenses` |
| Constraint | **`expenses_source_check`** |
| Allowed before | `manual`, `natural_language`, `bill` |
| App sent | `source = 'grocery'` on mark purchased → expense |
| Symptom | UI showed **Could not reach Supabase (23514)** because `formatAuthError` treated any `code` as a network failure |

Grocery **add** itself only checks `grocery_items.priority ∈ (low, normal, high)` — that path is valid for milk/high/2kg/300/310. The 23514 came from the expense insert when recording a purchase (or a purchase attempt on the same page). After this fix, mark purchased can insert `source = 'grocery'` once the migration is applied.

## App / error-handling fix

- `src/lib/supabase/errors.ts` — Postgres/PostgREST codes (22xxx, 23xxx, 42xxx, PGRST*) return the real message + `code` + constraint name. Only true network failures use “Could not reach Supabase”.
- Mark purchased continues to use `source: "grocery"` (now allowed after migration).

## Migration to paste in Supabase SQL Editor

**File:** `supabase/migrations/20261116000004_expenses_source_grocery.sql`

```sql
-- Allow grocery-originated expenses (mark purchased → expense).
-- Root cause of Postgres 23514 when inserting source = 'grocery'.
-- Previous check: ('manual', 'natural_language', 'bill') only.

alter table public.expenses
  drop constraint if exists expenses_source_check;

alter table public.expenses
  add constraint expenses_source_check
  check (source in ('manual', 'natural_language', 'bill', 'grocery'));
```

Paste that entire file into the Supabase Dashboard → SQL Editor → Run.

## Test checklist

1. Apply migration above.
2. Add grocery item → success (no 23514 / no “Could not reach”).
3. Edit item → success.
4. Mark purchased + record expense → one expense with `source = grocery`; remake → no duplicate.
5. Delete item → success.
6. If a DB error occurs, message includes `code 23514` and `constraint expenses_source_check` (not network wording).
