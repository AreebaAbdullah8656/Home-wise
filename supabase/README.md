# Supabase setup

## SQL Editor paste order

In the Supabase Dashboard → **SQL Editor**, run these files **in order**:

1. `migrations/20261116000001_initial_schema.sql` — tables, triggers, signup seed
2. `migrations/20261116000002_rls_policies.sql` — RLS on every table
3. `migrations/20261116000003_storage_bills.sql` — private `bills` bucket + per-user policies
4. `migrations/20261116000004_expenses_source_grocery.sql` — allow expense `source = 'grocery'`
5. `migrations/20261118000005_profile_location_coords.sql` — optional lat/lng on profiles (Recommendations)
6. `migrations/20261118000006_ai_saving_tips.sql` — AI saving tips cache + bookmark snapshots

## Auth settings

- Enable **Email** provider (email/password).
- Do **not** enable Google or magic link for v1.
- Optional: disable “Confirm email” for local testing (Authentication → Providers → Email).

## App env

Copy `.env.example` → `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable alias)

Optional Gemini (server-only):

- `GEMINI_API_KEY`
- `GEMINI_MODELS` (preferred) or legacy `GEMINI_MODEL`

Restart `npm run dev` after saving.
