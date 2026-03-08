import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, AlertCircle, Pill, CheckCircle2, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const mockResult = {
  name: "Amoxicillin 500mg",
  description: "White oval capsule with red band, imprint 'AMOX 500'",
  uses: ["Bacterial infections", "Respiratory tract infections", "Urinary tract infections", "Skin infections"],
  warnings: ["Do not use if allergic to penicillin", "May cause diarrhea", "Complete the full course"],
};

const manualSearchData: Record<string, typeof mockResult> = {
  amoxicillin: mockResult,
  metformin: {
    name: "Metformin 500mg",
    description: "White round tablet, imprint 'MET 500'",
    uses: ["Type 2 diabetes", "Blood sugar control", "Insulin resistance"],
    warnings: ["May cause lactic acidosis in rare cases", "Take with food", "Monitor kidney function"],
  },
  omeprazole: {
    name: "Omeprazole 20mg",
    description: "Purple and white delayed-release capsule",
    uses: ["Acid reflux (GERD)", "Stomach ulcers", "Heartburn relief"],
    warnings: ["Do not crush or chew", "Long-term use may affect magnesium levels", "Consult doctor if symptoms persist"],
  },
};

export default function PillIdentifier() {
  const [preview, setPreview] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<typeof mockResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualResult, setManualResult] = useState<typeof mockResult | null>(null);
  const [manualNotFound, setManualNotFound] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setResult(null);
    setFailed(false);
    setPreview(URL.createObjectURL(f));
    setIdentifying(false);
  };

  const handleIdentify = () => {
    if (!preview) return;
    setResult(null);
    setFailed(false);
    setIdentifying(true);
    setTimeout(() => {
      // Simulate: ~80% success rate
      if (Math.random() > 0.2) {
        setResult(mockResult);
      } else {
        setFailed(true);
      }
      setIdentifying(false);
    }, 2000);
  };

  const clearFile = () => {
    setPreview(null);
    setResult(null);
    setFailed(false);
    setIdentifying(false);
  };

  const handleManualSearch = () => {
    const key = manualQuery.trim().toLowerCase();
    setManualNotFound(false);
    setManualResult(null);
    if (!key) return;
    const found = manualSearchData[key];
    if (found) {
      setManualResult(found);
    } else {
      setManualNotFound(true);
    }
  };

  const displayResult = result || manualResult;

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-7 h-7 text-primary" /> Pill Identifier
        </h1>
        <p className="text-muted-foreground mt-1">Upload a photo of a pill to identify it</p>
      </div>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <p className="text-sm font-medium">Upload a pill photo</p>
            <p className="text-xs text-muted-foreground mt-1">Take a clear photo on a flat surface · JPG or PNG</p>
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              <FileImage className="w-4 h-4" /> Browse Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-sm mx-auto">
              <img src={preview} alt="Pill preview" className="w-full rounded-xl object-contain max-h-64 bg-muted" />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={handleIdentify} disabled={identifying} className="w-full gap-2 rounded-xl">
              <Pill className="w-4 h-4" /> {identifying ? "Identifying..." : "Identify Pill"}
            </Button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/jpg"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </motion.div>

      {/* Loading Skeleton */}
      <AnimatePresence>
        {identifying && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium">Identifying pill...</p>
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identification Failed */}
      <AnimatePresence>
        {failed && !identifying && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card rounded-2xl border border-destructive/30 p-6 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="text-sm font-medium">❌ Could not identify this pill.</p>
              <p className="text-sm text-muted-foreground">Please try a clearer image or use the manual search below.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {displayResult && !identifying && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{displayResult.name}</h3>
                  <p className="text-sm text-muted-foreground">{displayResult.description}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Common Uses</p>
                <div className="space-y-1.5">
                  {displayResult.uses.map((u) => (
                    <div key={u} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {u}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Warnings</p>
                <div className="space-y-1.5">
                  {displayResult.warnings.map((w) => (
                    <div key={w} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" /> {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Search Fallback */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm font-medium mb-3">Manual Search</p>
          <div className="flex gap-2">
            <Input
              placeholder="Type a medicine name (e.g. Amoxicillin, Metformin)..."
              className="rounded-xl flex-1"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button onClick={handleManualSearch} variant="outline" className="rounded-xl gap-2">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
          {manualNotFound && (
            <p className="text-sm text-destructive mt-3">No results found. Try a different medicine name.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
