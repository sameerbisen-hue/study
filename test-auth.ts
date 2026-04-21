import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

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
      storageKey: "studyshare-auth-token",
      flowType: "pkce",
    },
  }
);

async function run() {
  const email = `test_auth_${Date.now()}@example.com`;
  const password = "password123";

  console.log("signUp:start", email);
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: "Auth Test User" } },
  });
  console.log("signUp:error", signUp.error?.message ?? null);
  console.log("signUp:user", signUp.data.user?.id ?? null);
  console.log("signUp:session", Boolean(signUp.data.session));

  console.log("signOut:start");
  await supabase.auth.signOut();

  console.log("signIn:start");
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  console.log("signIn:error", signIn.error?.message ?? null);
  console.log("signIn:user", signIn.data.user?.id ?? null);
  console.log("signIn:session", Boolean(signIn.data.session));

  const currentSession = await supabase.auth.getSession();
  console.log("getSession:error", currentSession.error?.message ?? null);
  console.log("getSession:hasSession", Boolean(currentSession.data.session));

  const currentUser = await supabase.auth.getUser();
  console.log("getUser:error", currentUser.error?.message ?? null);
  console.log("getUser:id", currentUser.data.user?.id ?? null);
}

run().catch((error) => {
  console.error("fatal", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
