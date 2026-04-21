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

async function comprehensiveUploadDebug() {
  console.log("=== Comprehensive Upload Debug ===");
  
  try {
    // Step 1: Check current authentication state
    console.log("1. Checking current authentication state...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError.message);
      console.log("💡 SOLUTION: Please sign in again");
      return;
    }
    
    if (!session) {
      console.log("❌ No session - please sign in first");
      console.log("💡 SOLUTION: Go to /login and sign in");
      return;
    }
    
    console.log("✅ Session found");
    console.log("User ID:", session.user.id);
    console.log("User email:", session.user.email);
    console.log("Session expires at:", new Date(session.expires_at! * 1000));
    
    // Step 2: Test storage bucket access
    console.log("2. Testing storage bucket access...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ Bucket error:", bucketError.message);
      console.log("💡 SOLUTION: Check RLS policies in Supabase");
      return;
    }
    
    console.log("✅ Buckets accessible:", buckets?.map(b => b.name).join(", "));
    
    // Step 3: Test file upload with small file
    console.log("3. Testing small file upload...");
    const testContent = "This is a test file for debugging upload issues.";
    const testFile = new File([testContent], "debug-upload.txt", { type: "text/plain" });
    
    console.log("Test file size:", testFile.size, "bytes");
    console.log("Test file name:", testFile.name);
    
    const uploadStartTime = Date.now();
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("materials")
        .upload(`mobile-test/${session.user.id}/${Date.now()}-debug-upload.txt`, testFile, {
          upsert: false,
          contentType: "text/plain",
        });
      
      const uploadTime = Date.now() - uploadStartTime;
      
      if (uploadError) {
        console.error("❌ Upload failed:", uploadError.message);
        
        // Analyze specific error
        if (uploadError.message.includes("403") || uploadError.message.includes("permission")) {
          console.log("💡 SOLUTION: RLS policy issue - check storage policies");
        } else if (uploadError.message.includes("413") || uploadError.message.includes("large")) {
          console.log("💡 SOLUTION: File size issue - try smaller files");
        } else if (uploadError.message.includes("timeout")) {
          console.log("💡 SOLUTION: Network timeout - check connection");
        } else if (uploadError.message.includes("network") || uploadError.message.includes("connection")) {
          console.log("💡 SOLUTION: Network issue - check mobile data");
        } else {
          console.log("💡 SOLUTION: Unknown error - contact support");
        }
        
        // Try to get more details
        console.log("Error details:", JSON.stringify(uploadError, null, 2));
        
      } else {
        console.log("✅ Upload successful!");
        console.log("Upload time:", uploadTime, "ms");
        console.log("File path:", uploadData.path);
        console.log("File ID:", uploadData.id);
        
        // Clean up test file
        await supabase.storage.from("materials").remove([uploadData.path]);
        console.log("✅ Test file cleaned up");
        
        // Step 4: Test database insert
        console.log("4. Testing database insert...");
        const { data: insertData, error: insertError } = await supabase
          .from("materials")
          .insert({
            title: "Debug Test Upload",
            subject: "Testing",
            semester: "Sem 1",
            description: "Test upload for debugging mobile issues",
            tags: "debug,test",
            file_type: "notes",
            file_name: "debug-upload.txt",
            file_size: testFile.size,
            file_path: uploadData.path,
            uploader_id: session.user.id,
            uploader_name: session.user.email,
            uploader_avatar: null,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("❌ Database insert failed:", insertError.message);
          console.log("💡 SOLUTION: Check RLS policies for materials table");
        } else {
          console.log("✅ Database insert successful!");
          console.log("Material ID:", insertData.id);
          
          // Clean up test material
          await supabase.from("materials").delete().eq("id", insertData.id);
          console.log("✅ Test material cleaned up");
        }
      }
      
    } catch (error) {
      console.error("❌ Unexpected error:", error instanceof Error ? error.message : error);
      console.log("💡 SOLUTION: Check console for more details");
    }
    
    // Step 5: Provide comprehensive solutions
    console.log("5. COMPREHENSIVE SOLUTIONS:");
    console.log("");
    console.log("If upload is still failing, try these solutions in order:");
    console.log("");
    console.log("🔧 SOLUTION 1: Authentication Fix");
    console.log("   - Sign out from mobile app");
    console.log("   - Clear browser cache and cookies");
    console.log("   - Sign back in with same credentials");
    console.log("   - Try uploading again");
    console.log("");
    console.log("🔧 SOLUTION 2: Network Fix");
    console.log("   - Switch to WiFi from mobile data");
    console.log("   - Try different network (home/work WiFi)");
    console.log("   - Check internet speed and stability");
    console.log("");
    console.log("🔧 SOLUTION 3: Browser Fix");
    console.log("   - Try different mobile browser (Chrome, Safari, Firefox)");
    console.log("   - Update browser to latest version");
    console.log("   - Clear browser cache");
    console.log("   - Disable extensions temporarily");
    console.log("");
    console.log("🔧 SOLUTION 4: File Size Fix");
    console.log("   - Try very small files (under 1MB)");
    console.log("   - Test with different file types");
    console.log("   - Check file format compatibility");
    console.log("");
    console.log("🔧 SOLUTION 5: App Fix");
    console.log("   - Restart mobile app");
    console.log("   - Check for app updates");
    console.log("   - Try desktop version if mobile fails");
    console.log("");
    console.log("🔧 SOLUTION 6: Advanced Debug");
    console.log("   - Run: npx tsx comprehensive-upload-debug.ts");
    console.log("   - Check browser console for errors");
    console.log("   - Check network tab in browser dev tools");
    console.log("   - Test with browser dev tools open");
    console.log("");
    console.log("📋 NEXT STEPS:");
    console.log("   1. Try SOLUTION 1 (authentication) first");
    console.log("   2. If still failing, try SOLUTION 2 (network)");
    console.log("   3. If still failing, try SOLUTION 3 (browser)");
    console.log("   4. If still failing, try SOLUTION 4 (file size)");
    console.log("   5. Contact support with debug output");
    
  } catch (error) {
    console.error("Critical error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Comprehensive Upload Debug Complete ===");
}

comprehensiveUploadDebug().catch(console.error);
