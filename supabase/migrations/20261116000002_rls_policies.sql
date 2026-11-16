-- HomeWise Phase 3 — Row Level Security on every table
-- Paste into Supabase SQL Editor SECOND (after initial_schema).

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;
alter table public.expenses enable row level security;
alter table public.savings_goals enable row level security;
alter table public.emergency_funds enable row level security;
alter table public.grocery_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.saved_recommendations enable row level security;
alter table public.bookmarked_tips enable row level security;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_preferences
create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- categories
create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- monthly_budgets
create policy "monthly_budgets_select_own"
  on public.monthly_budgets for select
  using (auth.uid() = user_id);

create policy "monthly_budgets_insert_own"
  on public.monthly_budgets for insert
  with check (auth.uid() = user_id);

create policy "monthly_budgets_update_own"
  on public.monthly_budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "monthly_budgets_delete_own"
  on public.monthly_budgets for delete
  using (auth.uid() = user_id);

-- bills
create policy "bills_select_own"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "bills_insert_own"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "bills_update_own"
  on public.bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bills_delete_own"
  on public.bills for delete
  using (auth.uid() = user_id);

-- bill_items
create policy "bill_items_select_own"
  on public.bill_items for select
  using (auth.uid() = user_id);

create policy "bill_items_insert_own"
  on public.bill_items for insert
  with check (auth.uid() = user_id);

create policy "bill_items_update_own"
  on public.bill_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bill_items_delete_own"
  on public.bill_items for delete
  using (auth.uid() = user_id);

-- expenses
create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- savings_goals
create policy "savings_goals_select_own"
  on public.savings_goals for select
  using (auth.uid() = user_id);

create policy "savings_goals_insert_own"
  on public.savings_goals for insert
  with check (auth.uid() = user_id);

create policy "savings_goals_update_own"
  on public.savings_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "savings_goals_delete_own"
  on public.savings_goals for delete
  using (auth.uid() = user_id);

-- emergency_funds
create policy "emergency_funds_select_own"
  on public.emergency_funds for select
  using (auth.uid() = user_id);

create policy "emergency_funds_insert_own"
  on public.emergency_funds for insert
  with check (auth.uid() = user_id);

create policy "emergency_funds_update_own"
  on public.emergency_funds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "emergency_funds_delete_own"
  on public.emergency_funds for delete
  using (auth.uid() = user_id);

-- grocery_items
create policy "grocery_items_select_own"
  on public.grocery_items for select
  using (auth.uid() = user_id);

create policy "grocery_items_insert_own"
  on public.grocery_items for insert
  with check (auth.uid() = user_id);

create policy "grocery_items_update_own"
  on public.grocery_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "grocery_items_delete_own"
  on public.grocery_items for delete
  using (auth.uid() = user_id);

-- inventory_items
create policy "inventory_items_select_own"
  on public.inventory_items for select
  using (auth.uid() = user_id);

create policy "inventory_items_insert_own"
  on public.inventory_items for insert
  with check (auth.uid() = user_id);

create policy "inventory_items_update_own"
  on public.inventory_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "inventory_items_delete_own"
  on public.inventory_items for delete
  using (auth.uid() = user_id);

-- saved_recommendations
create policy "saved_recommendations_select_own"
  on public.saved_recommendations for select
  using (auth.uid() = user_id);

create policy "saved_recommendations_insert_own"
  on public.saved_recommendations for insert
  with check (auth.uid() = user_id);

create policy "saved_recommendations_update_own"
  on public.saved_recommendations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_recommendations_delete_own"
  on public.saved_recommendations for delete
  using (auth.uid() = user_id);

-- bookmarked_tips
create policy "bookmarked_tips_select_own"
  on public.bookmarked_tips for select
  using (auth.uid() = user_id);

create policy "bookmarked_tips_insert_own"
  on public.bookmarked_tips for insert
  with check (auth.uid() = user_id);

create policy "bookmarked_tips_update_own"
  on public.bookmarked_tips for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bookmarked_tips_delete_own"
  on public.bookmarked_tips for delete
  using (auth.uid() = user_id);
