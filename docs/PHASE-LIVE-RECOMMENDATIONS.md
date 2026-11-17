# HomeWise — Live Smart Recommendations (Google Places)

**Status:** Complete — awaiting user approval  
**Date:** 2026-11-17  
**Branch:** `cursor/live-recommendations-7352` (local commit only — not pushed)  
**Scope:** Replace all sample/mock recommendation data with live Google Places + Geocoding. Zero silent sample fallback.

---

## Migration

**None required.** Save/dismiss still uses existing `saved_recommendations` (+ RLS).

---

## What changed

- **Removed** static sample catalog (`catalog.ts`), keyword mock matcher (`match.ts`), and sample `product-card.tsx`.
- **Added** server-only Places layer: geocode → nearby search / text search → normalize real places.
- **UI sections (live):** Nearby Stores, Best Local Options, Free Home Delivery, Verified Online Stores, Lowest Available Price (+ From your bills, Saved).
- **Location:** device geolocation (preferred) or Settings location geocoded; refresh on revisit + manual Refresh.
- **Cache:** in-memory TTL **5 minutes** only; responses include `lastVerifiedAt` / `cacheExpiresAt`.
- **Failures / missing key:** clear setup or error empty state — **never** fake stores/prices.
- **Delivery:** Places `delivery` boolean → available (cost not verified free) / not offered / unavailable. **Free** home delivery is never assumed; Free Home Delivery section stays empty unless status is explicitly `free` (Places does not confirm free).
- **Prices:** Google Places does not provide verified product unit prices → Lowest Available Price stays honestly empty.
- **External only:** Maps / website links; no cart, checkout, or payments.
- **Bill wiring:** live text search for confirmed bill item names near location (optional, collapsed in My Bills).

---

## Exact user setup (API keys)

1. Google Cloud project → enable:
   - **Places API (New)**
   - **Geocoding API**
2. Create an API key (restrict by IP/HTTP referrer as you prefer; server-side key is fine for this app).
3. Copy `.env.example` → `.env.local` and set:

```env
GOOGLE_MAPS_API_KEY=your_key_here
# or alias:
# GOOGLE_PLACES_API_KEY=your_key_here
```

4. Restart `npm run dev`.
5. Sign in → optionally set **Settings → Location** (city/area) as fallback when device permission is denied.
6. Open **Smart Recommendations** and allow location when prompted.

Without the key: setup message + empty state (no sample data).

---

## SPEC checklist (§§8–9 live upgrade)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Real nearby shops via legitimate API | **Done** | Google Places Nearby Search (New) |
| Real name, address, website, Maps link | **Done** | From Places fields when present |
| Product/price only if verified | **Done** | Never invent; price section empty from Places |
| Delivery availability + free only if confirmed | **Done** | Free never assumed; honest labels |
| Source attribution | **Done** | “Google Places” + attributions |
| External redirect only / no cart | **Done** | |
| Auto refresh on revisit; timestamps; TTL cache | **Done** | 5 min TTL |
| API failure → honest empty, not fake | **Done** | |
| Missing key → setup message, not sample | **Done** | |
| Remove sample catalogs | **Done** | |
| Bill-item optional suggestions | **Done** | Live text search |
| New SQL migration | **Skipped** | Not needed |

**Partial by API limits (honest empty, not fake):**
- Free Home Delivery claims (Places has no “free delivery” flag)
- Lowest Available Price product amounts (Places has no SKU prices)

---

## Files

**Created:** `src/lib/places/*`, `src/app/api/recommendations/live/route.ts`, `src/components/recommendations/place-card.tsx`, `docs/PHASE-LIVE-RECOMMENDATIONS.md`

**Rewritten:** recommendations page/panel/actions/queries, bill suggestions, bills page wiring

**Deleted:** `src/lib/recommendations/catalog.ts`, `match.ts`, `product-card.tsx`

**Updated:** `.env.example`, `README.md`, settings copy, nav description

---

## How to test

```bash
cd "c:\Users\meow\OneDrive\Desktop\Home wise"
# With GOOGLE_MAPS_API_KEY in .env.local
npm run dev
```

1. **No key:** remove/rename key → `/recommendations` shows setup message, empty — no sample shops.
2. **With key + location:** allow device location → Nearby Stores lists real places; badges say Live · Google Places; open Maps / website.
3. **Best Local Options:** rated places sorted by rating.
4. **Free Home Delivery:** empty + explanation (unless ever explicitly free — Places won’t mark free).
5. **Verified Online Stores:** only places with `websiteUri`.
6. **Lowest Available Price:** empty + “not invented” copy.
7. Reload page → refresh runs; timestamp updates (or short-cache note within 5 min).
8. Deny geolocation + set Settings location → geocoded nearby results.
9. Confirm bill with item names → My Bills → open bill → optional live matches (needs location).
10. Save / dismiss a live place; confirm no cart UI anywhere.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass (overlay 0) |
| New SQL | None |
| Secrets in git | None (`.env.example` placeholders only) |

---

## Stop

Awaiting approval before push.
