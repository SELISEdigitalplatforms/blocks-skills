/**
 * Language Context Provider
 *
 * Provides language state management for the entire application:
 * - Fetches available languages & modules from the Blocks API
 * - Determines initial language from localStorage or API default
 * - Loads translation modules based on the current route
 * - Caches loaded modules to avoid redundant API calls
 * - Re-loads translations on route change
 *
 * Wrap your app with <LanguageProvider> inside <BrowserRouter> and <QueryClientProvider>.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadTranslations } from './i18n';
import { routeModuleMap } from './route-module-map';
import { useAvailableLanguages, useAvailableModules } from './use-language';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string, isUserAction?: boolean) => Promise<void>;
  isLoading: boolean;
  availableLanguages: any[];
  availableModules: any[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
  defaultModules?: string[];
}

/** Cache of loaded translation modules per language */
const translationCache: Record<string, Set<string>> = {};

export function LanguageProvider({
  children,
  defaultLanguage = 'en-US',
  defaultModules = ['common'],
}: Readonly<LanguageProviderProps>) {
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();
  const { data: languages = [], isLoading: isLanguagesLoading } = useAvailableLanguages();
  const { data: modules = [], isLoading: isModulesLoading } = useAvailableModules();
  const isInitialized = useRef(false);
  const hasCheckedDefaultLanguage = useRef(false);
  const lastApiDefaultLanguage = useRef<string | null>(null);

  useEffect(() => {
    setIsLoading(isLanguagesLoading || isModulesLoading);
  }, [isLanguagesLoading, isModulesLoading]);

  const getBaseRoute = useCallback((pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean);
    return '/' + (segments[0] || '');
  }, []);

  const areModulesCached = useCallback((language: string, mods: string[]): boolean => {
    if (!translationCache[language]) return false;
    return mods.every((mod) => translationCache[language].has(mod));
  }, []);

  const cacheModules = useCallback((language: string, mods: string[]): void => {
    if (!translationCache[language]) {
      translationCache[language] = new Set();
    }
    mods.forEach((mod) => translationCache[language].add(mod));
  }, []);

  const loadLanguageModules = useCallback(
    async (language: string, pathname: string) => {
      const baseRoute = getBaseRoute(pathname);
      const matchedModules = routeModuleMap[baseRoute] || defaultModules;

      if (areModulesCached(language, matchedModules)) return;

      for (const moduleName of matchedModules) {
        try {
          if (!translationCache[language]?.has(moduleName)) {
            await loadTranslations(language, moduleName);
            cacheModules(language, [moduleName]);
          }
        } catch (err) {
          console.error(`Failed to load translations for module ${moduleName}:`, err);
        }
      }
    },
    [getBaseRoute, areModulesCached, cacheModules, defaultModules]
  );

  const setLanguage = useCallback(
    async (language: string, isUserAction = true): Promise<void> => {
      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', language);
          if (isUserAction) {
            localStorage.setItem('language_user_selected', 'true');
          }
        }
        await loadLanguageModules(language, location.pathname);
        i18n.changeLanguage(language);
        setCurrentLanguage(language);
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to change language:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [loadLanguageModules, location.pathname, i18n]
  );

  // Apply default language from API
  useEffect(() => {
    if (isLanguagesLoading || languages.length === 0) return;

    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    const userExplicitChoice =
      typeof window !== 'undefined' ? localStorage.getItem('language_user_selected') : null;
    const apiDefaultLanguage = languages.find((lang: any) => lang.isDefault);

    if (!apiDefaultLanguage) return;

    const apiDefaultCode = apiDefaultLanguage.languageCode;
    const apiDefaultChanged =
      lastApiDefaultLanguage.current !== null && lastApiDefaultLanguage.current !== apiDefaultCode;

    lastApiDefaultLanguage.current = apiDefaultCode;

    if (userExplicitChoice === 'true' && storedLanguage && !apiDefaultChanged) {
      const storedLanguageExists = languages.some(
        (lang: any) => lang.languageCode === storedLanguage
      );
      if (
        storedLanguageExists &&
        storedLanguage !== currentLanguage &&
        hasCheckedDefaultLanguage.current
      ) {
        setLanguage(storedLanguage, false);
        return;
      }
    }

    if (!hasCheckedDefaultLanguage.current || apiDefaultChanged || userExplicitChoice !== 'true') {
      if (apiDefaultCode !== currentLanguage) {
        setLanguage(apiDefaultCode, false);
      }
      hasCheckedDefaultLanguage.current = true;
    }
  }, [languages, isLanguagesLoading, currentLanguage, setLanguage]);

  // Initialize translations
  useEffect(() => {
    if (isInitialized.current || isLanguagesLoading || !hasCheckedDefaultLanguage.current) return;

    const initializeTranslations = async () => {
      setIsLoading(true);
      try {
        await loadLanguageModules(currentLanguage, location.pathname);
        i18n.changeLanguage(currentLanguage);
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, [currentLanguage, location.pathname, loadLanguageModules, i18n, isLanguagesLoading]);

  // Reload on route change
  useEffect(() => {
    const loadOnRouteChange = async () => {
      const baseRoute = getBaseRoute(location.pathname);
      const matchedModules = routeModuleMap[baseRoute] || defaultModules;

      if (!areModulesCached(currentLanguage, matchedModules)) {
        setIsLoading(true);
      }

      try {
        await loadLanguageModules(currentLanguage, location.pathname);
      } catch (err) {
        console.error('Failed to load modules on route change:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnRouteChange();
  }, [
    currentLanguage,
    location.pathname,
    loadLanguageModules,
    getBaseRoute,
    areModulesCached,
    defaultModules,
  ]);

  const value = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      isLoading,
      availableLanguages: languages,
      availableModules: modules,
    }),
    [currentLanguage, setLanguage, isLoading, languages, modules]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};
