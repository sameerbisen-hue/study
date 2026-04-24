import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NavigationStateManagerProps {
  children: React.ReactNode;
}

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

      // When page becomes visible after being hidden, ensure we're ready
      if (isVisible && !lastVisibilityRef.current) {
        console.log("Page became visible");
        // Immediately set ready - don't block UI on revisit
        safeSetReady(true);
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
        // Quick session check - just verify we can talk to Supabase
        // Don't block page load with complex auth checks
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("Session found, user is authenticated");
        } else {
          console.log("No session, user is not authenticated");
        }

        // Always become ready after first check - auth state will update via listener
        safeSetReady(true);

      } catch (error) {
        console.error("Auth check error:", error);
        // Even on error, show the app - better UX than stuck loading
        safeSetReady(true);
      } finally {
        checkInProgressRef.current = false;
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check - run once on mount only
    checkAndRestoreAuth();

    // Force ready after 5 seconds max (failsafe) - use ref to avoid stale closure
    readyTimeoutId = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("NavigationStateManager: Forcing ready state after timeout");
        safeSetReady(true);
        checkInProgressRef.current = false;
      }
    }, 5000);

    // Cleanup
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
