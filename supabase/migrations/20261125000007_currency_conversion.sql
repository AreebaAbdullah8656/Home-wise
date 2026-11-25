-- HomeWise — currency conversion support
-- Run this file ONLY in the Supabase SQL Editor (do not re-run earlier migrations).
-- Filename: 20261125000007_currency_conversion.sql
-- Safe for existing data: backfills amount_currency from profiles.currency; no deletes.

-- ---------------------------------------------------------------------------
-- Profiles: amount_currency = currency stored amounts are denominated in.
-- profiles.currency = active display currency (convert at display by default).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists amount_currency text;

update public.profiles
set amount_currency = upper(coalesce(nullif(trim(currency), ''), 'PKR'))
where amount_currency is null;

alter table public.profiles
  alter column amount_currency set default 'PKR';

alter table public.profiles
  alter column amount_currency set not null;

comment on column public.profiles.currency is
  'Active display currency. Changing this converts amounts at display using live FX; does not rewrite stored numbers.';
comment on column public.profiles.amount_currency is
  'Currency that stored money columns are denominated in. Updated only on permanent convert / reverse.';

-- ---------------------------------------------------------------------------
-- Shared FX cache (authenticated users may refresh; ≥12h TTL enforced in app)
-- Rate meaning: 1 base_currency = rate quote_currency
-- ---------------------------------------------------------------------------
create table if not exists public.fx_rates (
  base_currency text not null,
  quote_currency text not null,
  rate numeric(18, 8) not null check (rate > 0),
  provider text not null default 'open.er-api.com',
  fetched_at timestamptz not null default now(),
  primary key (base_currency, quote_currency)
);

comment on table public.fx_rates is
  'Cached live FX rates. App refreshes when older than 12 hours. Never invent rates.';

alter table public.fx_rates enable row level security;

drop policy if exists "fx_rates_select_authenticated" on public.fx_rates;
create policy "fx_rates_select_authenticated"
  on public.fx_rates for select
  to authenticated
  using (true);

drop policy if exists "fx_rates_insert_authenticated" on public.fx_rates;
create policy "fx_rates_insert_authenticated"
  on public.fx_rates for insert
  to authenticated
  with check (true);

drop policy if exists "fx_rates_update_authenticated" on public.fx_rates;
create policy "fx_rates_update_authenticated"
  on public.fx_rates for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Permanent convert events — snapshot for reversible PKR↔USD without compounding
-- ---------------------------------------------------------------------------
create table if not exists public.currency_conversion_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_currency text not null,
  to_currency text not null,
  rate numeric(18, 8) not null check (rate > 0),
  provider text,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index if not exists currency_conversion_events_user_id_idx
  on public.currency_conversion_events (user_id, created_at desc);

comment on table public.currency_conversion_events is
  'Audit + undo for permanent currency converts. Reverse restores exact snapshot amounts.';

alter table public.currency_conversion_events enable row level security;

drop policy if exists "currency_conversion_events_select_own"
  on public.currency_conversion_events;
create policy "currency_conversion_events_select_own"
  on public.currency_conversion_events for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "currency_conversion_events_insert_own"
  on public.currency_conversion_events;
create policy "currency_conversion_events_insert_own"
  on public.currency_conversion_events for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "currency_conversion_events_update_own"
  on public.currency_conversion_events;
create policy "currency_conversion_events_update_own"
  on public.currency_conversion_events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
