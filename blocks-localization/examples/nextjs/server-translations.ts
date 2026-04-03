/**
 * Server Translations (Next.js)
 *
 * Called from layout.tsx (Server Component) to prefetch translations
 * on the server before hydration. This eliminates flash of untranslated content.
 *
 * Add more modules to the Promise.all array as your app grows.
 */

import { fetchTranslations } from "./translation.service";

export async function getServerTranslations(locale: string = "en-US") {
  try {
    // Fetch all required modules in parallel
    const [commonTranslations] = await Promise.all([
      fetchTranslations(locale, "common"),
      // Add more modules:
      // fetchTranslations(locale, "homepage"),
      // fetchTranslations(locale, "dashboard"),
    ]);

    return {
      common: commonTranslations,
      // homepage: homepageTranslations,
      // dashboard: dashboardTranslations,
    };
  } catch (error) {
    console.error("Failed to fetch server translations:", error);
    return {
      common: {},
    };
  }
}
