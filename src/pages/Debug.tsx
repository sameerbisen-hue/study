import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function Debug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const log = (msg: string) => setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].slice(0, 8)} - ${msg}`]);

  const runDiagnostics = async () => {
    setRunning(true);
    setLogs([]);
    log("Starting diagnostics...");

    try {
      const email = `test_debug_${Date.now()}@example.com`;
      const password = "password123";

      log(`1. Testing Auth SignUp (${email})...`);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: "Debug User" } },
      });

      if (signUpError) {
        log(`❌ Auth error: ${signUpError.message}`);
        setRunning(false);
        return;
      }
      log(`✅ Auth success. User ID: ${signUpData.user?.id}`);

      log("2. Waiting 2 seconds for triggers to process...");
      await new Promise((r) => setTimeout(r, 2000));

      log("3. Testing Profile fetching...");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", signUpData.user?.id)
        .single();

      if (profileError) {
        log(`❌ Profile fetch error: ${JSON.stringify(profileError)}`);
      } else {
        log(`✅ Profile fetch success: ${profile.name}`);
      }

      log("4. Testing Storage Upload...");
      const blob = new Blob(["Debug file content"], { type: "text/plain" });
      const storagePath = `${signUpData.user?.id}/debug.txt`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from("materials")
        .upload(storagePath, blob, { upsert: true });

      if (storageError) {
        log(`❌ Storage upload error: ${storageError.message}`);
      } else {
        log(`✅ Storage upload success.`);
      }

      log("5. Testing DB Insert into materials...");
      const { data: dbData, error: dbError } = await supabase
        .from("materials")
        .insert({
          title: "Debug Material",
          subject: "Debug",
          semester: "Sem 1",
          description: "Debug test",
          tags: ["debug"],
          file_type: "txt",
          file_name: "debug.txt",
          file_size: "1KB",
          file_path: storagePath,
          uploader_id: signUpData.user?.id,
          uploader_name: "Debug User"
        })
        .select()
        .single();

      if (dbError) {
        log(`❌ DB insert error: ${JSON.stringify(dbError)}`);
      } else {
        log(`✅ DB insert success. Material ID: ${dbData.id}`);
      }

      log("6. Testing Storage Download...");
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from("materials")
        .download(storagePath);

      if (downloadError) {
        log(`❌ Storage download error: ${downloadError.message}`);
      } else {
        log(`✅ Storage download success. Size: ${downloadData?.size} bytes.`);
      }

      log("7. Testing Session cleanup...");
      await supabase.auth.signOut();
      log("✅ Diagnostics complete.");

    } catch (e) {
      log(`❌ Unhandled exception: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Diagnostics Dashboard</h1>
        <p className="text-muted-foreground">Run this tool to verify your Supabase database and storage configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={running}>
            {running ? "Running tests..." : "Run Diagnostics"}
          </Button>

          <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-1 h-96 overflow-y-auto">
            {logs.length === 0 && <span className="text-muted-foreground">No logs yet. Click run to start testing.</span>}
            {logs.map((l, i) => (
              <div key={i} className={l.includes("❌") ? "text-destructive" : l.includes("✅") ? "text-green-600" : ""}>
                {l}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
