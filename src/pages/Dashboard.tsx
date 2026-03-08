import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardList, Pill, Bell, AlertTriangle, Upload,
  Clock, CheckCircle2, AlertCircle, ChevronRight,
  ScanLine, Bot, Search, MapPin, ArrowLeftRight, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } } };

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: t("dashboard.totalPrescriptions"), value: "12", icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { label: t("dashboard.activeMedicines"), value: "5", icon: Pill, color: "text-success", bg: "bg-success/10" },
    { label: t("dashboard.upcomingReminders"), value: "3", icon: Bell, color: "text-warning", bg: "bg-warning/10" },
    { label: t("dashboard.interactionsFound"), value: "1", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const todaySchedule = [
    { time: "8:00 AM", medicine: "Metformin 500mg", status: "taken", form: "Tablet" },
    { time: "12:00 PM", medicine: "Amoxicillin 250mg", status: "upcoming", form: "Capsule" },
    { time: "2:00 PM", medicine: "Omeprazole 20mg", status: "upcoming", form: "Tablet" },
    { time: "8:00 PM", medicine: "Metformin 500mg", status: "upcoming", form: "Tablet" },
    { time: "10:00 PM", medicine: "Atorvastatin 10mg", status: "upcoming", form: "Tablet" },
  ];

  const recentPrescriptions = [
    { id: 1, date: "Mar 5, 2026", doctor: "Dr. Sarah Chen", medicines: 3, status: "validated" },
    { id: 2, date: "Feb 28, 2026", doctor: "Dr. James Miller", medicines: 2, status: "warning" },
    { id: 3, date: "Feb 15, 2026", doctor: "Dr. Priya Sharma", medicines: 4, status: "pending" },
  ];

  const quickActions = [
    { label: t("dashboard.uploadPrescription"), path: "/analyze", icon: ScanLine, color: "bg-primary/10 text-primary" },
    { label: t("nav.rxbot"), path: "/rxbot", icon: Bot, color: "bg-success/10 text-success" },
    { label: t("nav.pillId"), path: "/pill-id", icon: Search, color: "bg-warning/10 text-warning" },
    { label: t("nav.pharmacies"), path: "/pharmacies", icon: MapPin, color: "bg-destructive/10 text-destructive" },
    { label: t("nav.alternatives"), path: "/alternatives", icon: ArrowLeftRight, color: "bg-primary/10 text-primary" },
    { label: t("nav.analytics"), path: "/analytics", icon: BarChart3, color: "bg-success/10 text-success" },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      validated: "bg-[hsl(152_76%_96%)] text-[hsl(152_55%_25%)]",
      warning: "bg-[hsl(48_96%_89%)] text-[hsl(32_95%_44%)]",
      pending: "bg-primary/10 text-primary",
    };
    const labels: Record<string, string> = {
      validated: t("dashboard.validated"),
      warning: t("dashboard.warning"),
      pending: t("dashboard.pending"),
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="rounded-2xl p-8 md:p-10 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(210 52% 24%) 0%, hsl(174 83% 30%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t("dashboard.greeting", { name: "Alex" })} 👋</h1>
            <p className="text-white/70 mt-2 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <Link to="/analyze">
            <Button size="lg" className="gap-2 rounded-xl bg-white text-secondary hover:bg-white/90 shadow-lg px-6 font-semibold">
              <Upload className="w-4 h-4" />
              {t("dashboard.uploadPrescription")}
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} className="stat-card">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold animate-count-up">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <motion.div key={action.path} variants={item}>
            <Link
              to={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 text-center"
            >
              <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Schedule & Recent */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }} className="lg:col-span-3 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("dashboard.todaySchedule")}
            </h2>
            <Link to="/reminders" className="text-sm text-primary font-medium hover:underline">{t("common.viewAll")}</Link>
          </div>

          {/* Timeline with teal connector */}
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-primary/20 rounded-full" />
            <div className="space-y-1">
              {todaySchedule.map((med, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-colors relative">
                  <div className={`relative z-10 w-3 h-3 rounded-full border-2 ${med.status === "taken" ? "bg-success border-success" : "bg-card border-primary/40"}`} />
                  <div className="text-sm font-medium text-muted-foreground w-20 shrink-0">{med.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{med.medicine}</p>
                    <p className="text-xs text-muted-foreground">{med.form}</p>
                  </div>
                  {med.status === "taken" ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }} className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">{t("dashboard.recentRx")}</h2>
            <Link to="/history" className="text-sm text-primary font-medium hover:underline">{t("nav.history")}</Link>
          </div>
          <div className="space-y-3">
            {recentPrescriptions.map((rx) => (
              <Link key={rx.id} to="/history" className="block p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 hover:-translate-y-px">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold">{rx.doctor}</span>
                  {statusBadge(rx.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{rx.date} · {rx.medicines} {t("dashboard.medicines")}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Adherence */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }} className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">{t("dashboard.weeklyAdherence")}</h2>
          <Link to="/analytics" className="text-sm text-primary font-medium hover:underline">{t("common.details")}</Link>
        </div>
        <div className="space-y-3">
          {[
            { name: "Metformin", adherence: 92 },
            { name: "Amoxicillin", adherence: 78 },
            { name: "Atorvastatin", adherence: 100 },
          ].map((med) => (
            <div key={med.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 truncate">{med.name}</span>
              <Progress value={med.adherence} className="flex-1 h-2.5" />
              <span className={`text-sm font-semibold w-12 text-right ${med.adherence >= 90 ? "text-success" : med.adherence >= 70 ? "text-warning" : "text-destructive"}`}>
                {med.adherence}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
