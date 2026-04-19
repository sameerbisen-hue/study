import type { BadgeType, FileType, ReportReason } from "./types";

export const fileTypeLabel: Record<FileType, string> = {
  pdf: "PDF",
  docx: "DOCX",
  ppt: "PPT",
  image: "Image",
  notes: "Notes",
};

export const reportReasonLabel: Record<ReportReason, string> = {
  "wrong-content": "Wrong content",
  "duplicate-file": "Duplicate file",
  "corrupted-file": "Corrupted file",
  inappropriate: "Inappropriate content",
  spam: "Spam",
  other: "Other",
};

export const badgeMeta: Record<BadgeType, { label: string; description: string; color: string }> = {
  "top-uploader": { label: "Top Uploader", description: "Uploaded 20+ materials", color: "bg-primary text-primary-foreground" },
  "helpful-reviewer": { label: "Helpful Reviewer", description: "50+ reviews written", color: "bg-success text-success-foreground" },
  "most-upvoted": { label: "Most Upvoted", description: "300+ total upvotes", color: "bg-warning text-warning-foreground" },
  "active-contributor": { label: "Active Contributor", description: "Active every week", color: "bg-accent text-accent-foreground" },
  "new-member": { label: "New Member", description: "Joined recently", color: "bg-secondary text-secondary-foreground" },
};
