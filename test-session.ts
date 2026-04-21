import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const envStr = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
for (const line of envStr.split("\n")) {
  if (line.includes("=")) {
    const [k, v] = line.split("=");
    env[k.trim()] = v.trim();
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testSession() {
  const email = `test_session_${Date.now()}@example.com`;
  const { data } = await supabase.auth.signUp({
    email,
    password: "password123",
    options: { data: { name: "Test" } }
  });
  console.log("Session exists:", !!data.session);
}

testSession();
