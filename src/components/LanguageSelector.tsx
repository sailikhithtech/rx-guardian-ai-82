import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { languages, type LangCode } from "@/i18n";
import { toast } from "sonner";

export default function LanguageSelector({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const switchLang = (code: LangCode) => {
    i18n.changeLanguage(code);
    const lang = languages.find((l) => l.code === code)!;
    toast.success(t("language.changed", { language: lang.name }));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg transition-colors ${
          variant === "full"
            ? "px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
            : "p-2 hover:bg-muted"
        }`}
      >
        <Globe className="w-[18px] h-[18px]" />
        {variant === "full" && <span>{currentLang.flag} {currentLang.name}</span>}
      </button>

      {open && (
        <div className={`absolute z-50 bg-popover border border-border rounded-xl shadow-lg py-1 min-w-[200px] max-h-[320px] overflow-y-auto ${
          variant === "full" ? "bottom-full mb-1 left-0" : "top-full mt-1 right-0 rtl:right-auto rtl:left-0"
        }`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left rtl:text-right"
            >
              <span className="text-base">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {i18n.language === lang.code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
