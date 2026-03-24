import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, X, Check, Edit3, ShieldAlert, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  form: string;
  route: string;
  confidence: number;
}

interface AnalysisResult {
  medicines: ExtractedMedicine[];
  diagnosis: string;
  summary: string;
  recommendations: string[];
  abnormalities: string[];
  doctorName: string;
  followUpDate: string | null;
}

// Mock full analysis result — replace with real Claude/Vision API response
const mockAnalysis: AnalysisResult = {
  medicines: [
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", form: "Tablet", route: "Oral", confidence: 95 },
    { name: "Amoxicillin", dosage: "250mg", frequency: "Three times daily", duration: "7 days", form: "Capsule", route: "Oral", confidence: 88 },
    { name: "Omeprazole", dosage: "20mg", frequency: "Once daily", duration: "14 days", form: "Tablet", route: "Oral", confidence: 72 },
  ],
  diagnosis: "Type 2 Diabetes Mellitus with mild gastrointestinal infection",
  summary:
    "Patient presents with elevated blood glucose levels consistent with Type 2 Diabetes. An accompanying bacterial infection has been identified requiring antibiotic therapy. Gastrointestinal protective medication has been prescribed to prevent antibiotic-induced gastric irritation.",
  recommendations: [
    "Monitor blood glucose levels twice daily and maintain a log",
    "Complete the full antibiotic course even if symptoms resolve",
    "Take Omeprazole 30 minutes before breakfast",
    "Maintain a low-carb diet and stay hydrated",
    "Avoid alcohol during antibiotic course",
  ],
  abnormalities: [
    "Elevated fasting blood glucose (>126 mg/dL)",
    "Mild gastrointestinal bacterial infection detected",
    "Potential drug interaction: Metformin + Amoxicillin — monitor for GI distress",
  ],
  doctorName: "Dr. Sarah Chen",
  followUpDate: "2026-04-05",
};

const confidenceColor = (c: number) =>
  c >= 85 ? "bg-success" : c >= 60 ? "bg-warning" : "bg-destructive";
const confidenceText = (c: number) =>
  c >= 85 ? "text-success" : c >= 60 ? "text-warning" : "text-destructive";

const isPillPhoto = (file: File): boolean => {
  const name = file.name.toLowerCase();
  const pillKeywords = ["tablet", "pill", "capsule", "medicine", "drug", "packet", "strip", "blister"];
  return pillKeywords.some((kw) => name.includes(kw));
};

