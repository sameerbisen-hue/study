import { useEffect } from "react";
import { Trophy, Upload, ThumbsUp, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, select, users } from "@/services/store";
import type { User } from "@/services/types";

export default function Leaderboard() {
  useEffect(() => { users.loadAll(); }, []);
  const all = useStore(select.users).filter((u) => u.role === "student");

  const byUploads = [...all].sort((a, b) => b.uploadCount - a.uploadCount);
  const byUpvotes = [...all].sort((a, b) => b.totalUpvotes - a.totalUpvotes);
  const byReviews = [...all].sort((a, b) => b.reviewCount - a.reviewCount);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Trophy className="text-warning" /> Leaderboard</h1>
        <p className="text-muted-foreground">Top students powering StudyShare.</p>
      </div>
      <Tabs defaultValue="uploaders">
        <TabsList>
          <TabsTrigger value="uploaders"><Upload className="h-3.5 w-3.5" /> Top Uploaders</TabsTrigger>
          <TabsTrigger value="upvoted"><ThumbsUp className="h-3.5 w-3.5" /> Most Upvoted</TabsTrigger>
          <TabsTrigger value="reviewers"><MessageSquare className="h-3.5 w-3.5" /> Helpful Reviewers</TabsTrigger>
        </TabsList>
        <TabsContent value="uploaders"><LeaderTable users={byUploads} metric="uploadCount" metricLabel="Uploads" /></TabsContent>
        <TabsContent value="upvoted"><LeaderTable users={byUpvotes} metric="totalUpvotes" metricLabel="Upvotes" /></TabsContent>
        <TabsContent value="reviewers"><LeaderTable users={byReviews} metric="reviewCount" metricLabel="Reviews" /></TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderTable({ users, metric, metricLabel }: { users: User[]; metric: keyof User; metricLabel: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Rankings</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {users.map((u, i) => (
          <div
            key={u.id}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg transition ${
              i === 0 ? "bg-warning/10 border border-warning/30" : i < 3 ? "bg-accent/40" : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-7 text-center text-sm font-bold ${i === 0 ? "text-warning" : "text-muted-foreground"}`}>#{i + 1}</span>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {(() => {
                    const displayName = u.name && u.name.trim() && u.name !== "User" ? u.name : u.email?.split("@")[0] || "User";
                    return displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {u.name && u.name.trim() && u.name !== "User" ? u.name : u.email?.split("@")[0] || "User"}
                </div>
                {u.name && u.name.trim() && u.name !== "User" && u.email && (
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{u[metric] as number}</div>
              <div className="text-xs text-muted-foreground">{metricLabel}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
