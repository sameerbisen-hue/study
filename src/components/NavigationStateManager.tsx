import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NavigationStateManagerProps {
  children: React.ReactNode;
}

export function NavigationStateManager({ children }: NavigationStateManagerProps) {
  const [isReady, setIsReady] = useState(false);
  const [lastVisibility, setLastVisibility] = useState(!document.hidden);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      if (isVisible && !lastVisibility) {
        // Page became visible (user switched back)
        console.log("Page became visible, checking authentication");
        
        // Add small delay to ensure browser is ready
        timeoutId = setTimeout(() => {
          checkAndRestoreAuth();
        }, 100);
      }
      
      setLastVisibility(isVisible);
    };

    const checkAndRestoreAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setIsReady(true);
          return;
        }

        if (!session) {
          console.log("No session found, attempting to restore");
          
          // Try to get current user (might restore session)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log("User found, session restored");
          } else {
            console.log("No user found, session lost");
          }
        } else {
          console.log("Session found and valid");
        }
        
        setIsReady(true);
        
      } catch (error) {
        console.error("Auth restoration error:", error);
        setIsReady(true);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check
    checkAndRestoreAuth();

    // Handle page focus/blur as backup
    const handleFocus = () => {
      if (!lastVisibility) {
        console.log("Window gained focus");
        checkAndRestoreAuth();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lastVisibility]);

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
