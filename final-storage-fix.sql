-- ============================================================
-- Final Storage Fix - Ensure proper bucket configuration
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, let's see what we have
select 'Current buckets' as info, id, name, public 
from storage.buckets;

-- Ensure materials bucket exists and is public
insert into storage.buckets (id, name, public) 
values ('materials', 'materials', true) 
on conflict (id) do update set public = true;

-- Drop and recreate all storage policies to ensure they're correct
drop policy if exists "storage: authenticated upload" on storage.objects;
drop policy if exists "storage: owner update" on storage.objects;
drop policy if exists "storage: owner delete" on storage.objects;
drop policy if exists "storage: public read" on storage.objects;

-- Recreate with proper permissions
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

-- Verify final state
select 'Final bucket state' as info, id, name, public 
from storage.buckets 
where name = 'materials';

select 'Created policies' as info, policy_name 
from pg_policies 
where tablename = 'objects' 
  and schemaname = 'storage'
  and policy_name like 'storage:%';
