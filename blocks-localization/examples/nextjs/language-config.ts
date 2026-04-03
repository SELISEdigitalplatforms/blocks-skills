/**
 * Language Configuration (Next.js)
 *
 * Static fallback locale list and defaults. At runtime, languages
 * are fetched dynamically from the Blocks API.
 */

// Fallback locales used during build/static generation when API may be unavailable
export const STATIC_FALLBACK_LOCALES = ["en-US"] as const;
export type Locale = (typeof STATIC_FALLBACK_LOCALES)[number] | string;

export const DEFAULT_LOCALE = "en-US";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

// Static locale display names for fallback
export const LOCALE_NAMES: Record<string, string> = {
  "en-US": "English",
};
