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

async function debugAdminRole() {
  console.log("=== Debugging Admin Role Assignment ===");
  
  const testEmail = "sameeropbis@gmail.com";
  const testPassword = "your_password_here"; // Replace with actual password
  
  try {
    // Step 1: Sign in first
    console.log("1. Signing in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error("❌ Sign in failed:", signInError.message);
      console.log("Please replace 'your_password_here' with actual password");
      return;
    }
    
    console.log("✅ Sign in successful");
    console.log("User ID:", signInData.user?.id);
    
    // Step 2: Check if profile exists
    console.log("2. Checking existing profile...");
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signInData.user!.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("❌ Profile check error:", profileError.message);
      return;
    }
    
    if (existingProfile) {
      console.log("✅ Profile exists");
      console.log("Current role:", existingProfile.role);
      console.log("Email in profile:", existingProfile.email);
      
      if (existingProfile.role !== 'admin') {
        console.log("❌ Profile exists but role is not admin!");
        console.log("Updating role to admin...");
        
        // Force update role
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ role: 'admin' })
          .eq("id", signInData.user!.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("❌ Role update failed:", updateError.message);
        } else {
          console.log("✅ Role updated to admin");
          console.log("Updated profile:", updateData);
        }
      } else {
        console.log("✅ Already has admin role");
      }
    } else {
      console.log("❌ Profile does not exist, creating...");
      
      // Create profile manually with admin role
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: signInData.user!.id,
          name: "Admin User",
          username: "sameeropbis",
          email: testEmail,
          role: 'admin',
        })
        .select()
        .single();
      
      if (createError) {
        console.error("❌ Profile creation failed:", createError.message);
      } else {
        console.log("✅ Profile created with admin role");
        console.log("New profile:", newProfile);
      }
    }
    
    // Step 3: Verify final state
    console.log("3. Verifying final state...");
    const { data: finalProfile, error: finalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signInData.user!.id)
      .single();
    
    if (finalError) {
      console.error("❌ Final verification failed:", finalError.message);
    } else {
      console.log("✅ Final profile state:");
      console.log("  ID:", finalProfile.id);
      console.log("  Email:", finalProfile.email);
      console.log("  Role:", finalProfile.role);
      console.log("  Name:", finalProfile.name);
    }
    
    // Step 4: Check for database triggers
    console.log("4. Checking for database triggers...");
    const { data: triggerCheck } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", testEmail);
    
    console.log("All profiles with this email:");
    triggerCheck?.forEach((profile, index) => {
      console.log(`  ${index + 1}. Role: ${profile.role}`);
    });
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Debug Complete ===");
}

debugAdminRole().catch(console.error);
