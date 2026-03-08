import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, X, Check, Edit3, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  form: string;
  route: string;
  confidence: number;
}

const mockExtraction: ExtractedMedicine[] = [
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", form: "Tablet", route: "Oral", confidence: 95 },
  { name: "Amoxicillin", dosage: "250mg", frequency: "Three times daily", duration: "7 days", form: "Capsule", route: "Oral", confidence: 88 },
  { name: "Omeprazole", dosage: "20mg", frequency: "Once daily", duration: "14 days", form: "Tablet", route: "Oral", confidence: 72 },
];

const confidenceColor = (c: number) => c >= 85 ? "bg-success" : c >= 60 ? "bg-warning" : "bg-destructive";
const confidenceText = (c: number) => c >= 85 ? "text-success" : c >= 60 ? "text-warning" : "text-destructive";

// Simple heuristic: filenames containing these keywords suggest pill/tablet photos
const isPillPhoto = (file: File): boolean => {
  const name = file.name.toLowerCase();
  const pillKeywords = ["tablet", "pill", "capsule", "medicine", "drug", "packet", "strip", "blister"];
  return pillKeywords.some((kw) => name.includes(kw));
};

export default function PrescriptionAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ExtractedMedicine[] | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    // Clear ALL previous state first
    setResults(null);
    setEditingIdx(null);
    setRejectionError(null);

    // Check if it looks like a pill/tablet photo
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

    setTimeout(() => {
      setResults(mockExtraction);
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
    setResults(null);
    setRejectionError(null);
    setEditingIdx(null);
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold">Prescription Analyzer</h1>
        <p className="text-muted-foreground mt-1">Upload a prescription image and let AI extract medicine details</p>
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
              <img src={preview} alt="Prescription preview" className="w-full rounded-xl object-contain max-h-80 bg-muted" />
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
        {results && !analyzing && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="section-title mb-4">Extraction Results</h2>
              <div className="space-y-4">
                {results.map((med, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{med.name}</h3>
                      <button onClick={() => setEditingIdx(editingIdx === i ? null : i)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
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
                      <Progress value={med.confidence} className={`flex-1 h-1.5 [&>div]:${confidenceColor(med.confidence)}`} />
                      <span className={`text-xs font-semibold ${confidenceText(med.confidence)}`}>{med.confidence}%</span>
                    </div>
                    {editingIdx === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <Input defaultValue={med.name} placeholder="Medicine name" className="text-sm" />
                        <Input defaultValue={med.dosage} placeholder="Dosage" className="text-sm" />
                        <Input defaultValue={med.frequency} placeholder="Frequency" className="text-sm" />
                        <Input defaultValue={med.duration} placeholder="Duration" className="text-sm" />
                      </motion.div>
                    )}
                  </div>
                ))}
                <Button className="w-full gap-2 rounded-xl mt-4" onClick={() => {}}>
                  <Check className="w-4 h-4" /> Confirm & Validate
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
