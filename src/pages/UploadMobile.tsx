import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/services/store";
import { Upload as UploadIcon, FileUp, X, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { materials } from "@/services/store";
import type { FileType } from "@/services/types";

export default function UploadMobile() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("Sem 1");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [fileType, setFileType] = useState<FileType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const onFile = (f?: File) => {
    if (!f) return;
    
    // Mobile-specific file size check (lower limit for mobile)
    const mobileSizeLimit = 25 * 1024 * 1024; // 25MB for mobile
    const desktopSizeLimit = 50 * 1024 * 1024; // 50MB for desktop
    const sizeLimit = isMobile ? mobileSizeLimit : desktopSizeLimit;
    
    if (f.size > sizeLimit) {
      toast({
        title: "File too large",
        description: isMobile 
          ? "Mobile uploads must be smaller than 25MB." 
          : "Files must be smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(f);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "docx" || ext === "doc") setFileType("docx");
    else if (ext === "ppt" || ext === "pptx") setFileType("ppt");
    else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) setFileType("image");
    else setFileType("notes");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !file) {
      toast({ title: "Missing info", description: "Title, subject and a file are required.", variant: "destructive" });
      return;
    }

    // Check network connectivity
    if (!isOnline) {
      toast({ title: "No connection", description: "Please check your internet connection and try again.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(10);
    setRetryCount(0);

    // Mobile-specific upload with retry logic
    const attemptUpload = async (attempt: number = 1): Promise<void> => {
      const maxRetries = isMobile ? 3 : 1; // More retries on mobile
      
      try {
        setProgress(20);
        
        const newMat = await materials.upload({
          title,
          subject,
          semester,
          description,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          file,
          fileType,
          fileName: file.name,
          fileSize: file.size,
        });

        setProgress(100);
        toast({ title: "Upload complete!", description: "Your material is now in the library." });
        navigate(`/material/${newMat.id}`);
        
      } catch (err) {
        console.error(`Upload attempt ${attempt} failed:`, err);
        
        if (attempt < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          setProgress(30 + (attempt * 10));
          
          toast({
            title: `Upload failed (attempt ${attempt}/${maxRetries})`,
            description: isMobile 
              ? "Retrying... Make sure you have a stable connection." 
              : "Retrying upload...",
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryCount(attempt);
          return attemptUpload(attempt + 1);
        } else {
          // Final failure
          clearInterval(interval);
          const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
          
          // Mobile-specific error messages
          if (isMobile) {
            if (errorMessage.includes("network") || errorMessage.includes("connection")) {
              toast({
                title: "Mobile Network Issue",
                description: "Check your connection and try switching to WiFi.",
                variant: "destructive",
              });
            } else if (errorMessage.includes("timeout")) {
              toast({
                title: "Upload Timeout",
                description: "Mobile uploads may take longer. Try smaller files.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Mobile Upload Failed",
                description: "Try switching to WiFi or a different browser.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Upload failed",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      }
    };

    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 5));
    }, 800);

    try {
      await attemptUpload();
    } finally {
      clearInterval(interval);
      setUploading(false);
      setRetryCount(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Upload study material</h1>
        <p className="text-muted-foreground">Help your peers - share notes, slides, or past papers.</p>
      </div>

      {/* Mobile-specific network indicator */}
      {isMobile && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">No connection</span>
                </>
              )}
              {isMobile && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Max file size: 25MB
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UploadIcon className="h-5 w-5 text-primary" /> 
            Material details
            {isMobile && <span className="text-xs text-muted-foreground">(Mobile optimized)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>File</Label>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
                className={`flex flex-col items-center justify-center gap-2 p-6 md:p-8 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-accent/40 transition cursor-pointer text-center ${isMobile ? 'p-6' : 'p-8'}`}
              >
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm font-medium">{file ? file.name : "Drop a file here or click to browse"}</div>
                <div className="text-xs text-muted-foreground">
                  {isMobile ? "Mobile: PDF, DOCX, PPT, images (max 25MB)" : "PDF, DOCX, PPT, images, notes"}
                </div>
                <Input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => onFile(e.target.files?.[0] || undefined)} 
                  accept=".pdf,.docx,.doc,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.md,.txt" 
                />
              </label>
              {file && (
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                  <span className="truncate">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <button type="button" onClick={() => setFile(null)}><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Linear Algebra Midterm Notes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Linear Algebra" />
              </div>
              <div className="space-y-2">
                <Label>Semester / Class</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File type</Label>
                <Select value={fileType} onValueChange={(v: FileType) => setFileType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="ppt">PPT</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the material..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. calculus, exam, notes (comma separated)" />
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading{retryCount > 0 ? ` (retry ${retryCount})` : ""}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {isMobile && (
                  <p className="text-xs text-muted-foreground">
                    Mobile uploads may take longer. Please keep the app open.
                  </p>
                )}
              </div>
            )}

            <Button type="submit" disabled={uploading || !isOnline} className="w-full">
              {uploading ? "Uploading..." : "Upload Material"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
