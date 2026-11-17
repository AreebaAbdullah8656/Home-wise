# HomeWise — Smart Bill Scanner, My Bills & NL Expenses

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-17  
**Scope:** SPEC §§6–7 + §5B NL expense entry

---

## Migration

**None required for app tables.** `bills`, `bill_items`, expenses `source` values (`bill`, `natural_language`), and private `bills` Storage bucket + RLS already exist from Phase 3 migrations:

1. `supabase/migrations/20261116000001_initial_schema.sql`
2. `supabase/migrations/20261116000002_rls_policies.sql`
3. `supabase/migrations/20261116000003_storage_bills.sql`

If Storage was never pasted, run **`20261116000003_storage_bills.sql`** in the Supabase SQL Editor.

---

## SPEC coverage

| Requirement | Status |
|-------------|--------|
| §6 Upload bill image / camera / PDF | **Done** |
| §6 OCR: store, date, items, qty, unit prices, discounts, taxes, total | **Done** (Gemini multimodal) |
| §6 Category suggestion per item | **Done** |
| §6 Review / correct / confirm before save | **Done** |
| §6 Never save unconfirmed OCR as expenses | **Done** (scan API returns JSON only) |
| §6 Confirm → bill + private storage + items + expenses, no duplicates | **Done** |
| §6 Dashboard totals update via revalidation | **Done** |
| §7 My Bills list / search / filter date & store | **Done** |
| §7 Open original / download / delete (+ storage) | **Done** |
| §7 Private per-user Storage + RLS | **Done** (existing policies) |
| Missing `GEMINI_API_KEY` clear message; manual still works | **Done** |
| §5B NL expense entry + review/confirm | **Done** |
| Unhide Scan a Bill + My Bills | **Done** |

Still hidden: Smart Saving Tips, Smart Recommendations.

---

## Server-only Gemini

- Key: `GEMINI_API_KEY` in `.env.local` (never `NEXT_PUBLIC_`)
- Model: `GEMINI_MODEL` optional; default **`gemini-3.8-flash`** (multimodal image + PDF)
- Routes: `POST /api/bills/scan`, `POST /api/expenses/parse-nl`
- Confirm paths: server actions `confirmBillScan`, `confirmNlExpense`
- API failures return the real Gemini error text to the UI

---

## How to run / test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
# Ensure GEMINI_API_KEY and Supabase keys are in .env.local
npm run dev
```

### Exact user test steps

1. Sign in → sidebar shows **Scan a Bill** and **My Bills**.
2. Without `GEMINI_API_KEY`: Scan page shows clear warning; Expenses → manual form still works; NL shows missing-key message.
3. With key: Scan → upload/camera → **Scan with Gemini** → review fields/lines → **Confirm and save bill**.
4. Confirm Expenses/Dashboard show new bill-sourced expenses; confirm again does not duplicate.
5. **My Bills**: search/filter; Open preview; Download; Delete (file removed from storage).
6. Expenses → Smart expense entry: type “Bought groceries for Rs. 2500 today.” → Suggest → edit → Confirm. Unconfirmed parse never saves.
7. Quick Actions Scan a bill / My bills work (no dead buttons).

---

## Verification

| Check | Result |
|-------|--------|
| New SQL migration | **None** (reuse storage migration if needed) |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| Overlay / lints | 0 issues |

---

## SPEC checklist

| Area | Status |
|------|--------|
| §6 Smart Bill Scanner | **Done** |
| §7 Digital Bill Wallet | **Done** |
| §5B NL expense entry | **Done** |
| Tips / Recommendations | **Skipped** |

---

*Stop for approval.*
