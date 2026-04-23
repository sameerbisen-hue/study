import { useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/auth/Login.tsx";
import Signup from "./pages/auth/Signup.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Library from "./pages/Library.tsx";
import UploadRouter from "./components/UploadRouter.tsx";
import MaterialDetails from "./pages/MaterialDetails.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Profile from "./pages/Profile.tsx";
import Bookmarks from "./pages/Bookmarks.tsx";
import AdminProtected from "./pages/admin/AdminProtected.tsx";
import ReportManagement from "./pages/admin/ReportManagement.tsx";
import Debug from "./pages/Debug.tsx";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary.tsx";
import { Analytics } from "@vercel/analytics/react";

const queryClient = new QueryClient();

interface NavigationAwareAppProps {
  children: React.ReactNode;
}

function NavigationAwareApp({ children }: NavigationAwareAppProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [appReady, setAppReady] = useState(false);

  // Handle page visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const nowVisible = !document.hidden;
      setIsVisible(nowVisible);
      
      if (nowVisible) {
        console.log("Page became visible (tab switched back)");
        setLastActiveTime(Date.now());
        
        // Check if we need to refresh authentication
        const timeSinceLastActive = Date.now() - lastActiveTime;
        if (timeSinceLastActive > 5 * 60 * 1000) { // 5 minutes
          console.log("Tab was inactive for more than 5 minutes, checking auth");
          // Trigger auth check by reloading page state
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        console.log("Page became hidden (tab switched away)");
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Network: Online");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("Network: Offline");
    };

    // Handle focus/blur events
    const handleFocus = () => {
      console.log("Window gained focus");
      setLastActiveTime(Date.now());
    };

    const handleBlur = () => {
      console.log("Window lost focus");
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial setup
    setAppReady(true);
    console.log("NavigationAwareApp initialized");

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [lastActiveTime]);

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (!appReady) {
        console.warn("App taking too long to load, forcing recovery");
        setAppReady(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [appReady]);

  // Show loading state only if app is not ready
  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading application...</p>
          {!isOnline && (
            <p className="text-xs text-red-600">No internet connection</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug information for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 z-50 bg-black/80 text-white text-xs p-2 rounded-bl-lg">
          <div>Visible: {isVisible ? 'Yes' : 'No'}</div>
          <div>Online: {isOnline ? 'Yes' : 'No'}</div>
          <div>Active: {Math.floor((Date.now() - lastActiveTime) / 1000)}s ago</div>
        </div>
      )}
      {children}
    </>
  );
}

const App = () => (
  <EnhancedErrorBoundary>
    <NavigationAwareApp>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/library" element={<Library />} />
                <Route path="/upload" element={<UploadRouter />} />
                <Route path="/material/:id" element={<MaterialDetails />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/admin" element={<AdminProtected />} />
                <Route path="/admin/reports" element={<ReportManagement />} />
                <Route path="/debug" element={<Debug />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </QueryClientProvider>
    </NavigationAwareApp>
  </EnhancedErrorBoundary>
);

export default App;
