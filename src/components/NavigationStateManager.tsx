import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NavigationStateManagerProps {
  children: React.ReactNode;
}

// Promise with timeout helper
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
};

export function NavigationStateManager({ children }: NavigationStateManagerProps) {
  const [isReady, setIsReady] = useState(false);
  const lastVisibilityRef = useRef(!document.hidden);
  const checkInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let readyTimeoutId: NodeJS.Timeout;

    const safeSetReady = (value: boolean) => {
      if (mountedRef.current) {
        setIsReady(value);
      }
    };

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      if (isVisible && !lastVisibilityRef.current) {
        console.log("Page became visible, checking authentication");

        timeoutId = setTimeout(() => {
          checkAndRestoreAuth();
        }, 100);
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
        // Check session with 5 second timeout
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );

        if (error) {
          console.error("Session check error:", error);
          safeSetReady(true);
          checkInProgressRef.current = false;
          return;
        }

        if (!session) {
          console.log("No session found, attempting to restore");

          // Try to get current user with timeout
          try {
            const { data: { user } } = await withTimeout(
              supabase.auth.getUser(),
              5000
            );

            if (user) {
              console.log("User found, session restored");
            } else {
              console.log("No user found, session lost");
            }
          } catch (userError) {
            console.log("User check timed out or failed");
          }
        } else {
          console.log("Session found and valid");
        }

        safeSetReady(true);

      } catch (error) {
        console.error("Auth restoration error:", error);
        safeSetReady(true);
      } finally {
        checkInProgressRef.current = false;
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page focus/blur as backup
    const handleFocus = () => {
      if (!lastVisibilityRef.current && !checkInProgressRef.current) {
        console.log("Window gained focus");
        checkAndRestoreAuth();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Initial check - run once on mount only
    checkAndRestoreAuth();

    // Force ready after 8 seconds max (failsafe)
    readyTimeoutId = setTimeout(() => {
      if (!isReady && mountedRef.current) {
        console.warn("NavigationStateManager: Forcing ready state after timeout");
        safeSetReady(true);
        checkInProgressRef.current = false;
      }
    }, 8000);

    // Cleanup
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (timeoutId) clearTimeout(timeoutId);
      if (readyTimeoutId) clearTimeout(readyTimeoutId);
    };
  }, []);

  // Show loading state while checking authentication
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
