# HomeWise — Smart Recommendations (SPEC §§8–9)

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-17  
**Branch:** `cursor/recommendations-7352` (local commit only — not pushed)  
**Scope:** Affordable alternatives + shopping discovery with labeled sample data; unhide nav; optional bill wiring

---

## Migration

**None required.** `saved_recommendations` (+ RLS) already exists in:

1. `supabase/migrations/20261116000001_initial_schema.sql`
2. `supabase/migrations/20261116000002_rls_policies.sql`

No new SQL file to paste.

---

## What shipped

### §8 Affordable alternatives
- Keyword match from **confirmed** bill line items → sample catalog alternatives
- Shows current bill item + price, suggested alternative, brand, sample price, sample estimated savings, quality notes, features, source, sample retailer link
- Does **not** recommend solely because cheaper — quality notes + features required on every sample product
- User controls: **Save**, **Dismiss**, ignore by leaving closed, **more alternatives** in-category
- My Bills bill dialog: optional collapsed “Show suggestions” (never auto-interrupts)

### §9 Smart shopping discovery
- Sections: Recommended for Your Home, Deals of the Week, Better Alternatives, Affordable Home Essentials, Nearby Shops, From your bills, Saved
- Categories covering SPEC list (clothing through household essentials)
- Search + category filter
- Nearby shops use Settings location label when set; shop rows remain **sample**
- Every card: `SampleBadge` + “not a real price/discount” copy; verified offer = no
- **No** cart, checkout, payments, seller accounts, or selling

### Nav / docs
- Smart Recommendations unhidden in sidebar + quick actions
- README feature bullet updated
- Settings prefs copy updated

### Verify
- `npx tsc --noEmit` — pass
- `npm run build` — pass (overlay / compile errors: **0**)

---

## SPEC checklist

| Requirement | Status | Notes |
|-------------|--------|--------|
| §8 Analyze confirmed bill items → alternatives | **Done** | Keyword match + sample catalog |
| §8 Show current / alt / brand / prices / savings / quality / features / source / link | **Done** | Sample prices clearly labeled |
| §8 Not cheaper-only; consider quality etc. | **Done** | Quality notes + features on catalog |
| §8 Never invent real prices / claims | **Done** | Static sample data only |
| §8 Save / dismiss / ignore / view more | **Done** | via `saved_recommendations` |
| §9 Discovery sections | **Done** | All five + From bills + Saved |
| §9 Product categories | **Done** | SPEC list covered |
| §9 Search | **Done** | |
| §9 Location / nearby shops | **Partial** | Manual Settings location label; sample shops; no live geo API |
| §9 Legitimate APIs or labeled sample | **Done** | Sample path (no product API) |
| §9 No cart/checkout/payments/sellers | **Done** | |
| Unhide in sidebar | **Done** | |
| New SQL migration | **Skipped** | Not needed |

---

## Files created / modified

**Created**
- `src/lib/recommendations/catalog.ts`
- `src/lib/recommendations/match.ts`
- `src/lib/recommendations/queries.ts`
- `src/app/recommendations/actions.ts`
- `src/components/recommendations/product-card.tsx`
- `src/components/recommendations/discovery-panel.tsx`
- `src/components/recommendations/bill-item-suggestions.tsx`
- `docs/PHASE-RECOMMENDATIONS.md`

**Modified**
- `src/app/(app)/recommendations/page.tsx` — live page (was redirect)
- `src/lib/navigation.ts` — unhide Recommendations; `HIDDEN_FEATURE_ROUTES` empty
- `src/components/bills/bills-list.tsx` — optional suggestions in bill dialog
- `src/app/(app)/bills/page.tsx` — pass save/dismiss keys
- `src/components/dashboard/quick-actions.tsx`
- `src/app/(app)/settings/page.tsx`
- `README.md`

---

## How to test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm run dev
```

1. Sidebar shows **Smart Recommendations**; open `/recommendations`
2. Confirm banner + badges say sample / not real discounts; no cart UI
3. Browse sections; search “detergent”; filter category; open a sample source link
4. Sign in → **Save** a product → **Saved** tab; **Dismiss** another → hidden from lists
5. **Nearby Shops**: set location in Settings → label updates; shops still sample
6. Confirm a bill with items like “laundry detergent” / “shampoo” → My Bills → open bill → **Show suggestions** → save/dismiss; or use **From your bills** section
7. Confirm Reports still never auto-open

---

## External config

No new env vars. Same Supabase (+ optional Gemini for bills). Location is optional profile field.

---

## Stop

Awaiting approval before push or further Phase 10 work.
