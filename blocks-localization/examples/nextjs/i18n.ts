/**
 * Client i18n Initialization (Next.js)
 *
 * Initializes i18next with SSR-compatible settings:
 * - useSuspense: true (works with React Suspense boundaries)
 * - initAsync: false (synchronous init for SSR hydration)
 * - Includes key-mode toggle for UILM browser extension
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: "en-US",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
    defaultNS: "common",
    ns: ["common"],  // Add your module names here
    initAsync: false,
    saveMissing: false,
  });

// ─── Key-Mode Toggle (UILM Browser Extension Support) ───────────────────────

declare global {
  interface Window {
    __i18nKeyMode?: boolean;
  }
}

if (typeof window !== "undefined") {
  window.__i18nKeyMode = false;
}

const originalT = i18n.t.bind(i18n);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(i18n as any).t = (key: string | string[], options?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.__i18nKeyMode) {
    if (Array.isArray(key)) return key[0];
    return key;
  }
  return originalT(key, options);
};

if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    const { data } = event;
    if (!data || typeof data !== "object") return;

    const { action, keymode } = data as { action?: string; keymode?: boolean };
    if (action === "keymode" && typeof keymode === "boolean") {
      const previous = window.__i18nKeyMode;
      window.__i18nKeyMode = keymode;

      if (previous !== keymode) {
        (i18n as any).emit("languageChanged", i18n.language);
      }
    }
  });
}

export default i18n;
