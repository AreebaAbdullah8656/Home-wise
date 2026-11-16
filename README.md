# HomeWise

Your smart household budget and saving companion.

HomeWise helps households manage budgets, track expenses, organize groceries, store bills, and discover affordable alternatives. It is **not** an e-commerce site.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage) — Phase 3+
- Recharts — Phase 9
- Gemini API (server-side only) — Phase 4+
- Deploy target: Vercel

## Current status

**Phase 2 complete:** layout, theme, navigation, and dashboard shell with labeled sample / empty states.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/dashboard`).

Quality checks:

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## Environment

See `.env.example`. Supabase and Gemini keys are **not** required for Phase 2.

## Spec

See `SPEC.md` and `docs/PHASE-*.md` for phased delivery notes.

## License

Private project — not licensed for redistribution yet.
