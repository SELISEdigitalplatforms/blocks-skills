/**
 * i18n configuration and utility functions for internationalization.
 *
 * This module:
 * 1. Initializes i18next with React integration
 * 2. Provides a `loadTranslations` helper for dynamic module loading
 * 3. Adds key-mode toggle support for the UILM browser extension
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getUilmFile } from './language.service';

// Declare custom type options so the return is always a string
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}

/**
 * Initialize i18next with default configuration.
 * - English (US) as fallback
 * - No HTML escaping for interpolation
 * - Empty resources (loaded dynamically from the API)
 */
i18n.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  resources: {},
});

/**
 * Loads and registers translations for a specific language and module.
 *
 * @param language - Language code (e.g. 'en-US', 'de-DE')
 * @param moduleName - Module name (e.g. 'common', 'dashboard')
 */
export const loadTranslations = async (language: string, moduleName: string): Promise<void> => {
  try {
    const translations = await getUilmFile({ language, moduleName });
    if (!translations) return;

    // Default namespace — direct access via t('KEY')
    i18n.addResourceBundle(language, 'translation', translations, true, true);
    // Module namespace — access via t('module:KEY') if needed
    i18n.addResourceBundle(language, moduleName, translations, true, true);
  } catch (error) {
    console.error(`Failed to load translations for module ${moduleName}:`, error);
  }
};

// ─── Key-Mode Toggle (UILM Browser Extension Support) ───────────────────────

declare global {
  interface Window {
    __i18nKeyMode?: boolean;
  }
}

if (typeof window !== 'undefined') {
  window.__i18nKeyMode = false;
}

const originalT = i18n.t.bind(i18n);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(i18n as any).t = (key: string | string[], options?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.__i18nKeyMode) {
    if (Array.isArray(key)) return key[0];
    return key;
  }
  return (originalT as any)(key, options);
};

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const { data } = event;
    if (!data || typeof data !== 'object') return;

    const { action, keymode } = data as { action?: string; keymode?: boolean };
    if (action === 'keymode' && typeof keymode === 'boolean') {
      const previous = window.__i18nKeyMode;
      window.__i18nKeyMode = keymode;

      if (previous !== keymode) {
        (i18n as any).emit('languageChanged', i18n.language);
      }
    }
  });
}

export default i18n;
