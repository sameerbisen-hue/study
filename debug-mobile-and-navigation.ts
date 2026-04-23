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

async function debugMobileAndNavigationIssues() {
  console.log("=== Mobile Upload & Navigation Debug ===");
  
  try {
    // Step 1: Test Authentication State
    console.log("1. Testing authentication state...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError.message);
      console.log("💡 This could cause blank pages when navigating back");
    } else if (session) {
      console.log("✅ Session found");
      console.log("User ID:", session.user.id);
      console.log("Session expires at:", new Date(session.expires_at! * 1000));
      console.log("Is session expired?", Date.now() > session.expires_at! * 1000);
    } else {
      console.log("❌ No session found");
      console.log("💡 This could cause blank pages when navigating back");
    }
    
    // Step 2: Test Storage Bucket Access
    console.log("2. Testing storage bucket access...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("❌ Bucket error:", bucketError.message);
      console.log("💡 This could cause mobile upload failures");
    } else {
      console.log("✅ Buckets accessible:", buckets?.map(b => b.name).join(", "));
      
      // Test materials bucket specifically
      const { data: bucketData, error: materialsError } = await supabase.storage.getBucket('materials');
      if (materialsError) {
        console.error("❌ Materials bucket error:", materialsError.message);
      } else {
        console.log("✅ Materials bucket accessible");
      }
    }
    
    // Step 3: Test File Upload Simulation
    console.log("3. Testing file upload simulation...");
    const testFile = new File(["test content for mobile upload"], "mobile-test.txt", { type: "text/plain" });
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("materials")
        .upload(`mobile-test/${Date.now()}-test.txt`, testFile, {
          upsert: false,
          contentType: "text/plain",
        });
      
      if (uploadError) {
        console.error("❌ Upload test failed:", uploadError.message);
        
        // Analyze specific mobile-related errors
        if (uploadError.message.includes("403") || uploadError.message.includes("permission")) {
          console.log("💡 Mobile upload issue: RLS policy problem");
        } else if (uploadError.message.includes("413") || uploadError.message.includes("large")) {
          console.log("💡 Mobile upload issue: File size problem");
        } else if (uploadError.message.includes("timeout")) {
          console.log("💡 Mobile upload issue: Network timeout");
        } else if (uploadError.message.includes("network") || uploadError.message.includes("connection")) {
          console.log("💡 Mobile upload issue: Network connectivity");
        } else {
          console.log("💡 Mobile upload issue: Unknown error -", uploadError.message);
        }
      } else {
        console.log("✅ Upload test successful");
        console.log("File path:", uploadData.path);
        
        // Clean up test file
        await supabase.storage.from("materials").remove([uploadData.path]);
        console.log("✅ Test file cleaned up");
      }
    } catch (error) {
      console.error("❌ Upload test exception:", error instanceof Error ? error.message : error);
    }
    
    // Step 4: Check Browser Compatibility Issues
    console.log("4. Checking browser compatibility...");
    console.log("User Agent:", navigator.userAgent);
    console.log("Mobile detection:", /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log("Online status:", navigator.onLine);
    console.log("Connection type:", (navigator as any).connection?.effectiveType || 'Unknown');
    
    // Step 5: Check for Common Issues
    console.log("5. Checking for common issues...");
    
    // Check if localStorage is accessible
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log("✅ LocalStorage accessible");
    } catch (error) {
      console.error("❌ LocalStorage error:", error);
      console.log("💡 This could cause authentication issues");
    }
    
    // Check if sessionStorage is accessible
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      console.log("✅ SessionStorage accessible");
    } catch (error) {
      console.error("❌ SessionStorage error:", error);
      console.log("💡 This could cause navigation issues");
    }
    
    // Step 6: Provide Solutions
    console.log("6. SOLUTIONS:");
    console.log("");
    console.log("🔧 For Mobile Upload Issues:");
    console.log("   - Check network connectivity on mobile");
    console.log("   - Verify user is logged in with valid session");
    console.log("   - Check RLS policies for storage bucket");
    console.log("   - Try smaller files first (<25MB for mobile)");
    console.log("   - Ensure proper file types are accepted");
    console.log("");
    console.log("🔧 For Blank Page Navigation Issues:");
    console.log("   - Check if session expires when navigating away");
    console.log("   - Verify authentication state persistence");
    console.log("   - Check for JavaScript errors in browser console");
    console.log("   - Ensure proper error boundary handling");
    console.log("   - Check if localStorage/sessionStorage is accessible");
    console.log("");
    console.log("🔧 Next Steps:");
    console.log("   1. Run this debug script to identify specific issues");
    console.log("   2. Check browser console for JavaScript errors");
    console.log("   3. Test on different mobile browsers");
    console.log("   4. Verify authentication persistence");
    console.log("   5. Test upload with different file sizes");
    
  } catch (error) {
    console.error("Critical error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Debug Complete ===");
}

debugMobileAndNavigationIssues().catch(console.error);
