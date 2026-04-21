# Mobile Upload Issues - Complete Fix Guide

## Problem
Upload gets stuck or fails on mobile devices when trying to upload files.

## Root Causes Identified

### 1. **Authentication Issues**
- User may not be properly logged in on mobile
- Session may have expired
- Cookie/localStorage issues on mobile browsers

### 2. **Network Issues**
- Mobile data connections can be unstable
- Slower upload speeds on mobile networks
- Connection timeouts during upload

### 3. **Mobile Browser Limitations**
- File picker restrictions on mobile
- Touch interface problems
- Background app restrictions
- Smaller memory limits on mobile devices

### 4. **File Size Issues**
- 50MB limit may be too restrictive for mobile
- Mobile networks struggle with large files

## Solutions

### Solution 1: Fix Authentication (Most Likely)
1. **Sign out and sign back in** on mobile
2. **Clear browser cache and cookies**
3. **Try different browser** (Chrome, Safari, Firefox)

### Solution 2: Reduce File Size Limit
Update the file size check in `src/pages/Upload.tsx`:

```typescript
// Change from 50MB to 25MB for mobile
if (file.size > 25 * 1024 * 1024) {
  toast({ title: "File too large", description: "Please select a file smaller than 25MB for mobile.", variant: "destructive" });
  return;
}
```

### Solution 3: Add Mobile-Specific UI
Add mobile-friendly upload interface:

```typescript
// Add mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Add mobile-specific progress indicator
if (isMobile) {
  // Show simpler progress for mobile
  // Add retry button
  // Show smaller file size warning
}
```

### Solution 4: Improve Error Handling
Add mobile-specific error messages:

```typescript
catch (err) {
  // Mobile-specific error handling
  if (isMobile) {
    if (err.message.includes("network")) {
      toast({ title: "Mobile Network Issue", description: "Check your connection and try again." });
    } else if (err.message.includes("timeout")) {
      toast({ title: "Upload Timeout", description: "Mobile uploads may take longer. Try smaller files." });
    } else {
      toast({ title: "Mobile Upload Failed", description: "Try switching to WiFi or smaller files." });
    }
  }
}
```

## Testing Steps

### Step 1: Test Authentication
Run `npx tsx debug-mobile-upload.ts` to verify:
- Session is active
- Storage bucket is accessible
- Network connectivity is working

### Step 2: Test Upload Process
1. **Login** on mobile device
2. **Try small file** (under 5MB)
3. **Monitor progress** - should see progress bar
4. **Check error messages** for mobile-specific hints

### Step 3: Verify Storage
Check if files actually reach storage:
- Go to library page
- Look for uploaded material
- Verify file appears correctly

## Quick Fixes

### Fix 1: Immediate (Try This First)
1. **Sign out** from mobile app
2. **Clear browser data** (cache, cookies, storage)
3. **Sign back in** with same credentials
4. **Try uploading** a small file (under 5MB)

### Fix 2: Code Changes
Update `src/pages/Upload.tsx` to add:
- Mobile detection
- Smaller file size limits for mobile
- Better error messages for mobile
- Retry functionality

### Fix 3: Network Optimization
- Add retry logic for failed uploads
- Implement chunked uploads for large files
- Add offline detection

## Files Created
- `debug-mobile-upload.ts` - Mobile upload debugging tool
- `MOBILE_UPLOAD_FIX.md` - This comprehensive guide

## Next Steps
1. Test authentication first (most likely issue)
2. Try uploading smaller files
3. Implement mobile-specific fixes if needed
4. Test on different mobile browsers

**The most common mobile upload issue is authentication - try signing out and back in first!**
