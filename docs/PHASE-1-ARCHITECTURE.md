# HomeWise — Phase 1 Architecture Report

**Status:** Phase 1 complete — awaiting user approval before Phase 2  
**Date:** 2026-11-16  
**Stack target:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Recharts + Gemini (server-only) + Vercel

---

## 1. Workspace inspection

### Paths checked

| Path | Result |
|------|--------|
| `c:\Users\meow\OneDrive\Desktop\Home wise\` (project root) | Exists; **not** a git repository |
| `c:\Users\meow\OneDrive\Desktop\Home wise\SPEC.md` | **Not found** at root |
| `c:\Users\meow\OneDrive\Desktop\Home wise\SPEC. md\` | Oddly named folder (space before `md`) |
| `c:\Users\meow\OneDrive\Desktop\Home wise\SPEC. md\read me.txt` | Contains full HomeWise SPEC text (~14 KB) |
| `package.json` / `node_modules` / Next.js app | **Absent** — greenfield workspace |
| Project store `docs/SPEC.md` | **Found** — canonical SPEC used for this plan |

### What exists now

- **No application code.** No `package.json`, no `src/`/`app/`, no TypeScript config, no Tailwind setup.
- **No git repo** initialized in the workspace.
- **Only content:** a misnamed folder `SPEC. md` holding `read me.txt` (SPEC copy). Treat this as reference text only; do not overwrite without checking.
- **SPEC source of truth for planning:** Project store copy at  
  `C:\Users\meow\AppData\Local\Cursor\AgentStores\cursor_agent_stores\bc-f3da1a2b-3db8-464c-bb79-6bff0fc1ac0b\files\docs\SPEC.md`  
  (content matches the local `read me.txt`).

### Verification (tsc / build)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **N/A** — no TypeScript project yet |
| `npm run build` | **N/A** — no Next.js app yet |

Scaffolding is deferred to **Phase 2** (per SPEC §20 and Phase 1 stop rule).

---

## 2. Development plan (Phases 1–10 per SPEC §20)

| Phase | Deliverable | Notes |
|-------|-------------|--------|
| **1 — Architecture** *(this phase)* | Workspace inspection, plan, folder structure, dependency list, env/setup preview | Stop for approval; no app scaffold |
| **2 — Layout & shell** | Next.js + TS + Tailwind + shadcn/ui scaffold; sage/beige/cream theme; sidebar + mobile nav; Dashboard UI shell with empty states; all nav routes as real pages (no dead buttons) | Auth can be stubbed with protected-route placeholders until Phase 3 |
| **3 — Auth & database** | Supabase Auth (register/login/logout/profile); Postgres schema + RLS on every table; SQL migrations; Storage bucket policies for bills; `.env.example` | Secrets never committed |
| **4 — Budget & expenses** | Monthly budget, custom categories, category limits, savings/emergency allocation (balances); manual expense CRUD; natural-language expense parse via server Gemini route with **user confirm before save**; search/filter; duplicate prevention; bill upload never required | Aligns with SPEC §§4–5 |
| **5 — Bill scanner & wallet** | Upload image/PDF + camera; OCR + AI extract via server routes; review/correct/confirm workflow; confirmed bills → Storage + expense rows; My Bills list/search/filter/download/delete | Unconfirmed OCR never saved as final expenses |
| **6 — Savings & emergency** | Dedicated Savings & Emergency UX; distinguish allocated vs actual savings vs expenses (no double-counting); goals and fund tracking | Complements Phase 4 allocations |
| **7 — Grocery & inventory** | Grocery list CRUD, priorities, purchased flag, estimated/actual totals, convert purchased → expense without duplicates; Home Inventory by category, low-stock → grocery | SPEC §§10–11 |
| **8 — Alternatives & discovery** | Affordable alternatives from confirmed bill items; Smart Recommendations discovery sections; clearly labeled **sample data** if no real APIs; never invent prices; no cart/checkout | SPEC §§8–9 |
| **9 — Reports & tips** | Reports tab only (never auto-open); weekly/monthly charts (Recharts); date range; Smart Saving Tips + bookmarks; optional dashboard snapshot only | SPEC §§12–13 |
| **10 — QA & GitHub** | Full feature/security/responsive testing; `tsc` + production build; README, `.gitignore`, screenshots section; fix bugs; no placeholder pages | SPEC §§18–19 |

**Cross-cutting rules (every phase):** no secrets in git; reports never auto-open; bill upload optional; OCR/AI confirmed by user; no invented prices; no dead buttons; check before overwriting files.

---

## 3. Proposed folder structure (Next.js App Router)

App will live at the project root (not inside `SPEC. md`). Proposed tree:

```text
homewise/   (or current "Home wise" root after scaffold)
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                 # shadcn/ui
├── postcss.config.mjs
├── docs/
│   ├── PHASE-1-ARCHITECTURE.md     # this report
│   └── SPEC.md                     # optional: clean copy of SPEC at root docs
├── public/
│   └── images/                     # branding, empty-state art
├── supabase/
│   ├── migrations/                 # SQL: tables + RLS + storage policies
│   └── seed.sql                    # optional sample/demo data (clearly labeled)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # landing or redirect to dashboard
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/                  # authenticated shell
│   │   │   ├── layout.tsx          # sidebar + mobile nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── budget/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   ├── scan-bill/page.tsx
│   │   │   ├── bills/page.tsx
│   │   │   ├── savings/page.tsx
│   │   │   ├── grocery/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── tips/page.tsx
│   │   │   ├── recommendations/page.tsx
│   │   │   ├── reports/page.tsx    # loads only when visited
│   │   │   └── settings/page.tsx
│   │   └── api/                    # server-only; Gemini never client-side
│   │       ├── expenses/
│   │       │   └── parse/route.ts  # NL expense → suggestions
│   │       ├── bills/
│   │       │   ├── ocr/route.ts
│   │       │   └── categorize/route.ts
│   │       └── recommendations/
│   │           └── alternatives/route.ts
│   ├── components/
│   │   ├── ui/                     # shadcn primitives
│   │   ├── layout/                 # Sidebar, MobileNav, AppShell, Header
│   │   ├── dashboard/
│   │   ├── budget/
│   │   ├── expenses/
│   │   ├── bills/
│   │   ├── grocery/
│   │   ├── inventory/
│   │   ├── recommendations/
│   │   ├── reports/
│   │   └── shared/                 # EmptyState, ConfirmDialog, CurrencyDisplay
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # browser client
│   │   │   ├── server.ts           # server/RSC client
│   │   │   └── middleware.ts
│   │   ├── gemini.ts               # server-only Gemini helper
│   │   ├── currency.ts             # PKR default + formatting
│   │   ├── budget-math.ts          # allocated vs actual; no double-count
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts             # generated or hand-maintained DB types
│   ├── hooks/
│   └── middleware.ts               # auth session refresh / route protection
└── tests/                          # Phase 10+; optional earlier smoke tests
```

**Navigation map (SPEC §16)** → routes above: Dashboard, My Budget, Expenses, Scan a Bill, My Bills, Savings & Emergency, Grocery List, Home Inventory, Smart Saving Tips, Smart Recommendations, Reports, Settings.

---

## 4. Full dependency list

Versions pinned at scaffold time (Phase 2); purposes listed here.

### Runtime

| Package | Purpose |
|---------|---------|
| `next` | App Router framework, API routes, Vercel deploy target |
| `react` / `react-dom` | UI |
| `typescript` | Typed codebase (also listed under tooling) |
| `tailwindcss` + `@tailwindcss/postcss` (or v3 stack as scaffolded) | Styling per design system |
| `class-variance-authority` | shadcn variant API |
| `clsx` / `tailwind-merge` | Class composition (`cn()`) |
| `lucide-react` | Icons for nav and actions |
| `@radix-ui/react-*` | shadcn/ui primitives (dialog, dropdown, tabs, etc. as added) |
| `@supabase/supabase-js` | Auth, Postgres, Storage client |
| `@supabase/ssr` | Cookie-based auth for Next.js App Router |
| `recharts` | Weekly/monthly report charts |
| `@google/generative-ai` | Gemini API — **imported only in server routes / `lib/gemini.ts`** |
| `zod` | Request/form validation |
| `date-fns` | Date parsing/formatting for expenses & reports |
| `react-hook-form` + `@hookform/resolvers` | Accessible forms (expenses, budget, settings) |
| `sonner` (or shadcn toast) | Subtle alerts (budget near-limit), not pop-up spam |

Optional later (Phase 5+): PDF parsing helper if needed for receipt PDFs (e.g. `pdf-parse` or client-side PDF→image); decide after OCR approach is chosen. Prefer server-side processing.

### Dev / tooling

| Package | Purpose |
|---------|---------|
| `typescript` | Typecheck |
| `@types/node` / `@types/react` / `@types/react-dom` | Types |
| `eslint` + `eslint-config-next` | Lint |
| `prettier` (+ optional `prettier-plugin-tailwindcss`) | Format |
| `tailwindcss` / `postcss` / `autoprefixer` | CSS pipeline (as required by chosen Tailwind major) |
| `supabase` CLI (devDependency or global) | Local migrations & type gen |

**Not** installed as client-side SDKs for secrets: Gemini key stays server-only (`GEMINI_API_KEY`).

### Expected `.env.example` keys (create in Phase 2/3; no real secrets)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only if ever needed; prefer RLS + user JWT
GEMINI_API_KEY=              # server-only
```

