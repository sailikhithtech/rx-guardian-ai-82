import { motion } from "framer-motion";
import { BarChart3, Flame, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const weeklyData = [
  { day: "Mon", taken: 4, missed: 0 },
  { day: "Tue", taken: 4, missed: 0 },
  { day: "Wed", taken: 3, missed: 1 },
  { day: "Thu", taken: 4, missed: 0 },
  { day: "Fri", taken: 2, missed: 2 },
  { day: "Sat", taken: 4, missed: 0 },
  { day: "Sun", taken: 3, missed: 1 },
];

const monthlyTrend = [
  { week: "W1", adherence: 95 },
  { week: "W2", adherence: 88 },
  { week: "W3", adherence: 92 },
  { week: "W4", adherence: 85 },
];

const perMedicine = [
  { name: "Metformin", adherence: 92, streak: 7 },
  { name: "Amoxicillin", adherence: 78, streak: 3 },
  { name: "Atorvastatin", adherence: 100, streak: 14 },
  { name: "Omeprazole", adherence: 85, streak: 5 },
];

export default function AdherenceAnalytics() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Adherence Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track your medication compliance</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => toast.success("Report downloaded!")}>
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Overall Adherence", value: "89%", color: "text-success" },
          { label: "This Week", value: "24/28", color: "text-primary" },
          { label: "Best Streak", value: "14 days", color: "text-warning" },
          { label: "Current Streak", value: "7 days 🔥", color: "text-destructive" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
          <h2 className="section-title mb-4">Weekly Doses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="taken" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Line type="monotone" dataKey="adherence" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Per Medicine */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
        <h2 className="section-title mb-4">Per-Medicine Adherence</h2>
        <div className="space-y-4">
          {perMedicine.map((med) => (
            <div key={med.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 truncate">{med.name}</span>
              <Progress value={med.adherence} className="flex-1 h-2.5" />
              <span className={`text-sm font-semibold w-12 text-right ${med.adherence >= 90 ? "text-success" : med.adherence >= 70 ? "text-warning" : "text-destructive"}`}>
                {med.adherence}%
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground w-20">
                <Flame className="w-3.5 h-3.5 text-warning" /> {med.streak}d streak
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
