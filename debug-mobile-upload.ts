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

async function debugMobileUpload() {
  console.log("=== Mobile Upload Debug ===");
  
  try {
    // Step 1: Test authentication
    console.log("1. Testing authentication...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError.message);
      return;
    }
    
    if (!sessionData.session) {
      console.log("❌ No active session - please login first");
      return;
    }
    
    console.log("✅ Session active");
    console.log("User ID:", sessionData.session.user.id);
    console.log("User email:", sessionData.session.user.email);
    
    // Step 2: Test storage bucket access
    console.log("2. Testing storage bucket access...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Bucket list error:", bucketError.message);
    } else {
      console.log("Available buckets:", buckets?.map(b => b.name).join(", "));
    }
    
    // Step 3: Test file upload simulation
    console.log("3. Simulating mobile upload...");
    const testFile = new File(["test content"], "test-mobile.txt", { type: "text/plain" });
    
    // Check file size limits
    console.log("Test file size:", testFile.size, "bytes");
    console.log("50MB limit in bytes:", 50 * 1024 * 1024, "bytes");
    
    if (testFile.size > 50 * 1024 * 1024) {
      console.log("❌ File too large for mobile upload");
    } else {
      console.log("✅ File size acceptable");
    }
    
    // Step 4: Test network connectivity
    console.log("4. Testing network connectivity...");
    const startTime = Date.now();
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("materials")
        .upload(`mobile-test/${Date.now()}-test.txt`, testFile, {
          upsert: false,
          contentType: "text/plain",
        });
      
      const uploadTime = Date.now() - startTime;
      
      if (uploadError) {
        console.error("❌ Upload test failed:", uploadError.message);
        
        // Check specific mobile-related errors
        if (uploadError.message.includes("network") || uploadError.message.includes("connection")) {
          console.log("💡 Possible mobile network issue");
        }
        if (uploadError.message.includes("size") || uploadError.message.includes("large")) {
          console.log("💡 Possible file size issue");
        }
        if (uploadError.message.includes("timeout")) {
          console.log("💡 Possible timeout issue");
        }
      } else {
        console.log("✅ Upload test successful");
        console.log("Upload time:", uploadTime, "ms");
        console.log("File path:", uploadData.path);
        
        // Clean up test file
        await supabase.storage.from("materials").remove([uploadData.path]);
        console.log("✅ Test file cleaned up");
      }
    } catch (networkError) {
      console.error("❌ Network error:", networkError instanceof Error ? networkError.message : networkError);
      console.log("💡 This might be a mobile connectivity issue");
    }
    
    // Step 5: Mobile-specific recommendations
    console.log("5. Mobile upload recommendations:");
    console.log("   - Check internet connection stability");
    console.log("   - Ensure file is under 50MB");
    console.log("   - Try uploading smaller files first");
    console.log("   - Check browser permissions");
    console.log("   - Try different browser (Chrome, Safari, Firefox)");
    console.log("   - Clear browser cache and cookies");
    console.log("   - Disable VPN or proxy if using");
    
    // Step 6: Common mobile issues
    console.log("6. Common mobile upload issues:");
    console.log("   - Slow network on mobile data");
    console.log("   - Browser limitations on mobile");
    console.log("   - File picker issues on mobile");
    console.log("   - Touch interface problems");
    console.log("   - Background app restrictions");
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Mobile Upload Debug Complete ===");
}

debugMobileUpload().catch(console.error);
