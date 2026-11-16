-- HomeWise Phase 3 — private bills storage bucket + per-user policies
-- Paste into Supabase SQL Editor THIRD (after schema and RLS).
-- Object path convention: {user_id}/{bill_id}/{filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bills',
  'bills',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop prior policies if re-running this migration in the SQL editor
drop policy if exists "bills_storage_select_own" on storage.objects;
drop policy if exists "bills_storage_insert_own" on storage.objects;
drop policy if exists "bills_storage_update_own" on storage.objects;
drop policy if exists "bills_storage_delete_own" on storage.objects;

create policy "bills_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "bills_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "bills_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "bills_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
