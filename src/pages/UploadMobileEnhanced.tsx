import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/services/store";
import { Upload as UploadIcon, FileUp, X, Wifi, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
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

export default function UploadMobileEnhanced() {
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
  const [connectionType, setConnectionType] = useState<string>('Unknown');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Enhanced mobile detection
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
    console.log("Mobile device detected:", mobile);
  }, []);

  // Enhanced network monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Network status: Online");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("Network status: Offline");
      toast({
        title: "Connection Lost",
        description: "Please check your internet connection",
        variant: "destructive",
      });
    };
    
    const handleConnectionChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(String(connection.effectiveType || 'Unknown'));
        console.log("Connection type:", connection.effectiveType);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connectionchange', handleConnectionChange);
    
    // Initial connection check
    handleConnectionChange();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectionchange', handleConnectionChange);
    };
  }, []);

  // Enhanced file validation
  const onFile = useCallback((f?: File) => {
    if (!f) return;
    
    setUploadError(null);
    
    // Mobile-specific file size check
    const mobileSizeLimit = 25 * 1024 * 1024; // 25MB for mobile
    const desktopSizeLimit = 50 * 1024 * 1024; // 50MB for desktop
    const sizeLimit = isMobile ? mobileSizeLimit : desktopSizeLimit;
    
    if (f.size > sizeLimit) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const limitMB = (sizeLimit / (1024 * 1024)).toFixed(2);
      setUploadError(`File too large: ${sizeMB}MB. Maximum allowed: ${limitMB}MB${isMobile ? ' for mobile' : ''}`);
      toast({
        title: "File too large",
        description: `Maximum file size is ${limitMB}MB${isMobile ? ' for mobile devices' : ''}`,
        variant: "destructive",
      });
      return;
    }
    
    // File type validation
    const allowedTypes = ['pdf', 'docx', 'doc', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'md', 'txt'];
    const fileExtension = f.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      setUploadError(`File type not supported: ${fileExtension || 'unknown'}`);
      toast({
        title: "File type not supported",
        description: "Please upload PDF, DOCX, PPT, images, or text files",
        variant: "destructive",
      });
      return;
    }
    
    setFile(f);
    const ext = fileExtension;
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "docx" || ext === "doc") setFileType("docx");
    else if (ext === "ppt" || ext === "pptx") setFileType("ppt");
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) setFileType("image");
    else setFileType("notes");
    
    console.log("File selected:", f.name, "Size:", (f.size / (1024 * 1024)).toFixed(2) + "MB");
  }, [isMobile]);

  // Enhanced upload with better error handling
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !subject || !file) {
      toast({ 
        title: "Missing information", 
        description: "Please fill in title, subject, and select a file", 
        variant: "destructive" 
      });
      return;
    }

    if (!isOnline) {
      toast({ 
        title: "No internet connection", 
        description: "Please check your connection and try again", 
        variant: "destructive" 
      });
      return;
    }

    if (!currentUser) {
      toast({ 
        title: "Not logged in", 
        description: "Please sign in to upload files", 
        variant: "destructive" 
      });
      navigate("/login");
      return;
    }

    setUploading(true);
    setProgress(10);
    setRetryCount(0);
    setUploadError(null);

    // Enhanced upload with better retry logic
    const attemptUpload = async (attempt: number = 1): Promise<void> => {
      const maxRetries = isMobile ? 3 : 2;
      
      try {
        setProgress(20);
        
        console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${file.name}`);
        
        const newMat = await materials.upload({
          title,
          subject,
          semester,
          description,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          file,
          fileType,
          fileName: file.name,
          fileSize: Number(file.size),
        });

        setProgress(100);
        toast({ 
          title: "Upload successful!", 
          description: "Your material has been uploaded to the library." 
        });
        
        console.log("Upload successful:", newMat.id);
        navigate(`/material/${newMat.id}`);
        
      } catch (err) {
        console.error(`Upload attempt ${attempt} failed:`, err);
        
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setUploadError(errorMessage);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          setProgress(30 + (attempt * 15));
          
          toast({
            title: `Upload failed (retry ${attempt}/${maxRetries})`,
            description: isMobile 
              ? "Retrying... Please ensure stable connection." 
              : "Retrying upload...",
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryCount(attempt);
          return attemptUpload(attempt + 1);
        } else {
          // Final failure with detailed error message
          clearInterval(interval);
          
          let userFriendlyMessage = "Upload failed. Please try again.";
          
          if (errorMessage.includes("Bucket not found") || errorMessage.includes("storage")) {
            userFriendlyMessage = "Storage error: Please contact support or try again later.";
          } else if (errorMessage.includes("row-level security") || errorMessage.includes("permission")) {
            userFriendlyMessage = "Permission denied: Please check your account settings.";
          } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
            userFriendlyMessage = "Network error: Please check your internet connection.";
          } else if (errorMessage.includes("timeout")) {
            userFriendlyMessage = "Upload timeout: Please try with a smaller file or better connection.";
          } else if (errorMessage.includes("large") || errorMessage.includes("size")) {
            userFriendlyMessage = "File too large: Please try with a smaller file.";
          } else {
            userFriendlyMessage = `Upload failed: ${errorMessage}`;
          }
          
          toast({
            title: "Upload failed",
            description: userFriendlyMessage,
            variant: "destructive",
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            ),
          });
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      console.log("No current user, redirecting to login");
      navigate("/login");
    }
  }, [currentUser, navigate]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Upload study material</h1>
        <p className="text-muted-foreground">Help your peers - share notes, slides, or past papers.</p>
      </div>

      {/* Enhanced Network Status */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
                <span className="text-xs text-muted-foreground">
                  Mobile • {connectionType}
                </span>
              )}
            </div>
            {isMobile && (
              <span className="text-xs text-muted-foreground">
                Max: 25MB
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {uploadError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-orange-800">{uploadError}</p>
              </div>
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
                className="flex flex-col items-center justify-center gap-2 p-6 md:p-8 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-accent/40 transition cursor-pointer text-center"
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
                  <button type="button" onClick={() => { setFile(null); setUploadError(null); }}>
                    <X className="h-4 w-4" />
                  </button>
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
                    Mobile uploads may take longer. Please keep the app open and maintain a stable connection.
                  </p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={uploading || !isOnline || !currentUser} 
              className="w-full"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Material"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
