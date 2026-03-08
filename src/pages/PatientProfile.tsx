import { useState } from "react";
import { motion } from "framer-motion";
import { User, Heart, AlertTriangle, Phone, Camera, Shield, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const allConditions = ["Type 2 Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid Disorder", "COPD", "Arthritis", "Chronic Kidney Disease"];

export default function PatientProfile() {
  const [name, setName] = useState("Alex Johnson");
  const [age, setAge] = useState("34");
  const [gender, setGender] = useState("Male");
  const [blood, setBlood] = useState("O+");
  const [emergency, setEmergency] = useState("+1 (555) 123-4567");
  const [conditions, setConditions] = useState<string[]>(["Type 2 Diabetes", "Hypertension"]);
  const [allergies, setAllergies] = useState<string[]>(["Penicillin", "Sulfonamides"]);
  const [allergyInput, setAllergyInput] = useState("");

  // Saved snapshot for display card
  const [saved, setSaved] = useState({ name, age, gender, blood, emergency });

  const handleSave = () => {
    setSaved({ name, age, gender, blood, emergency });
    toast.success("Profile updated successfully!");
  };

  const toggleCondition = (c: string) => {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) {
      setAllergies((prev) => [...prev, val]);
    }
    setAllergyInput("");
  };

  const removeAllergy = (a: string) => {
    setAllergies((prev) => prev.filter((x) => x !== a));
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-7 h-7 text-primary" /> Patient Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your health information</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
            <User className="w-10 h-10 text-primary" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold">{saved.name}</h2>
          <p className="text-sm text-muted-foreground">alex.johnson@email.com</p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{saved.age}</span></div>
            <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{saved.gender}</span></div>
            <div><span className="text-muted-foreground">Blood:</span> <span className="font-medium">{saved.blood}</span></div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Full Name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Age</label><Input value={age} onChange={(e) => setAge(e.target.value)} type="number" className="rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Blood Group</label>
              <select value={blood} onChange={(e) => setBlood(e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Emergency Contact</label><Input value={emergency} onChange={(e) => setEmergency(e.target.value)} className="rounded-xl" /></div>
          </div>
          <Button className="mt-4 rounded-xl" onClick={handleSave}>Save Changes</Button>
        </motion.div>
      </div>

      {/* Health Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" /> Chronic Conditions
          </h3>
          <div className="flex flex-wrap gap-2">
            {allConditions.map((c) => {
              const selected = conditions.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
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
                <button onClick={() => removeAllergy(a)} className="ml-1 hover:text-destructive/80">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {allergies.length === 0 && <p className="text-sm text-muted-foreground">No allergies added</p>}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type an allergy and press Enter"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAllergy()}
              className="rounded-xl text-sm flex-1"
            />
            <Button variant="outline" size="sm" className="rounded-xl" onClick={addAllergy}>Add</Button>
          </div>
        </motion.div>
      </div>

      {/* Health Summary Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent rounded-2xl border border-border p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" /> Health Summary
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-card/80">
            <p className="text-muted-foreground text-xs mb-1">Active Conditions</p>
            <p className="font-semibold">{conditions.length} condition{conditions.length !== 1 ? "s" : ""} being managed</p>
          </div>
          <div className="p-3 rounded-xl bg-card/80">
            <p className="text-muted-foreground text-xs mb-1">Allergy Alerts</p>
            <p className="font-semibold">{allergies.length} known allerg{allergies.length !== 1 ? "ies" : "y"} flagged</p>
          </div>
          <div className="p-3 rounded-xl bg-card/80">
            <p className="text-muted-foreground text-xs mb-1">Emergency Contact</p>
            <p className="font-semibold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {saved.emergency}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
