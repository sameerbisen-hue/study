import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Read env file manually
const envStr = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
for (const line of envStr.split("\n")) {
  if (line.includes("=")) {
    const [k, ...rest] = line.split("=");
    env[k.trim()] = rest.join("=").trim();
  }
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function debugMobileUploadLive() {
  console.log("=== LIVE Mobile Upload Debug ===");
  console.log("This script will help identify why mobile uploads are stuck loading");
  
  try {
    // Step 1: Check Authentication State
    console.log("\n1. CHECKING AUTHENTICATION STATE...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ CRITICAL: Session error:", sessionError.message);
      console.log("💡 SOLUTION: User needs to sign in again");
      return;
    }
    
    if (!session) {
      console.error("❌ CRITICAL: No session found");
      console.log("💡 SOLUTION: User is not logged in - redirect to login");
      return;
    }
    
    console.log("✅ Session found");
    console.log("   User ID:", session.user.id);
    console.log("   User Email:", session.user.email);
    console.log("   Session expires:", new Date(session.expires_at! * 1000).toLocaleString());
    console.log("   Is expired?", Date.now() > session.expires_at! * 1000);
    
    // Step 2: Check Storage Bucket Status
    console.log("\n2. CHECKING STORAGE BUCKET...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ CRITICAL: Cannot list buckets:", bucketError.message);
      console.log("💡 SOLUTION: Check Supabase storage permissions");
      return;
    }
    
    console.log("✅ Buckets accessible:", buckets?.map(b => b.name).join(", ") || "None");
    
    // Check if materials bucket exists
    const materialsBucket = buckets?.find(b => b.name === 'materials');
    if (!materialsBucket) {
      console.error("❌ CRITICAL: 'materials' bucket not found");
      console.log("💡 SOLUTION: Run the storage fix SQL script");
      console.log("   File: fix-storage-and-upload-issues.sql");
      return;
    }
    
    console.log("✅ 'materials' bucket found");
    
    // Step 3: Test Bucket Permissions
    console.log("\n3. TESTING BUCKET PERMISSIONS...");
    try {
      const { data: bucketData, error: bucketAccessError } = await supabase.storage.getBucket('materials');
      if (bucketAccessError) {
        console.error("❌ Bucket access error:", bucketAccessError.message);
        console.log("💡 SOLUTION: Check RLS policies for storage");
      } else {
        console.log("✅ Bucket permissions OK");
        console.log("   Bucket public:", bucketData.public);
      }
    } catch (error) {
      console.error("❌ Bucket test failed:", error instanceof Error ? error.message : error);
    }
    
    // Step 4: Test Minimal Upload
    console.log("\n4. TESTING MINIMAL UPLOAD...");
    const testContent = "test file content for mobile upload debugging";
    const testFile = new File([testContent], "mobile-debug-test.txt", { type: "text/plain" });
    
    console.log("   Test file size:", testFile.size, "bytes");
    console.log("   Test file name:", testFile.name);
    
    try {
      const uploadStartTime = Date.now();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("materials")
        .upload(`mobile-debug/${session.user.id}/${Date.now()}-test.txt`, testFile, {
          upsert: false,
          contentType: "text/plain",
        });
      
      const uploadTime = Date.now() - uploadStartTime;
      
      if (uploadError) {
        console.error("❌ UPLOAD FAILED:", uploadError.message);
        
        // Analyze specific error
        if (uploadError.message.includes("row-level security")) {
          console.log("💡 RLS POLICY ISSUE:");
          console.log("   - User doesn't have permission to upload");
          console.log("   - Solution: Fix RLS policies in Supabase");
          console.log("   - Run: fix-storage-and-upload-issues.sql");
        } else if (uploadError.message.includes("Bucket not found")) {
          console.log("💡 BUCKET ISSUE:");
          console.log("   - Materials bucket doesn't exist");
          console.log("   - Solution: Create bucket with SQL script");
        } else if (uploadError.message.includes("permission")) {
          console.log("💡 PERMISSION ISSUE:");
          console.log("   - Storage permissions not configured");
          console.log("   - Solution: Check storage policies");
        } else if (uploadError.message.includes("network") || uploadError.message.includes("connection")) {
          console.log("💡 NETWORK ISSUE:");
          console.log("   - Network connectivity problem");
          console.log("   - Solution: Check mobile connection");
        } else if (uploadError.message.includes("timeout")) {
          console.log("💡 TIMEOUT ISSUE:");
          console.log("   - Upload taking too long");
          console.log("   - Solution: Try smaller files");
        } else {
          console.log("💡 UNKNOWN ERROR:", uploadError.message);
          console.log("   - Check browser console for more details");
        }
        
        return;
      } else {
        console.log("✅ UPLOAD SUCCESSFUL!");
        console.log("   Upload time:", uploadTime, "ms");
        console.log("   File path:", uploadData.path);
        
        // Clean up test file
        await supabase.storage.from("materials").remove([uploadData.path]);
        console.log("✅ Test file cleaned up");
      }
      
    } catch (error) {
      console.error("❌ UPLOAD EXCEPTION:", error instanceof Error ? error.message : error);
      console.log("💡 SOLUTION: Check browser console for JavaScript errors");
    }
    
    // Step 5: Check User Profile
    console.log("\n5. CHECKING USER PROFILE...");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile error:", profileError.message);
      console.log("💡 SOLUTION: Create user profile");
    } else {
      console.log("✅ Profile found");
      console.log("   Name:", profile.name);
      console.log("   Role:", profile.role);
      console.log("   Email:", profile.email);
    }
    
    // Step 6: Provide Mobile-Specific Solutions
    console.log("\n6. MOBILE-SPECIFIC SOLUTIONS:");
    console.log("");
    console.log("🔧 IMMEDIATE FIXES TO TRY:");
    console.log("   1. Sign out and sign back in");
    console.log("   2. Clear browser cache and cookies");
    console.log("   3. Try different mobile browser (Chrome, Safari, Firefox)");
    console.log("   4. Switch from mobile data to WiFi");
    console.log("   5. Try very small file (under 1MB)");
    console.log("");
    console.log("🔧 IF STILL NOT WORKING:");
    console.log("   1. Run this debug script again");
    console.log("   2. Check browser console for JavaScript errors");
    console.log("   3. Verify storage bucket exists in Supabase");
    console.log("   4. Check RLS policies in Supabase");
    console.log("   5. Test upload on desktop browser");
    console.log("");
    console.log("🔧 STORAGE FIX (if needed):");
    console.log("   1. Go to Supabase Dashboard → SQL Editor");
    console.log("   2. Run: fix-storage-and-upload-issues.sql");
    console.log("   3. Verify bucket creation");
    console.log("   4. Test upload again");
    
  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error instanceof Error ? error.message : error);
  }
  
  console.log("\n=== DEBUG COMPLETE ===");
}

debugMobileUploadLive().catch(console.error);
