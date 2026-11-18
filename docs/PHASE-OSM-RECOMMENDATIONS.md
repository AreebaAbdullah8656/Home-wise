# HomeWise — OSM default for Smart Recommendations

**Status:** Complete — awaiting approval  
**Date:** 2026-11-18  
**Branch:** `cursor/osm-recommendations-7352` (local commit only)

---

## Provider selection logic

```text
if GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY is set
  → provider = "google"  (Places Nearby/Text + Google Geocoding)
else
  → provider = "osm"     (Nominatim geocode + Overpass nearby shops)
```

Implemented in `getPlacesProvider()` (`src/lib/places/config.ts`).  
OSM is the **default** and needs **no API key**. Failures return honest empty states — never sample/fake data.

---

## OSM stack (server-only)

| Step | Service | Notes |
|------|---------|--------|
| Geocode Settings city | Nominatim | Identifying `User-Agent`, ~1 req/s rate limit, **24h** geocode cache |
| Device lat/lng | Browser → API | Skips geocode when coords present |
| Nearby shops | Overpass | Categories: supermarket, convenience, hardware, clothes, furniture, electronics/appliance, pharmacy, etc. |
| Map link | openstreetmap.org/`{type}/{id}` | External only |
| Optional Google | Places API (New) | Only when key set |

Shown fields: **name, type, address, OpenStreetMap (or Maps) link**, optional website/phone if tagged.  
No invented prices, deals, or free-delivery claims.

---

## Files changed (high level)

**Added:** `osm-nominatim.ts`, `osm-overpass.ts`, `geocode-google.ts`, `rate-limit.ts`, `docs/PHASE-OSM-RECOMMENDATIONS.md`  
**Updated:** `config.ts`, `types.ts`, `geocode.ts`, `service.ts`, live API route, recommendations UI/actions/queries, bills wiring, `.env.example`, `README.md`

---

## Env

```env
# Optional — switches provider to Google
GOOGLE_MAPS_API_KEY=

# Recommended for Nominatim policy
NOMINATIM_USER_AGENT=HomeWise/1.0 (you@example.com)

# Optional overrides
# NOMINATIM_URL=https://nominatim.openstreetmap.org
# OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

---

## Verify

- `npx tsc --noEmit` — pass  
- `npm run build` — pass (overlay 0)  
- Migration — none  

---

## Test

1. No Google key → Recommendations banner says OpenStreetMap; nearby shops from Overpass after location.
2. Set Settings city or allow geolocation → refresh → real OSM shops (name/type/address/OSM link).
3. Fail Overpass/Nominatim → empty + error message, no samples.
4. Set `GOOGLE_MAPS_API_KEY` → provider switches to Google Places.
