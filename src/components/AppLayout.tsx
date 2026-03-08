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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar fixed h-full z-30 rtl:border-r-0 rtl:border-l rtl:right-0 rtl:left-auto">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">RxVision</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navKeys.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {t(item.titleKey)}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
            {isGuest ? t("common.guestUser") : user?.email}
          </div>
          <LanguageSelector variant="full" />
          <button
            onClick={toggleDark}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {darkMode ? t("common.lightMode") : t("common.darkMode")}
          </button>
          <div className="my-1 border-t border-sidebar-border" />
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-[18px] h-[18px]" />
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
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-border z-50 lg:hidden flex flex-col rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l"
            >
              <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <Pill className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">RxVision</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {navKeys.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                      {t(item.titleKey)}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-sidebar-border">
                <LanguageSelector variant="full" />
                <div className="my-1 border-t border-sidebar-border mb-2" />
                <button
                  onClick={() => { setSidebarOpen(false); setShowLogoutDialog(true); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  {logoutLabel}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 rtl:lg:ml-0 rtl:lg:mr-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Pill className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">RxVision</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSelector variant="icon" />
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-background/90 backdrop-blur-lg border-t border-border z-30">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavKeys.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t(item.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
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
