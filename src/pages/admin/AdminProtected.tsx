import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, select, auth } from "@/services/store";
import AdminPanel from "./AdminPanel";

export default function AdminProtected() {
  const navigate = useNavigate();
  const currentUser = useStore(select.currentUser);
  const isAdmin = auth.isAdmin();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [currentUser, isAdmin, navigate]);

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}
