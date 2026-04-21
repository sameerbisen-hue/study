/**
 * store.ts — Supabase-backed service layer.
 *
 * Public API is kept identical to the old localStorage store so that
 * all pages (Dashboard, Library, Upload, etc.) work without changes.
 *
 * Auth    → Supabase Auth (email + password)
 * Data    → Supabase Postgres via the JS client
 * Files   → Supabase Storage bucket "materials"
 * State   → React context + useState (no more manual pub/sub)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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

// ─── Context ─────────────────────────────────────────────────────────────────

interface StoreState {
  currentUser: User | null;
  materials: Material[];
  users: User[];
  reviews: Review[];
  reports: Report[];
  bookmarks: string[]; // material ids for current user
  loading: boolean;
}

const defaultState: StoreState = {
  currentUser: null,
  materials: [],
  users: [],
  reviews: [],
  reports: [],
  bookmarks: [],
  loading: true,
};

// Expose state + setState outside React so service functions can read/write.
let _setState: React.Dispatch<React.SetStateAction<StoreState>> = () => {};
let _state: StoreState = defaultState;

const StoreContext = createContext<StoreState>(defaultState);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);
  _setState = setState;
  _state = state;

  useEffect(() => {
    const handleSession = async (session: any) => {
      if (session?.user) {
        let profile = await fetchProfile(session.user.id);
        if (!profile) {
          // Fallback: manually create if db trigger failed or if missing
          await supabase.from("profiles").upsert({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
            username: (session.user.email?.split("@")[0] || "user").toLowerCase(),
            email: session.user.email || "",
            role: session.user.email?.toLowerCase() === "sameeropbis@gmail.com" ? "admin" : "student",
          }, { onConflict: "id" });
          profile = await fetchProfile(session.user.id);
        }
        patchState({ currentUser: profile, loading: false });
        if (profile) {
          await bookmarks.loadForUser(profile.id);
        }
      } else {
        patchState({ currentUser: null, loading: false, bookmarks: [] });
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => handleSession(session)
    );
    
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreContext.Provider value={state}>{children}</StoreContext.Provider>
  );
}

function patchState(patch: Partial<StoreState>) {
  _setState((prev) => {
    const next = { ...prev, ...patch };
    _state = next;
    return next;
  });
}

// ─── useStore hook ────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return {
    id: row.id,
    title: row.title || "",
    subject: row.subject || "",
    semester: row.semester || "",
    description: row.description || "",
    tags: row.tags || [],
    fileType: row.file_type || "pdf",
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  getCurrentUser: () => _state.currentUser,
  isAdmin: () => _state.currentUser?.role === "admin",
  isAuthenticated: () => Boolean(_state.currentUser),

  signup: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };

    // Manually create profile in case the DB trigger doesn't fire
    if (data.user) {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        name: name || email.split("@")[0],
        username: email.split("@")[0].toLowerCase(),
        email: email,
        role: email.toLowerCase() === "sameeropbis@gmail.com" ? "admin" : "student",
      }, { onConflict: "id" });
      
      if (upsertError) {
        // Wait briefly to see if trigger worked anyway
        await new Promise(r => setTimeout(r, 1000));
        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          return { ok: false, error: "Account created but profile initialization failed. Ensure you have run the latest Supabase SQL schema." };
        }
      }
    }

    return { ok: true };
  },

  login: async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    patchState({ currentUser: null, materials: [], bookmarks: [] });
  },

  resetPassword: async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const materials = {
  loadAll: async () => {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (!error && data) {
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
    const me = _state.currentUser;
    if (!me) throw new Error("Not authenticated");

    // 1. Upload file to Supabase Storage
    const ext = data.fileName.split(".").pop();
    const storagePath = `${me.id}/${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage
      .from("materials")
      .upload(storagePath, data.file, { upsert: true });
    if (storageError) throw new Error("File upload failed: " + storageError.message);

    // 2. Insert material row
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
        uploader_name: me.name,
        uploader_avatar: me.avatarUrl || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // 3. Increment upload_count
    await supabase
      .from("profiles")
      .update({ upload_count: me.uploadCount + 1 })
      .eq("id", me.id);
    patchState({ currentUser: { ...me, uploadCount: me.uploadCount + 1 } });

    const mat = rowToMaterial(row);
    patchState({ materials: [mat, ..._state.materials] });
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

    // Optimistic update
    patchState({
      materials: _state.materials.map((m) =>
        m.id === id ? { ...m, upvotedBy: newUpvotedBy, upvotes: newUpvotes } : m
      ),
    });

    await supabase
      .from("materials")
      .update({ upvoted_by: newUpvotedBy, upvotes: newUpvotes })
      .eq("id", id);
  },

  removeIfAllowed: async (id: string): Promise<boolean> => {
    const me = _state.currentUser;
    const m = _state.materials.find((x) => x.id === id);
    if (!me || !m) return false;
    if (me.role !== "admin" && m.uploaderId !== me.id) return false;

    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) return false;

    if (m.filePath) {
      await supabase.storage.from("materials").remove([m.filePath]);
    }

    patchState({ materials: _state.materials.filter((x) => x.id !== id) });
    return true;
  },

  download: async (id: string): Promise<boolean> => {
    const m = _state.materials.find((x) => x.id === id);
    if (!m?.filePath) return false;

    // Use supabase.storage.download to bypass CORS issues for the download attribute
    const { data: blob, error } = await supabase.storage
      .from("materials")
      .download(m.filePath);

    if (error || !blob) {
      // Fallback to public URL in new tab if download fails
      const { data: urlData } = supabase.storage
        .from("materials")
        .getPublicUrl(m.filePath);
      if (urlData?.publicUrl) {
        window.open(urlData.publicUrl, "_blank");
      }
    } else {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = m.fileName || "download";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    }

    await supabase
      .from("materials")
      .update({ downloads: m.downloads + 1 })
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

// ─── Reviews ─────────────────────────────────────────────────────────────────

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
    const me = _state.currentUser;
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

    await supabase
      .from("profiles")
      .update({ review_count: me.reviewCount + 1 })
      .eq("id", me.id);

    patchState({
      reviews: [newReview, ..._state.reviews],
      currentUser: { ...me, reviewCount: me.reviewCount + 1 },
    });
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reports = {
  list: () => _state.reports,

  loadAll: async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
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
    const me = _state.currentUser;
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

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = {
  list: () => _state.users,

  loadAll: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("total_upvotes", { ascending: false });
    if (!error && data) {
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
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────

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
    const uid = _state.currentUser?.id;
    if (!uid) return;
    const has = _state.bookmarks.includes(materialId);
    if (has) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", uid)
        .eq("material_id", materialId);
      patchState({ bookmarks: _state.bookmarks.filter((x) => x !== materialId) });
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: uid, material_id: materialId });
      patchState({ bookmarks: [..._state.bookmarks, materialId] });
    }
  },

  has: (materialId: string) => _state.bookmarks.includes(materialId),
};