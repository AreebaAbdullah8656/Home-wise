# HomeWise — Phase 3 Auth & Database Report

**Status:** Phase 3 complete — awaiting user approval before Phase 4  
**Date:** 2026-11-16  
**Commit:** `b891e5f352d29350c926b0bf6d4e109d1a5922d4` — *Phase 3: Supabase auth, schema, and RLS* (local only; not pushed)

---

## SPEC coverage (this phase)

Re-read: SPEC §15 (Auth + DB + RLS), §17 (profile/currency defaults for settings), §20 Phase 3.

| Requirement | Status |
|-------------|--------|
| §20 Phase 3: authentication and database | **Done** |
| §15 Register / login / logout / profile | **Done** (email/password only) |
| §15 Schema: expenses, budgets, categories, savings, emergency, bills, bill items, grocery, inventory, recommendations, preferences | **Done** (foundations; CRUD in later phases) |
| §15 RLS — each user only own data | **Done** |
| §15 SQL migrations + setup instructions | **Done** |
| Private bills storage + per-user policies | **Done** |
| Google / magic link | **Skipped** (binding preference) |
| Full budget/expense CRUD, OCR | **Skipped** (Phases 4–5) |

---

## 1. What was delivered

- `@supabase/supabase-js` + `@supabase/ssr` + `zod` installed
- Three SQL migrations under `supabase/migrations/`
- Browser + server Supabase clients; Next.js 16 `src/proxy.ts` session refresh + route protection
- Functional `/login` and `/register` (email/password) via server actions
- Logout in sidebar/mobile nav; Settings profile editor (display name, currency PKR default, optional location)
- Graceful banner + disabled auth when `.env.local` missing
- Typed `src/types/database.ts`
- `.env.example` updated (no secrets; no `.env.local` created)

---

## 2. SQL files — paste into Supabase SQL Editor **in this order**

1. `supabase/migrations/20261116000001_initial_schema.sql`  
   Tables, indexes, `updated_at` triggers, signup trigger (profile + preferences + default categories + emergency fund).

2. `supabase/migrations/20261116000002_rls_policies.sql`  
   `ENABLE ROW LEVEL SECURITY` + per-user policies on **every** table.

3. `supabase/migrations/20261116000003_storage_bills.sql`  
   Private `bills` bucket + storage object policies (`{user_id}/{bill_id}/…` paths).

Also see `supabase/README.md`.

---

## 3. External setup (user)

1. Create a Supabase project.
2. Authentication → Providers → **Email** on; leave Google / magic link off.
3. (Optional for local testing) Disable email confirmation.
4. Settings → API → copy Project URL + `anon` `public` key.
5. Copy `.env.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL=`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
6. Paste the three SQL files in order (section 2).
7. Restart `npm run dev`.

**Not required for Phase 3:** Gemini key, Vercel, service role key (prefer RLS).

---

## 4. How to run

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm install
cp .env.example .env.local   # then edit keys
npm run dev
```

Without keys: app still loads; config banner shown; auth forms explain missing env; proxy does not force login.

With keys + migrations: unauthenticated `/dashboard` redirects to `/login`; signed-in users can use Settings profile + Sign out.

---

## 5. Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass (Proxy registered; `/login` dynamic) |
| Overlay `/login`, `/register`, `/dashboard` | **0 issues** (`data-error=false`, `data-status=none`, no Base UI console errors) |

---

## 6. Created / modified files (high level)

### Created

- `supabase/migrations/20261116000001_initial_schema.sql`
- `supabase/migrations/20261116000002_rls_policies.sql`
- `supabase/migrations/20261116000003_storage_bills.sql`
- `supabase/README.md`
- `src/lib/supabase/*`, `src/proxy.ts`, `src/types/database.ts`
- `src/app/auth/actions.ts`
- `src/components/auth/*`, `src/components/shared/config-banner.tsx`
- `docs/PHASE-3-AUTH-DATABASE.md`

### Modified

- Auth pages, settings, app shell/sidebar/mobile nav, `.env.example`, `README.md`, `(app)/layout.tsx`

---

## 7. SPEC checklist (Phase 3 only)

| Area | Status |
|------|--------|
| §20 Phase 3 | **Done** |
| §15 Auth (email/password) | **Done** |
| §15 Schema foundations | **Done** |
| §15 RLS all tables | **Done** |
| §15 Migrations + instructions | **Done** |
| Bills storage policies | **Done** |
| §17 Profile/currency shell | **Partial** (profile + currency + location; full prefs later) |
| Feature CRUD / OCR / reports | **Skipped** |

---

## 8. Questions before Phase 4

1. Approve Phase 4 (budget + manual/NL expenses)?
2. Confirm email verification on or off for your Supabase project?
3. Any schema tweaks before expense CRUD?

---

*End of Phase 3. Do not start Phase 4 until approved.*
