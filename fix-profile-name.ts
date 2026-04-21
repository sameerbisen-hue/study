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

async function testProfileNameFix() {
  console.log("=== Testing Profile Name Fix ===");
  
  const testEmail = "sameeropbis@gmail.com";
  const testPassword = "your_password_here"; // Replace with actual password
  const testName = "Test Admin User";
  
  try {
    // Step 1: Sign up with name
    console.log("1. Testing sign up with proper name...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { name: testName } },
    });
    
    if (signUpError) {
      console.error("❌ Sign up failed:", signUpError.message);
      return;
    }
    
    console.log("✅ Sign up successful");
    
    // Step 2: Check profile
    console.log("2. Checking created profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signUpData.user!.id)
      .single();
    
    if (profileError) {
      console.error("❌ Profile check failed:", profileError.message);
      return;
    }
    
    if (profile) {
      console.log("✅ Profile found:");
      console.log("  Name:", profile.name);
      console.log("  Email:", profile.email);
      console.log("  Username:", profile.username);
      console.log("  Role:", profile.role);
      
      // Check if name is correct
      if (profile.name === testName) {
        console.log("✅ Profile name is correct!");
      } else {
        console.log("❌ Profile name is incorrect, got:", profile.name);
        console.log("Expected:", testName);
        
        // Fix the name
        console.log("3. Fixing profile name...");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ name: testName })
          .eq("id", profile.id);
        
        if (updateError) {
          console.error("❌ Name update failed:", updateError.message);
        } else {
          console.log("✅ Profile name updated successfully");
        }
      }
    }
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Profile Name Fix Test Complete ===");
}

testProfileNameFix().catch(console.error);
