/**
 * Enhanced store with better authentication state management for tab switching
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

// Enhanced store state with navigation awareness
interface StoreState {
  currentUser: User | null;
  materials: Material[];
  reviews: Review[];
  reports: Report[];
  users: User[];
  bookmarks: string[];
  loading: boolean;
  lastActiveTime: number;
  isTabVisible: boolean;
  authCheckInProgress: boolean;
}

const initialState: StoreState = {
  currentUser: null,
  materials: [],
  reviews: [],
  reports: [],
  users: [],
  bookmarks: [],
  loading: true,
  lastActiveTime: Date.now(),
  isTabVisible: !document.hidden,
  authCheckInProgress: false,
};

const StoreContext = createContext<{
  state: StoreState;
  patchState: (updates: Partial<StoreState>) => void;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, patchState] = useState<StoreState>(initialState);

  // Enhanced authentication sync with tab switching awareness
  const syncAuthState = useCallback(async () => {
    if (state.authCheckInProgress) {
      console.log("Auth check already in progress, skipping");
      return;
    }

    patchState({ authCheckInProgress: true });
    let isMounted = true;

    try {
      console.log("Syncing auth state...");
      
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!session?.user) {
        console.log("No session found, clearing auth state");
        if (isMounted) {
          patchState({ 
            currentUser: null, 
            loading: false, 
            authCheckInProgress: false 
          });
        }
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (error || !user) {
        console.error("User fetch error:", error);
        await supabase.auth.signOut();
        if (isMounted) {
          patchState({ 
            currentUser: null, 
            loading: false, 
            authCheckInProgress: false 
          });
        }
        return;
      }

      // Check if session is expired
      if (session.expires_at && Date.now() > session.expires_at * 1000) {
        console.log("Session expired, signing out");
        await supabase.auth.signOut();
        if (isMounted) {
          patchState({ 
            currentUser: null, 
            loading: false, 
            authCheckInProgress: false 
          });
        }
        return;
      }

      // Get or create user profile
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
        patchState({ 
          currentUser: null, 
          loading: false, 
          authCheckInProgress: false 
        });
        return;
      }

      console.log("Auth state synced successfully");
      patchState({ 
        currentUser: profile, 
        loading: false, 
        lastActiveTime: Date.now(),
        authCheckInProgress: false 
      });
      
      // Load bookmarks in background
      bookmarks.loadForUser(profile.id).catch(error => {
        console.error("Failed to load bookmarks:", error);
      });
      
    } catch (error) {
      console.error("Auth state sync error:", error);
      if (isMounted) {
        patchState({ 
          currentUser: null, 
          loading: false, 
          authCheckInProgress: false 
        });
      }
    }
  }, [state.authCheckInProgress]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      patchState({ isTabVisible: isVisible });
      
      if (isVisible) {
        console.log("Tab became visible, checking auth state");
        patchState({ lastActiveTime: Date.now() });
        
        // Check auth state when tab becomes visible
        const timeSinceLastActive = Date.now() - state.lastActiveTime;
        if (timeSinceLastActive > 2 * 60 * 1000) { // 2 minutes
          console.log("Tab was inactive, refreshing auth state");
          syncAuthState();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.lastActiveTime, syncAuthState]);

  // Initial auth check
  useEffect(() => {
    syncAuthState();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        syncAuthState();
      } else if (event === 'SIGNED_OUT') {
        patchState({ 
          currentUser: null, 
          loading: false,
          bookmarks: [] 
        });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed");
        syncAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, [syncAuthState]);

  // Handle storage events (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token') {
        console.log("Storage event detected, refreshing auth");
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncAuthState]);

  return (
    <StoreContext.Provider value={{ state, patchState }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return selector(context.state);
}

// Enhanced profile creation with better error handling
async function ensureProfile(params: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<User | null> {
  const existing = await waitForProfile(params.userId, 2);
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
      return waitForProfile(params.userId, 2);
    }

    return waitForProfile(params.userId, 3);
  } catch (error) {
    console.error("Profile creation error:", error);
    return waitForProfile(params.userId, 2);
  }
}

function waitForProfile(userId: string, maxAttempts: number): Promise<User | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const check = async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (data) {
          resolve(data);
        } else if (attempts >= maxAttempts) {
          resolve(null);
        } else {
          setTimeout(check, 500);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          resolve(null);
        } else {
          setTimeout(check, 500);
        }
      }
    };
    
    check();
  });
}

// Enhanced materials with better error handling
const materials = {
  async loadAll() {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to load materials:", error);
      return [];
    }
  },

  async upload(data: {
    title: string;
    subject: string;
    semester: string;
    description: string;
    tags: string[];
    file: File;
    fileType: FileType;
    fileName: string;
    fileSize: number;
  }) {
    try {
      // Upload file to storage
      const fileExt = data.fileName.split(".").pop()?.toLowerCase();
      const filePath = `${data.fileType}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, data.file, {
          upsert: false,
          contentType: data.file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("materials")
        .getPublicUrl(filePath);

      // Create material record
      const { data: material, error: insertError } = await supabase
        .from("materials")
        .insert({
          title: data.title,
          subject: data.subject,
          semester: data.semester,
          description: data.description,
          tags: data.tags,
          file_url: publicUrl,
          file_path: filePath,
          file_type: data.fileType,
          file_name: data.fileName,
          file_size: data.fileSize,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return material;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  async download(id: string) {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("file_path")
        .eq("id", id)
        .single();
      
      if (error || !data) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("materials")
        .getPublicUrl(data.file_path);
      
      window.open(publicUrl, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },
};

// Enhanced reviews with better error handling
const reviews = {
  forMaterial: (materialId: string) => {
    // Implementation here
    return [];
  },
  
  async loadForMaterial(materialId: string) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to load reviews:", error);
      return [];
    }
  },

  async add(materialId: string, rating: number, comment: string) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          material_id: materialId,
          rating,
          comment,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to add review:", error);
      throw error;
    }
  },
};

// Enhanced reports with better error handling
const reports = {
  list: () => {
    // Implementation here
    return [];
  },
  
  async loadAll() {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to load reports:", error);
      return [];
    }
  },

  async add(materialId: string, reason: ReportReason, message?: string) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          material_id: materialId,
          reason,
          message,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to add report:", error);
      throw error;
    }
  },

  async setStatus(id: string, status: "open" | "resolved" | "dismissed") {
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to update report status:", error);
      throw error;
    }
  },
};

// Enhanced users with better error handling
const users = {
  list: () => {
    // Implementation here
    return [];
  },
  
  async loadAll() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to load users:", error);
      return [];
    }
  },

  get: (id: string) => {
    // Implementation here
    return null;
  },

  async toggleBlock(id: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ blocked: true })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to block user:", error);
      throw error;
    }
  },
};

// Enhanced bookmarks with better error handling
const bookmarks = {
  list: () => {
    // Implementation here
    return [];
  },
  
  async loadForUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("material_id")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data?.map(b => b.material_id) || [];
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      return [];
    }
  },

  async toggle(materialId: string) {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", currentUser.user.id)
        .eq("material_id", materialId)
        .single();

      if (existing) {
        await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", currentUser.user.id)
          .eq("material_id", materialId);
      } else {
        await supabase
          .from("bookmarks")
          .insert({
            user_id: currentUser.user.id,
            material_id: materialId,
          });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      throw error;
    }
  },

  has: (materialId: string) => {
    // Implementation here
    return false;
  },
};

// Enhanced auth with better error handling
const auth = {
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  async signup(email: string, password: string, name?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },

  isAdmin: () => {
    const context = useContext(StoreContext);
    if (!context) return false;
    return context.state.currentUser?.role === "admin";
  },
};

export { auth, materials, reviews, reports, users, bookmarks };
export type { StoreState };
