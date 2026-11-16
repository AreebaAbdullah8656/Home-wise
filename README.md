# HomeWise

Your smart household budget and saving companion.

HomeWise helps households manage budgets, track expenses, organize groceries, store bills, and discover affordable alternatives. It is **not** an e-commerce site.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage) — Phase 3
- Recharts — Phase 9
- Gemini API (server-side only) — Phase 4+
- Deploy target: Vercel

## Current status

**Phase 3 complete:** email/password auth, Postgres schema with RLS, private `bills` storage bucket, Next.js Supabase clients and route protection.

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Run SQL migrations in supabase/migrations (see supabase/README.md)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `.env.local`, the UI still loads with a configuration banner; auth stays disabled until keys are set.

Quality checks:

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## Environment

See `.env.example`. Never commit `.env.local` or real secrets.

## Spec

See `SPEC.md` and `docs/PHASE-*.md` for phased delivery notes.

## License

Private project — not licensed for redistribution yet.
