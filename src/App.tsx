import { Analytics } from "@vercel/analytics/react";
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

const queryClient = new QueryClient();

const App = () => (
  <EnhancedErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
  </EnhancedErrorBoundary>
);

export default App;
