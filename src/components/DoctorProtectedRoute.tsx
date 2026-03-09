import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function DoctorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session?.user) {
      setChecking(false);
      return;
    }

    const checkRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'doctor')
        .maybeSingle();

      setIsDoctor(!!data);
      setChecking(false);
    };

    checkRole();
  }, [session, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!isDoctor) return <Navigate to="/" replace />;

  return <>{children}</>;
}
