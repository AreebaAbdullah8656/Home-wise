# HomeWise — Smart Saving Tips + Settings + README (Phase 10 slice)

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-17  
**Branch:** `cursor/tips-settings-readme-7352` (local commit only — not pushed)  
**Scope:** SPEC §12 (tips + bookmarks), §17 Settings slice, §19 README, Phase 10 cleanup/test

---

## Migration

**None required.** `bookmarked_tips` + RLS and `profiles` (currency default PKR, location) already exist in:

1. `supabase/migrations/20261116000001_initial_schema.sql`
2. `supabase/migrations/20261116000002_rls_policies.sql`

No new SQL file to paste.

---

## What shipped

### Smart Saving Tips (§12)
- Static catalog: Grocery, Electricity, Water, Kitchen, Cleaning, DIY, Organization, Shopping
- `/tips` page with category filters + Bookmarked view
- Bookmark / unbookmark via `bookmarked_tips` (RLS)
- Unhidden in sidebar; dashboard “Browse all tips” + quick action
- Sign-in required to bookmark; library readable when signed out if configured

### Settings (§17 slice)
- Profile: display name, email (read-only)
- Currency: PKR default, changeable select (PKR/USD/EUR/GBP/AED/SAR/INR + current if custom)
- Location: optional
- Preferences card notes: bill upload optional, reports never auto-open, Recommendations not enabled

### README / docs (§19)
- Root `README.md` rewritten: features, stack, setup, env vars, database setup, testing, screenshots section
- `supabase/README.md` migration paste order refreshed

### Cleanup
- Removed incomplete `scripts/make-receipt-image.mjs`
- Smart Recommendations stays **hidden** (redirect → `/dashboard`, not in nav)

### Verify
- `npx tsc --noEmit` — pass
- `npm run build` — pass (overlay / compile errors: **0**)

---

## SPEC checklist

| Area | Status | Notes |
|------|--------|--------|
| §12 Smart Saving Tips categories | **Done** | Static catalog |
| §12 Bookmark tips | **Done** | `bookmarked_tips` |
| §12 Unhide Tips in nav | **Done** | |
| §13 Reports never auto-open | **Done** (prior) | Unchanged |
| §16 Nav: Tips visible | **Done** | |
| §16 Nav: Recommendations | **Skipped** | Kept hidden per request |
| §17 Profile | **Done** | |
| §17 Currency PKR default + changeable | **Done** (store) / **Partial** (display) | Saved on profile; most UI still formats via `formatPkr` default PKR. `formatMoney(amount, currency)` ready to thread. |
| §17 Location optional | **Done** | |
| §17 Budget / notification / privacy prefs | **Partial / skipped** | Placeholder copy only; not full preference panels |
| §18 Testing (tsc + build) | **Done** | Manual smoke listed below |
| §19 README features/stack/setup/env/DB/testing/screenshots | **Done** | Screenshots section is a placeholder for images |
| §8 Phase 8 Smart Recommendations | **Skipped** | Keep hidden |
| Phase 10 full bugfix + GitHub push | **Partial** | Local commit; no push |

---

## Files created / modified

**Created**
- `src/lib/tips/catalog.ts`
- `src/lib/tips/queries.ts`
- `src/app/tips/actions.ts`
- `src/components/tips/tips-library.tsx`
- `docs/PHASE-TIPS-SETTINGS-README.md`

**Modified**
- `src/app/(app)/tips/page.tsx` — real tips page (was redirect)
- `src/lib/navigation.ts` — Tips unhidden; Recommendations only in `HIDDEN_FEATURE_ROUTES`
- `src/components/dashboard/saving-suggestions.tsx` — link to `/tips`
- `src/components/dashboard/quick-actions.tsx` — Saving tips action
- `src/components/auth/profile-form.tsx` — currency `<select>`
- `src/app/(app)/settings/page.tsx` — profile + prefs copy
- `src/app/auth/actions.ts` — currency uppercased; revalidate dashboard
- `src/lib/format.ts` — `formatMoney` + optional currency on `formatPkr`
- `README.md`, `supabase/README.md`

**Unchanged (intentionally)**
- `src/app/(app)/recommendations/page.tsx` — still redirects to dashboard

---

## How to test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm run dev
```

1. Sidebar shows **Smart Saving Tips**; **Smart Recommendations** absent
2. Open `/tips` → filter by category → bookmark → Bookmarked filter → remove bookmark
3. Dashboard → “Browse all tips” / quick action “Saving tips”
4. Settings → change display name, currency (e.g. USD), optional location → Save → reload Settings and confirm values
5. Visit `/recommendations` → redirects to dashboard
6. Confirm Reports still only open from nav / quick action (no auto pop-up)

---

## External config

Same as before: Supabase URL + anon key; optional `GEMINI_API_KEY` / `GEMINI_MODELS`. No new env vars.

---

## Stop

Awaiting approval before any further Phase 10 work or push.
