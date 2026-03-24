import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, ChevronDown, Download, AlertTriangle,
  CheckCircle2, Clock, Loader2, FileText, Activity,
  Pill, Stethoscope, CalendarCheck, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicineEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  form?: string;
  route?: string;
  confidence?: number;
}

interface ParsedNotes {
  summary?: string;
  recommendations?: string[];
  abnormalities?: string[];
  doctorName?: string;
  scannedAt?: string;
}

interface PrescriptionRecord {
  id: string;
  created_at: string;
  diagnosis: string | null;
  notes: string | null;
  follow_up_date: string | null;
  medicines: MedicineEntry[];
  parsedNotes: ParsedNotes;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const getStatus = (rx: PrescriptionRecord): "validated" | "warning" | "pending" => {
  if (rx.parsedNotes?.abnormalities && rx.parsedNotes.abnormalities.length > 0) return "warning";
  if (rx.diagnosis) return "validated";
  return "pending";
};

const statusConfig = {
  validated: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "Validated" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "Warning" },
  pending: { icon: Clock, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "Pending" },
};

// ─── PDF Generation ───────────────────────────────────────────────────────────

const generatePDF = (rx: PrescriptionRecord, index: number) => {
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PAGE_W = 210;
    const MARGIN = 18;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    let y = 0;

    const addPage = () => {
      doc.addPage();
      y = 20;
    };

    const checkY = (needed: number) => {
      if (y + needed > 270) addPage();
    };

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 118, 110); // teal-700
    doc.rect(0, 0, PAGE_W, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RxGuardian AI", MARGIN, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("AI-Powered Prescription Intelligence Report", MARGIN, 22);

    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, MARGIN, 28);
    doc.text(`Report ID: #RXG-${String(index + 1).padStart(4, "0")}`, PAGE_W - MARGIN - 36, 28);

    // Status badge in header
    const status = getStatus(rx);
    const statusLabel = statusConfig[status].label;
    const badgeColors: Record<string, [number, number, number]> = {
      validated: [16, 185, 129],
      warning: [245, 158, 11],
      pending: [99, 102, 241],
    };
    const [br, bg, bb] = badgeColors[status];
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(PAGE_W - MARGIN - 28, 8, 28, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel.toUpperCase(), PAGE_W - MARGIN - 14, 14.5, { align: "center" });

    y = 44;
    doc.setTextColor(30, 30, 30);

    // ── Patient & Visit Info ─────────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, "F");
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, "S");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("VISIT DETAILS", MARGIN + 4, y + 6);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const col1x = MARGIN + 4;
    const col2x = MARGIN + CONTENT_W / 2;
    doc.setFont("helvetica", "bold");
    doc.text("Visit Date:", col1x, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(rx.created_at), col1x + 22, y + 14);

    doc.setFont("helvetica", "bold");
    doc.text("Doctor:", col2x, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(rx.parsedNotes?.doctorName || "Not specified", col2x + 16, y + 14);

    if (rx.follow_up_date) {
      doc.setFont("helvetica", "bold");
      doc.text("Follow-up:", col1x, y + 22);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(rx.follow_up_date), col1x + 22, y + 22);
    }

    y += 36;

    // ── Diagnosis ────────────────────────────────────────────────────────────
    if (rx.diagnosis) {
      checkY(24);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3, 3, "F");
      doc.setDrawColor(147, 197, 253);
      doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3, 3, "S");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.text("DIAGNOSIS", MARGIN + 4, y + 6);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      const diagLines = doc.splitTextToSize(rx.diagnosis, CONTENT_W - 8);
      doc.text(diagLines[0], MARGIN + 4, y + 13);
      y += 26;
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    if (rx.parsedNotes?.summary) {
      checkY(16);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110);
      doc.text("Patient Condition Summary", MARGIN, y);
      doc.setDrawColor(15, 118, 110);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 2, MARGIN + 70, y + 2);
      y += 8;

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 55, 55);
      const summaryLines = doc.splitTextToSize(rx.parsedNotes.summary, CONTENT_W);
      summaryLines.forEach((line: string) => {
        checkY(7);
        doc.text(line, MARGIN, y);
        y += 5.5;
      });
      y += 6;
    }

    // ── Medicines Table ──────────────────────────────────────────────────────
    checkY(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text("Prescribed Medicines", MARGIN, y);
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 2, MARGIN + 60, y + 2);
    y += 8;

    // Table header
    const colW = [62, 28, 40, 28, 16];
    const colX = [MARGIN, MARGIN + 62, MARGIN + 90, MARGIN + 130, MARGIN + 158];
    const headers = ["Medicine", "Dosage", "Frequency", "Duration", "Conf."];

    doc.setFillColor(15, 118, 110);
    doc.rect(MARGIN, y, CONTENT_W, 8, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5.5));
    y += 8;

    doc.setFont("helvetica", "normal");
    rx.medicines.forEach((med, idx) => {
      checkY(8);
      doc.setFillColor(idx % 2 === 0 ? 250 : 244, idx % 2 === 0 ? 253 : 249, idx % 2 === 0 ? 252 : 250);
      doc.rect(MARGIN, y, CONTENT_W, 8, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(med.name, colW[0] - 3)[0], colX[0] + 2, y + 5.5);
      doc.text(med.dosage || "—", colX[1] + 2, y + 5.5);
      doc.text(doc.splitTextToSize(med.frequency || "—", colW[2] - 3)[0], colX[2] + 2, y + 5.5);
      doc.text(med.duration || "—", colX[3] + 2, y + 5.5);
      const conf = med.confidence ?? 0;
      const confColor: [number, number, number] = conf >= 85 ? [16, 185, 129] : conf >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setTextColor(...confColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${conf}%`, colX[4] + 2, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      y += 8;
    });

    // Table border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y - rx.medicines.length * 8 - 8, CONTENT_W, rx.medicines.length * 8 + 8, "S");
    y += 8;

    // ── Abnormalities ────────────────────────────────────────────────────────
    if (rx.parsedNotes?.abnormalities && rx.parsedNotes.abnormalities.length > 0) {
      checkY(20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text("Abnormalities & Drug Interactions", MARGIN, y);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 2, MARGIN + 80, y + 2);
      y += 9;

      rx.parsedNotes.abnormalities.forEach((item) => {
        checkY(8);
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, "F");
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, "S");
        doc.setFillColor(245, 158, 11);
        doc.circle(MARGIN + 5, y + 4, 1.5, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 40, 0);
        const lines = doc.splitTextToSize(item, CONTENT_W - 12);
        doc.text(lines[0], MARGIN + 10, y + 5);
        y += 10;
      });
      y += 4;
    }

    // ── Recommendations ──────────────────────────────────────────────────────
    if (rx.parsedNotes?.recommendations && rx.parsedNotes.recommendations.length > 0) {
      checkY(20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text("Recommendations", MARGIN, y);
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 2, MARGIN + 48, y + 2);
      y += 9;

      rx.parsedNotes.recommendations.forEach((item, i) => {
        checkY(8);
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, "F");
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, "S");
        doc.setFillColor(16, 185, 129);
        doc.circle(MARGIN + 5, y + 4, 1.5, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(5, 46, 22);
        const lines = doc.splitTextToSize(item, CONTENT_W - 12);
        doc.text(lines[0], MARGIN + 10, y + 5);
        y += 10;
      });
      y += 4;
    }

    // ── Follow-up reminder ───────────────────────────────────────────────────
    if (rx.follow_up_date) {
      checkY(18);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(MARGIN, y, CONTENT_W, 14, 3, 3, "F");
      doc.setDrawColor(147, 197, 253);
      doc.roundedRect(MARGIN, y, CONTENT_W, 14, 3, 3, "S");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("Next Follow-up Appointment:", MARGIN + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(rx.follow_up_date), MARGIN + 62, y + 6);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 200);
      doc.text("Please ensure you attend this appointment for continued care.", MARGIN + 4, y + 11);
      y += 20;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 282, PAGE_W, 15, "F");
      doc.setDrawColor(220, 220, 220);
      doc.line(0, 282, PAGE_W, 282);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(130, 130, 130);
      doc.text("RxGuardian AI — This report is AI-generated and intended for informational purposes only. Always consult your healthcare provider.", MARGIN, 288);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, 288, { align: "right" });
    }

    doc.save(`RxGuardian-Report-${formatDate(rx.created_at).replace(/ /g, "-")}.pdf`);
    toast.success("Report downloaded successfully!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate report. Please try again.");
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrescriptionHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctor_prescriptions")
        .select("id, created_at, diagnosis, notes, follow_up_date, medicines")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed: PrescriptionRecord[] = (data || []).map((row) => {
        let parsedNotes: ParsedNotes = {};
        try {
          if (row.notes) parsedNotes = JSON.parse(row.notes);
        } catch {}

        let medicines: MedicineEntry[] = [];
        if (Array.isArray(row.medicines)) {
          medicines = row.medicines as MedicineEntry[];
        }

        return {
          id: row.id,
          created_at: row.created_at,
          diagnosis: row.diagnosis,
          notes: row.notes,
          follow_up_date: row.follow_up_date,
          medicines,
          parsedNotes,
        };
      });

      setRecords(parsed);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load prescription history.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" /> Prescription History
          </h1>
          <p className="text-muted-foreground mt-1">View and download detailed reports for every visit</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (records.length === 0) {
    return (
      <div className="page-container">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" /> Prescription History
          </h1>
          <p className="text-muted-foreground mt-1">View and download detailed reports for every visit</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <p className="font-semibold">No prescriptions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Scan a prescription using the Analyzer — it will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-primary" /> Prescription History
        </h1>
        <p className="text-muted-foreground mt-1">
          {records.length} visit{records.length !== 1 ? "s" : ""} · tap any entry to expand
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {records.map((rx, i) => {
            const status = getStatus(rx);
            const config = statusConfig[status];
            const isExpanded = expanded === rx.id;
            const Icon = config.icon;

            return (
              <motion.div
                key={rx.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative pl-10 md:pl-14"
              >
                {/* Timeline dot */}
                <div className={`absolute left-2 md:left-4 top-4 w-5 h-5 rounded-full ${config.bg} border ${config.border} flex items-center justify-center z-10`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  {/* Header row — always visible */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : rx.id)}
                    className="w-full text-left p-4 md:p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {rx.parsedNotes?.doctorName || "Scanned Prescription"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDate(rx.created_at)} · {rx.medicines.length} medicine{rx.medicines.length !== 1 ? "s" : ""}
                        </p>
                        {rx.diagnosis && (
                          <p className="text-xs text-primary/80 mt-1 font-medium truncate">
                            {rx.diagnosis}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {status === "warning" && (
                          <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full hidden sm:block">
                            {rx.parsedNotes?.abnormalities?.length ?? 0} alert{(rx.parsedNotes?.abnormalities?.length ?? 0) !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 md:p-5 space-y-4">

                          {/* Summary */}
                          {rx.parsedNotes?.summary && (
                            <div className="flex gap-3 p-3 rounded-xl bg-muted/30">
                              <Stethoscope className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {rx.parsedNotes.summary}
                              </p>
                            </div>
                          )}

                          {/* Medicines list */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5" /> Medicines
                            </p>
                            <div className="space-y-2">
                              {rx.medicines.map((m, j) => (
                                <div
                                  key={j}
                                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30 border border-border"
                                >
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {m.frequency} · {m.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Abnormalities */}
                          {rx.parsedNotes?.abnormalities && rx.parsedNotes.abnormalities.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" /> Abnormalities
                              </p>
                              <div className="space-y-1.5">
                                {rx.parsedNotes.abnormalities.map((a, k) => (
                                  <div key={k} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                                    <span className="text-muted-foreground">{a}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {rx.parsedNotes?.recommendations && rx.parsedNotes.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-success uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> Recommendations
                              </p>
                              <div className="space-y-1.5">
                                {rx.parsedNotes.recommendations.map((r, k) => (
                                  <div key={k} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-success/5 border border-success/20">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                                    <span className="text-muted-foreground">{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up */}
                          {rx.follow_up_date && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                              <CalendarCheck className="w-4 h-4 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-primary">Follow-up Appointment</p>
                                <p className="text-sm text-muted-foreground">{formatDate(rx.follow_up_date)}</p>
                              </div>
                            </div>
                          )}

                          {/* Download button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-lg w-full sm:w-auto"
                            onClick={() => generatePDF(rx, i)}
                          >
                            <Download className="w-4 h-4" /> Download Detailed Report
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
