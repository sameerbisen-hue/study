import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Flame, ThumbsUp, Trophy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { materials, useStore, select, users } from "@/services/store";

export default function Dashboard() {
  useEffect(() => {
    materials.loadAll();
    users.loadAll();
  }, []);

  useStore(select.materials);
  const me = useStore(select.currentUser);
  const recent = materials.recent();
  const trending = materials.trending();
  const topUpvoted = materials.topUpvoted();
  const leaders = [...users.list()]
    .filter((u) => u.role === "student")
    .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
    .slice(0, 5);

  if (!me) return null;

  const stats = [
    { label: "My Uploads", value: me.uploadCount, icon: BookOpen, color: "text-primary" },
    { label: "Total Upvotes", value: me.totalUpvotes, icon: ThumbsUp, color: "text-success" },
    { label: "Reviews", value: me.reviewCount, icon: Flame, color: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 md:p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-primary-foreground/80">Welcome back, {(me.name || "User").split(" ")[0]} 👋</p>
            <h1 className="text-2xl md:text-3xl font-bold">Ready to share what you've learned today?</h1>
          </div>
          <Button asChild size="lg" variant="secondary" className="shadow-md">
            <Link to="/upload"><Upload className="h-4 w-4" /> Upload material</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <SectionHeader title="🔥 Trending now" link="/library" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trending.slice(0, 3).map((m) => <MaterialCard key={m.id} material={m} />)}
      </div>

      <SectionHeader title="🆕 Recent uploads" link="/library" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recent.slice(0, 3).map((m) => <MaterialCard key={m.id} material={m} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-primary" /> Most upvoted</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/library">See all <ArrowRight className="h-3 w-3" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUpvoted.slice(0, 5).map((m, i) => (
              <Link key={m.id} to={`/material/${m.id}`} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted transition">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.subject} · {m.uploaderName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary font-semibold">
                  <ThumbsUp className="h-3.5 w-3.5" /> {m.upvotes}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Leaderboard</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/leaderboard">Full <ArrowRight className="h-3 w-3" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaders.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <div>
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.uploadCount} uploads</div>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold">{u.totalUpvotes} ▲</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button asChild variant="ghost" size="sm"><Link to={link}>See all <ArrowRight className="h-3 w-3" /></Link></Button>
    </div>
  );
}
