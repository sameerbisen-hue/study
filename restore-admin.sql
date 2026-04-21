-- ============================================================
-- Restore Admin Privileges for sameeropbis@gmail.com
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, check current role
select 'Current role before update' as status, id, email, role 
from profiles 
where email = 'sameeropbis@gmail.com';

-- Update role to admin
update profiles 
set role = 'admin' 
where email = 'sameeropbis@gmail.com';

-- Verify the update
select 'Updated role' as status, id, email, role 
from profiles 
where email = 'sameeropbis@gmail.com';

-- Alternative: If multiple profiles exist, update all
-- update profiles 
-- set role = 'admin' 
-- where lower(email) = 'sameeropbis@gmail.com';

-- Check if there are any other admin users
select 'All admin users' as status, id, email, role 
from profiles 
where role = 'admin';
