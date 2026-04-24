import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/services/store";
import { Upload as UploadIcon, FileUp, X, LogOut, FileText, Image as ImageIcon, Presentation, File as FileIcon, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { materials } from "@/services/store";
import { supabase } from "@/lib/supabase";
import type { FileType } from "@/services/types";

type Step = "file" | "details" | "review";

const fileTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pdf: { icon: <FileText className="h-6 w-6" />, label: "PDF Document", color: "bg-red-100 text-red-700" },
  docx: { icon: <FileText className="h-6 w-6" />, label: "Word Document", color: "bg-blue-100 text-blue-700" },
  ppt: { icon: <Presentation className="h-6 w-6" />, label: "Presentation", color: "bg-orange-100 text-orange-700" },
  image: { icon: <ImageIcon className="h-6 w-6" />, label: "Image", color: "bg-purple-100 text-purple-700" },
  notes: { icon: <FileIcon className="h-6 w-6" />, label: "Text Notes", color: "bg-green-100 text-green-700" },
};

const getFileIcon = (type: FileType) => fileTypeConfig[type]?.icon || <FileIcon className="h-6 w-6" />;
const getFileLabel = (type: FileType) => fileTypeConfig[type]?.label || "Document";
const getFileColor = (type: FileType) => fileTypeConfig[type]?.color || "bg-gray-100 text-gray-700";

