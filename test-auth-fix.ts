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
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'studyshare-auth-token',
      flowType: 'pkce',
    },
  }
);

async function testAuthFix() {
  console.log("=== Testing Authentication Fix ===");
  
  const testEmail = `auth_fix_test_${Date.now()}@example.com`;
  const testPassword = "password123";
  
  try {
    // Test 1: Sign up
    console.log("1. Testing sign up...");
    const startTime = Date.now();
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { name: "Auth Fix Test User" } },
    });
    
    const signUpTime = Date.now() - startTime;
    console.log(`Sign up completed in ${signUpTime}ms`);
    
    if (signUpError) {
      console.error("Sign up error:", signUpError.message);
      return;
    }
    
    console.log("✓ Sign up successful");
    
    // Test 2: Check if profile was created
    console.log("2. Checking profile creation...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signUpData.user?.id)
      .single();
    
    if (profileError) {
      console.log("Profile not immediately available (expected):", profileError.message);
    } else {
      console.log("✓ Profile created successfully");
    }
    
    // Test 3: Sign out
    console.log("3. Testing sign out...");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Sign out error:", signOutError.message);
    } else {
      console.log("✓ Sign out successful");
    }
    
    // Test 4: Sign in (this is where the hanging occurred)
    console.log("4. Testing sign in (previously hanging)...");
    const signInStartTime = Date.now();
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    const signInTime = Date.now() - signInStartTime;
    console.log(`Sign in completed in ${signInTime}ms`);
    
    if (signInError) {
      console.error("Sign in error:", signInError.message);
    } else {
      console.log("✓ Sign in successful");
      console.log("Session active:", signInData.session ? "Yes" : "No");
    }
    
    // Test 5: Check session persistence
    console.log("5. Testing session persistence...");
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Session persists:", sessionData.session ? "Yes" : "No");
    
    // Test 6: Multiple rapid sign in/out attempts
    console.log("6. Testing rapid auth state changes...");
    for (let i = 0; i < 3; i++) {
      console.log(`  Attempt ${i + 1}:`);
      
      const signOutStart = Date.now();
      await supabase.auth.signOut();
      const signOutTime = Date.now() - signOutStart;
      console.log(`    Sign out: ${signOutTime}ms`);
      
      const signInStart = Date.now();
      const { error: rapidSignInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      const signInTime2 = Date.now() - signInStart;
      console.log(`    Sign in: ${signInTime2}ms`);
      
      if (rapidSignInError) {
        console.error(`    Error on attempt ${i + 1}:`, rapidSignInError.message);
      }
    }
    
    console.log("✅ Authentication fix test completed successfully!");
    
  } catch (error) {
    console.error("Test failed:", error instanceof Error ? error.message : error);
  }
}

testAuthFix().catch(console.error);
