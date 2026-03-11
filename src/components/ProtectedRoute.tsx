import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, role, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session && !isGuest) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If a doctor tries to access patient pages, redirect to doctor dashboard
  if (session && role === "doctor") {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return <>{children}</>;
}
