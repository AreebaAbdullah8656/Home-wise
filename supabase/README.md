# Supabase setup

## SQL Editor paste order

In the Supabase Dashboard → **SQL Editor**, run these files **in order**:

1. `migrations/20261116000001_initial_schema.sql` — tables, triggers, signup seed
2. `migrations/20261116000002_rls_policies.sql` — RLS on every table
3. `migrations/20261116000003_storage_bills.sql` — private `bills` bucket + per-user policies
4. `migrations/20261116000004_expenses_source_grocery.sql` — allow expense `source = 'grocery'`
5. `migrations/20261118000005_profile_location_coords.sql` — optional lat/lng on profiles (Recommendations)
6. `migrations/20261118000006_ai_saving_tips.sql` — AI saving tips cache + bookmark snapshots
7. `migrations/20261125000007_currency_conversion.sql` — amount_currency, fx_rates cache, conversion undo

## Auth settings

- Enable **Email** provider (email/password).
- Do **not** enable Google or magic link for v1.
- **Confirm email: ON** (required). Site URL + Redirect URLs must include local and production `/auth/callback` — see `docs/phase-email-verification.md` in the project store.

## App env

Copy `.env.example` → `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable alias)
- `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` locally)

Optional Gemini (server-only):

- `GEMINI_API_KEY`
- `GEMINI_MODELS` (preferred) or legacy `GEMINI_MODEL`

Restart `npm run dev` after saving.
