-- Persist confirmed search center (lat/lng) for Smart Recommendations.
-- Paste after prior migrations if applying via Supabase SQL Editor.

alter table public.profiles
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

comment on column public.profiles.location_lat is
  'Confirmed search latitude (Pakistan). Optional; used before browser geolocation.';
comment on column public.profiles.location_lng is
  'Confirmed search longitude (Pakistan). Optional; used before browser geolocation.';