export default function PrescriptionAnalyzer() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editedMeds, setEditedMeds] = useState<ExtractedMedicine[]>([]);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setAnalysis(null);
    setEditingIdx(null);
    setRejectionError(null);
    setSaved(false);

    if (isPillPhoto(f)) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setRejectionError(
        "⚠️ This appears to be a tablet or medicine photo, not a prescription. Please upload a valid doctor's prescription."
      );
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnalyzing(true);

    // Replace this timeout with your real Claude/Vision API call
    setTimeout(() => {
      setAnalysis(mockAnalysis);
      setEditedMeds(mockAnalysis.medicines);
      setAnalyzing(false);
    }, 2000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setRejectionError(null);
    setEditingIdx(null);
    setSaved(false);
  };

  const updateMed = (idx: number, field: keyof ExtractedMedicine, value: string) => {
    setEditedMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  // Save confirmed scan to Supabase doctor_prescriptions table
  const handleConfirmAndSave = async () => {
    if (!analysis || !user) {
      toast.error("You must be logged in to save prescriptions.");
      return;
    }

    setSaving(true);
    try {
      const medicinesToSave = editedMeds.map((m) => ({
        name: `${m.name} ${m.dosage}`,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        form: m.form,
        route: m.route,
        confidence: m.confidence,
      }));

      const { error } = await supabase.from("doctor_prescriptions").insert({
        patient_id: user.id,
        doctor_id: user.id, // Replace with actual doctor_id if available
        medicines: medicinesToSave,
        diagnosis: analysis.diagnosis,
        notes: JSON.stringify({
          summary: analysis.summary,
          recommendations: analysis.recommendations,
          abnormalities: analysis.abnormalities,
          doctorName: analysis.doctorName,
          scannedAt: new Date().toISOString(),
        }),
        follow_up_date: analysis.followUpDate,
      });

      if (error) throw error;

      setSaved(true);
      toast.success("Prescription saved to history successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold">Prescription Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          Upload a prescription image and let AI extract medicine details
        </p>
      </div>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="section-title mb-4">Upload Prescription</h2>
          {!preview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <p className="text-sm font-medium">Drop your prescription here</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · Max 10MB</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <FileImage className="w-4 h-4" /> Browse Files
              </Button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Prescription preview"
                className="w-full rounded-xl object-contain max-h-80 bg-muted"
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {analyzing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-medium">Analyzing prescription...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Rejection Error */}
      <AnimatePresence>
        {rejectionError && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Alert variant="destructive" className="rounded-xl">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Invalid Upload</AlertTitle>
              <AlertDescription>{rejectionError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeleton */}
      <AnimatePresence>
        {analyzing && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {analysis && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Diagnosis & Summary */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
              <h2 className="section-title">Diagnosis Summary</h2>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-semibold text-primary">{analysis.diagnosis}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Medicines */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="section-title mb-4">Extracted Medicines</h2>
              <div className="space-y-4">
                {editedMeds.map((med, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{med.name}</h3>
                      <button
                        onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Dosage:</span> <span className="font-medium">{med.dosage}</span></div>
                      <div><span className="text-muted-foreground">Frequency:</span> <span className="font-medium">{med.frequency}</span></div>
                      <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{med.duration}</span></div>
                      <div><span className="text-muted-foreground">Form:</span> <span className="font-medium">{med.form}</span></div>
                      <div><span className="text-muted-foreground">Route:</span> <span className="font-medium">{med.route}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <Progress
                        value={med.confidence}
                        className={`flex-1 h-1.5 [&>div]:${confidenceColor(med.confidence)}`}
                      />
                      <span className={`text-xs font-semibold ${confidenceText(med.confidence)}`}>
                        {med.confidence}%
                      </span>
                    </div>
                    {editingIdx === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="grid grid-cols-2 gap-2 pt-2 border-t border-border"
                      >
                        <Input
                          defaultValue={med.name}
                          placeholder="Medicine name"
                          className="text-sm"
                          onChange={(e) => updateMed(i, "name", e.target.value)}
                        />
                        <Input
                          defaultValue={med.dosage}
                          placeholder="Dosage"
                          className="text-sm"
                          onChange={(e) => updateMed(i, "dosage", e.target.value)}
                        />
                        <Input
                          defaultValue={med.frequency}
                          placeholder="Frequency"
                          className="text-sm"
                          onChange={(e) => updateMed(i, "frequency", e.target.value)}
                        />
                        <Input
                          defaultValue={med.duration}
                          placeholder="Duration"
                          className="text-sm"
                          onChange={(e) => updateMed(i, "duration", e.target.value)}
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Abnormalities */}
            {analysis.abnormalities.length > 0 && (
              <div className="bg-card rounded-2xl border border-warning/30 p-6 space-y-3">
                <h2 className="section-title text-warning">Abnormalities & Interactions</h2>
                <ul className="space-y-2">
                  {analysis.abnormalities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                      <span className="text-muted-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-card rounded-2xl border border-success/30 p-6 space-y-3">
                <h2 className="section-title text-success">Recommendations</h2>
                <ul className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 w-2 h-2 rounded-full bg-success flex-shrink-0" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Button */}
            {saved ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-success/10 border border-success/30">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-sm font-medium text-success">
                  Saved to Prescription History
                </p>
              </div>
            ) : (
              <Button
                className="w-full gap-2 rounded-xl"
                onClick={handleConfirmAndSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Saving to History...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Confirm & Save to History
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
