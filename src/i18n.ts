import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/game/locales";
import esAR from "@/locales/es-AR/translation.json";

export type { SupportedLocale } from "@/game/locales";
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/game/locales";

void i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: Object.values(SUPPORTED_LOCALES),
  resources: {
    [SUPPORTED_LOCALES.ES_AR]: {
      translation: esAR,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export { i18n };
