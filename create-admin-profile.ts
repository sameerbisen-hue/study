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

async function createAdminProfile() {
  console.log("=== Creating Admin Profile ===");
  
  const email = "sameeropbis@gmail.com";
  const password = "your_password_here"; // Replace with actual password
  
  try {
    console.log("1. Attempting to sign in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.log("Sign in failed, trying to sign up...");
      
      // Try to sign up if sign in fails
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: "Admin User" } },
      });
      
      if (signUpError) {
        console.error("Sign up failed:", signUpError.message);
        console.log("This might mean the user already exists but with different password");
        console.log("Try resetting password or check if you're using the correct password");
        return;
      }
      
      console.log("✅ Sign up successful");
      console.log("Please check your email for confirmation if needed");
      
      if (signUpData.session) {
        console.log("✅ Already signed in");
        await verifyAdminRole(signUpData.user?.id || '');
      } else {
        console.log("⏳ Please sign in after email confirmation");
      }
    } else {
      console.log("✅ Sign in successful");
      await verifyAdminRole(signInData.user.id);
    }
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Admin Profile Creation Complete ===");
}

async function verifyAdminRole(userId: string) {
  console.log("2. Verifying admin role...");
  
  // Check current role
  const { data: profiles, error: checkError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId);
  
  if (checkError) {
    console.error("Error checking profile:", checkError.message);
    return;
  }
  
  const profile = profiles?.[0];
  if (profile) {
    console.log(`Current role: ${profile.role}`);
    
    if (profile.role !== 'admin') {
      console.log("Updating role to admin...");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: 'admin' })
        .eq("id", userId);
      
      if (updateError) {
        console.error("Error updating role:", updateError.message);
      } else {
        console.log("✅ Role updated to admin successfully");
      }
    } else {
      console.log("✅ Already has admin role");
    }
  } else {
    console.log("❌ Profile not found, this shouldn't happen");
  }
}

// Instructions
console.log("📋 Instructions:");
console.log("1. Replace 'your_password_here' with your actual password");
console.log("2. Run this script: npx tsx create-admin-profile.ts");
console.log("3. Or sign in through the web app at http://localhost:8080");
console.log("4. The admin role should be automatically assigned to sameeropbis@gmail.com");
console.log("");

createAdminProfile().catch(console.error);
