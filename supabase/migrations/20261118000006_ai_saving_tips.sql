-- HomeWise — AI Smart Saving Tips cache (+ bookmark snapshot columns)
-- Paste into Supabase SQL Editor AFTER relying on personalized tips.
-- Safe to re-run (IF NOT EXISTS / additive columns).

-- ---------------------------------------------------------------------------
-- Cached Gemini tips (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_saving_tips_cache (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tips jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  model text,
  refresh_count integer not null default 0,
  refresh_window_start date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_saving_tips_cache is
  'Cached AI-generated saving tips. Regenerated weekly or via limited manual refresh.';

create index if not exists ai_saving_tips_cache_generated_at_idx
  on public.ai_saving_tips_cache (generated_at);

alter table public.ai_saving_tips_cache enable row level security;

drop policy if exists "ai_saving_tips_cache_select_own" on public.ai_saving_tips_cache;
create policy "ai_saving_tips_cache_select_own"
  on public.ai_saving_tips_cache for select
  using (auth.uid() = user_id);

drop policy if exists "ai_saving_tips_cache_insert_own" on public.ai_saving_tips_cache;
create policy "ai_saving_tips_cache_insert_own"
  on public.ai_saving_tips_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_saving_tips_cache_update_own" on public.ai_saving_tips_cache;
create policy "ai_saving_tips_cache_update_own"
  on public.ai_saving_tips_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_saving_tips_cache_delete_own" on public.ai_saving_tips_cache;
create policy "ai_saving_tips_cache_delete_own"
  on public.ai_saving_tips_cache for delete
  using (auth.uid() = user_id);

drop trigger if exists ai_saving_tips_cache_set_updated_at on public.ai_saving_tips_cache;
create trigger ai_saving_tips_cache_set_updated_at
  before update on public.ai_saving_tips_cache
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Snapshot fields so AI tip bookmarks survive regeneration
-- ---------------------------------------------------------------------------
alter table public.bookmarked_tips
  add column if not exists tip_body text,
  add column if not exists tip_category text;
