import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Pill, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Step = "form" | "otp" | "success";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [shakeOtp, setShakeOtp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isGuest, setGuest } = useAuth();

  const from = (location.state as any)?.from || "/";

  useEffect(() => {
    if (session || isGuest) {
      navigate(from, { replace: true });
    }
  }, [session, isGuest, navigate, from]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Lock timer check
  useEffect(() => {
    if (!lockUntil) return;
    const remaining = lockUntil - Date.now();
    if (remaining <= 0) {
      setLockUntil(null);
      setWrongAttempts(0);
      return;
    }
    const timer = setTimeout(() => {
      setLockUntil(null);
      setWrongAttempts(0);
    }, remaining);
    return () => clearTimeout(timer);
  }, [lockUntil]);

  // Success auto-redirect
  useEffect(() => {
    if (step !== "success") return;
    const timer = setTimeout(() => navigate(from, { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [step, navigate, from]);

  const startResendCountdown = useCallback(() => {
    setResendCountdown(30);
  }, []);

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
        setStep("otp");
        startResendCountdown();
        toast.success("Verification code sent to your email!");
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

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;
    if (lockUntil && Date.now() < lockUntil) {
      toast.error("Too many attempts. Please wait before trying again.");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpValue,
        type: "signup",
      });
      if (error) throw error;
      setStep("success");
    } catch {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 600);
      setOtpValue("");

      if (newAttempts >= 3) {
        setLockUntil(Date.now() + 60_000);
        toast.error("Too many wrong attempts. Locked for 1 minute.");
      } else {
        toast.error(`Invalid OTP. ${3 - newAttempts} attempt(s) remaining.`);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setOtpValue("");
      setWrongAttempts(0);
      setLockUntil(null);
      startResendCountdown();
      toast.success("New verification code sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpValue("");
    setWrongAttempts(0);
    setLockUntil(null);
  };

  const handleGuest = () => {
    setGuest();
    navigate(from, { replace: true });
  };

  const isLocked = lockUntil !== null && Date.now() < lockUntil;
  const formatCountdown = (s: number) => `0:${s.toString().padStart(2, "0")}`;

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
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
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
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Pill className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Verify your email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <motion.div animate={shakeOtp ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
                    <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} disabled={isLocked}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-11 h-12 text-lg border-border" />
                        <InputOTPSlot index={1} className="w-11 h-12 text-lg border-border" />
                        <InputOTPSlot index={2} className="w-11 h-12 text-lg border-border" />
                        <InputOTPSlot index={3} className="w-11 h-12 text-lg border-border" />
                        <InputOTPSlot index={4} className="w-11 h-12 text-lg border-border" />
                        <InputOTPSlot index={5} className="w-11 h-12 text-lg border-border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </motion.div>
                </div>

                {isLocked && (
                  <p className="text-center text-sm text-destructive font-medium">
                    Too many attempts. Please wait 1 minute.
                  </p>
                )}

                <Button className="w-full rounded-xl gap-2" disabled={otpValue.length !== 6 || verifying || isLocked} onClick={handleVerifyOtp}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify OTP
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button onClick={handleBackToForm} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Change Email
                  </button>
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground">Resend in {formatCountdown(resendCountdown)}</span>
                  ) : (
                    <button onClick={handleResendOtp} className="text-primary hover:text-primary/80 font-medium transition-colors">
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center space-y-4 py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                </motion.div>
                <h2 className="text-lg font-semibold">Email verified successfully!</h2>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                <div className="w-8 h-1 bg-primary rounded-full mx-auto animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
