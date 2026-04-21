-- ============================================================
-- Force Admin Role for sameeropbis@gmail.com
-- Run this in Supabase SQL Editor - This will work even if profile exists
-- ============================================================

-- First, update any existing profile
update profiles 
set role = 'admin' 
where lower(email) = 'sameeropbis@gmail.com';

-- If no profile exists, create one
insert into profiles (id, name, username, email, role, upload_count, total_upvotes, review_count, badges, blocked, joined_at)
select 
  gen_random_uuid() as id,
  'Admin User' as name,
  'sameeropbis' as username,
  'sameeropbis@gmail.com' as email,
  'admin' as role,
  0 as upload_count,
  0 as total_upvotes,
  0 as review_count,
  array['new-member'] as badges,
  false as blocked,
  now() as joined_at
where not exists (
  select 1 from profiles where lower(email) = 'sameeropbis@gmail.com'
);

-- Verify the result
select 'Final Status' as action, id, email, role, created_at
from profiles 
where lower(email) = 'sameeropbis@gmail.com';
