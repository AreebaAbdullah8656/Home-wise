-- HomeWise Phase 3 — initial Postgres schema
-- Paste into Supabase SQL Editor FIRST (before RLS and storage migrations).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'PKR',
  location text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile linked to auth.users';

-- ---------------------------------------------------------------------------
-- User preferences
-- ---------------------------------------------------------------------------
create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  budget_alerts_enabled boolean not null default true,
  notification_preferences jsonb not null default '{}'::jsonb,
  privacy_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories (defaults seeded per user on signup)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  spending_limit numeric(14, 2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- Monthly budgets
-- ---------------------------------------------------------------------------
create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year_month date not null,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  savings_allocation numeric(14, 2) not null default 0 check (savings_allocation >= 0),
  emergency_allocation numeric(14, 2) not null default 0 check (emergency_allocation >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year_month)
);

create index monthly_budgets_user_id_idx on public.monthly_budgets (user_id);

-- ---------------------------------------------------------------------------
-- Bills (confirmed uploads; storage path under private bills bucket)
-- ---------------------------------------------------------------------------
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  store_name text,
  purchase_date date,
  total_amount numeric(14, 2),
  storage_path text,
  mime_type text,
  status text not null default 'draft'
    check (status in ('draft', 'confirmed', 'discarded')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bills_user_id_idx on public.bills (user_id);
create index bills_purchase_date_idx on public.bills (user_id, purchase_date desc);

-- ---------------------------------------------------------------------------
-- Bill line items (OCR suggestions; not final until bill confirmed)
-- ---------------------------------------------------------------------------
create table public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_name text not null,
  quantity numeric(14, 3) default 1,
  unit_price numeric(14, 2),
  line_total numeric(14, 2),
  category_suggestion text,
  category_id uuid references public.categories (id) on delete set null,
  is_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bill_items_bill_id_idx on public.bill_items (bill_id);
create index bill_items_user_id_idx on public.bill_items (user_id);

-- ---------------------------------------------------------------------------
-- Expenses (manual, NL-confirmed, or bill-confirmed)
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_date date not null default (current_date),
  payment_method text,
  notes text,
  source text not null default 'manual'
    check (source in ('manual', 'natural_language', 'bill', 'grocery')),
  bill_id uuid references public.bills (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_id_idx on public.expenses (user_id);
create index expenses_date_idx on public.expenses (user_id, expense_date desc);
create index expenses_category_id_idx on public.expenses (category_id);

-- ---------------------------------------------------------------------------
-- Savings goals (allocated vs actual tracked separately)
-- ---------------------------------------------------------------------------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null default 0 check (target_amount >= 0),
  allocated_amount numeric(14, 2) not null default 0 check (allocated_amount >= 0),
  actual_amount numeric(14, 2) not null default 0 check (actual_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index savings_goals_user_id_idx on public.savings_goals (user_id);

-- ---------------------------------------------------------------------------
-- Emergency funds
-- ---------------------------------------------------------------------------
create table public.emergency_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Emergency fund',
  target_amount numeric(14, 2) not null default 0 check (target_amount >= 0),
  allocated_amount numeric(14, 2) not null default 0 check (allocated_amount >= 0),
  actual_amount numeric(14, 2) not null default 0 check (actual_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emergency_funds_user_id_idx on public.emergency_funds (user_id);

-- ---------------------------------------------------------------------------
-- Grocery items
-- ---------------------------------------------------------------------------
create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  quantity text,
  estimated_price numeric(14, 2),
  actual_price numeric(14, 2),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  is_purchased boolean not null default false,
  expense_id uuid references public.expenses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grocery_items_user_id_idx on public.grocery_items (user_id);

-- ---------------------------------------------------------------------------
-- Household inventory
-- ---------------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null default 'Other essentials'
    check (category in (
      'Kitchen',
      'Cleaning',
      'Bathroom',
      'Laundry',
      'Appliances',
      'Furniture',
      'Home maintenance',
      'Other essentials'
    )),
  quantity numeric(14, 3) not null default 1,
  purchase_date date,
  price numeric(14, 2),
  notes text,
  stock_status text not null default 'ok'
    check (stock_status in ('ok', 'low', 'out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_user_id_idx on public.inventory_items (user_id);

-- ---------------------------------------------------------------------------
-- Saved product recommendations (Phase 8 data foundation)
-- ---------------------------------------------------------------------------
create table public.saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  is_sample boolean not null default false,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_recommendations_user_id_idx on public.saved_recommendations (user_id);

-- ---------------------------------------------------------------------------
-- Bookmarked saving tips (Phase 9 data foundation)
-- ---------------------------------------------------------------------------
create table public.bookmarked_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tip_key text not null,
  tip_title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, tip_key)
);

create index bookmarked_tips_user_id_idx on public.bookmarked_tips (user_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger monthly_budgets_set_updated_at
  before update on public.monthly_budgets
  for each row execute function public.set_updated_at();

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

create trigger bill_items_set_updated_at
  before update on public.bill_items
  for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger savings_goals_set_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

create trigger emergency_funds_set_updated_at
  before update on public.emergency_funds
  for each row execute function public.set_updated_at();

create trigger grocery_items_set_updated_at
  before update on public.grocery_items
  for each row execute function public.set_updated_at();

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create trigger saved_recommendations_set_updated_at
  before update on public.saved_recommendations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signup: create profile, preferences, default categories
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_names text[] := array[
    'Groceries',
    'Household expenses',
    'Electricity and utilities',
    'Clothing',
    'Transportation',
    'Healthcare',
    'Personal care',
    'Home maintenance',
    'Savings',
    'Emergency fund',
    'Extras',
    'Unexpected expenses'
  ];
  i integer;
begin
  insert into public.profiles (id, display_name, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'PKR'
  );

  insert into public.user_preferences (user_id)
  values (new.id);

  for i in 1 .. array_length(default_names, 1) loop
    insert into public.categories (user_id, name, is_default, sort_order)
    values (new.id, default_names[i], true, i);
  end loop;

  insert into public.emergency_funds (user_id, name)
  values (new.id, 'Emergency fund');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