export default function Upload() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const [step, setStep] = useState<Step>("file");
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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Mobile detection
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Enhanced authentication check with session validation
  useEffect(() => {
    const checkAuth = async () => {
      setAuthStatus('checking');
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setAuthStatus('unauthenticated');
          setSessionExpired(true);
          return;
        }
        
        if (!session) {
          console.log("No session found");
          setAuthStatus('unauthenticated');
          setSessionExpired(true);
          return;
        }
        
        // Check if session is expired
        if (session.expires_at && Date.now() > session.expires_at * 1000) {
          console.log("Session expired");
          setAuthStatus('unauthenticated');
          setSessionExpired(true);
          await supabase.auth.signOut();
          return;
        }
        
        // Validate user exists
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User validation error:", userError);
          setAuthStatus('unauthenticated');
          setSessionExpired(true);
          await supabase.auth.signOut();
          return;
        }
        
        setAuthStatus('authenticated');
        setSessionExpired(false);
        
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthStatus('unauthenticated');
        setSessionExpired(true);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      
      if (event === 'SIGNED_IN' && session) {
        setAuthStatus('authenticated');
        setSessionExpired(false);
      } else if (event === 'SIGNED_OUT') {
        setAuthStatus('unauthenticated');
        setSessionExpired(true);
      } else if (event === 'TOKEN_REFRESHED') {
        setAuthStatus('authenticated');
        setSessionExpired(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // File validation with mobile-friendly detection
  const onFile = (f?: File) => {
    if (!f) return;

    console.log("File selected:", f.name, "Type:", f.type, "Size:", f.size);

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

    // File type validation (extension first, then MIME type for mobile)
    const fileExtension = f.name.split('.').pop()?.toLowerCase() || '';

    // MIME type to extension mapping for mobile where extension might be missing
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'text/markdown': 'md',
      'text/plain': 'txt',
      'application/octet-stream': fileExtension, // Fallback to extension for generic type
    };

    // Detect file type from extension or MIME type
    let detectedExt = fileExtension;
    if (!fileExtension || fileExtension === 'bin' || fileExtension === 'octet-stream') {
      detectedExt = mimeToExt[f.type] || fileExtension;
    }

    const allowedTypes = ['pdf', 'docx', 'doc', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'md', 'txt'];

    if (!detectedExt || !allowedTypes.includes(detectedExt)) {
      toast({
        title: "File type not supported",
        description: `File type "${f.type || detectedExt}" is not supported. Please upload PDF, DOCX, PPT, images, or text files.`,
        variant: "destructive",
      });
      return;
    }

    setFile(f);
    const ext = detectedExt;
    if (ext === "pdf") setFileType("pdf");
    else if (ext === "docx" || ext === "doc") setFileType("docx");
    else if (ext === "ppt" || ext === "pptx") setFileType("ppt");
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) setFileType("image");
    else setFileType("notes");

    // Auto-set title from filename if empty
    if (!title) {
      const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt.replace(/[_-]/g, " "));
    }

    // Move to details step
    setStep("details");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  const canProceedToReview = title.trim() && subject.trim();

  const resetForm = () => {
    setStep("file");
    setTitle("");
    setSubject("");
    setSemester("Sem 1");
    setDescription("");
    setTags("");
    setFileType("pdf");
    setFile(null);
    setProgress(0);
  };

  // Upload function with enhanced error handling
  const onSubmit = async () => {
    if (!title || !subject || !file) {
      toast({
        title: "Missing information",
        description: "Please fill in title, subject, and select a file",
        variant: "destructive"
      });
      return;
    }

    if (authStatus !== 'authenticated') {
      toast({
        title: "Not authenticated",
        description: "Please sign in to upload files",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate progress for better UX on mobile
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      console.log("Starting upload:", { title, subject, fileName: file?.name, fileSize: file?.size });

      const newMat = await materials.upload({
        title: title.trim(),
        subject: subject.trim(),
        semester,
        description: description.trim(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        file,
        fileType,
        fileName: file.name,
        fileSize: file.size.toString(),
      });

      clearInterval(progressInterval);
      setProgress(100);
      toast({
        title: "Upload successful!",
        description: "Your material has been uploaded to the library."
      });

      navigate(`/material/${newMat.id}`);

    } catch (err) {
      clearInterval(progressInterval);
      console.error("Upload failed:", err);

      const errorMessage = err instanceof Error ? err.message : "Upload failed";

      let userFriendlyMessage = "Upload failed. Please try again.";

      if (errorMessage.includes("row-level security") || errorMessage.includes("permission")) {
        userFriendlyMessage = "Permission denied. Please sign in again.";
        setSessionExpired(true);
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        userFriendlyMessage = "Network error. Please check your connection.";
      } else if (errorMessage.includes("timeout")) {
        userFriendlyMessage = "Upload timeout. Try with a smaller file.";
      } else if (errorMessage.includes("large") || errorMessage.includes("size")) {
        userFriendlyMessage = "File too large. Please use a smaller file.";
      } else if (errorMessage.includes("bucket") || errorMessage.includes("storage")) {
        userFriendlyMessage = "Storage error. The upload bucket may not be configured.";
      }

      toast({
        title: "Upload failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      setUploading(false);
      setProgress(0);
    }
  };

  // Show authentication prompt if not authenticated
  if (authStatus === 'unauthenticated' || sessionExpired) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <LogOut className="h-12 w-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground text-sm">
                You need to sign in to upload files. Your session may have expired.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking authentication
  if (authStatus === 'checking') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { key: "file", label: "Select File" },
        { key: "details", label: "Add Details" },
        { key: "review", label: "Review & Upload" },
      ].map((s, index) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              step === s.key
                ? "bg-primary text-primary-foreground"
                : step === "review" && s.key === "details"
                ? "bg-primary/20 text-primary"
                : step === "review" && s.key === "file"
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-bold">
              {index + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {index < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderFileStep = () => (
    <div className="space-y-6">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-4 p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <UploadIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-lg">
            {isMobile ? "Tap to select a file" : "Drop your file here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse from your device
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["PDF", "DOCX", "PPT", "Images", "TXT"].map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Max file size: {isMobile ? "25MB" : "50MB"}
        </p>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0] || undefined);
            e.target.value = ''; // Reset for same file selection
          }}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.md,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,text/plain,text/markdown"
        />
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <FileText className="h-5 w-5" />, label: "Past Papers", desc: "Exams & solutions" },
          { icon: <Presentation className="h-5 w-5" />, label: "Lectures", desc: "Slides & notes" },
          { icon: <FileIcon className="h-5 w-5" />, label: "Assignments", desc: "Homework & projects" },
          { icon: <Sparkles className="h-5 w-5" />, label: "Resources", desc: "References & guides" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 text-center hover:bg-muted transition-colors"
          >
            <div className="text-primary">{item.icon}</div>
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* Selected File Preview */}
      {file && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className={`p-3 rounded-lg ${getFileColor(fileType)}`}>
            {getFileIcon(fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB · {getFileLabel(fileType)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("file")}
            className="shrink-0"
          >
            Change
          </Button>
        </div>
      )}

      <Separator />

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-1">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Linear Algebra Midterm Notes 2024"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="flex items-center gap-1">
            Subject <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Linear Algebra"
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select value={fileType} onValueChange={(v: FileType) => setFileType(v)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="docx">Word Document</SelectItem>
                <SelectItem value="ppt">Presentation</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="notes">Text Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description to help others understand what's in this material..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="calculus, exam-2024, midterm, professor-smith (comma separated)"
          />
          <p className="text-xs text-muted-foreground">
            Add relevant tags to help others find this material
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setStep("file")}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button
          onClick={() => setStep("review")}
          disabled={!canProceedToReview}
          className="flex-1"
        >
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* File Summary */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileIcon className="h-4 w-4" /> File Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getFileColor(fileType)}`}>
              {getFileIcon(fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file?.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file!.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Summary */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Material Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="font-medium">{title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="font-medium">{semester}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{getFileLabel(fileType)}</p>
            </div>
          </div>
          {description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{description}</p>
            </div>
          )}
          {tags && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-medium">Uploading...</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground">
            Please don't close this page until upload completes
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setStep("details")}
          disabled={uploading}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Edit Details
        </Button>
        <Button
          onClick={onSubmit}
          disabled={uploading || !canProceedToReview}
          className="flex-1"
        >
          {uploading ? "Uploading..." : "Upload Material"}
        </Button>
      </div>

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span>By uploading, you agree to share this material with the community</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Share Study Material</h1>
        <p className="text-muted-foreground">
          Help your peers by uploading notes, slides, or past papers
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content Card */}
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6">
          {step === "file" && renderFileStep()}
          {step === "details" && renderDetailsStep()}
          {step === "review" && renderReviewStep()}
        </CardContent>
      </Card>

      {/* Cancel Option */}
      <div className="text-center mt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/library")}
          className="text-muted-foreground"
        >
          Cancel and go back
        </Button>
      </div>
    </div>
  );
}
