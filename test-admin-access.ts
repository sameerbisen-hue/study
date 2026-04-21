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

async function testAdminAccess() {
  console.log("=== Testing Admin Access ===");
  
  const email = "sameeropbis@gmail.com";
  const password = "your_password_here"; // Replace with actual password
  
  try {
    // Step 1: Sign in
    console.log("1. Signing in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error("❌ Sign in failed:", signInError.message);
      console.log("Please replace 'your_password_here' with actual password");
      return;
    }
    
    console.log("✅ Sign in successful");
    
    // Step 2: Check profile and role
    console.log("2. Checking profile and role...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signInData.user!.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile check failed:", profileError.message);
      return;
    }
    
    if (profile) {
      console.log("✅ Profile found:");
      console.log("  ID:", profile.id);
      console.log("  Name:", profile.name);
      console.log("  Email:", profile.email);
      console.log("  Role:", profile.role);
      
      if (profile.role === 'admin') {
        console.log("✅ ADMIN ACCESS CONFIRMED!");
        console.log("You should be able to access /admin");
      } else {
        console.log("❌ Role is not admin:", profile.role);
        console.log("Current role needs to be updated to 'admin'");
      }
    } else {
      console.log("❌ No profile found");
    }
    
    // Step 3: Test admin function
    console.log("3. Testing admin function logic...");
    const isAdmin = profile?.role === "admin";
    console.log("Admin function result:", isAdmin);
    
    // Step 4: Instructions
    console.log("4. Next steps:");
    if (profile?.role === 'admin') {
      console.log("  - Go to http://localhost:8080/login");
      console.log("  - Login with your credentials");
      console.log("  - Try to access http://localhost:8080/admin");
      console.log("  - If it works, admin access is fixed!");
    } else {
      console.log("  - Run the SQL from force-admin.sql in Supabase");
      console.log("  - Or sign up again to trigger admin role assignment");
    }
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Admin Access Test Complete ===");
}

testAdminAccess().catch(console.error);
