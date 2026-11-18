# HomeWise SPEC checklist (Phase 10)

Status key: **done** · **partial** · **skipped**

Synced with product intent in root `SPEC.md` (2026-11-18).

| SPEC area | Status | Notes |
|-----------|--------|--------|
| §1 Product identity (household budget, not e-commerce) | **done** | Enforced in copy + Recommendations (no cart/checkout) |
| §2 UI/UX (responsive, sage/cream theme, sidebar + mobile nav) | **done** | Layout + theme shipped; polish ongoing |
| §3 Dashboard overview / quick actions / recent / progress / tips / weekly | **done** | Live data when signed in; tips link to `/tips` |
| §4 Flexible budget + default categories + custom categories | **done** | Alerts are soft (near-limit UI), not push notifications |
| §4 Budget alerts | **partial** | Soft UI near-limit; no email/push notification system |
| §5 Manual expense entry | **done** | |
| §5 NL expense entry (Gemini, confirm before save) | **done** | Requires `GEMINI_API_KEY` |
| §5 Bill upload never compulsory | **done** | |
| §6 Bill scan OCR + review/correct + My Bills wallet | **done** | Private `bills` storage + RLS |
| §7 Savings & emergency (allocated vs actual, no double-count) | **done** | |
| §8 Grocery list + mark purchased → expense once | **done** | Duplicate guard via `expense_id` + same-day match |
| §8 Home inventory + add to grocery | **done** | |
| §9 Reports weekly/monthly; never auto-open | **done** | Opened only via nav / quick action |
| §10 Smart Saving Tips catalog + bookmarks | **done** | |
| §10 AI personalized tips | **done** | Aggregates only; weekly cache; refresh limit; curated fallback |
| §11 Smart Recommendations / affordable alternatives | **partial** | Live nearby OSM (+ optional Google); Online Stores = search links only (no prices/deals claims) |
| §12 Tips categories (grocery…shopping) | **done** | |
| §13 Reports never auto-open | **done** | |
| §14 Security / RLS / private bills | **done** | Policies own-row + storage folder = `auth.uid()` |
| §15 Auth email/password only | **done** | No Google / magic link |
| §16 Navigation completeness | **done** | All primary routes in sidebar |
| §17 Settings profile / currency PKR / optional location | **done** | |
| §17 Notification / privacy preference panels | **partial** | Placeholder copy only |
| §17 Currency used everywhere in UI | **partial** | Saved on profile; many formatters still default PKR |
| §18 Testing & quality | **partial** | tsc/lint/build green; manual smoke documented; no automated E2E suite |
| §19 README / .env.example / .gitignore / no secrets | **done** | Phase 10 polish |
| §20 Phased delivery | **done** | Phases 1–10 delivered via incremental branches |

## Explicitly skipped / out of scope for v1

| Item | Status | Notes |
|------|--------|--------|
| E-commerce / cart / checkout | **skipped** | By product rule |
| Social login / magic link | **skipped** | Preferences: email/password only |
| Invented product prices / free-delivery claims | **skipped** | Honest empty / unavailable states |
| Push/email notification service | **skipped** | Soft in-app cues only |
| Full multi-currency display threading | **partial** | See §17 |
