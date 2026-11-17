# HomeWise

Your smart household budget and saving companion.

HomeWise helps households manage budgets, track expenses, organize groceries, store bills privately, and follow practical saving tips. It is **not** an e-commerce site. Bill upload is always optional. Reports never open automatically.

## Features

- **Dashboard** — live budget overview, recent expenses, category progress, weekly snapshot
- **My Budget** — flexible monthly envelope, custom categories, savings/emergency set-asides (not expenses)
- **Expenses** — manual entry + natural-language suggestions (Gemini, confirm before save)
- **Scan a Bill / My Bills** — optional OCR, review/confirm, private storage wallet
- **Savings & Emergency** — allocated vs actual (never double-counted as expenses)
- **Grocery List** — priorities, mark purchased → expense once
- **Home Inventory** — stock status, low-stock reminders, add to grocery without duplicates
- **Smart Saving Tips** — categorized advice with bookmarks
- **Smart Recommendations** — live nearby stores via Google Places (no sample/fake data; no cart/checkout); optional bill-based live place matches
- **Reports** — weekly/monthly charts only when you open Reports
- **Settings** — profile, currency (PKR default, changeable), optional location

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS + shadcn/ui (Base UI)
- Supabase Auth (email/password), Postgres + RLS, private Storage (`bills`)
- Recharts (Reports)
- Gemini API — **server-side only** for bill OCR + NL expenses
- Deploy target: Vercel

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill Supabase URL + anon/publishable key
# Optional: GEMINI_API_KEY (and GEMINI_MODELS) for OCR / NL
# Run SQL migrations (see Database setup below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `.env.local`, the UI still loads with a configuration banner; auth and live data stay disabled until keys are set.

## Environment variables

See `.env.example`. Never commit `.env.local` or real secrets.

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for auth/data) | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Prefer user JWT + RLS |
| `GEMINI_API_KEY` | No | Server-only; without it, manual expenses still work |
| `GEMINI_MODELS` | No | Ordered fallback models (default `gemini-3.8-flash,gemini-3.1-flash-lite`) |
| `GEMINI_MODEL` | No | Legacy single-model override |
| `GOOGLE_MAPS_API_KEY` or `GOOGLE_PLACES_API_KEY` | No (required for live Recommendations) | Server-only; enable Places API (New) + Geocoding |

## Database setup

In Supabase Dashboard → **SQL Editor**, paste migrations **in order** (see `supabase/README.md`):

1. `supabase/migrations/20261116000001_initial_schema.sql`
2. `supabase/migrations/20261116000002_rls_policies.sql`
3. `supabase/migrations/20261116000003_storage_bills.sql`
4. `supabase/migrations/20261116000004_expenses_source_grocery.sql` — allows `source = 'grocery'`

Auth: enable **Email** provider only (no Google / magic link for v1).

## Testing

```bash
npx tsc --noEmit
npm run build
npm run lint
```

Manual smoke:

1. Register / sign in
2. Set budget + add expense (manual and optional NL)
3. Grocery mark purchased → one expense
4. Scan bill → review → confirm → My Bills + expenses
5. Tips → bookmark; Settings → change currency / location
6. Open Reports only from nav (never auto)

## Screenshots

Add product screenshots here when preparing a release or store listing:

- Dashboard overview
- Budget + categories
- Bill scan review
- Reports (opened intentionally)

## Spec & phase docs

- `SPEC.md` — product requirements
- `docs/PHASE-*.md` — phase delivery notes

## License

Private project — not licensed for redistribution yet.
