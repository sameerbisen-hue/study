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

async function checkBucketStatus() {
  console.log("=== Checking Bucket Status ===");
  
  // Check buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Error listing buckets:", bucketError.message);
  } else {
    console.log("Available buckets:");
    buckets?.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`));
  }
  
  // Try to access materials bucket directly
  try {
    const bucketResult = await supabase.storage.getBucket('materials');
    console.log("Materials bucket info:", bucketResult.data);
    if (bucketResult.error) {
      console.log("Materials bucket error:", bucketResult.error.message);
    }
  } catch (err: any) {
    console.log("Materials bucket access error:", err.message);
  }
  
  // Check if we can list files in materials bucket
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('materials')
      .list('', { limit: 10 });
    
    if (listError) {
      console.log("List files error:", listError.message);
    } else {
      console.log("Files in materials bucket:", files?.length || 0);
      files?.forEach(f => console.log(`  - ${f.name}`));
    }
  } catch (err: any) {
    console.log("List files exception:", err.message);
  }
  
  console.log("=== Bucket Status Complete ===");
}

checkBucketStatus().catch(console.error);
