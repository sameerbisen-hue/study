import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/services/store";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await auth.resetPassword(email);
    setLoading(false);
    setSent(true);
    toast({ title: "Reset link sent", description: `Check ${email} for instructions.` });
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={<><Link to="/login" className="text-primary font-medium hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-lg border bg-accent/40 p-4 text-sm">
          If an account exists for <strong>{email}</strong>, a reset email is on its way.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-elegant">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
