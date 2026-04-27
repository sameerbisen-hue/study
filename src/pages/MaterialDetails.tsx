import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Download, Flag, Star, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { formatBytes } from "@/lib/utils";
import { bookmarks, materials, reports, reviews, useStore, select } from "@/services/store";
import { fileTypeLabel, reportReasonLabel } from "@/services/labels";
import type { ReportReason } from "@/services/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MaterialDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  useStore(select.materials);
  useStore(select.reviews);
  const me = useStore(select.currentUser);
  const bm = useStore(select.bookmarks);
  const material = materials.get(id);
  const list = reviews.forMaterial(id);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState<ReportReason>("wrong-content");
  const [reportMsg, setReportMsg] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (id) {
      materials.loadAll();
      reviews.loadForMaterial(id);
    }
  }, [id]);

  if (!material) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Material not found.</p>
        <Button asChild variant="link"><Link to="/library">Back to library</Link></Button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const upvoted = material.upvotedBy.includes(me.id);
  const isBookmarked = bm.includes(material.id);
  const canDelete = me.role === "admin" || material.uploaderId === me.id;

  const submitReview = async () => {
    if (!comment.trim()) return;
    try {
      await reviews.add(material.id, rating, comment);
      setComment("");
      setRating(5);
      toast({ title: "Review posted", description: "Thanks for sharing your feedback!" });
    } catch {
      toast({ title: "Failed to post review", variant: "destructive" });
    }
  };

  const submitReport = async () => {
    await reports.add(material.id, reason, reportMsg);
    setReportOpen(false);
    setReportMsg("");
    toast({ title: "Report sent", description: "Our admins will review it shortly." });
  };

  const onDownload = async () => {
    const ok = await materials.download(material.id);
    if (ok) {
      toast({ title: "Download started", description: material.fileName });
    } else {
      toast({ title: "File unavailable", description: "No downloadable file is attached.", variant: "destructive" });
    }
  };

  const onDelete = async () => {
    const ok = await materials.removeIfAllowed(material.id);
    if (ok) {
      toast({ title: "Material deleted", description: material.title });
      navigate("/library");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back</Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-card overflow-hidden">
            <div className="bg-gradient-primary h-32 relative">
              <div className="absolute inset-0 flex items-end p-6">
                <Badge variant="secondary" className="uppercase">{fileTypeLabel[material.fileType]}</Badge>
              </div>
            </div>
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">{material.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{material.subject}</Badge>
                <Badge variant="outline">{material.semester}</Badge>
                {material.tags.map((t) => <Badge key={t} variant="secondary">#{t}</Badge>)}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {(material.uploaderName || "User").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{material.uploaderName || "User"}</div>
                  <div className="text-xs text-muted-foreground">
                    Uploaded {formatDistanceToNow(new Date(material.uploadedAt), { addSuffix: true })} · {formatBytes(material.fileSize)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground/90">{material.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={onDownload} className="bg-gradient-primary hover:opacity-90"><Download className="h-4 w-4" /> Download</Button>
                <Button variant={upvoted ? "default" : "outline"} onClick={() => materials.toggleUpvote(material.id)}>
                  <ThumbsUp className={cn("h-4 w-4", upvoted && "fill-current")} /> {material.upvotes} Upvote
                </Button>
                <Button variant="outline" onClick={() => bookmarks.toggle(material.id)}>
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} /> {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive"><Flag className="h-4 w-4" /> Report</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report this material</DialogTitle>
                      <DialogDescription>Help us keep StudyShare clean. Admins will review your report.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Label>Reason</Label>
                      <Select value={reason} onValueChange={(v: ReportReason) => setReason(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(reportReasonLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Label>Additional details (optional)</Label>
                      <Textarea rows={3} value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="Anything else admins should know?" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                      <Button onClick={submitReport} variant="destructive">Send report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this material?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{material.title}" will be permanently removed. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-lg">Reviews ({list.length})</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 rounded-lg border bg-accent/30 p-4">
                <Label className="text-sm">Leave a review</Label>
                <StarPicker value={rating} onChange={setRating} />
                <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or what could be improved?" />
                <Button onClick={submitReview} size="sm" className="bg-gradient-primary hover:opacity-90">Post review</Button>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              ) : (
                list.map((r) => (
                  <div key={r.id} className="flex gap-3 border-b last:border-0 pb-4 last:pb-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-secondary text-xs">{(r.userName || "User").split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{r.userName || "User"}</div>
                        <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</div>
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "text-warning fill-warning" : "text-muted-foreground/40")} />
                        ))}
                      </div>
                      <p className="text-sm text-foreground/90">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Stat label="Upvotes" value={material.upvotes} />
              <Stat label="Downloads" value={material.downloads} />
              <Stat label="Average rating" value={`${material.ratingAvg || "—"} ★`} />
              <Stat label="Reviews" value={material.ratingCount} />
              <Stat label="File size" value={formatBytes(material.fileSize)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button type="button" key={i} onClick={() => onChange(i + 1)}>
          <Star className={cn("h-5 w-5 transition", i < value ? "text-warning fill-warning" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
