# Supabase setup (Phase 3)

## SQL Editor paste order

In the Supabase Dashboard → **SQL Editor**, run these files **in order**:

1. `migrations/20261116000001_initial_schema.sql` — tables, triggers, signup seed
2. `migrations/20261116000002_rls_policies.sql` — RLS on every table
3. `migrations/20261116000003_storage_bills.sql` — private `bills` bucket + per-user policies

## Auth settings

- Enable **Email** provider (email/password).
- Do **not** enable Google or magic link for v1.
- Optional: disable “Confirm email” for local testing (Authentication → Providers → Email).

## App env

Copy `.env.example` → `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Restart `npm run dev` after saving.
