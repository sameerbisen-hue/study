-- Fix Storage Bucket and RLS Policies for Mobile Upload
-- Run this in Supabase SQL Editor

-- Step 1: Create materials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing RLS policies that might be causing issues
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Step 3: Create proper RLS policies for storage
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'materials' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'materials' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'materials' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'materials' AND 
  auth.role() = 'authenticated'
);

-- Step 4: Verify bucket exists
SELECT 'Bucket created successfully' as status, id, name, public 
FROM storage.buckets 
WHERE id = 'materials';
