# Admin Setup Instructions for sameeropbis@gmail.com

## Current Status
The admin profile for `sameeropbis@gmail.com` doesn't exist yet. You need to create it first.

## Option 1: Use Web App (Recommended)
1. Go to http://localhost:8080
2. Click "Sign up"
3. Enter:
   - Email: `sameeropbis@gmail.com`
   - Password: Your password
   - Name: Your name
4. Click "Create account"
5. The system will automatically assign admin role to this email

## Option 2: Use Script
1. Edit `create-admin-profile.ts`
2. Replace `your_password_here` with your actual password
3. Run: `npx tsx create-admin-profile.ts`

## Option 3: Manual SQL
Run this in Supabase SQL Editor:

```sql
-- Create admin profile manually
insert into profiles (id, name, username, email, role)
values (
  gen_random_uuid(),
  'Admin User',
  'sameeropbis',
  'sameeropbis@gmail.com',
  'admin'
);
```

## How Admin Role is Assigned
The system automatically assigns admin role to `sameeropbis@gmail.com` in the `ensureProfile` function:

```typescript
role: fallbackEmail.toLowerCase() === "sameeropbis@gmail.com"
  ? "admin"
  : "student",
```

## Verification
After creating the account, you can verify admin role by:
1. Logging in at http://localhost:8080
2. Going to http://localhost:8080/admin
3. If you can access admin panel, role is working

## Troubleshooting
- If sign up fails, try the manual SQL option
- If you already have an account, just sign in
- Check browser console for any errors
- Make sure email confirmation is not required

## Files Created
- `restore-admin.sql` - SQL script to restore admin role
- `restore-admin-script.ts` - Script to check and restore admin
- `create-admin-profile.ts` - Script to create admin profile
- `ADMIN_SETUP_INSTRUCTIONS.md` - This instruction file
