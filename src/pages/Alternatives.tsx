import { motion } from "framer-motion";
import { ArrowLeftRight, BadgeCheck, Info } from "lucide-react";

const alternatives = [
  {
    original: "Metformin (Glucophage)",
    options: [
      { brand: "Glucophage", generic: "Metformin HCl", cost: "$15.00", savings: "-", best: false },
      { brand: "Fortamet", generic: "Metformin HCl ER", cost: "$22.00", savings: "-$7.00", best: false },
      { brand: "Generic Metformin", generic: "Metformin HCl", cost: "$4.00", savings: "$11.00", best: true },
    ],
  },
  {
    original: "Amoxicillin (Amoxil)",
    options: [
      { brand: "Amoxil", generic: "Amoxicillin", cost: "$12.00", savings: "-", best: false },
      { brand: "Trimox", generic: "Amoxicillin", cost: "$10.50", savings: "$1.50", best: false },
      { brand: "Generic Amoxicillin", generic: "Amoxicillin", cost: "$4.00", savings: "$8.00", best: true },
    ],
  },
  {
    original: "Omeprazole (Prilosec)",
    options: [
      { brand: "Prilosec", generic: "Omeprazole", cost: "$25.00", savings: "-", best: false },
      { brand: "Zegerid", generic: "Omeprazole + NaHCO3", cost: "$30.00", savings: "-$5.00", best: false },
      { brand: "Generic Omeprazole", generic: "Omeprazole", cost: "$6.00", savings: "$19.00", best: true },
    ],
  },
];

export default function Alternatives() {
  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-7 h-7 text-primary" /> Alternatives & Cost Comparison
        </h1>
        <p className="text-muted-foreground mt-1">Compare brand vs generic options and find the best value</p>
      </div>

      <div className="space-y-6">
        {alternatives.map((group, i) => (
          <motion.div
            key={group.original}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-muted/30">
              <h3 className="font-semibold">{group.original}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Brand</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Generic Name</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Est. Cost</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {group.options.map((opt, j) => (
                    <tr key={j} className={`border-b border-border last:border-0 ${opt.best ? "bg-success/5" : ""}`}>
                      <td className="p-4 font-medium flex items-center gap-2">
                        {opt.brand}
                        {opt.best && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" /> Best Value
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{opt.generic}</td>
                      <td className="p-4 text-right font-medium">{opt.cost}</td>
                      <td className={`p-4 text-right font-medium ${opt.best ? "text-success" : "text-muted-foreground"}`}>{opt.savings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-warning/10 border border-warning/20 rounded-2xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Disclaimer</p>
          <p className="text-sm text-muted-foreground mt-0.5">Always consult your doctor before switching medicines. Prices are estimates and may vary by pharmacy and location.</p>
        </div>
      </motion.div>
    </div>
  );
}
