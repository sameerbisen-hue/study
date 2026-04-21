import { Link } from "react-router-dom";
import { Bookmark, Download, FileText, Image as ImageIcon, Presentation, StickyNote, ThumbsUp, Star, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import type { Material } from "@/services/types";
import { bookmarks, materials, useStore, select } from "@/services/store";
import { fileTypeLabel } from "@/services/labels";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fileIcon = {
  pdf: FileText,
  docx: FileText,
  ppt: Presentation,
  image: ImageIcon,
  notes: StickyNote,
};

export function MaterialCard({ material }: { material: Material }) {
  const me = useStore(select.currentUser);
  const bm = useStore(select.bookmarks);
  const Icon = fileIcon[material.fileType];
  const userId = me?.id;
  const upvoted = userId ? material.upvotedBy.includes(userId) : false;
  const isBookmarked = bm.includes(material.id);
  const canDelete = me ? me.role === "admin" || material.uploaderId === me.id : false;

  const handleDelete = async () => {
    const ok = await materials.removeIfAllowed(material.id);
    if (ok) toast({ title: "Material deleted", description: material.title });
  };

  return (
    <Card className="group overflow-hidden border-border/60 hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200 bg-card">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wide">
                {fileTypeLabel[material.fileType]}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              bookmarks.toggle(material.id);
            }}
            aria-label="Bookmark"
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} />
          </Button>
        </div>
        <Link to={`/material/${material.id}`} className="block">
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition">
            {material.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{material.subject}</Badge>
          <Badge variant="outline">{material.semester}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          by <span className="font-medium text-foreground">{material.uploaderName}</span> ·{" "}
          {formatDistanceToNow(new Date(material.uploadedAt), { addSuffix: true })}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0 gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            onClick={(e) => {
              e.preventDefault();
              materials.toggleUpvote(material.id);
            }}
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-1 transition",
              upvoted ? "text-primary font-semibold" : "hover:text-foreground",
            )}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", upvoted && "fill-primary")} />
            {material.upvotes}
          </button>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            {material.ratingAvg || "—"}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {material.downloads}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Delete material"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this material?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{material.title}" will be permanently removed along with its reviews. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link to={`/material/${material.id}`}>View</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
