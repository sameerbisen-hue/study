/**
 * store.ts — Supabase-backed service layer.
 *
 * Public API is kept identical to the old localStorage store so that
 * all pages (Dashboard, Library, Upload, etc.) work without changes.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  BadgeType,
  FileType,
  Material,
  Report,
  ReportReason,
  Review,
  User,
} from "./types";

export type { FileType, BadgeType, Material, Report, ReportReason, Review, User };

interface StoreState {
  currentUser: User | null;
  materials: Material[];
  users: User[];
  reviews: Review[];
  reports: Report[];
  bookmarks: string[];
  loading: boolean;
}

const defaultState: StoreState = {
  currentUser: null,
  materials: [],
  users: [],
  reviews: [],
  reports: [],
  bookmarks: [],
  loading: false,
};

let _setState: React.Dispatch<React.SetStateAction<StoreState>> = () => {};
let _state: StoreState = defaultState;

const StoreContext = createContext<StoreState>(defaultState);

function timeoutAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([promise, timeoutAfter(ms, message)]);
}

function patchState(patch: Partial<StoreState>) {
  _setState((prev) => {
    const next = { ...prev, ...patch };
    _state = next;
    return next;
  });
}

function clearAuthState() {
  patchState({
    currentUser: null,
    loading: false,
    bookmarks: [],
    materials: [],
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);
  _setState = setState;
  _state = state;

  useEffect(() => {
    let isMounted = true;
    let isSyncing = false;

    const syncAuthState = async () => {
      if (isSyncing) return;
      isSyncing = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (!session?.user) {
          clearAuthState();
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error || !user) {
          if (error && !error.message.includes('timed out') && !error.message.includes('network')) {
            await supabase.auth.signOut();
          }
          if (!isMounted) return;
          clearAuthState();
          return;
        }

        // Ensure profile exists
        const profile = await ensureProfile({
          userId: user.id,
          email: user.email,
          name:
            typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null,
        });

        if (!isMounted) return;

        if (!profile) {
          console.warn("Profile creation failed");
          clearAuthState();
          return;
        }

        patchState({ currentUser: profile, loading: false });

        // Load bookmarks in background without blocking
        bookmarks.loadForUser(profile.id).catch(error => {
          console.error("Failed to load bookmarks:", error);
        });
      } catch (error) {
        console.error("Auth state sync error:", error);
        if (!isMounted) return;
        clearAuthState();
      } finally {
        isSyncing = false;
      }
    };

    void syncAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "TOKEN_REFRESHED") {
        // Token was refreshed successfully, no action needed
        return;
      }

      if (event === "SIGNED_OUT") {
        clearAuthState();
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        const profile = await ensureProfile({
          userId: session.user.id,
          email: session.user.email,
          name: typeof session.user.user_metadata?.name === "string" ? session.user.user_metadata.name : null,
        });
        if (profile) {
          patchState({ currentUser: profile, loading: false });
          await bookmarks.loadForUser(profile.id);
          await users.loadAll();
        }
        return;
      }

      if (!isSyncing) {
        await syncAuthState();
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  
  return <StoreContext.Provider value={state}>{children}</StoreContext.Provider>;
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  const state = useContext(StoreContext);
  return selector(state);
}

export const select = {
  materials: (s: StoreState) => s.materials,
  users: (s: StoreState) => s.users,
  reports: (s: StoreState) => s.reports,
  reviews: (s: StoreState) => s.reviews,
  currentUser: (s: StoreState) => s.currentUser,
  bookmarks: (s: StoreState) => s.bookmarks,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name || "",
    username: row.username || "",
    email: row.email || "",
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    semester: row.semester || undefined,
    joinedAt: row.joined_at || new Date().toISOString(),
    uploadCount: row.upload_count || 0,
    totalUpvotes: row.total_upvotes || 0,
    reviewCount: row.review_count || 0,
    badges: (row.badges as BadgeType[]) || ["new-member"],
    role: row.role || "student",
    blocked: row.blocked || false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMaterial(row: any): Material {
  const rawFileType = typeof row.file_type === "string" ? row.file_type : "pdf";
  const fileType: FileType =
    rawFileType === "pdf" ||
    rawFileType === "docx" ||
    rawFileType === "ppt" ||
    rawFileType === "image" ||
    rawFileType === "notes"
      ? rawFileType
      : "notes";

  return {
    id: row.id,
    title: row.title || "",
    subject: row.subject || "",
    semester: row.semester || "",
    description: row.description || "",
    tags: row.tags || [],
    fileType,
    fileName: row.file_name || "",
    fileSize: row.file_size || "",
    filePath: row.file_path || undefined,
    uploaderId: row.uploader_id || "",
    uploaderName: row.uploader_name || "",
    uploaderAvatar: row.uploader_avatar || undefined,
    uploadedAt: row.uploaded_at || new Date().toISOString(),
    upvotes: row.upvotes || 0,
    upvotedBy: row.upvoted_by || [],
    downloads: row.downloads || 0,
    ratingAvg: parseFloat(row.rating_avg || 0),
    ratingCount: row.rating_count || 0,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data ? rowToUser(data) : null;
}

async function waitForProfile(userId: string, attempts = 2): Promise<User | null> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const profile = await fetchProfile(userId);
      if (profile) return profile;
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return null;
}

async function ensureProfile(params: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<User | null> {
  const existing = await waitForProfile(params.userId, 1);
  if (existing) return existing;

  const fallbackName = params.name?.trim() || params.email?.split("@")[0] || "User";
  const fallbackEmail = params.email || "";

  try {
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: params.userId,
        name: fallbackName,
        username: fallbackEmail
          ? fallbackEmail.split("@")[0].toLowerCase()
          : `user-${params.userId.slice(0, 8)}`,
        email: fallbackEmail,
        role:
          fallbackEmail.toLowerCase() === "sameeropbis@gmail.com"
            ? "admin"
            : "student",
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Profile upsert error:", upsertError);
      // Try to fetch the profile one more time in case it was created by a trigger
      return waitForProfile(params.userId, 1);
    }

    // Wait for the profile to be available
    return waitForProfile(params.userId, 2);
  } catch (error) {
    console.error("Profile creation error:", error);
    return waitForProfile(params.userId, 1);
  }
}

// Function to update user profile in database
export const updateProfile = async (userId: string, updates: { name?: string; bio?: string; semester?: string }): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }

  // Refresh the user data in state
  const updatedUser = await fetchProfile(userId);
  if (updatedUser) {
    patchState({ currentUser: updatedUser });
  }
};

async function resolveCurrentUserProfile(): Promise<User | null> {
  if (_state.currentUser) return _state.currentUser;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return ensureProfile({
    userId: user.id,
    email: user.email,
    name:
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null,
  });
}

function triggerBrowserDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export const auth = {
  getCurrentUser: () => _state.currentUser,
  isAdmin: () => _state.currentUser?.role === "admin",
  isAuthenticated: () => Boolean(_state.currentUser),

  refreshProfile: async () => {
    const me = _state.currentUser;
    if (!me) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", me.id)
      .single();

    if (error) {
      console.error("Failed to refresh profile:", error);
      return;
    }

    if (data) {
      const updatedProfile = rowToUser(data);
      patchState({
        currentUser: updatedProfile,
        users: _state.users.map(u => u.id === me.id ? updatedProfile : u),
      });
    }
  },

  signup: async (
    name: string,
    email: string,
    password: string
  ): Promise<{
    ok: boolean;
    error?: string;
    nextStep?: "dashboard" | "login";
    message?: string;
  }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      
      if (error) return { ok: false, error: error.message };

      if (!data.user) {
        return { ok: true, nextStep: "login" };
      }

      const profile = await ensureProfile({
        userId: data.user.id,
        name,
        email: data.user.email ?? email,
      });

      if (profile && data.session) {
        patchState({ currentUser: profile, loading: false });
        await bookmarks.loadForUser(profile.id);
        return {
          ok: true,
          nextStep: "dashboard",
          message: "Your account is ready and you're signed in.",
        };
      }

      if (profile) {
        return {
          ok: true,
          nextStep: "login",
          message: "Your account was created. Please sign in to continue.",
        };
      }

      return {
        ok: true,
        nextStep: data.session ? "dashboard" : "login",
        message:
          "Your account was created, but your profile is still finishing setup. Please try signing in again in a moment.",
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to create account right now.",
      };
    }
  },

  login: async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { ok: false, error: error.message };

      if (data.user) {
        const profile = await ensureProfile({
          userId: data.user.id,
          email: data.user.email ?? email,
          name:
            typeof data.user.user_metadata?.name === "string"
              ? data.user.user_metadata.name
              : null,
        });

        if (!profile) {
          return {
            ok: false,
            error:
              "Signed in, but your profile could not be loaded. Run the latest Supabase schema and try again.",
          };
        }

        patchState({ currentUser: profile, loading: false });
        await bookmarks.loadForUser(profile.id);
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to sign in right now.",
      };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    clearAuthState();
  },

  resetPassword: async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};

export const materials = {
  loadAll: async () => {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Failed to load materials:", error);
      return;
    }

    if (data) {
      patchState({ materials: data.map(rowToMaterial) });
    }
  },

  list: () => _state.materials,

  get: (id: string) => _state.materials.find((m) => m.id === id),

  trending: () =>
    [..._state.materials]
      .sort(
        (a, b) =>
          b.upvotes * 0.7 +
          b.downloads * 0.3 -
          (a.upvotes * 0.7 + a.downloads * 0.3)
      )
      .slice(0, 6),

  recent: () =>
    [..._state.materials]
      .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
      .slice(0, 6),

  topUpvoted: () =>
    [..._state.materials].sort((a, b) => b.upvotes - a.upvotes).slice(0, 6),

  upload: async (data: {
    title: string;
    subject: string;
    semester: string;
    description: string;
    tags: string[];
    fileType: FileType;
    fileName: string;
    fileSize: string;
    file: File;
  }): Promise<Material> => {
    console.log("Upload started:", { fileName: data.fileName, fileSize: data.fileSize, fileType: data.fileType });

    const me = await resolveCurrentUserProfile();
    if (!me) {
      console.error("Upload failed: No current user profile");
      throw new Error("Please sign in again before uploading.");
    }

    console.log("User profile found:", me.id, me.name);

    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${me.id}/${Date.now()}-${safeFileName}`;

    console.log("Storage path:", storagePath);

    // Detect content type for mobile uploads where file.type might be empty
    const mimeTypes: Record<FileType, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      image: 'image/jpeg',
      notes: 'text/plain',
    };

    const contentType = data.file.type || mimeTypes[data.fileType] || 'application/octet-stream';
    console.log("Uploading with content type:", contentType, "File type:", data.fileType);

    // Add timeout for storage upload (2 minutes)
    const uploadPromise = supabase.storage
      .from("materials")
      .upload(storagePath, data.file, {
        upsert: false,
        contentType: contentType,
      });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out. Please check your connection and try again.")), 120000);
    });

    const { error: storageError, data: storageData } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error("File upload failed: " + storageError.message);
    }

    console.log("Storage upload successful:", storageData);

    const { data: row, error } = await supabase
      .from("materials")
      .insert({
        title: data.title,
        subject: data.subject,
        semester: data.semester,
        description: data.description,
        tags: data.tags,
        file_type: data.fileType,
        file_name: data.fileName,
        file_size: data.fileSize,
        file_path: storagePath,
        uploader_id: me.id,
        uploader_name: me.name && me.name !== "User" ? me.name : me.email?.split("@")[0] || "User",
        uploader_avatar: me.avatarUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      await supabase.storage.from("materials").remove([storagePath]);
      throw new Error("Database insert failed: " + error.message);
    }

    console.log("Database insert successful:", row);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ upload_count: me.uploadCount + 1 })
      .eq("id", me.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't throw - upload succeeded, just log the error
    }

    patchState({ currentUser: { ...me, uploadCount: me.uploadCount + 1 } });
    
    // Refresh users list and current user profile to update leaderboard data
    await users.loadAll();
    await auth.refreshProfile();

    const mat = rowToMaterial(row);
    patchState({ materials: [mat, ..._state.materials] });
    console.log("Upload complete, material ID:", mat.id);
    return mat;
  },

  toggleUpvote: async (id: string) => {
    const uid = _state.currentUser?.id;
    if (!uid) return;

    const mat = _state.materials.find((m) => m.id === id);
    if (!mat) return;

    const has = mat.upvotedBy.includes(uid);
    const newUpvotedBy = has
      ? mat.upvotedBy.filter((x) => x !== uid)
      : [...mat.upvotedBy, uid];
    const newUpvotes = has ? mat.upvotes - 1 : mat.upvotes + 1;
    const upvoteDelta = has ? -1 : 1;

    // Optimistic update
    patchState({
      materials: _state.materials.map((m) =>
        m.id === id ? { ...m, upvotedBy: newUpvotedBy, upvotes: newUpvotes } : m
      ),
    });

    // Update database
    const { error } = await supabase
      .from("materials")
      .update({ upvoted_by: newUpvotedBy, upvotes: newUpvotes })
      .eq("id", id);

    if (error) {
      console.error("Failed to toggle upvote:", error);
      // Revert optimistic update on error
      patchState({
        materials: _state.materials.map((m) =>
          m.id === id ? mat : m
        ),
      });
      return;
    }

    // Update uploader's total_upvotes in profiles table
    if (mat.uploaderId) {
      const uploader = _state.users.find(u => u.id === mat.uploaderId);
      if (uploader) {
        const newTotalUpvotes = Math.max(0, uploader.totalUpvotes + upvoteDelta);
        await supabase
          .from("profiles")
          .update({ total_upvotes: newTotalUpvotes })
          .eq("id", mat.uploaderId);
        
        // Update local state for uploader
        patchState({
          users: _state.users.map(u => 
            u.id === mat.uploaderId ? { ...u, totalUpvotes: newTotalUpvotes } : u
          ),
          currentUser: _state.currentUser?.id === mat.uploaderId 
            ? { ..._state.currentUser, totalUpvotes: newTotalUpvotes }
            : _state.currentUser,
        });
        
        // Refresh profile if the current user is the uploader
        if (_state.currentUser?.id === mat.uploaderId) {
          await auth.refreshProfile();
        }
      }
      
      // Refresh users list to update leaderboard
      await users.loadAll();
    }
  },

  removeIfAllowed: async (id: string): Promise<boolean> => {
    const me = await resolveCurrentUserProfile();
    const material = _state.materials.find((x) => x.id === id);

    if (!me || !material) return false;
    if (me.role !== "admin" && material.uploaderId !== me.id) return false;

    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) return false;

    if (material.filePath) {
      await supabase.storage.from("materials").remove([material.filePath]);
    }

    patchState({ materials: _state.materials.filter((x) => x.id !== id) });
    return true;
  },

  download: async (id: string): Promise<boolean> => {
    const material = _state.materials.find((x) => x.id === id);
    if (!material?.filePath) return false;

    let downloadStarted = false;

    const { data: blob, error } = await supabase.storage
      .from("materials")
      .download(material.filePath);

    if (!error && blob) {
      const blobUrl = window.URL.createObjectURL(blob);
      triggerBrowserDownload(blobUrl, material.fileName || "download");
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      downloadStarted = true;
    } else {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("materials")
        .createSignedUrl(material.filePath, 60);

      if (!signedUrlError && signedUrlData?.signedUrl) {
        triggerBrowserDownload(signedUrlData.signedUrl, material.fileName || "download");
        downloadStarted = true;
      } else {
        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(material.filePath);

        if (urlData?.publicUrl) {
          triggerBrowserDownload(urlData.publicUrl, material.fileName || "download");
          downloadStarted = true;
        }
      }
    }

    if (!downloadStarted) return false;

    await supabase
      .from("materials")
      .update({ downloads: material.downloads + 1 })
      .eq("id", id);

    patchState({
      materials: _state.materials.map((x) =>
        x.id === id ? { ...x, downloads: x.downloads + 1 } : x
      ),
    });

    return true;
  },

  getPublicUrl: (filePath: string): string => {
    const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
    return data.publicUrl;
  },
};

export const reviews = {
  forMaterial: (materialId: string) =>
    _state.reviews
      .filter((r) => r.materialId === materialId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

  loadForMaterial: async (materialId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const existing = _state.reviews.filter((r) => r.materialId !== materialId);
      patchState({
        reviews: [
          ...existing,
          ...data.map((r) => ({
            id: r.id as string,
            materialId: r.material_id as string,
            userId: r.user_id as string,
            userName: r.user_name as string,
            userAvatar: r.user_avatar as string | undefined,
            rating: r.rating as number,
            comment: r.comment as string,
            createdAt: r.created_at as string,
          })),
        ],
      });
    }
  },

  add: async (materialId: string, rating: number, comment: string) => {
    const me = await resolveCurrentUserProfile();
    if (!me) return;

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        material_id: materialId,
        user_id: me.id,
        user_name: me.name,
        user_avatar: me.avatarUrl || null,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newReview: Review = {
      id: data.id as string,
      materialId,
      userId: me.id,
      userName: me.name,
      rating,
      comment,
      createdAt: data.created_at as string,
    };

    const mat = _state.materials.find((m) => m.id === materialId);
    if (mat) {
      const total = mat.ratingAvg * mat.ratingCount + rating;
      const count = mat.ratingCount + 1;
      const newAvg = Math.round((total / count) * 10) / 10;

      await supabase
        .from("materials")
        .update({ rating_avg: newAvg, rating_count: count })
        .eq("id", materialId);

      patchState({
        materials: _state.materials.map((m) =>
          m.id === materialId ? { ...m, ratingAvg: newAvg, ratingCount: count } : m
        ),
      });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ review_count: me.reviewCount + 1 })
      .eq("id", me.id);

    if (profileError) {
      console.error("Failed to update review count in profile:", profileError);
    }

    patchState({
      reviews: [newReview, ..._state.reviews],
      currentUser: { ...me, reviewCount: me.reviewCount + 1 },
    });
    
    // Refresh users list and current user profile to update leaderboard data
    await users.loadAll();
    await auth.refreshProfile();
  },
};

export const reports = {
  list: () => _state.reports,

  loadAll: async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load reports:", error);
      return;
    }

    if (data) {
      patchState({
        reports: data.map((r) => ({
          id: r.id as string,
          materialId: r.material_id as string,
          materialTitle: r.material_title as string,
          reporterId: r.reporter_id as string,
          reporterName: r.reporter_name as string,
          reason: r.reason as ReportReason,
          message: r.message as string | undefined,
          status: r.status as Report["status"],
          createdAt: r.created_at as string,
        })),
      });
    }
  },

  add: async (materialId: string, reason: ReportReason, message?: string) => {
    const me = await resolveCurrentUserProfile();
    if (!me) return;

    const mat = _state.materials.find((m) => m.id === materialId);
    await supabase.from("reports").insert({
      material_id: materialId,
      material_title: mat?.title ?? "Unknown",
      reporter_id: me.id,
      reporter_name: me.name,
      reason,
      message: message || null,
    });
  },

  setStatus: async (id: string, status: Report["status"]) => {
    await supabase.from("reports").update({ status }).eq("id", id);
    patchState({
      reports: _state.reports.map((r) => (r.id === id ? { ...r, status } : r)),
    });
  },
};

export const users = {
  list: () => _state.users,

  loadAll: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("total_upvotes", { ascending: false });

    if (error) {
      console.error("Failed to load users:", error);
      return;
    }

    if (data) {
      patchState({ users: data.map(rowToUser) });
    }
  },

  get: (id: string) => _state.users.find((u) => u.id === id),

  toggleBlock: async (id: string) => {
    const user = _state.users.find((u) => u.id === id);
    if (!user) return;

    const blocked = !user.blocked;
    await supabase.from("profiles").update({ blocked }).eq("id", id);
    patchState({
      users: _state.users.map((u) => (u.id === id ? { ...u, blocked } : u)),
    });
  },

  makeAdmin: async (id: string) => {
    const user = _state.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");

    console.log("Making user admin:", id);

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Failed to make user admin:", error);
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    console.log("Update result:", data);

    if (!data || data.length === 0) {
      console.error("No rows updated - check RLS permissions");
      throw new Error("No rows updated. You may not have permission to modify this user.");
    }

    // Update local state with confirmed data
    patchState({
      users: _state.users.map((u) => (u.id === id ? { ...u, role: "admin" } : u)),
    });

    // Force reload to verify change persisted
    await users.loadAll();
  },

  removeAdmin: async (id: string) => {
    const user = _state.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");

    console.log("Removing admin from user:", id);

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "student" })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Failed to remove admin:", error);
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    console.log("Update result:", data);

    if (!data || data.length === 0) {
      console.error("No rows updated - check RLS permissions");
      throw new Error("No rows updated. You may not have permission to modify this user.");
    }

    // Update local state with confirmed data
    patchState({
      users: _state.users.map((u) => (u.id === id ? { ...u, role: "student" } : u)),
    });

    // Force reload to verify change persisted
    await users.loadAll();
  },
};

export const bookmarks = {
  list: () => _state.bookmarks,

  loadForUser: async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("material_id")
      .eq("user_id", userId);

    patchState({
      bookmarks: data ? data.map((r) => r.material_id as string) : [],
    });
  },

  toggle: async (materialId: string) => {
    const me = await resolveCurrentUserProfile();
    if (!me) return;

    const has = _state.bookmarks.includes(materialId);
    if (has) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", me.id)
        .eq("material_id", materialId);

      patchState({ bookmarks: _state.bookmarks.filter((x) => x !== materialId) });
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: me.id, material_id: materialId });

      patchState({ bookmarks: [..._state.bookmarks, materialId] });
    }
  },

  has: (materialId: string) => _state.bookmarks.includes(materialId),
};
