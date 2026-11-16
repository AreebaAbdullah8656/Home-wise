-- Allow grocery-originated expenses (mark purchased → expense).
-- Root cause of Postgres 23514 when inserting source = 'grocery'.
-- Previous check: ('manual', 'natural_language', 'bill') only.

alter table public.expenses
  drop constraint if exists expenses_source_check;

alter table public.expenses
  add constraint expenses_source_check
  check (source in ('manual', 'natural_language', 'bill', 'grocery'));
