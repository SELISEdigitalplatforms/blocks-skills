/**
 * Translation Service (Next.js)
 *
 * Server-safe functions for fetching translations from the Blocks UILM API.
 * These work in both Server Components and Client Components.
 *
 * Uses `next: { revalidate: 0 }` to always fetch fresh data (no Next.js cache).
 */

const BLOCKS_API_URL = process.env.NEXT_PUBLIC_BLOCKS_API_URL || "";

export async function fetchTranslations(
  locale: string,
  module: string,
): Promise<Record<string, string>> {
  const projectKey = process.env.NEXT_PUBLIC_X_BLOCKS_KEY;

  if (!BLOCKS_API_URL) {
    console.error("NEXT_PUBLIC_BLOCKS_API_URL is not configured");
    return {};
  }

  const url = new URL(`${BLOCKS_API_URL}/uilm/v1/Key/GetUilmFile`);
  url.searchParams.set("Language", locale);
  url.searchParams.set("ModuleName", module);
  url.searchParams.set("ProjectKey", projectKey || "");

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": projectKey || "",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error(`[TranslationService] Failed to fetch translations:`, {
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
      responseBody: errorText,
    });
    return {};
  }

  const data = await response.json().catch((err: Error) => {
    console.error(`[TranslationService] Failed to parse JSON response:`, err);
    return {};
  });

  if (Object.keys(data).length === 0) {
    console.warn(
      `[TranslationService] Empty translation data received for locale=${locale}, module=${module}`
    );
  }

  return data;
}

export async function fetchAvailableLanguages(): Promise<
  Array<{
    languageCode: string;
    languageName: string;
    isDefault: boolean;
    itemId?: string;
  }>
> {
  const projectKey = process.env.NEXT_PUBLIC_X_BLOCKS_KEY;

  const url = new URL(`${BLOCKS_API_URL}/uilm/v1/Language/Gets`);
  url.searchParams.set("ProjectKey", projectKey || "");

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": projectKey || "",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch languages: ${response.status}`);
    return [];
  }

  return response.json();
}
