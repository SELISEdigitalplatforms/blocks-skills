/**
 * Language Provider (Next.js App Router)
 *
 * A "use client" component that:
 * - Receives SSR-prefetched translations via props from layout.tsx
 * - Hydrates i18n synchronously (no flash of untranslated content)
 * - Provides client-side language switching
 * - Persists locale in a cookie for SSR reads
 * - Polls for new languages from the Blocks Portal
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import { fetchTranslations, fetchAvailableLanguages } from "./translation.service";

const LOCALE_COOKIE_KEY = "blocks-website-locale";

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isLoading: boolean;
  availableLanguages: Array<{
    languageCode: string;
    languageName: string;
    isDefault: boolean;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale: string;
  initialTranslations?: Record<string, Record<string, string>>;
  availableLanguages?: Array<{
    languageCode: string;
    languageName: string;
    isDefault: boolean;
  }>;
}

export function LanguageProvider({
  children,
  initialLocale,
  initialTranslations,
  availableLanguages = [],
}: LanguageProviderProps): React.ReactNode {
  const { i18n: i18nInstance } = useTranslation(undefined, { i18n });
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<string>(initialLocale);
  const [languages, setLanguages] = useState(availableLanguages);

  const hasInitializedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Synchronous hydration — no flash
  if (initialTranslations && !isInitializedRef.current) {
    Object.entries(initialTranslations).forEach(([namespace, translations]) => {
      if (!i18nInstance.hasResourceBundle(initialLocale, namespace)) {
        i18nInstance.addResourceBundle(initialLocale, namespace, translations, true, true);
      }
    });
    i18nInstance.changeLanguage(initialLocale);
    isInitializedRef.current = true;
    hasInitializedRef.current = true;
  }

  const loadTranslations = useCallback(
    async (locale: string) => {
      setIsLoading(true);
      try {
        // Fetch all modules in parallel — add your module names here
        const modules = ["common"];
        await Promise.all(
          modules.map(async (module) => {
            const translations = await fetchTranslations(locale, module);
            i18nInstance.addResourceBundle(locale, module, translations, true, true);
          })
        );
        await i18nInstance.changeLanguage(locale);
        setCurrentLocale(locale);
        // Persist to cookie for SSR
        if (typeof window !== "undefined") {
          document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [i18nInstance]
  );

  const setLocale = useCallback(
    async (locale: string) => {
      const availableLocaleCodes = languages.map((lang) => lang.languageCode);
      if (!availableLocaleCodes.includes(locale)) {
        console.warn(`Unsupported locale: ${locale}`);
        return;
      }
      await loadTranslations(locale);
    },
    [loadTranslations, languages]
  );

  // Poll for available languages
  const refetchLanguages = useCallback(async () => {
    try {
      const fetchedLanguages = await fetchAvailableLanguages();
      if (fetchedLanguages.length > 0) {
        setLanguages(fetchedLanguages);
      }
    } catch (error) {
      console.error("Failed to refetch languages:", error);
    }
  }, []);

  useEffect(() => {
    if (languages.length === 0) refetchLanguages();

    const pollInterval = setInterval(refetchLanguages, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refetchLanguages();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [languages.length, refetchLanguages]);

  return (
    <LanguageContext.Provider
      value={{ locale: currentLocale, setLocale, isLoading, availableLanguages: languages }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
