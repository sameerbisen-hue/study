-- ============================================================
-- Verify Storage Setup (Handles existing policies)
-- Run this in Supabase SQL Editor to check current state
-- ============================================================

-- Check if materials bucket exists
select 'Bucket Check' as check_type, 
       case 
         when exists(select 1 from storage.buckets where name = 'materials') 
         then '✅ Materials bucket exists' 
         else '❌ Materials bucket missing' 
       end as status;

-- Create bucket if it doesn't exist (won't error if it exists)
insert into storage.buckets (id, name, public) 
values ('materials', 'materials', true) 
on conflict do nothing;

-- Drop existing policies to recreate them (handles "already exists" error)
drop policy if exists "storage: authenticated upload" on storage.objects;
drop policy if exists "storage: owner update" on storage.objects;
drop policy if exists "storage: owner delete" on storage.objects;
drop policy if exists "storage: public read" on storage.objects;

-- Recreate storage policies
create policy "storage: authenticated upload"
  on storage.objects for insert with check (
    bucket_id = 'materials' and auth.role() = 'authenticated'
  );

create policy "storage: owner update"
  on storage.objects for update using (
    bucket_id = 'materials' and owner = auth.uid()
  );

create policy "storage: owner delete"
  on storage.objects for delete using (
    bucket_id = 'materials' and owner = auth.uid()
  );

create policy "storage: public read"
  on storage.objects for select using (bucket_id = 'materials');

-- Verify policies were created
select 'Policy Check' as check_type,
       string_agg(policy_name, ', ') as created_policies
from pg_policies 
where tablename = 'objects' 
  and schemaname = 'storage'
  and policy_name like 'storage:%';

-- Final verification
select 'Final Status' as check_type,
       case 
         when exists(select 1 from storage.buckets where name = 'materials')
           and exists(select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policy_name like 'storage:%')
         then '✅ Storage setup complete' 
         else '❌ Storage setup incomplete' 
       end as status;
