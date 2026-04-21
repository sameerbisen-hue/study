import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";
import { auth, useStore } from "@/services/store";

export default function Login() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const loadingState = useStore(state => state.loading);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loadingState && currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, loadingState, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await auth.login(email, password);
    setIsSubmitting(false);
    if (!res.ok) {
      toast({ title: "Sign in failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!", description: "Signed in successfully." });
    navigate("/dashboard");
  };

  if (loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Enter your credentials to continue."
      footer={<>Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary hover:opacity-90 shadow-elegant">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
