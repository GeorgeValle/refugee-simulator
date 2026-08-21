export const SUPPORTED_LOCALES = {
  ES_AR: "es-AR",
} as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[keyof typeof SUPPORTED_LOCALES];

export const DEFAULT_LOCALE: SupportedLocale = SUPPORTED_LOCALES.ES_AR;
