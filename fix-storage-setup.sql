-- ============================================================
-- Fix Storage Bucket Setup
-- Run this in Supabase SQL Editor to properly configure storage
-- ============================================================

-- Create the materials bucket if it doesn't exist
insert into storage.buckets (id, name, public) values ('materials', 'materials', true)
on conflict do nothing;

-- Storage policies for the materials bucket
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

-- Verify the bucket exists
select * from storage.buckets where name = 'materials';
