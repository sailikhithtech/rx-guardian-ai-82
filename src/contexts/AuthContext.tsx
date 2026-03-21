import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "patient" | "doctor" | "admin" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isGuest: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  setGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveRole(user: User): Promise<UserRole> {
  // 1. Check doctor_profiles table first (most reliable)
  const { data: docProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (docProfile) return "doctor";

  // 2. Check user_roles table
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (data?.some((r) => r.role === "doctor")) return "doctor";

  // 3. Check auth metadata
  const metaRole = user.user_metadata?.role;
  if (metaRole === "doctor") return "doctor";

  return "patient";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("rxvision_guest") === "true");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem("rxvision_guest");
        const resolved = await resolveRole(session.user);
        setRole(resolved);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const resolved = await resolveRole(session.user);
        setRole(resolved);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    setRole(null);
    localStorage.removeItem("rxvision_guest");
  };

  const setGuest = () => {
    setIsGuest(true);
    localStorage.setItem("rxvision_guest", "true");
  };

  return (
    <AuthContext.Provider value={{ session, user, role, isGuest, loading, signOut, setGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
