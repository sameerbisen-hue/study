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

async function fixProfileNameFinal() {
  console.log("=== Final Profile Name Fix ===");
  
  try {
    // Step 1: Update the profile name to something meaningful
    console.log("1. Updating profile name...");
    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ 
        name: "Sameer Bisens",  // You can change this to your actual name
        username: "sameeropbis"
      })
      .eq("email", "sameeropbis@gmail.com")
      .select();
    
    if (updateError) {
      console.error("Error updating profile:", updateError.message);
      return;
    }
    
    console.log("Profile updated successfully:");
    if (updateData && updateData.length > 0) {
      const updatedProfile = updateData[0];
      console.log(`  Name: "${updatedProfile.name}"`);
      console.log(`  Email: ${updatedProfile.email}`);
      console.log(`  Username: ${updatedProfile.username}`);
    } else {
      console.log("  No profile data returned");
    }
    
    // Step 2: Verify the update
    console.log("2. Verifying update...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("profiles")
      .select("name, email, username, role")
      .eq("email", "sameeropbis@gmail.com")
      .single();
    
    if (verifyError) {
      console.error("Error verifying update:", verifyError.message);
      return;
    }
    
    console.log("Current profile state:");
    console.log(`  Name: "${verifyData.name}"`);
    console.log(`  Email: ${verifyData.email}`);
    console.log(`  Username: ${verifyData.username}`);
    console.log(`  Role: ${verifyData.role}`);
    
    // Step 3: Instructions for UI refresh
    console.log("3. Next steps:");
    console.log("   - The profile name has been updated in the database");
    console.log("   - If the UI still shows 'user', you need to:");
    console.log("     1. Sign out from the app");
    console.log("     2. Sign back in");
    console.log("     3. Or refresh the page (Ctrl+R)");
    console.log("   - The name should now display as 'Sameer Bisens'");
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Final Profile Name Fix Complete ===");
}

fixProfileNameFinal().catch(console.error);
