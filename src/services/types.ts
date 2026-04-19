export type FileType = "pdf" | "docx" | "ppt" | "image" | "notes";

export type BadgeType =
  | "top-uploader"
  | "helpful-reviewer"
  | "most-upvoted"
  | "active-contributor"
  | "new-member";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  semester?: string;
  joinedAt: string;
  uploadCount: number;
  totalUpvotes: number;
  reviewCount: number;
  badges: BadgeType[];
  role: "student" | "admin";
  blocked?: boolean;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  semester: string;
  description: string;
  tags: string[];
  fileType: FileType;
  fileName: string;
  fileSize: string;
  fileDataUrl?: string; // base64 data URL (legacy, not used with Supabase)
  filePath?: string;   // Supabase Storage path
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar?: string;
  uploadedAt: string;
  upvotes: number;
  upvotedBy: string[];
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface Review {
  id: string;
  materialId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ReportReason =
  | "wrong-content"
  | "duplicate-file"
  | "corrupted-file"
  | "inappropriate"
  | "spam"
  | "other";

export interface Report {
  id: string;
  materialId: string;
  materialTitle: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  message?: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}