---

## 5. External setup (later) — not required for Phase 1

| Service | When needed | Phase 1? |
|---------|-------------|----------|
| **Supabase** project (Auth, Postgres, Storage) | Phase 3+ | **Not needed now** |
| **Gemini API** key | Phases 4–5, 8 (server routes) | **Not needed now** |
| **Vercel** project + env vars | Deploy / Phase 10 | **Not needed now** |
| Product/offers APIs (if any) | Phase 8; else labeled sample data | **Not needed now** |
| Node.js 20+ LTS + npm | Phase 2 scaffold onward | Install locally when starting Phase 2 |

Phase 1 only produces planning docs; no accounts or keys required to approve this phase.

---

## 6. How to run later (preview — not runnable yet)

After Phase 2 scaffold:

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
npm install
cp .env.example .env.local   # fill after Supabase/Gemini exist
npm run dev                  # http://localhost:3000
```

Quality gates (Phase 2 onward, required by SPEC §18):

```bash
npx tsc --noEmit
npm run build
npm run lint
```

Phase 3+: apply Supabase migrations (`supabase db push` or SQL in dashboard) before auth/data features work.

**Phase 1 itself:** no install/build required; this document is the deliverable.

---

## 7. SPEC.md checklist — Phase 1 only

Legend: **Done** = covered by this architecture phase · **Partial** = planned/documented only · **Skipped** = deferred by design

| SPEC area | Status | Notes |
|-----------|--------|-------|
| §20 Phase 1: inspect workspace, plan, folder structure, dependencies | **Done** | This report |
| §1 Product vision / non–e-commerce framing | **Partial** | Reflected in plan; no UI yet |
| §2 UI/UX design system | **Partial** | Theme/tokens planned for Phase 2 |
| §3 Main dashboard | **Skipped** | Phase 2 |
| §4 Flexible budget | **Skipped** | Phase 4 (+6) |
| §5 Daily expenses (manual + NL + history) | **Skipped** | Phase 4 |
| §6 Smart bill scanner | **Skipped** | Phase 5 |
| §7 Digital bill wallet | **Skipped** | Phase 5 |
| §8 Affordable alternatives | **Skipped** | Phase 8 |
| §9 Smart shopping discovery | **Skipped** | Phase 8 |
| §10 Grocery list | **Skipped** | Phase 7 |
| §11 Household inventory | **Skipped** | Phase 7 |
| §12 Smart saving tips | **Skipped** | Phase 9 |
| §13 Reports (never auto-open) | **Partial** | Rule captured in plan; UI Phase 9 |
| §14 Additional features (recurring, meal plan, etc.) | **Skipped** | After core phases / late |
| §15 Auth + DB + RLS | **Partial** | Schema folders planned; implement Phase 3 |
| §16 Navigation IA | **Partial** | Routes mapped; build Phase 2 |
| §17 Settings (PKR default) | **Skipped** | Phase 2 shell + Phase 3/4 prefs |
| §18 Testing / tsc / build | **Skipped** | N/A until scaffold; Phase 10 full QA |
| §19 GitHub docs / `.env.example` / `.gitignore` | **Skipped** | Phase 2 start + Phase 10 polish |
| Cross-cutting: no secrets; confirm OCR/AI; optional bills; no invented prices; no dead buttons; don’t overwrite blindly | **Partial** | Encoded in plan & rules |

**Phase 1 covers (explicitly):** SPEC §20 “FIRST TASK” / Phase 1 only — inspect, explain plan, propose structure, identify dependencies. Stop for approval.

---

## 8. Created / modified files this phase

### Created

| File | Role |
|------|------|
| `c:\Users\meow\OneDrive\Desktop\Home wise\docs\PHASE-1-ARCHITECTURE.md` | Local Phase 1 report |
| `C:\Users\meow\AppData\Local\Cursor\AgentStores\cursor_agent_stores\bc-f3da1a2b-3db8-464c-bb79-6bff0fc1ac0b\files\docs\phase-1-architecture.md` | Project store copy |

### Modified

- None (SPEC.md / `SPEC. md\read me.txt` left untouched).

### Not created (intentionally)

- No `package.json`, Next.js scaffold, components, or env files with secrets.

---

## Questions for user before Phase 2

1. **Project root:** Scaffold the Next.js app **in place** at `Home wise`, or rename/create a cleaner folder (e.g. `homewise`) first?
2. **SPEC file:** May we add a clean `docs/SPEC.md` (or root `SPEC.md`) copied from the store / `read me.txt`, and leave the misnamed `SPEC. md` folder alone?
3. **Git:** Initialize git + GitHub remote in Phase 2, or wait until Phase 10?
4. **Auth provider:** Email/password only for v1, or also Google/magic link via Supabase?
5. **OCR approach preference:** Gemini multimodal for bill images/PDFs first, or a dedicated OCR service later?
6. **Approve Phase 2?** Proceed to scaffold + layout/theme/dashboard shell after your go-ahead.

---

*End of Phase 1. Do not start Phase 2 until the user approves.*
