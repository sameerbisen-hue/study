import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/services/store";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await auth.signup(name, email, password);
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Signup failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: "Account created!",
      description: "Your account is ready. Please sign in.",
    });
    navigate("/login");
  };

  return (
    <AuthShell
      title="Create your student account"
      subtitle="Free for students. No credit card required."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">University email</Label>
          <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-elegant">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}