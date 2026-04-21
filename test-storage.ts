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

async function testStorage() {
  console.log("=== Testing Storage Functionality ===");
  
  // First, sign in to get authenticated
  console.log("1. Signing in...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
    email: "test@example.com", 
    password: "password" 
  });
  
  if (signInError) {
    console.log("Sign in failed, creating test user...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `test_storage_${Date.now()}@example.com`,
      password: "password123",
      options: { data: { name: "Storage Test User" } },
    });
    
    if (signUpError) {
      console.error("Sign up failed:", signUpError.message);
      return;
    }
    
    if (!signUpData.session) {
      console.log("User created but no session. Please check email confirmation.");
      return;
    }
  }
  
  console.log("✓ Authenticated");
  
  // Test 2: Check if materials bucket exists
  console.log("2. Checking materials bucket...");
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error("Bucket list error:", bucketError.message);
    } else {
      const materialsBucket = buckets?.find(b => b.name === 'materials');
      if (materialsBucket) {
        console.log("✓ Materials bucket exists, public:", materialsBucket.public);
      } else {
        console.error("❌ Materials bucket does not exist!");
        console.log("Available buckets:", buckets?.map(b => b.name));
      }
    }
  } catch (err) {
    console.error("Error checking buckets:", err);
  }
  
  // Test 3: Try to upload a small test file
  console.log("3. Testing file upload...");
  const testContent = "This is a test file for upload functionality";
  const testBlob = new Blob([testContent], { type: 'text/plain' });
  const testFile = new File([testBlob], 'test-upload.txt', { type: 'text/plain' });
  
  const testPath = `test/${Date.now()}-test-upload.txt`;
  
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("materials")
      .upload(testPath, testFile, {
        upsert: true,
        contentType: 'text/plain',
      });
    
    if (uploadError) {
      console.error("❌ Upload failed:", uploadError.message);
      console.error("Upload error details:", uploadError);
    } else {
      console.log("✓ Upload successful");
      console.log("Upload data:", uploadData);
      
      // Test 4: Try to download the file
      console.log("4. Testing file download...");
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from("materials")
        .download(testPath);
      
      if (downloadError) {
        console.error("❌ Download failed:", downloadError.message);
      } else {
        console.log("✓ Download successful");
        console.log("Download size:", downloadData?.size);
        
        // Test 5: Try signed URL
        console.log("5. Testing signed URL...");
        const { data: signedData, error: signedError } = await supabase.storage
          .from("materials")
          .createSignedUrl(testPath, 60);
        
        if (signedError) {
          console.error("❌ Signed URL failed:", signedError.message);
        } else {
          console.log("✓ Signed URL created");
          console.log("Signed URL:", signedData?.signedUrl?.substring(0, 100) + "...");
        }
        
        // Test 6: Try public URL
        console.log("6. Testing public URL...");
        const { data: publicData } = supabase.storage
          .from("materials")
          .getPublicUrl(testPath);
        
        if (publicData?.publicUrl) {
          console.log("✓ Public URL generated");
          console.log("Public URL:", publicData.publicUrl.substring(0, 100) + "...");
        } else {
          console.log("❌ Public URL generation failed");
        }
        
        // Cleanup
        console.log("7. Cleaning up test file...");
        const { error: deleteError } = await supabase.storage
          .from("materials")
          .remove([testPath]);
        
        if (deleteError) {
          console.error("Cleanup failed:", deleteError.message);
        } else {
          console.log("✓ Test file cleaned up");
        }
      }
    }
  } catch (err) {
    console.error("Upload test error:", err);
  }
  
  // Test 7: Check database tables
  console.log("8. Checking database tables...");
  try {
    const { data: materialsData, error: materialsError } = await supabase
      .from("materials")
      .select("count")
      .limit(1);
    
    if (materialsError) {
      console.error("❌ Materials table error:", materialsError.message);
      console.error("Materials table error details:", materialsError);
    } else {
      console.log("✓ Materials table accessible");
    }
    
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    
    if (profilesError) {
      console.error("❌ Profiles table error:", profilesError.message);
    } else {
      console.log("✓ Profiles table accessible");
    }
  } catch (err) {
    console.error("Database test error:", err);
  }
  
  console.log("=== Storage Test Complete ===");
}

testStorage().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
