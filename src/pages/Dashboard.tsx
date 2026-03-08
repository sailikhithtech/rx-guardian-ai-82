import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClipboardList, Pill, Bell, AlertTriangle, Upload,
  Clock, CheckCircle2, AlertCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  { label: "Total Prescriptions", value: "12", icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Medicines", value: "5", icon: Pill, color: "text-success", bg: "bg-success/10" },
  { label: "Upcoming Reminders", value: "3", icon: Bell, color: "text-warning", bg: "bg-warning/10" },
  { label: "Interactions Found", value: "1", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
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

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    validated: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    pending: "bg-primary/10 text-primary",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ""}`}>
      {status}
    </span>
  );
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Good morning, Alex 👋</h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <Link to="/analyze">
            <Button size="lg" className="gap-2 rounded-xl shadow-md shadow-primary/20 px-6">
              <Upload className="w-4 h-4" />
              Upload Prescription
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-card rounded-2xl border border-border p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Schedule
            </h2>
            <Link to="/reminders" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {todaySchedule.map((med, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${med.status === "taken" ? "bg-success/5" : "bg-muted/50"}`}>
                <div className="text-sm font-medium text-muted-foreground w-20 shrink-0">{med.time}</div>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{med.medicine}</p>
                  <p className="text-xs text-muted-foreground">{med.form}</p>
                </div>
                {med.status === "taken" ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Prescriptions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Rx</h2>
            <Link to="/history" className="text-sm text-primary font-medium hover:underline">History</Link>
          </div>
          <div className="space-y-3">
            {recentPrescriptions.map((rx) => (
              <Link key={rx.id} to="/history" className="block p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{rx.doctor}</span>
                  {statusBadge(rx.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{rx.date} · {rx.medicines} medicines</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Adherence Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Weekly Adherence</h2>
          <Link to="/analytics" className="text-sm text-primary font-medium hover:underline">Details</Link>
        </div>
        <div className="space-y-3">
          {[
            { name: "Metformin", adherence: 92 },
            { name: "Amoxicillin", adherence: 78 },
            { name: "Atorvastatin", adherence: 100 },
          ].map((med) => (
            <div key={med.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 truncate">{med.name}</span>
              <Progress value={med.adherence} className="flex-1 h-2" />
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
