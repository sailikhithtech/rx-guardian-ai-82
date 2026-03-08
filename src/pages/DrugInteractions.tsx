import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ChevronDown, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const medicines = [
  {
    name: "Metformin",
    generic: "Metformin Hydrochloride",
    dosageRange: "500mg - 2000mg/day",
    warnings: ["May cause lactic acidosis in rare cases", "Monitor kidney function"],
    contraindications: ["Severe renal impairment", "Metabolic acidosis"],
    ageGroup: "Adult",
  },
  {
    name: "Amoxicillin",
    generic: "Amoxicillin Trihydrate",
    dosageRange: "250mg - 500mg every 8h",
    warnings: ["Check for penicillin allergy", "May cause diarrhea"],
    contraindications: ["Penicillin hypersensitivity"],
    ageGroup: "All Ages",
  },
  {
    name: "Omeprazole",
    generic: "Omeprazole Magnesium",
    dosageRange: "20mg - 40mg/day",
    warnings: ["Long-term use may affect B12 absorption", "Risk of C. difficile"],
    contraindications: ["Known hypersensitivity"],
    ageGroup: "Adult",
  },
];

const interactions = [
  { drug1: "Metformin", drug2: "Amoxicillin", severity: "none", detail: "No clinically significant interaction." },
  { drug1: "Metformin", drug2: "Omeprazole", severity: "mild", detail: "Omeprazole may slightly reduce Metformin absorption. Monitor blood glucose." },
  { drug1: "Amoxicillin", drug2: "Omeprazole", severity: "moderate", detail: "Omeprazole may reduce Amoxicillin efficacy. Consider timing doses 2 hours apart." },
];

const severityConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  none: { label: "None", color: "text-success", bg: "bg-success/10", dot: "🟢" },
  mild: { label: "Mild", color: "text-warning", bg: "bg-warning/10", dot: "🟡" },
  moderate: { label: "Moderate", color: "text-warning", bg: "bg-warning/15", dot: "🟠" },
  severe: { label: "Severe", color: "text-destructive", bg: "bg-destructive/10", dot: "🔴" },
};

const ageBadge = (age: string) => {
  const colors: Record<string, string> = {
    "Adult": "bg-primary/10 text-primary",
    "All Ages": "bg-success/10 text-success",
    "Pediatric": "bg-warning/10 text-warning",
    "Elderly": "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[age] || ""}`}>{age}</span>;
};

export default function DrugInteractions() {
  const [expandedInteraction, setExpandedInteraction] = useState<number | null>(null);
  const hasSevere = interactions.some((i) => i.severity === "severe");

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" /> Drug Validation & Interactions
        </h1>
        <p className="text-muted-foreground mt-1">Review extracted medicines and check for potential interactions</p>
      </div>

      {/* Medicine Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {medicines.map((med, i) => (
          <motion.div
            key={med.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{med.name}</h3>
                <p className="text-xs text-muted-foreground">{med.generic}</p>
              </div>
              {ageBadge(med.ageGroup)}
            </div>
            <p className="text-sm mb-3"><span className="text-muted-foreground">Dosage range:</span> <span className="font-medium">{med.dosageRange}</span></p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warnings</p>
              {med.warnings.map((w, j) => (
                <div key={j} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interaction Matrix */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border p-5 md:p-6">
        <h2 className="section-title mb-4">Interaction Matrix</h2>
        <div className="space-y-2">
          {interactions.map((inter, i) => {
            const config = severityConfig[inter.severity];
            const expanded = expandedInteraction === i;
            return (
              <div key={i} className={`rounded-xl border border-border overflow-hidden transition-colors ${expanded ? config.bg : ""}`}>
                <button
                  onClick={() => setExpandedInteraction(expanded ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{config.dot}</span>
                    <span className="font-medium text-sm">{inter.drug1}</span>
                    <span className="text-muted-foreground text-sm">×</span>
                    <span className="font-medium text-sm">{inter.drug2}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{inter.detail}</p>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Severe Warning Banner */}
      {hasSevere && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Severe Interaction Detected</h3>
            <p className="text-sm text-muted-foreground mt-1">Please consult your doctor before taking these medications together.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Phone className="w-4 h-4" /> Call Doctor
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
              <MapPin className="w-4 h-4" /> Nearest Hospital
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
