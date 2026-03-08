import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Heart, AlertTriangle, Phone, Camera, Shield, X, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const allConditions = ["Type 2 Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid Disorder", "COPD", "Arthritis", "Chronic Kidney Disease"];

export default function PatientProfile() {
  const { signOut, isGuest } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Alex Johnson");
  const [age, setAge] = useState("34");
  const [gender, setGender] = useState("Male");
  const [blood, setBlood] = useState("O+");
  const [emergency, setEmergency] = useState("+1 (555) 123-4567");
  const [conditions, setConditions] = useState<string[]>(["Type 2 Diabetes", "Hypertension"]);
  const [allergies, setAllergies] = useState<string[]>(["Penicillin", "Sulfonamides"]);
  const [allergyInput, setAllergyInput] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [saved, setSaved] = useState({ name, age, gender, blood, emergency });

  const handleSave = () => { setSaved({ name, age, gender, blood, emergency }); toast.success("Profile updated successfully!"); };
  const handleLogout = async () => { await signOut(); toast.success("Logged out successfully 👋"); navigate("/login", { replace: true }); };
  const toggleCondition = (c: string) => setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const addAllergy = () => { const val = allergyInput.trim(); if (val && !allergies.includes(val)) setAllergies((prev) => [...prev, val]); setAllergyInput(""); };
  const removeAllergy = (a: string) => setAllergies((prev) => prev.filter((x) => x !== a));
  const logoutLabel = isGuest ? "Exit Guest Mode" : "Log Out";

  return (
    <div className="page-container">
      {/* Cover Banner */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden -mt-2"
        style={{ background: "linear-gradient(135deg, hsl(210 52% 24%) 0%, hsl(174 83% 30%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center relative">
            <User className="w-8 h-8 text-white" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center shadow-lg">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{saved.name}</h1>
            <p className="text-white/60 text-sm">alex.johnson@email.com</p>
            <div className="flex gap-4 mt-2 text-sm text-white/80">
              <span>Age: <strong>{saved.age}</strong></span>
              <span>Blood: <strong>{saved.blood}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11" /></div>
            <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Age</label><Input value={age} onChange={(e) => setAge(e.target.value)} type="number" className="rounded-xl h-11" /></div>
            <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none transition-colors">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Blood Group</label>
              <select value={blood} onChange={(e) => setBlood(e.target.value)} className="flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none transition-colors">
                <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="text-xs text-muted-foreground mb-1.5 block font-medium">Emergency Contact</label><Input value={emergency} onChange={(e) => setEmergency(e.target.value)} className="rounded-xl h-11" /></div>
          </div>
          <Button className="mt-5 rounded-xl" onClick={handleSave}>Save Changes</Button>
        </motion.div>

        {/* Health Summary Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Health Summary
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-muted-foreground text-xs mb-1 font-medium">Active Conditions</p>
              <p className="font-semibold text-sm">{conditions.length} condition{conditions.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-muted-foreground text-xs mb-1 font-medium">Allergy Alerts</p>
              <p className="font-semibold text-sm">{allergies.length} known allerg{allergies.length !== 1 ? "ies" : "y"}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-muted-foreground text-xs mb-1 font-medium">Emergency Contact</p>
              <p className="font-semibold text-sm flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {saved.emergency}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conditions & Allergies */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" /> Chronic Conditions
          </h3>
          <div className="flex flex-wrap gap-2">
            {allConditions.map((c) => {
              const selected = conditions.includes(c);
              return (
                <button key={c} onClick={() => toggleCondition(c)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border-2 transition-all duration-200 ${
                    selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {selected && "✓ "}{c}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" /> Known Allergies
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {allergies.map((a) => (
              <Badge key={a} variant="outline" className="rounded-full px-3 py-1 border-destructive/30 text-destructive bg-destructive/5 gap-1">
                {a}
                <button onClick={() => removeAllergy(a)} className="ml-1 hover:text-destructive/80"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {allergies.length === 0 && <p className="text-sm text-muted-foreground">No allergies added</p>}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type an allergy and press Enter" value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAllergy()} className="rounded-xl text-sm flex-1 h-10" />
            <Button variant="outline" size="sm" className="rounded-xl" onClick={addAllergy}>Add</Button>
          </div>
        </motion.div>
      </div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <button onClick={() => setShowLogoutDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="w-5 h-5" />
          {logoutLabel}
        </button>
      </motion.div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{isGuest ? "Exit Guest Mode?" : "Logout?"}</AlertDialogTitle>
            <AlertDialogDescription>{isGuest ? "You'll be redirected to the login page." : "Are you sure you want to logout of RxVision?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isGuest ? "Yes, Exit" : "Yes, Logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
