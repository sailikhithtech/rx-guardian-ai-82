import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Upload, AlertCircle, Pill, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mockResult = {
  name: "Amoxicillin 500mg",
  description: "White oval capsule with red band, imprint 'AMOX 500'",
  uses: ["Bacterial infections", "Respiratory tract infections", "Urinary tract infections", "Skin infections"],
  warnings: ["Do not use if allergic to penicillin", "May cause diarrhea", "Complete the full course"],
};

export default function PillIdentifier() {
  const [uploaded, setUploaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<typeof mockResult | null>(null);

  const handleUpload = () => {
    setUploaded(true);
    setSearching(true);
    setTimeout(() => {
      setResult(mockResult);
      setSearching(false);
    }, 1500);
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-7 h-7 text-primary" /> Pill Identifier
        </h1>
        <p className="text-muted-foreground mt-1">Upload a photo of a pill to identify it</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
          <div
            onClick={handleUpload}
            className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <p className="text-sm font-medium">Upload a pill photo</p>
            <p className="text-xs text-muted-foreground mt-1">Take a clear photo on a flat surface</p>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Or search manually:</p>
            <Input placeholder="Enter pill description, color, shape..." className="rounded-xl" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-6">
          <h2 className="section-title mb-4">Identification Result</h2>
          {searching ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Identifying pill...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{result.name}</h3>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Common Uses</p>
                <div className="space-y-1.5">
                  {result.uses.map((u) => (
                    <div key={u} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      {u}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Warnings</p>
                <div className="space-y-1.5">
                  {result.warnings.map((w) => (
                    <div key={w} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Upload a photo to identify a pill</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
