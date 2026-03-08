import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Pill, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isGuest, setGuest } = useAuth();

  const from = (location.state as any)?.from || "/";

  useEffect(() => {
    if (session || isGuest) {
      navigate(from, { replace: true });
    }
  }, [session, isGuest, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = () => {
    setGuest();
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Pill className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to RxVision</h1>
          <p className="text-muted-foreground mt-1 text-sm">AI-Powered Medication Safety</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button onClick={() => setIsSignup(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isSignup ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              Log In
            </button>
            <button onClick={() => setIsSignup(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isSignup ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input placeholder="Full Name" className="rounded-xl" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}
            <Input type="email" placeholder="Email address" className="rounded-xl" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Password" className="rounded-xl pr-10" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full rounded-xl gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSignup ? "Create Account" : "Log In"} {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" className="w-full rounded-xl" onClick={handleGuest}>
            Continue as Guest
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
