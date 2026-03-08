import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Pill, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(isSignup ? "Account created!" : "Welcome back!");
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
            {isSignup && <Input placeholder="Full Name" className="rounded-xl" required />}
            <Input type="email" placeholder="Email address" className="rounded-xl" required />
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Password" className="rounded-xl pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Age" className="rounded-xl" />
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                  <option value="" disabled selected>Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            )}
            <Button type="submit" className="w-full rounded-xl gap-2">
              {isSignup ? "Create Account" : "Log In"} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
          </div>

          <Link to="/">
            <Button variant="outline" className="w-full rounded-xl">
              Continue as Guest
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
