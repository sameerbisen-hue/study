import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NavigationStateManagerProps {
  children: React.ReactNode;
}

export function NavigationStateManager({ children }: NavigationStateManagerProps) {
  const [isReady, setIsReady] = useState(true); // Start as ready - don't block
  const lastVisibilityRef = useRef(!document.hidden);
  const checkInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    let visibilityTimeoutId: NodeJS.Timeout;

    const safeSetReady = (value: boolean) => {
      if (mountedRef.current) {
        setIsReady(value);
      }
    };

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      // When page becomes visible after being hidden, ensure we're ready
      // Debounce to prevent rapid state changes during visibility toggles (especially on mobile)
      if (isVisible && !lastVisibilityRef.current) {
        console.log("Page became visible");
        // Clear any pending timeout
        clearTimeout(visibilityTimeoutId);
        // Set a longer delay for mobile to prevent rapid state changes
        visibilityTimeoutId = setTimeout(() => {
          if (mountedRef.current) {
            safeSetReady(true);
          }
        }, 500);
      }

      lastVisibilityRef.current = isVisible;
    };

    const checkAndRestoreAuth = async () => {
      if (checkInProgressRef.current) {
        console.log("Auth check already in progress, skipping");
        return;
      }

      checkInProgressRef.current = true;

      try {
        // Fire-and-forget auth check - don't block the app
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
        ]);

        if (result?.data?.session) {
          console.log("Session found, user is authenticated");
        } else {
          console.log("No session, user is not authenticated");
        }

      } catch (error) {
        console.error("Auth check error:", error);
        // Don't block the app even on error
      } finally {
        checkInProgressRef.current = false;
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Run auth check in background - don't block
    checkAndRestoreAuth();

    // Cleanup
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
    };
  }, []);

  return <>{children}</>;
}
