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

async function testSessionPersistence() {
  console.log("=== Testing Session Persistence ===");
  
  // Test 1: Check current session
  console.log("1. Checking current session...");
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Session check error:", sessionError.message);
  } else {
    console.log("Current session:", sessionData.session ? "Active" : "None");
    if (sessionData.session) {
      console.log("User ID:", sessionData.session.user.id);
      console.log("Expires at:", new Date(sessionData.session.expires_at! * 1000));
    }
  }
  
  // Test 2: Check if we can get user without session
  console.log("2. Checking user directly...");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.log("User check error (expected if no session):", userError.message);
  } else {
    console.log("Current user:", userData.user ? userData.user.id : "None");
  }
  
  // Test 3: Try to sign in with test credentials
  console.log("3. Testing sign in...");
  const testEmail = `test_session_${Date.now()}@example.com`;
  const testPassword = "password123";
  
  // First, try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: { data: { name: "Session Test User" } },
  });
  
  if (signUpError) {
    console.error("Sign up error:", signUpError.message);
  } else {
    console.log("Sign up successful");
    console.log("Session after signup:", signUpData.session ? "Active" : "None");
  }
  
  // Test 4: Sign out
  console.log("4. Testing sign out...");
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Sign out error:", signOutError.message);
  } else {
    console.log("Sign out successful");
  }
  
  // Test 5: Check session after sign out
  console.log("5. Checking session after sign out...");
  const { data: sessionAfterSignOut } = await supabase.auth.getSession();
  console.log("Session after sign out:", sessionAfterSignOut.session ? "Active" : "None");
  
  // Test 6: Try to sign in again
  console.log("6. Testing sign in after sign out...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (signInError) {
    console.error("Sign in error:", signInError.message);
  } else {
    console.log("Sign in successful");
    console.log("Session after sign in:", signInData.session ? "Active" : "None");
    if (signInData.session) {
      console.log("User ID:", signInData.session.user.id);
    }
  }
  
  // Test 7: Check local storage
  console.log("7. Checking local storage...");
  if (typeof localStorage !== 'undefined') {
    const storageKey = 'studyshare-auth-token';
    const storedData = localStorage.getItem(storageKey);
    console.log("Local storage data:", storedData ? "Present" : "None");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log("Storage keys:", Object.keys(parsed));
      } catch (e) {
        console.log("Storage data is not valid JSON");
      }
    }
  } else {
    console.log("Local storage not available in this environment");
  }
  
  console.log("=== Session Persistence Test Complete ===");
}

testSessionPersistence().catch(console.error);
