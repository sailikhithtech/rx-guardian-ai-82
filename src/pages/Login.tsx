import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Pill, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ArrowLeft, Shield, Heart, Bot, Mail, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Step = "form" | "otp" | "success";
type AuthMode = "login" | "signup" | "otp-login";
type UserRole = "patient" | "doctor";

const friendlyError = (msg: string) => {
  if (msg.includes("Invalid login credentials")) return "❌ Wrong email or password. Try again.";
  if (msg.includes("Email not confirmed")) return "📧 Please verify your email first.";
  if (msg.includes("User already registered")) return "Account exists! Please login instead.";
  if (msg.includes("Invalid OTP") || msg.includes("Token has expired or is invalid")) return "❌ Wrong code. Please try again.";
  if (msg.includes("OTP expired")) return "⏰ Code expired. Click Resend OTP.";
  if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) return "🌐 Connection error. Check your internet.";
  return msg;
};

export default function Login() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [shakeOtp, setShakeOtp] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, role, isGuest, setGuest, loading } = useAuth();

  const otpType = authMode === "signup" ? "signup" : "email";

  // Redirect if already logged in
  useEffect(() => {
    if (loading) return;
    if (session && role) {
      const dest = role === "doctor" ? "/doctor/dashboard" : "/";
      navigate(dest, { replace: true });
    } else if (isGuest) {
      navigate("/", { replace: true });
    }
  }, [session, role, isGuest, loading, navigate]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const startResendCountdown = useCallback(() => setResendCountdown(30), []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      chars.forEach((ch, i) => {
        if (i + index < 6) newDigits[i + index] = ch;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (newDigits.every((d) => d !== "")) {
        setTimeout(() => handleVerifyOtp(newDigits.join("")), 100);
      }
      return;
    }
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && newDigits.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOtp(newDigits.join("")), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = "";
      setOtpDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const navigateByRole = async () => {
    // Get the fresh user to check their actual role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const metaRole = user.user_metadata?.role;
    if (metaRole === "doctor") {
      navigate("/doctor/dashboard", { replace: true });
      return;
    }
    if (metaRole === "patient") {
      navigate("/", { replace: true });
      return;
    }

    // Fallback: check user_roles table
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles?.some((r) => r.role === "doctor")) {
      navigate("/doctor/dashboard", { replace: true });
      return;
    }

    // Fallback: check doctor_profiles
    const { data: docProfile } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (docProfile) {
      navigate("/doctor/dashboard", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role: selectedRole } },
        });
        if (error) throw error;
        setStep("otp");
        startResendCountdown();
        toast.success("Verification code sent to your email!");
      } else if (authMode === "otp-login") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setStep("otp");
        startResendCountdown();
        toast.success("Login code sent to your email!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        await navigateByRole();
      }
    } catch (err: any) {
      toast.error(friendlyError(err.message || "Authentication failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const token = code || otpDigits.join("");
    if (token.length !== 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: otpType });
      if (error) throw error;
      setStep("success");
      toast.success("Email verified successfully!");
      setTimeout(() => navigateByRole(), 1500);
    } catch (err: any) {
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 600);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.error(friendlyError(err.message || "Verification failed"));
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.resend({ email, type: "signup" });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (error) throw error;
      }
      setOtpDigits(["", "", "", "", "", ""]);
      startResendCountdown();
      toast.success("New code sent! ✉️");
    } catch (err: any) {
      toast.error(friendlyError(err.message || "Failed to resend code"));
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleGuest = () => {
    setGuest();
    navigate("/", { replace: true });
  };

  const formatCountdown = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  const features = [
    { icon: Shield, label: "Drug Interaction Alerts" },
    { icon: Bot, label: "AI-Powered RxBot Assistant" },
    { icon: Heart, label: "Health Tracking & Reminders" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden text-white flex-col justify-between p-10"
        style={{ background: "linear-gradient(135deg, hsl(210 52% 24%) 0%, hsl(174 83% 30%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 30% 80%, white 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Pill className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">RxVision</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">AI-Powered<br />Medication Safety</h2>
          <p className="text-white/60 text-lg max-w-md">Intelligent prescription analysis, drug interaction alerts, and personalized medication guidance.</p>
        </div>
        <div className="relative z-10 space-y-4">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><f.icon className="w-5 h-5" /></div>
              <span className="font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <Pill className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to RxVision</h1>
            <p className="text-muted-foreground mt-1 text-sm">AI-Powered Medication Safety</p>
          </div>
          {/* Desktop header */}
          <div className="lg:block hidden mb-8">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
            <AnimatePresence mode="wait">
              {/* ═══ FORM STEP ═══ */}
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  {/* Role Tabs - Patient / Doctor */}
                  <div className="flex bg-muted rounded-xl p-1 mb-5">
                    <button
                      onClick={() => setSelectedRole("patient")}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        selectedRole === "patient"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <User className="w-4 h-4" /> Patient
                    </button>
                    <button
                      onClick={() => setSelectedRole("doctor")}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        selectedRole === "doctor"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" /> Doctor
                    </button>
                  </div>

                  {/* Auth Mode Tabs */}
                  <div className="flex bg-muted/50 rounded-xl p-1 mb-6">
                    <button
                      onClick={() => setAuthMode("login")}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {selectedRole === "doctor" && (
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      {authMode === "login" ? "Login with your registered doctor credentials" : "Create a new doctor account"}
                    </p>
                  )}

                  {authMode !== "otp-login" ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {authMode === "signup" && (
                        <Input placeholder="Full Name" className="rounded-xl h-11" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      )}
                      <Input type="email" placeholder="Email address" className="rounded-xl h-11" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="rounded-xl h-11 pr-10"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button type="submit" className="w-full rounded-xl h-11 gap-2" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {authMode === "signup" ? "Create Account" : "Log In"} {!submitting && <ArrowRight className="w-4 h-4" />}
                      </Button>
                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => setAuthMode("otp-login")}
                          className="w-full text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1.5 py-2 transition-colors"
                        >
                          <Mail className="w-4 h-4" /> Login with OTP instead
                        </button>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input type="email" placeholder="Email address" className="rounded-xl h-11" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      <Button type="submit" className="w-full rounded-xl h-11 gap-2" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Send OTP {!submitting && <ArrowRight className="w-4 h-4" />}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" /> Back to password login
                      </button>
                    </form>
                  )}

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
                  </div>
                  {selectedRole === "patient" && (
                    <Button variant="ghost" className="w-full rounded-xl h-11 border border-border" onClick={handleGuest}>
                      Continue as Guest
                    </Button>
                  )}
                  {selectedRole === "doctor" && authMode === "login" && (
                    <Link to="/doctor/register" className="block text-center text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors">
                      Don't have a doctor account? Register here →
                    </Link>
                  )}
                </motion.div>
              )}

              {/* ═══ OTP STEP ═══ */}
              {step === "otp" && (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <button onClick={handleBackToForm} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Check your email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                  <motion.div animate={shakeOtp ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }} className="flex gap-2 justify-center mb-6">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                          if (pasted) handleOtpChange(0, pasted);
                        }}
                        className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none ${
                          digit ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30"
                        } focus:border-primary focus:ring-2 focus:ring-primary/20`}
                        disabled={verifying}
                      />
                    ))}
                  </motion.div>
                  <Button onClick={() => handleVerifyOtp()} className="w-full rounded-xl h-11 gap-2" disabled={verifying || otpDigits.some((d) => !d)}>
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify Code
                  </Button>
                  <div className="text-center mt-4">
                    {resendCountdown > 0 ? (
                      <p className="text-sm text-muted-foreground">Resend in <span className="font-medium text-primary">{formatCountdown(resendCountdown)}</span></p>
                    ) : (
                      <button onClick={handleResendOtp} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">Resend Code</button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ SUCCESS ═══ */}
              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">You're all set!</h3>
                  <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
