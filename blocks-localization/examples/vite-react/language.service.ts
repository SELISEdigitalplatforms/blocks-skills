/**
 * UILM Language Service
 *
 * API calls for fetching translations, available languages, and modules
 * from the Blocks UILM API.
 *
 * NOTE: This example uses plain `fetch`. If your project has an HTTP client
 * that auto-injects the `x-blocks-key` header (e.g. an `https.ts` module),
 * use that instead and remove the manual header injection.
 */

import { LanguageResponse, ModuleResponse, UilmFileParams } from './language.types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const PROJECT_KEY = import.meta.env.VITE_X_BLOCKS_KEY || '';

/**
 * Fetches translation key-value pairs for a specific language and module.
 *
 * @example
 * const translations = await getUilmFile({ language: 'en-US', moduleName: 'dashboard' });
 * // { "WELCOME": "Welcome", "LOGOUT": "Log out", ... }
 */
export const getUilmFile = async ({ language, moduleName }: UilmFileParams): Promise<Record<string, string>> => {
  const params = new URLSearchParams({
    Language: language,
    ModuleName: moduleName,
    ProjectKey: PROJECT_KEY,
  });
  const url = `${BASE_URL}/uilm/v1/Key/GetUilmFile?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': PROJECT_KEY,
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch UILM file: ${res.status}`);
    return {};
  }
  return res.json();
};

/**
 * Fetches all available languages for the project.
 *
 * @example
 * const languages = await getLanguage();
 * const defaultLang = languages.find(l => l.isDefault);
 */
export const getLanguage = async (): Promise<LanguageResponse> => {
  const params = new URLSearchParams({ ProjectKey: PROJECT_KEY });
  const url = `${BASE_URL}/uilm/v1/Language/Gets?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': PROJECT_KEY,
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch languages: ${res.status}`);
    return [];
  }
  return res.json();
};

/**
 * Fetches all available translation modules for the project.
 *
 * @example
 * const modules = await getModule();
 */
export const getModule = async (): Promise<ModuleResponse> => {
  const params = new URLSearchParams({ ProjectKey: PROJECT_KEY });
  const url = `${BASE_URL}/uilm/v1/Module/Gets?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': PROJECT_KEY,
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch modules: ${res.status}`);
    return [];
  }
  return res.json();
};
