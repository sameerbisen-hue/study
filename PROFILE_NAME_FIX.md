# Profile Name Display Fix

## Problem
Profile display shows "user" instead of actual user name because of this fallback logic:

```typescript
const fallbackName = params.name?.trim() || params.email?.split("@")[0] || "User";
```

When `params.name` is null/empty and `params.email` is also null/empty, it falls back to "User".

## Root Cause
The `ensureProfile` function is being called during authentication without proper user metadata, causing the name to be lost.

## Solution Options

### Option 1: Manual SQL Fix
Run this in Supabase SQL Editor:

```sql
-- Update existing profile with proper name
update profiles 
set name = 'Your Actual Name'
where email = 'sameeropbis@gmail.com';

-- Or update all profiles with "User" as name
update profiles 
set name = 
  case 
    when name = 'User' then 'Your Actual Name'
    else name
  end
where email = 'sameeropbis@gmail.com';
```

### Option 2: Code Fix
The fallback logic needs improvement to preserve user metadata name when available.

## Files Created
- `fix-profile-name.ts` - Test script to verify the fix
- `PROFILE_NAME_FIX.md` - This documentation

## Testing
Run `npx tsx fix-profile-name.ts` to test the profile name fix.

## Expected Result
Profile should display the actual user name instead of "user".
