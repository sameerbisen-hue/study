-- ============================================================
-- Update Profile Name for sameeropbis@gmail.com
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update the profile name to something meaningful
update profiles 
set 
  name = 'Sameer Bisens',
  username = 'sameeropbis'
where email = 'sameeropbis@gmail.com';

-- Verify the update
select 'After Update' as status, name, email, username, role 
from profiles 
where email = 'sameeropbis@gmail.com';
