import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import te from "@/locales/te.json";
import ta from "@/locales/ta.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";
import mr from "@/locales/mr.json";
import bn from "@/locales/bn.json";
import ur from "@/locales/ur.json";
import ar from "@/locales/ar.json";

export const languages = [
  { code: "en", name: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳", dir: "ltr" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳", dir: "ltr" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳", dir: "ltr" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳", dir: "ltr" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳", dir: "ltr" },
  { code: "mr", name: "मराठी", flag: "🇮🇳", dir: "ltr" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩", dir: "ltr" },
  { code: "ur", name: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
] as const;

export type LangCode = (typeof languages)[number]["code"];

const resources = { en: { translation: en }, hi: { translation: hi }, te: { translation: te }, ta: { translation: ta }, kn: { translation: kn }, ml: { translation: ml }, mr: { translation: mr }, bn: { translation: bn }, ur: { translation: ur }, ar: { translation: ar } };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: languages.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "rxvision-lang",
    },
  });

// Apply RTL/LTR and font on language change
const applyLangSettings = (lng: string) => {
  const lang = languages.find((l) => l.code === lng);
  const dir = lang?.dir || "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  document.documentElement.setAttribute("data-lang", lng);
};

applyLangSettings(i18n.language);
i18n.on("languageChanged", applyLangSettings);

export default i18n;
