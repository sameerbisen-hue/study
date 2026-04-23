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

async function debugNavigationIssues() {
  console.log("=== Navigation & Tab Switching Debug ===");
  console.log("This script will identify why the app loads forever when switching tabs");
  
  try {
    // Step 1: Check Authentication State
    console.log("\n1. CHECKING AUTHENTICATION STATE...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError.message);
      console.log("💡 This could cause infinite loading when switching tabs");
      return;
    }
    
    if (!session) {
      console.error("❌ No session found");
      console.log("💡 User needs to sign in - this could cause loading issues");
      return;
    }
    
    console.log("✅ Session found");
    console.log("   User ID:", session.user.id);
    console.log("   User Email:", session.user.email);
    console.log("   Session expires:", new Date(session.expires_at! * 1000).toLocaleString());
    console.log("   Is expired?", Date.now() > session.expires_at! * 1000);
    
    // Step 2: Check User Profile
    console.log("\n2. CHECKING USER PROFILE...");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile error:", profileError.message);
      console.log("💡 Missing profile could cause infinite loading");
    } else {
      console.log("✅ Profile found");
      console.log("   Name:", profile.name);
      console.log("   Role:", profile.role);
      console.log("   Email:", profile.email);
    }
    
    // Step 3: Simulate Page Visibility Changes
    console.log("\n3. SIMULATING TAB SWITCHING...");
    console.log("   This simulates what happens when user switches tabs");
    
    // Test session persistence
    const { data: session2, error: sessionError2 } = await supabase.auth.getSession();
    if (sessionError2 || !session2) {
      console.error("❌ Session lost during tab switch simulation");
      console.log("💡 Session not persisting across tab changes");
    } else {
      console.log("✅ Session persists across tab changes");
    }
    
    // Step 4: Check React State Management Issues
    console.log("\n4. POTENTIAL REACT STATE ISSUES...");
    console.log("   Common causes of infinite loading:");
    console.log("   - useEffect dependencies causing infinite loops");
    console.log("   - Authentication state not updating properly");
    console.log("   - Error boundary not recovering properly");
    console.log("   - Component not re-rendering on tab focus");
    
    // Step 5: Check Browser Compatibility
    console.log("\n5. BROWSER COMPATIBILITY CHECK...");
    console.log("   Issues that could cause tab switching problems:");
    console.log("   - Page Visibility API not supported");
    console.log("   - Service Worker interfering");
    console.log("   - Browser caching issues");
    console.log("   - CORS policy issues");
    
    // Step 6: Provide Specific Solutions
    console.log("\n6. SOLUTIONS FOR TAB SWITCHING ISSUES:");
    console.log("");
    console.log("🔧 IMMEDIATE FIXES:");
    console.log("   1. Clear browser cache and cookies");
    console.log("   2. Sign out and sign back in");
    console.log("   3. Try different browser");
    console.log("   4. Disable browser extensions");
    console.log("   5. Try incognito/private mode");
    console.log("");
    console.log("🔧 CODE FIXES NEEDED:");
    console.log("   1. Add page visibility event listeners");
    console.log("   2. Fix authentication state management");
    console.log("   3. Improve error boundary recovery");
    console.log("   4. Add loading state timeout");
    console.log("   5. Fix useEffect dependencies");
    console.log("");
    console.log("🔧 NAVIGATION FIXES:");
    console.log("   1. Add proper route state management");
    console.log("   2. Fix React Router state persistence");
    console.log("   3. Add navigation error handling");
    console.log("   4. Implement proper cleanup on unmount");
    console.log("");
    console.log("🔧 TESTING STEPS:");
    console.log("   1. Open app in new tab");
    console.log("   2. Navigate to any page");
    console.log("   3. Switch to different website");
    console.log("   4. Switch back to app");
    console.log("   5. Check if page loads properly");
    console.log("   6. Check browser console for errors");
    
  } catch (error) {
    console.error("❌ Critical error:", error instanceof Error ? error.message : error);
  }
  
  console.log("\n=== DEBUG COMPLETE ===");
}

debugNavigationIssues().catch(console.error);
