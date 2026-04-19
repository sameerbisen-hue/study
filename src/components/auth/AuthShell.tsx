import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { ReactNode } from "react";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-primary text-primary-foreground p-12 flex-col justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 w-fit">
          <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">StudyShare</span>
        </button>
        <div className="space-y-4 max-w-md relative z-10">
          <h1 className="text-4xl font-bold leading-tight">Share notes. Learn faster. Together.</h1>
          <p className="text-primary-foreground/80">
            Upload, discover and review study materials curated by students like you.
          </p>
        </div>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudyShare</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="text-sm text-muted-foreground text-center">{footer}</div>}
          <p className="text-xs text-muted-foreground text-center">
            <Link to="/" className="hover:text-foreground">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
