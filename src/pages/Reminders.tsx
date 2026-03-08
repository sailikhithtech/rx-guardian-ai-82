import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Clock, Trash2, Edit3, X } from "lucide-react";
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
  notes: string;
  active: boolean;
  status: "upcoming" | "overdue" | "completed";
}

const initialReminders: Reminder[] = [
  { id: 1, medicine: "Metformin 500mg", time: "08:00", frequency: "Twice Daily", startDate: "2026-03-01", endDate: "2026-03-31", notes: "", active: true, status: "upcoming" },
  { id: 2, medicine: "Amoxicillin 250mg", time: "12:00", frequency: "Three times daily", startDate: "2026-03-05", endDate: "2026-03-12", notes: "", active: true, status: "upcoming" },
  { id: 3, medicine: "Omeprazole 20mg", time: "07:00", frequency: "Daily", startDate: "2026-03-01", endDate: "2026-03-15", notes: "", active: false, status: "completed" },
  { id: 4, medicine: "Atorvastatin 10mg", time: "22:00", frequency: "Daily", startDate: "2026-02-20", endDate: "2026-04-20", notes: "", active: true, status: "overdue" },
];

const statusStyle: Record<string, string> = {
  upcoming: "border-l-primary bg-primary/5",
  overdue: "border-l-destructive bg-destructive/5",
  completed: "border-l-success bg-success/5",
};

const emptyForm = { medicine: "", time: "", frequency: "Daily", startDate: "", endDate: "", notes: "" };

export default function Reminders() {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const updateForm = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setForm({ medicine: r.medicine, time: r.time, frequency: r.frequency, startDate: r.startDate, endDate: r.endDate, notes: r.notes });
    setEditingId(r.id);
    setShowForm(true);
  };

  const saveReminder = () => {
    if (!form.medicine.trim() || !form.time) {
      toast.error("Please fill in medicine name and time");
      return;
    }

    if (editingId !== null) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, medicine: form.medicine, time: form.time, frequency: form.frequency, startDate: form.startDate, endDate: form.endDate, notes: form.notes }
            : r
        )
      );
      toast.success("Reminder updated!");
    } else {
      const newReminder: Reminder = {
        id: Date.now(),
        medicine: form.medicine,
        time: form.time,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes,
        active: true,
        status: "upcoming",
      };
      setReminders((prev) => [newReminder, ...prev]);
      toast.success("Reminder added!");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleReminder = (id: number) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteReminder = (id: number) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast.success("Reminder deleted");
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" /> Medication Reminders
          </h1>
          <p className="text-muted-foreground mt-1">Never miss a dose with smart reminders</p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-xl self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Reminder
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editingId ? "Edit Reminder" : "New Reminder"}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input placeholder="Medicine name *" value={form.medicine} onChange={(e) => updateForm("medicine", e.target.value)} className="rounded-xl" />
              <Input type="time" value={form.time} onChange={(e) => updateForm("time", e.target.value)} className="rounded-xl" />
              <select value={form.frequency} onChange={(e) => updateForm("frequency", e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                <option>Daily</option>
                <option>Twice Daily</option>
                <option>Three times daily</option>
                <option>Weekly</option>
              </select>
              <Input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} placeholder="Start date" className="rounded-xl" />
              <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} placeholder="End date" className="rounded-xl" />
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="rounded-xl" onClick={saveReminder}>{editingId ? "Update" : "Save"} Reminder</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {reminders.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          No reminders yet. Click "Add Reminder" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card rounded-xl border border-border border-l-4 p-4 flex items-center gap-4 ${statusStyle[r.status]}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.medicine}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.time}</span>
                  <span>·</span>
                  <span>{r.frequency}</span>
                  {r.notes && <><span>·</span><span className="truncate max-w-[120px]">{r.notes}</span></>}
                </div>
              </div>
              <Switch checked={r.active} onCheckedChange={() => toggleReminder(r.id)} />
              <button className="p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => openEdit(r)}>
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" onClick={() => deleteReminder(r.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
