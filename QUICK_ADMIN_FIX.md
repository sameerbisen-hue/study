# Quick Admin Fix for sameeropbis@gmail.com

## The Problem
The admin role is not being assigned automatically because the profile doesn't exist yet.

## Solution 1: Manual SQL Fix (Easiest)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste this SQL:

```sql
-- Force admin role for sameeropbis@gmail.com
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
```

4. Click "Run"

## Solution 2: Web App

1. Go to http://localhost:8080
2. Sign up with:
   - Email: `sameeropbis@gmail.com`
   - Any password
   - Any name
3. The system will automatically assign admin role

## Verification

After running either solution:

1. Go to http://localhost:8080/login
2. Login with `sameeropbis@gmail.com`
3. Try to access http://localhost:8080/admin
4. If you can see the admin panel, it worked!

## Why This Happened

The admin role assignment code exists in `ensureProfile` function, but it only runs when a profile is created. If you already had an account or the profile creation failed, the admin role wasn't assigned.

## Files Available

- `force-admin.sql` - The SQL script above
- `debug-admin-role.ts` - Debug script (needs password)
- `QUICK_ADMIN_FIX.md` - This instruction file

Use the SQL fix for guaranteed results.
