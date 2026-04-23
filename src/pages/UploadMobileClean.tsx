import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/services/store";
import { Upload as UploadIcon, FileUp, X } from "lucide-react";
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

export default function UploadMobileClean() {
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
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // File validation
  const onFile = (f?: File) => {
    if (!f) return;
    
    // Mobile file size limit (25MB)
    const mobileSizeLimit = 25 * 1024 * 1024;
    const sizeLimit = isMobile ? mobileSizeLimit : 50 * 1024 * 1024;
    
    if (f.size > sizeLimit) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const limitMB = (sizeLimit / (1024 * 1024)).toFixed(2);
      toast({
        title: "File too large",
        description: `Maximum file size is ${limitMB}MB`,
        variant: "destructive",
      });
      return;
    }
    
    // File type validation
    const allowedTypes = ['pdf', 'docx', 'doc', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'md', 'txt'];
    const fileExtension = f.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
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
  };

  // Upload function
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

    try {
      const newMat = await materials.upload({
        title,
        subject,
        semester,
        description,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        file,
        fileType,
        fileName: file.name,
        fileSize: file.size.toString(),
      });

      setProgress(100);
      toast({ 
        title: "Upload successful!", 
        description: "Your material has been uploaded to the library." 
      });
      
      navigate(`/material/${newMat.id}`);
      
    } catch (err) {
      console.error("Upload failed:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      
      let userFriendlyMessage = "Upload failed. Please try again.";
      
      if (errorMessage.includes("Bucket not found") || errorMessage.includes("storage")) {
        userFriendlyMessage = "Storage configuration error. Please try again.";
      } else if (errorMessage.includes("row-level security") || errorMessage.includes("permission")) {
        userFriendlyMessage = "Permission denied. Please sign in again.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        userFriendlyMessage = "Network error. Please check your connection.";
      } else if (errorMessage.includes("timeout")) {
        userFriendlyMessage = "Upload timeout. Try with a smaller file.";
      } else if (errorMessage.includes("large") || errorMessage.includes("size")) {
        userFriendlyMessage = "File too large. Please use a smaller file.";
      }
      
      toast({
        title: "Upload failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Upload study material</h1>
        <p className="text-muted-foreground">Help your peers - share notes, slides, or past papers.</p>
      </div>

      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UploadIcon className="h-5 w-5 text-primary" /> 
            Material details
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
                  {isMobile ? "PDF, DOCX, PPT, images (max 25MB)" : "PDF, DOCX, PPT, images, notes"}
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
                  <button type="button" onClick={() => setFile(null)}>
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
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={uploading || !currentUser} 
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Material"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
