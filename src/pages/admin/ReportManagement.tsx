import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Trash2, CheckCircle2, X, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore, select, reports, materials, users } from "@/services/store";
import { reportReasonLabel } from "@/services/labels";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function ReportManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    reports.loadAll();
    materials.loadAll();
    users.loadAll();
  }, []);

  const reps = useStore(select.reports);
  useStore(select.materials);

  const filteredReports = reps.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.materialTitle.toLowerCase().includes(query) ||
      r.reporterName.toLowerCase().includes(query) ||
      reportReasonLabel[r.reason].toLowerCase().includes(query) ||
      r.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Flag className="text-destructive" /> Report Management</h1>
        <p className="text-muted-foreground">Review and act on user-submitted reports.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          placeholder="Search by material title, reporter, reason, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filteredReports.length === 0 && (
          <Card className="border-border/60"><CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No reports match your search." : "No reports yet."}
          </CardContent></Card>
        )}
        {filteredReports.map((r) => {
          const mat = materials.get(r.materialId);
          return (
            <Card key={r.id} className="border-border/60">
              <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {mat ? <Link to={`/material/${mat.id}`} className="hover:text-primary">{r.materialTitle}</Link> : r.materialTitle}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Reported by <strong>{r.reporterName}</strong> · {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant={r.status === "open" ? "destructive" : r.status === "resolved" ? "secondary" : "outline"}>{r.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="font-medium">{reportReasonLabel[r.reason]}</span>
                </div>
                {r.message && <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 italic">"{r.message}"</p>}
                {r.status === "open" && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (mat) await materials.removeIfAllowed(mat.id);
                        await reports.setStatus(r.id, "resolved");
                        toast({ title: "File removed", description: r.materialTitle });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove file
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (mat) {
                          await users.toggleBlock(mat.uploaderId);
                          toast({ title: "Uploader blocked" });
                        }
                      }}
                    >
                      Block uploader
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => { await reports.setStatus(r.id, "resolved"); toast({ title: "Marked resolved" }); }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => { await reports.setStatus(r.id, "dismissed"); toast({ title: "Dismissed" }); }}>
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
