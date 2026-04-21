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

async function debugProfileNameDeep() {
  console.log("=== Deep Profile Name Debug ===");
  
  try {
    // Step 1: Check all profiles
    console.log("1. Checking all profiles...");
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, name, email, username, role")
      .order("id", { ascending: false });
    
    if (allProfilesError) {
      console.error("Error fetching all profiles:", allProfilesError.message);
      return;
    }
    
    console.log(`Found ${allProfiles?.length || 0} profiles:`);
    allProfiles?.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id}`);
      console.log(`     Name: "${profile.name}"`);
      console.log(`     Email: ${profile.email}`);
      console.log(`     Username: ${profile.username}`);
      console.log(`     Role: ${profile.role}`);
      console.log(`     ID: ${profile.id}`);
      console.log("");
    });
    
    // Step 2: Check specifically for sameeropbis@gmail.com
    console.log("2. Checking for sameeropbis@gmail.com...");
    const { data: targetProfiles, error: targetError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", "%sameeropbis%gmail.com%");
    
    if (targetError) {
      console.error("Error checking target profile:", targetError.message);
      return;
    }
    
    if (targetProfiles && targetProfiles.length > 0) {
      console.log(`Found ${targetProfiles.length} profile(s) for sameeropbis@gmail.com:`);
      targetProfiles.forEach((profile, index) => {
        console.log(`  Profile ${index + 1}:`);
        console.log(`    Name: "${profile.name}"`);
        console.log(`    Email: ${profile.email}`);
        console.log(`    Username: ${profile.username}`);
        console.log(`    Role: ${profile.role}`);
      });
      
      // Step 3: Fix the name if it's wrong
      const profileToFix = targetProfiles[0];
      if (profileToFix.name === "User" || profileToFix.name === "user" || !profileToFix.name || profileToFix.name.trim() === "") {
        console.log("3. Profile name needs fixing...");
        
        const newName = "Admin User"; // You can change this
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ name: newName })
          .eq("id", profileToFix.id);
        
        if (updateError) {
          console.error("Error updating profile name:", updateError.message);
        } else {
          console.log(`Successfully updated name to: "${newName}"`);
        }
      } else {
        console.log("3. Profile name looks correct");
      }
    } else {
      console.log("No profile found for sameeropbis@gmail.com");
      
      // Step 4: Create profile manually
      console.log("4. Creating profile manually...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: crypto.randomUUID(),
          name: "Admin User",
          username: "sameeropbis",
          email: "sameeropbis@gmail.com",
          role: "admin",
          upload_count: 0,
          total_upvotes: 0,
          review_count: 0,
          badges: ["new-member"],
          blocked: false,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating profile:", createError.message);
      } else {
        console.log("Successfully created profile:", newProfile);
      }
    }
    
    // Step 5: Final verification
    console.log("5. Final verification...");
    const { data: finalProfiles, error: finalError } = await supabase
      .from("profiles")
      .select("name, email, role")
      .ilike("email", "%sameeropbis%gmail.com%");
    
    if (finalError) {
      console.error("Error in final verification:", finalError.message);
    } else {
      console.log("Final state:");
      finalProfiles?.forEach((profile) => {
        console.log(`  Name: "${profile.name}" | Email: ${profile.email} | Role: ${profile.role}`);
      });
    }
    
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : error);
  }
  
  console.log("=== Deep Profile Name Debug Complete ===");
}

debugProfileNameDeep().catch(console.error);
