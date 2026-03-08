import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ScanLine, ShieldCheck, ArrowLeftRight, Bot,
  Bell, Search, ClipboardList, User, BarChart3, Menu, X,
  Pill, Moon, Sun, MapPin, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import LanguageSelector from "@/components/LanguageSelector";
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

const navKeys = [
  { titleKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { titleKey: "nav.analyze", path: "/analyze", icon: ScanLine },
  { titleKey: "nav.interactions", path: "/interactions", icon: ShieldCheck },
  { titleKey: "nav.alternatives", path: "/alternatives", icon: ArrowLeftRight },
  { titleKey: "nav.rxbot", path: "/rxbot", icon: Bot },
  { titleKey: "nav.reminders", path: "/reminders", icon: Bell },
  { titleKey: "nav.pillId", path: "/pill-id", icon: Search },
  { titleKey: "nav.pharmacies", path: "/pharmacies", icon: MapPin },
  { titleKey: "nav.history", path: "/history", icon: ClipboardList },
  { titleKey: "nav.analytics", path: "/analytics", icon: BarChart3 },
  { titleKey: "nav.profile", path: "/profile", icon: User },
];

const mobileNavKeys = [
  { titleKey: "nav.home", path: "/", icon: LayoutDashboard },
  { titleKey: "nav.analyze", path: "/analyze", icon: ScanLine },
  { titleKey: "nav.rxbot", path: "/rxbot", icon: Bot },
  { titleKey: "nav.reminders", path: "/reminders", icon: Bell },
  { titleKey: "nav.profile", path: "/profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, isGuest, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success(t("auth.loggedOut"));
    navigate("/login", { replace: true });
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const logoutLabel = isGuest ? t("common.exitGuest") : t("common.logout");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar — Deep Medical Blue */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-sidebar fixed h-full z-30 rtl:right-0 rtl:left-auto shadow-xl"
        style={{ background: "linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(210 52% 20%) 100%)" }}
      >
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">RxVision</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navKeys.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 h-[44px] rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-white"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                {t(item.titleKey)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 space-y-2">
          <div className="px-4 py-2 text-xs text-sidebar-foreground/60 truncate">
            {isGuest ? t("common.guestUser") : user?.email}
          </div>
          <LanguageSelector variant="full" />
          <button
            onClick={toggleDark}
            className="flex items-center gap-3 px-4 h-[44px] rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-muted hover:text-white w-full transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {darkMode ? t("common.lightMode") : t("common.darkMode")}
          </button>
          <div className="mx-3 border-t border-sidebar-border" />
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 px-4 h-[44px] rounded-xl text-sm font-medium w-full transition-all duration-200 text-red-300 hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="w-5 h-5" />
            {logoutLabel}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden flex flex-col shadow-2xl rtl:left-auto rtl:right-0"
              style={{ background: "linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(210 52% 20%) 100%)" }}
            >
              <div className="h-[72px] flex items-center justify-between px-5 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Pill className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-white">RxVision</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-muted text-sidebar-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navKeys.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 h-[44px] rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {t(item.titleKey)}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-3 pb-4 space-y-2">
                <LanguageSelector variant="full" />
                <div className="mx-3 border-t border-sidebar-border" />
                <button
                  onClick={() => { setSidebarOpen(false); setShowLogoutDialog(true); }}
                  className="flex items-center gap-3 px-4 h-[44px] rounded-xl text-sm font-medium w-full transition-all duration-200 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                >
                  <LogOut className="w-5 h-5" />
                  {logoutLabel}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px] rtl:lg:ml-0 rtl:lg:mr-[260px] flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center justify-between shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Pill className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">RxVision</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSelector variant="icon" />
            <button onClick={toggleDark} className="p-2 rounded-xl hover:bg-muted transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-xl border-t border-border z-30 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavKeys.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[44px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{t(item.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl shadow-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{isGuest ? t("logoutDialog.guestTitle") : t("logoutDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {isGuest ? t("logoutDialog.guestMessage") : t("logoutDialog.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isGuest ? t("logoutDialog.guestConfirm") : t("logoutDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
