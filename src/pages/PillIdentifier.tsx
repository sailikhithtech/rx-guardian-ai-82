import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, AlertCircle, Pill, CheckCircle2, X, FileImage, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PillResult {
  medicine_name: string;
  description: string;
  common_uses?: string[];
  dosage_form?: string;
  warnings?: string[];
  side_effects?: string[];
  color_shape_description?: string;
  confidence?: string;
}

export default function PillIdentifier() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<PillResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setResult(null);
    setFailed(false);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setIdentifying(false);
  };

  const toBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleIdentify = async () => {
    if (!file) return;
    setResult(null);
    setFailed(false);
    setIdentifying(true);

    try {
      const imageBase64 = await toBase64(file);
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pill-identify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64, mimeType: file.type }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data: PillResult = await resp.json();

      if (data.confidence === "unidentifiable" || data.medicine_name === "Unknown") {
        setFailed(true);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      console.error("Pill identify error:", e);
      toast.error(e.message || "Failed to identify pill");
      setFailed(true);
    } finally {
      setIdentifying(false);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setFailed(false);
    setIdentifying(false);
  };

  const handleManualSearch = async () => {
    const query = manualQuery.trim();
    if (!query) return;
    setResult(null);
    setFailed(false);
    setIdentifying(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pill-identify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ manualQuery: query }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data: PillResult = await resp.json();
      if (data.confidence === "unidentifiable" || data.medicine_name === "Unknown") {
        setFailed(true);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      console.error("Manual search error:", e);
      toast.error(e.message || "Search failed");
      setFailed(true);
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-7 h-7 text-primary" /> Pill Identifier
        </h1>
        <p className="text-muted-foreground mt-1">Upload a photo of a pill to identify it using AI</p>
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
              <Pill className="w-4 h-4" /> {identifying ? "Analyzing your pill..." : "Identify Pill"}
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

      {/* Loading */}
      <AnimatePresence>
        {identifying && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium">Analyzing your pill...</p>
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

      {/* Failed */}
      <AnimatePresence>
        {failed && !identifying && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card rounded-2xl border border-destructive/30 p-6 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="text-sm font-medium">❌ Could not identify this pill with confidence.</p>
              <p className="text-sm text-muted-foreground">Please try a clearer image or use the manual search below.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !identifying && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{result.medicine_name}</h3>
                  {result.dosage_form && (
                    <Badge variant="secondary" className="mt-1">{result.dosage_form}</Badge>
                  )}
                </div>
              </div>

              {/* Color & Shape */}
              {result.color_shape_description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Appearance</p>
                  <p className="text-sm">{result.color_shape_description}</p>
                </div>
              )}

              {/* Description */}
              {result.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm">{result.description}</p>
                </div>
              )}

              {/* Common Uses */}
              {result.common_uses && result.common_uses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Common Uses</p>
                  <div className="flex flex-wrap gap-2">
                    {result.common_uses.map((u) => (
                      <Badge key={u} variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" /> {u}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Side Effects */}
              {result.side_effects && result.side_effects.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Side Effects</p>
                  <div className="space-y-1.5">
                    {result.side_effects.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Warnings</p>
                  <div className="space-y-2">
                    {result.warnings.map((w) => (
                      <div key={w} className="flex items-start gap-2 text-sm bg-warning/10 border border-warning/20 rounded-lg p-3">
                        <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" /> {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Search */}
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
            <Button onClick={handleManualSearch} variant="outline" className="rounded-xl gap-2" disabled={identifying}>
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
