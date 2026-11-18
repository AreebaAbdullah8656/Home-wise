# HomeWise

**Your smart household budget and saving companion.**

HomeWise helps households manage budgets, track expenses, organize groceries, store bills privately, follow practical saving tips, and discover nearby stores. It is **not** an e-commerce site or shopping marketplace. Bill upload is always optional. Reports never open automatically.

## Features (built)

- **Dashboard** — live budget overview, recent expenses, category progress, weekly snapshot, saving suggestions
- **My Budget** — flexible monthly envelope, custom categories, savings/emergency set-asides (not expenses)
- **Expenses** — manual entry + natural-language suggestions (Gemini, confirm before save)
- **Scan a Bill / My Bills** — optional OCR, review/confirm, private digital bill wallet
- **Savings & Emergency** — allocated vs actual (never double-counted as expenses)
- **Grocery List** — priorities; mark purchased creates **one** expense (no duplicates)
- **Home Inventory** — stock status, low-stock reminders, add to grocery without duplicates
- **Smart Saving Tips** — curated catalog + optional AI tips from aggregated spend (weekly cache; bookmarks)
- **Smart Recommendations** — Pakistan radius search via OpenStreetMap (Nominatim + Overpass, Nominatim nearby fallback); optional Google Places when a Maps key is set; no sample/fake stores; no cart/checkout
- **Reports** — weekly/monthly charts **only** when you open Reports from nav/quick action
- **Settings** — profile, currency (PKR default, changeable), optional location (+ saved search coords when set from Recommendations)

## Tech stack

- **Next.js 16** (App Router, Cache Components) + **TypeScript** + **Tailwind CSS** + **shadcn/ui** (Base UI)
- **Supabase** — Auth (email/password only), Postgres + **RLS**, private Storage (`bills`)
- **Recharts** — Reports
- **Gemini API** — server-side only (bill OCR, NL expenses, AI saving tips)
- **OpenStreetMap** — Nominatim geocode + Overpass / Nominatim nearby for Recommendations
- Deploy target: **Vercel**

## Install

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm install
cp .env.example .env.local
# Fill required Supabase values (and optional Gemini / Maps / Nominatim contact)
# Run SQL migrations in Supabase (see Database setup)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `.env.local`, the UI still loads with a configuration banner; auth and live data stay disabled until keys are set.

## Environment variables

Copy `.env.example` → `.env.local`. **Never commit `.env.local` or real secrets.**

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for auth/data) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (or use publishable alias below) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Alias if your dashboard labels the key “publishable” |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Prefer user JWT + RLS; never expose to the browser |
| `GEMINI_API_KEY` | No | Server-only; OCR / NL / AI tips disabled without it |
| `GEMINI_MODELS` | No | Ordered fallback models (default `gemini-3.8-flash,gemini-3.1-flash-lite`) |
| `GEMINI_MODEL` | No | Legacy single-model override |
| `GOOGLE_MAPS_API_KEY` | No | Optional; switches Recommendations to Google Places |
| `GOOGLE_PLACES_API_KEY` | No | Alias for the same Maps/Places key |
| `NOMINATIM_CONTACT_EMAIL` | Recommended | Real contact embedded in OSM User-Agent (Nominatim policy) |
| `NOMINATIM_USER_AGENT` / `OVERPASS_USER_AGENT` | No | Full UA override |
| `NOMINATIM_ACCEPT_LANGUAGE` | No | Default `en` |
| `NOMINATIM_URL` / `OVERPASS_API_URL` | No | Endpoint overrides |

## Database setup

In Supabase Dashboard → **SQL Editor**, paste migrations **in order** (also listed in `supabase/README.md`):

1. `supabase/migrations/20261116000001_initial_schema.sql` — tables, triggers, signup seed  
2. `supabase/migrations/20261116000002_rls_policies.sql` — RLS on every table  
3. `supabase/migrations/20261116000003_storage_bills.sql` — private `bills` bucket + per-user storage policies  
4. `supabase/migrations/20261116000004_expenses_source_grocery.sql` — allow expense `source = 'grocery'`  
5. `supabase/migrations/20261118000005_profile_location_coords.sql` — optional `location_lat` / `location_lng` on profiles  
6. `supabase/migrations/20261118000006_ai_saving_tips.sql` — AI tips cache + bookmark snapshot columns  

**Storage:** private bucket `bills`; object paths are `{user_id}/…` so RLS/storage policies keep files per user.

**Auth:** enable **Email** provider only (email/password). Do **not** enable Google or magic link for v1.

## Deploy (Vercel)

1. Push the repo to GitHub.  
2. Import the project in Vercel.  
3. Set the same env vars as `.env.example` (production values).  
4. Ensure Supabase Auth redirect URLs include your Vercel domain.  
5. Deploy. Run any missing SQL migrations in Supabase before first use.

## Testing

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Manual smoke (signed-in):

1. Register / login / logout  
2. Set budget + categories; add manual expense; optional NL expense (confirm before save)  
3. Grocery → mark purchased → one expense  
4. Savings / emergency funds; inventory + add to grocery  
5. Scan bill → review → confirm → My Bills  
6. Open Reports only from nav (never auto)  
7. Tips (curated + AI if Gemini configured); Recommendations (set area); Settings  

Optional Playwright harness (dev server on `:3000`, uses disposable Mailinator signup):

```bash
npx playwright install chromium
node scripts/phase10-smoke.mjs
``` 

## Known limitations

- **OSM coverage** varies by area; Overpass mirrors may time out — the app falls back to Nominatim nearby search.  
- **Free API limits** apply to Nominatim, Overpass, and Gemini.  
- **AI tips / OCR / NL** results must be reviewed by the user before relying on them.  
- Currency display is saved on the profile (PKR default); most amount formatting still defaults to PKR helpers unless threaded per currency.  
- Preference panels for notifications/privacy are partial (Settings notes only).

## Screenshots

Placeholder paths for release/store listing (add real captures later):

- ![Dashboard](docs/screenshots/dashboard.png)
- ![Expenses](docs/screenshots/expenses.png)
- ![Reports](docs/screenshots/reports.png)
- ![Bills](docs/screenshots/bills.png)

See `docs/screenshots/README.md`.

## Spec & docs

- `SPEC.md` — product requirements (+ Phase 10 checklist appendix)  
- `docs/SPEC-checklist.md` — done / partial / skipped matrix  
- `docs/PHASE-*.md` — phase delivery notes  

## License

Private project — not licensed for redistribution yet.
