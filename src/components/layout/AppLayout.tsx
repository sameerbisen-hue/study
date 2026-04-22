import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { LogOut, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth, useStore, select } from "@/services/store";

export default function AppLayout() {
  const me = useStore(select.currentUser);
  const loading = useStore((s) => s.loading);
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [q, setQ] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // While auth state is being resolved, show nothing (avoid flash redirect)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!me) return <Navigate to="/login" replace />;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/library?q=${encodeURIComponent(q)}`);
  };

  const onLogout = async () => {
    await auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-2 border-b bg-card/80 backdrop-blur px-3 sticky top-0 z-30">
            <SidebarTrigger />
            <form onSubmit={onSearch} className="flex-1 max-w-md mx-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search materials, subjects, tags..."
                  className="pl-9 h-9 bg-background"
                />
              </div>
            </form>
            <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-muted transition"
            >
              <span className="hidden sm:block text-sm font-medium">
                {me.name && me.name.trim() && me.name !== "User" ? me.name : me.email?.split("@")[0] || "User"}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {(() => {
                    const displayName = me.name && me.name.trim() && me.name !== "User" ? me.name : me.email?.split("@")[0] || "User";
                    const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    return initials || "U";
                  })()}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
