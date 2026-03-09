import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, MessageCircle, ClipboardList,
  BarChart3, Settings, LogOut, Menu, X, Moon, Sun, Stethoscope
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { title: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
  { title: "Appointments", path: "/doctor/appointments", icon: Calendar },
  { title: "My Patients", path: "/doctor/patients", icon: Users },
  { title: "Prescriptions", path: "/doctor/prescriptions", icon: ClipboardList },
  { title: "Analytics", path: "/doctor/analytics", icon: BarChart3 },
  { title: "Settings", path: "/doctor/settings", icon: Settings },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{ background: "linear-gradient(180deg, hsl(213 65% 16%) 0%, hsl(210 52% 20%) 100%)" }}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">RxVision</span>
              <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30 border-0 text-[10px]">Doctor Portal</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={doctorProfile?.profile_photo_url || ''} />
              <AvatarFallback className="bg-primary/20 text-white text-sm">
                {doctorProfile?.full_name?.[0] || 'D'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Dr. {doctorProfile?.full_name || 'Doctor'}</p>
              <p className="text-white/50 text-xs truncate">{doctorProfile?.specialization || 'Specialist'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/60 text-xs">Online</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-primary text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <button onClick={toggleDark} className="flex items-center gap-3 px-3 py-2 w-full text-white/60 hover:text-white text-sm transition-colors">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={() => setShowLogoutDialog(true)} className="flex items-center gap-3 px-3 py-2 w-full text-red-400 hover:text-red-300 text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span className="font-bold">Doctor Portal</span>
        </div>
        <button onClick={toggleDark}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 z-50 flex flex-col"
              style={{ background: "linear-gradient(180deg, hsl(213 65% 16%) 0%, hsl(210 52% 20%) 100%)" }}>
              <div className="p-4 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-white" />
                  <span className="text-white font-bold">Doctor Portal</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10">
                <button onClick={() => { setShowLogoutDialog(true); setSidebarOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 w-full text-red-400 text-sm">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Logout dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Doctor Portal?</AlertDialogTitle>
            <AlertDialogDescription>You will need to sign in again to access your dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
