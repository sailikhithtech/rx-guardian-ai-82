import { motion } from "framer-motion";
import { ArrowLeftRight, BadgeCheck, Info, ExternalLink } from "lucide-react";

const alternatives = [
  {
    original: "Metformin (Glycomet)",
    options: [
      { brand: "Glycomet 500mg", generic: "Metformin HCl", cost: "₹ 110.00", savings: "-", best: false },
      { brand: "Gluconorm SR", generic: "Metformin HCl SR", cost: "₹ 135.00", savings: "-₹ 25.00", best: false },
      { brand: "Generic Metformin", generic: "Metformin HCl", cost: "₹ 32.00", savings: "₹ 78.00", best: true },
    ],
  },
  {
    original: "Amoxicillin (Novamox)",
    options: [
      { brand: "Novamox 500mg", generic: "Amoxicillin", cost: "₹ 95.00", savings: "-", best: false },
      { brand: "Mox 500", generic: "Amoxicillin", cost: "₹ 72.00", savings: "₹ 23.00", best: false },
      { brand: "Generic Amoxicillin", generic: "Amoxicillin", cost: "₹ 28.00", savings: "₹ 67.00", best: true },
    ],
  },
  {
    original: "Omeprazole (Omez)",
    options: [
      { brand: "Omez 20mg", generic: "Omeprazole", cost: "₹ 120.00", savings: "-", best: false },
      { brand: "Ocid 20", generic: "Omeprazole", cost: "₹ 98.00", savings: "₹ 22.00", best: false },
      { brand: "Generic Omeprazole", generic: "Omeprazole", cost: "₹ 35.00", savings: "₹ 85.00", best: true },
    ],
  },
];

const pharmacyUrl = (name: string, site: "1mg" | "pharmeasy") => {
  const q = encodeURIComponent(name);
  return site === "1mg"
    ? `https://www.1mg.com/search/all?name=${q}`
    : `https://pharmeasy.in/search/all?name=${q}`;
};

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
                    <th className="text-right p-4 font-medium text-muted-foreground">Est. Cost / Strip</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Savings</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Order Online</th>
                  </tr>
                </thead>
                <tbody>
                  {group.options.map((opt, j) => (
                    <tr key={j} className={`border-b border-border last:border-0 ${opt.best ? "bg-success/5" : ""}`}>
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          {opt.brand}
                          {opt.best && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                              <BadgeCheck className="w-3 h-3" /> Best Value
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{opt.generic}</td>
                      <td className="p-4 text-right font-medium">{opt.cost}</td>
                      <td className={`p-4 text-right font-medium ${opt.best ? "text-success" : "text-muted-foreground"}`}>{opt.savings}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <a
                            href={pharmacyUrl(opt.brand, "1mg")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white transition-all duration-200 hover:brightness-90 shadow-sm"
                            style={{ backgroundColor: "#FF6B35" }}
                          >
                            🛒 Order on 1mg
                          </a>
                          <a
                            href={pharmacyUrl(opt.brand, "pharmeasy")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white transition-all duration-200 hover:brightness-90 shadow-sm"
                            style={{ backgroundColor: "#1A9E5F" }}
                          >
                            🛒 Order on PharmEasy
                          </a>
                        </div>
                      </td>
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
