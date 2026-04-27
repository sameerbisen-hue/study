import { useEffect } from "react";
import { Mail, Calendar, BookOpen, ThumbsUp, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { useStore, select, materials } from "@/services/store";
import { format } from "date-fns";

export default function Profile() {
  useEffect(() => { materials.loadAll(); }, []);
  const me = useStore(select.currentUser);
  useStore(select.materials);
  
  if (!me) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  
  const myUploads = materials.list().filter((m) => m.uploaderId === me.id);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 shadow-card">
        <div className="h-32 bg-gradient-primary" />
        <CardContent className="-mt-12 space-y-4">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                {(me.name || "User").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <h1 className="text-2xl font-bold">{me.name || "User"}</h1>
              <p className="text-sm text-muted-foreground">@{me.username || "user"} · {me.semester || "—"}</p>
            </div>
          </div>
          {me.bio && <p className="text-sm">{me.bio}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {me.email}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {format(new Date(me.joinedAt), "MMM yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={BookOpen} label="Uploads" value={me.uploadCount} />
        <StatCard icon={ThumbsUp} label="Upvotes received" value={me.totalUpvotes} />
        <StatCard icon={MessageSquare} label="Reviews written" value={me.reviewCount} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">My uploads</h2>
        {myUploads.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No uploads yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myUploads.map((m) => <MaterialCard key={m.id} material={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle></CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}
