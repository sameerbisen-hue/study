import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Read env file manually
const envStr = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
for (const line of envStr.split("\n")) {
  if (line.includes("=")) {
    const [k, v] = line.split("=");
    env[k.trim()] = v.trim();
  }
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function testFullFlow() {
  const email = `test_flow_${Date.now()}@example.com`;
  const password = "password123";

  console.log("1. Signing up...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: "Test Flow User" } }
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return;
  }
  const userId = signUpData.user?.id;
  console.log("Signed up user:", userId);

  await new Promise(r => setTimeout(r, 2000));

  console.log("2. Uploading file to storage with upsert:true...");
  const fileContent = "Flow test content.";
  const blob = new Blob([fileContent], { type: "text/plain" });
  const storagePath = `${userId}/flow.txt`;
  
  let storageData, storageError;
  try {
    const res = await supabase.storage
      .from("materials")
      .upload(storagePath, blob, { upsert: true });
    storageData = res.data;
    storageError = res.error;
  } catch (e) {
    console.error("Exception during upload:", e);
  }

  if (storageError) {
    console.error("Upload error:", storageError);
  } else {
    console.log("Upload success:", storageData);
  }

  console.log("3. Inserting material row...");
  const { data: dbData, error: dbError } = await supabase
    .from("materials")
    .insert({
      title: "Flow Test",
      subject: "Flow",
      description: "Test",
      file_type: "txt",
      file_name: "flow.txt",
      file_size: "1KB",
      file_path: storagePath,
      uploader_id: userId,
      uploader_name: "Test Flow User"
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
  } else {
    console.log("DB insert success:", dbData.id);
  }

  console.log("4. Updating profiles upload_count...");
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ upload_count: 1 })
    .eq("id", userId);

  if (profileError) {
    console.error("Profile update error:", profileError);
  } else {
    console.log("Profile update success");
  }

  console.log("5. Downloading file...");
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from("materials")
    .download(storagePath);

  if (downloadError) {
    console.error("Download error:", downloadError);
  } else {
    console.log("Download success!");
  }
}

testFullFlow();
