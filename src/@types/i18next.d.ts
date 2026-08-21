import "i18next";
import translation from "@/locales/es-AR/translation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    returnNull: false;
    resources: {
      translation: typeof translation;
    };
  }
}
