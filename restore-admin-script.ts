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

async function restoreAdmin() {
  console.log("=== Restoring Admin Privileges ===");
  
  try {
    // First, check current role
    console.log("1. Checking current role...");
    const { data: currentProfiles, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "sameeropbis@gmail.com");
    
    const currentProfile = currentProfiles?.[0] || null;
    
    if (checkError) {
      console.error("Error checking current role:", checkError.message);
      return;
    }
    
    if (currentProfile) {
      console.log(`Current role: ${currentProfile.role}`);
      console.log(`User ID: ${currentProfile.id}`);
      
      if (currentProfile.role === 'admin') {
        console.log("✅ User already has admin privileges");
      } else {
        console.log("❌ User does not have admin privileges, updating...");
        
        // Update role to admin
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ role: 'admin' })
          .eq("email", "sameeropbis@gmail.com")
          .select()
          .single();
        
        if (updateError) {
          console.error("Error updating role:", updateError.message);
        } else {
          console.log("✅ Role updated to admin successfully");
          console.log("Updated profile:", updateData);
        }
      }
    } else {
      console.log("❌ Profile not found for sameeropbis@gmail.com");
      console.log("You may need to sign up/login first to create the profile");
    }
    
    // Check all admin users
    console.log("2. Checking all admin users...");
    const { data: adminUsers, error: adminError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("role", "admin");
    
    if (adminError) {
      console.error("Error checking admin users:", adminError.message);
    } else {
      console.log("Current admin users:");
      adminUsers?.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.id})`);
      });
    }
    
    // Alternative: Try to find user by partial email match
    if (!currentProfile) {
      console.log("3. Trying alternative search...");
      const { data: altProfile, error: altError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", "%sameeropbis%gmail.com%")
        .single();
      
      if (altError) {
        console.log("Alternative search also failed");
      } else {
        console.log("Found similar profile:", altProfile);
        
        if (altProfile.role !== 'admin') {
          const { error: altUpdateError } = await supabase
            .from("profiles")
            .update({ role: 'admin' })
            .eq("id", altProfile.id);
          
          if (altUpdateError) {
            console.error("Error updating alternative profile:", altUpdateError.message);
          } else {
            console.log("✅ Alternative profile updated to admin");
          }
        }
      }
    }
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Admin Restore Complete ===");
}

restoreAdmin().catch(console.error);
