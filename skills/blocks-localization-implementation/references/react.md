# Frontend integration — i18n (React 19 / Vite / TanStack Query)

A dependency-light localization layer: fetch the generated UILM files, expose a `t(key)` lookup and a language switcher, cache per `(language, module)`. No impersonation — `x-blocks-key` is the public project key.

## Env

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>   # x-blocks-key (public)
VITE_BLOCKS_I18N_MODULES=common               # comma-separated modules to preload
```

## Client

```ts
// src/features/i18n/api.ts
const LOC = `${import.meta.env.VITE_BLOCKS_API_URL}/localization/v4`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface Language { languageName: string; languageCode: string; isDefault: boolean }
export type Dictionary = Record<string, string>; // { KEY: "translated value" }

async function loc<T>(path: string): Promise<T> {
  const res = await fetch(`${LOC}${path}`, { headers: { "x-blocks-key": KEY } });
  if (!res.ok) throw new Error(`localization ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const i18nApi = {
  languages: () => loc<Language[]>(`/Language/Gets?ProjectKey=${KEY}`),
  modules: () => loc<Array<{ moduleName: string }>>(`/Module/Gets?ProjectKey=${KEY}`),
  // Returns the generated key→value map for a language+module. Confirm the exact shape in your
  // project; if it comes wrapped (e.g. { data: {...} } or a resource array), normalize here.
  uilmFile: (language: string, moduleName: string) =>
    loc<Dictionary>(`/Key/GetUilmFile?Language=${encodeURIComponent(language)}&ModuleName=${encodeURIComponent(moduleName)}&ProjectKey=${KEY}`),
};
```

## i18n context (load, cache, `t`, switch)

```tsx
// src/features/i18n/provider.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { i18nApi, type Dictionary, type Language } from "./api";

const MODULES = (import.meta.env.VITE_BLOCKS_I18N_MODULES as string).split(",").map((s) => s.trim());

interface I18n {
  languages: Language[];
  language: string;               // active culture, e.g. "de-DE"
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  ready: boolean;
}
const Ctx = createContext<I18n | null>(null);
export const useI18n = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within <I18nProvider>");
  return v;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { data: languages = [] } = useQuery({ queryKey: ["i18n", "languages"], queryFn: i18nApi.languages });

  const [language, setLang] = useState<string>(() => localStorage.getItem("lang") ?? "");
  // Default to the project default once languages load, unless the user already chose one.
  useEffect(() => {
    if (!language && languages.length) setLang(languages.find((l) => l.isDefault)?.languageCode ?? languages[0].languageCode);
  }, [languages, language]);

  const setLanguage = (code: string) => { localStorage.setItem("lang", code); setLang(code); };

  // One cached query per module for the active language.
  const results = useQueries({
    queries: MODULES.map((m) => ({
      queryKey: ["i18n", "uilm", language, m] as const,
      queryFn: () => i18nApi.uilmFile(language, m),
      enabled: !!language,
      staleTime: 5 * 60_000,
    })),
  });

  const dict: Dictionary = useMemo(
    () => Object.assign({}, ...results.map((r) => r.data ?? {})),
    [results.map((r) => r.dataUpdatedAt).join()], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ready = !!language && results.every((r) => r.isSuccess);

  const t = (key: string, fallback?: string) => dict[key] ?? fallback ?? key; // missing → fallback → key name

  return <Ctx.Provider value={{ languages, language, setLanguage, t, ready }}>{children}</Ctx.Provider>;
}
```

## Switcher + usage

```tsx
// language switcher
import { useI18n } from "./provider";

export function LanguageSwitcher() {
  const { languages, language, setLanguage } = useI18n();
  return (
    <select className="rounded border p-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
      {languages.map((l) => <option key={l.languageCode} value={l.languageCode}>{l.languageName}</option>)}
    </select>
  );
}

// rendering by key
export function LoginButton() {
  const { t } = useI18n();
  return <button className="rounded bg-primary px-4 py-2 text-primary-foreground">{t("LOGIN")}</button>;
}
```

Wrap the app once: `<I18nProvider><App /></I18nProvider>`. Switching the language re-runs the per-module queries for the new culture (served from cache after the first fetch) and every `t(...)` updates.

## Notes

- **Cache key is `(language, module)`** — TanStack Query handles dedupe/caching; a language switch just changes the query keys.
- **Missing translations fall back** to the key name (or a provided fallback) — never render blank. Consider falling back to the default language's dictionary too if you preload it.
- **Preload before first paint** — gate on `ready`, or render the default language immediately, so users don't see raw keys flash.
- **Stale values?** The config side must run `/Key/GenerateUilmFile` after edits (**[blocks-localization-configuration](../../blocks-localization-configuration/SKILL.md)**); `GetUilmFile` only reflects the last generation.
- Prefer this lightweight layer, or adapt it to `react-i18next` by loading each UILM map as a namespace resource (`addResourceBundle(language, moduleName, dict)`).
