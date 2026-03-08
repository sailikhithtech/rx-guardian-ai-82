import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Clock, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Reminder {
  id: number;
  medicine: string;
  time: string;
  frequency: string;
  startDate: string;
  endDate: string;
  active: boolean;
  status: "upcoming" | "overdue" | "completed";
}

const initialReminders: Reminder[] = [
  { id: 1, medicine: "Metformin 500mg", time: "08:00", frequency: "Twice Daily", startDate: "2026-03-01", endDate: "2026-03-31", active: true, status: "upcoming" },
  { id: 2, medicine: "Amoxicillin 250mg", time: "12:00", frequency: "Three times daily", startDate: "2026-03-05", endDate: "2026-03-12", active: true, status: "upcoming" },
  { id: 3, medicine: "Omeprazole 20mg", time: "07:00", frequency: "Daily", startDate: "2026-03-01", endDate: "2026-03-15", active: false, status: "completed" },
  { id: 4, medicine: "Atorvastatin 10mg", time: "22:00", frequency: "Daily", startDate: "2026-02-20", endDate: "2026-04-20", active: true, status: "overdue" },
];

const statusStyle: Record<string, string> = {
  upcoming: "border-l-primary bg-primary/5",
  overdue: "border-l-destructive bg-destructive/5",
  completed: "border-l-success bg-success/5",
};

export default function Reminders() {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);

  const toggleReminder = (id: number) => {
    setReminders(reminders.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((r) => r.id !== id));
    toast.success("Reminder deleted");
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" /> Medication Reminders
          </h1>
          <p className="text-muted-foreground mt-1">Never miss a dose with smart reminders</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add Reminder
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
          <h3 className="font-semibold mb-4">New Reminder</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Input placeholder="Medicine name" className="rounded-xl" />
            <Input type="time" className="rounded-xl" />
            <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option>Daily</option>
              <option>Twice Daily</option>
              <option>Weekly</option>
            </select>
            <Input type="date" placeholder="Start date" className="rounded-xl" />
            <Input type="date" placeholder="End date" className="rounded-xl" />
            <Input placeholder="Notes (optional)" className="rounded-xl" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="rounded-xl" onClick={() => { setShowForm(false); toast.success("Reminder added!"); }}>Save Reminder</Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {reminders.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-card rounded-xl border border-border border-l-4 p-4 flex items-center gap-4 ${statusStyle[r.status]}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.medicine}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.time}</span>
                <span>·</span>
                <span>{r.frequency}</span>
              </div>
            </div>
            <Switch checked={r.active} onCheckedChange={() => toggleReminder(r.id)} />
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => toast.info("Edit coming soon")}>
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" onClick={() => deleteReminder(r.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
