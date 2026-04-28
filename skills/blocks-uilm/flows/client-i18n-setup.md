# Client i18n Setup Flow

Sets up `i18next` + `react-i18next` with React Query for runtime API calls to the Blocks UILM API. Translations are fetched client-side on navigation — no build-time sync script needed.

## Prerequisites

Before starting:
1. **Run the pre-flight audit** in `SKILL.md` — check for existing i18n tooling
2. **Languages and modules** must already exist in the UILM admin (or run `language-setup` flow first)
3. **Credentials available**: `BLOCKS_API_URL` and `X_BLOCKS_KEY` (or equivalent env vars)

## Stack Detection

Detect from `package.json`:

| Indicator | Stack |
|-----------|-------|
| `"next"` in `dependencies` | Next.js App Router |
| `"vite"` + `"react"` in `dependencies` | Vite + React SPA |
| `angular.json` exists | Angular — see `references/angular.md` |
| `pubspec.yaml` exists | Flutter — see `references/flutter.md` |
| Otherwise | Vanilla / generic JS |

For Angular, Flutter, SvelteKit, Nuxt, and other non-React stacks, the file-creation steps below apply to React stacks only. See the respective framework references.

---

## Step 1 — Install Dependencies

```bash
npm install i18next react-i18next @tanstack/react-query
```

Skip if `i18next` or `react-i18next` already exist in `package.json`.

---

## Step 2 — Create Environment Variables

For **Next.js**:
```env
# .env.local
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your_project_key
```

For **Vite + React**:
```env
# .env
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=your_project_key
```

> [!IMPORTANT]
> The `projectKey` value must also be stored in `localStorage` under the key `projectKey` on app initialization. This enables the UILM browser extension to inject the key-mode toggle on `localhost`. Read from localStorage in the service layer, falling back to the env var:
> ```ts
> const projectKey = typeof window !== 'undefined'
>   ? localStorage.getItem('projectKey') ?? import.meta.env.VITE_X_BLOCKS_KEY
>   : import.meta.env.VITE_X_BLOCKS_KEY;
> ```

---

## Step 3 — Create File: `src/lib/language.types.ts`

Defines the core types used throughout the i18n layer. Use exact field names from `contracts.md`.

```
Create: src/lib/language.types.ts
Pattern:
  export interface Language {
    itemId: string;
    languageName: string;
    languageCode: string;
    isDefault: boolean;
    isRTL?: boolean;
    projectKey: string;
  }
  export type ModuleTranslations = Record<string, string>;
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

---

## Step 4 — Create File: `src/lib/language.service.ts`

Contains raw API calls to the UILM backend. Three functions: `getUilmFile`, `getLanguages`, `getModules`.

> [!IMPORTANT]
> The `projectKey` must be read from `localStorage['projectKey']` first, falling back to the env var. This allows the UILM browser extension to inject keys in localhost.

```
Create: src/lib/language.service.ts
Key patterns:
  - Base URL: process.env.NEXT_PUBLIC_BLOCKS_API_URL (Next.js) or import.meta.env.VITE_BLOCKS_API_URL (Vite)
  - projectKey: read from localStorage['projectKey'] first, fall back to env var
  - Headers: x-blocks-key: {projectKey}
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Record<string, string> directly — NOT wrapped in data or translations
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns Language[] array directly
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns array with { itemId, moduleName } directly
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

For `getUilmFile`, use URLSearchParams with capitalized keys: `Language`, `ModuleName`, `ProjectKey`.

---

## Step 5 — Create File: `src/lib/i18n.ts`

i18next initialization with key-mode debugging support.

```
Create: src/lib/i18n.ts with "use client" directive
Key patterns:
  - declare module 'i18next' { interface CustomTypeOptions { returnNull: false; } }
  - i18n.use(initReactI18next).init({ lng, fallbackLng, interpolation: { escapeValue: false }, returnNull: false, resources: {} })
  - Export loadTranslations(language, moduleName): fetches getUilmFile and adds to 'translation' + moduleName namespaces via i18n.addResourceBundle()
  - Add Window global: window.__i18nKeyMode?: boolean, initialize to false
  - Wrap i18n.t: if window.__i18nKeyMode is true, return the key instead of translated value
  - postMessage listener: validate event.source, event.origin, typeof data, then toggle __i18nKeyMode and emit languageChanged
  See: references/key-mode-debugging.md for full implementation
```

> [!IMPORTANT]
> Always add translations to the `'translation'` namespace (the default namespace) in `loadTranslations`. This is what makes `useTranslation()` with no arguments resolve keys correctly. Never add hardcoded default values to `t()` calls — all translations must come from the UILM API.

---

## Step 6 — Create File: `src/lib/route-module-map.ts`

Implements dual-module loading. See `references/route-module-map.md` for the full implementation pattern.

```
Create: src/lib/route-module-map.ts
Key patterns:
  - export const DEFAULT_MODULE = "common"
  - getRouteModuleName(pathname): extracts first path segment as module name
  - getModulesForRoute(pathname, availableModules): returns ["common", <routeModule>] or ["common", "home"] as fallback
  - availableModules: fetch from getModules() API — primary pattern
  - Fallback: ["common"] — if API unavailable, use this minimum
```

---

## Step 7 — Create File: `src/lib/language-provider.tsx`

The core provider that fetches languages and translations, manages language state, and provides context to the app.

> [!IMPORTANT]
> **On app initialization, the default language must be loaded automatically.** The provider must:
> 1. Fetch the list of languages from `getLanguages()`
> 2. Find the `isDefault` language
> 3. Immediately load the `common` module translations for that language
> 4. Then, as the user navigates, load route-specific modules on demand
>
> Users should see translated text immediately on first load — no manual language selection required.

```
Create: src/lib/language-provider.tsx with "use client" directive
Key patterns:
  - Wrap with QueryClientProvider from @tanstack/react-query
  - LanguageContext: { language, setLanguage, languages, isLoading, direction, isHydrated }
  - On mount: fetch languages via getLanguages()
  - Determine default language: languages.find(l => l.isDefault) ?? languages[0]
  - Immediately load common module translations for default language via loadTranslations(defaultLanguage, "common")
  - useQuery for getModules — fetches available modules from API, used to build availableModules array
  - loadTranslations (from i18n.ts) handles: fetch getUilmFile({ language, moduleName }) → add to 'translation' + moduleName namespaces
  - availableModules = moduleData?.map(m => m.moduleName) ?? ["common"]
  - RTL detection: isRTL = ['ar','he','fa','ur'].some(l => code.startsWith(l))
  - <div dir={direction}> wraps children for RTL support
  - isHydrated state prevents SSR hydration mismatch
  - Wrap pathname setState in startTransition to avoid cascading renders warning
  See: references/key-mode-debugging.md for the key-mode re-render pattern
```

---

## Step 8 — Update Root Layout (Next.js) / App Root (Vite)

**Next.js** — update `app/layout.tsx`:
```
Wrap children in LanguageProvider
  import { LanguageProvider } from "@/lib/language-provider"
  <LanguageProvider>{children}</LanguageProvider>
```

**Vite** — update `src/App.tsx`:
```
Wrap with <BrowserRouter> + <LanguageProvider> inside <QueryClientProvider>
  import { LanguageProvider } from "@/lib/language-provider"
```

> [!WARNING]
> Do NOT import `i18n` or `language-provider` in a Server Component. Always ensure the component using these is a Client Component (`"use client"`).

---

## Step 9 — Create File: `src/components/language-selector.tsx`

A dropdown locale switcher. Place it **in the app header or navigation bar** — it must be visible and accessible from every page.

```
Create: src/components/language-selector.tsx with "use client"
Key patterns:
  - const { language, setLanguage, isHydrated, isLoading, languages } = useLanguage()
  - Show skeleton/placeholder until isHydrated is true
  - On language change: setLanguage(lang.languageCode)
  - Position: in the Header component — see Step 10 for header integration
```

---

## Step 10 — Integrate Language Selector into Header

The `LanguageSelector` component must be placed in the **app header or navigation bar** so it is accessible from every route.

**Next.js** — in your Header or Nav component:
```tsx
// components/header.tsx
"use client";
import { LanguageSelector } from "@/components/language-selector";

export function Header() {
  return (
    <header>
      <nav>
        <a href="/">{t("NAV_HOME")}</a>
        <a href="/about">{t("NAV_ABOUT")}</a>
      </nav>
      <LanguageSelector />
    </header>
  );
}
```

**Vite** — in your App header/nav component:
```tsx
// src/components/Header.tsx
import { LanguageSelector } from "@/components/language-selector";

export function Header() {
  return (
    <header>
      <nav>
        <a href="/">{t("NAV_HOME")}</a>
        <a href="/about">{t("NAV_ABOUT")}</a>
      </nav>
      <LanguageSelector />
    </header>
  );
}
```

---

## Step 11 — Namespace in Components

Always use `useTranslation()` with no arguments. The `LanguageProvider` already loads the correct modules (common + route-specific) per route, so all keys are available:

```
const { t } = useTranslation();
t("NAV_HOME"); t("ERROR_REQUIRED");
t("HOME_HERO_TITLE"); t("AUTH_LOGIN_SUBMIT");
```

> [!WARNING]
> Do not pass a namespace argument to `useTranslation()` — always use `useTranslation()` with no arguments. Adding a namespace argument causes keys to not resolve.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| React Query hooks not working | Missing `QueryClientProvider` | Wrap with `QueryClientProvider` |
| Flash of untranslated content on first load | Default language not loaded on init | Ensure `loadTranslations(defaultLanguage, "common")` is called in `useEffect` on mount |
| "createContext only in Client Components" | Importing i18n in Server Component | Add `"use client"` to `i18n.ts` |
| Keys showing instead of values | Namespace argument passed to `useTranslation()` | Remove the namespace argument — always use `useTranslation()` |
| All keys show key names | Translations not registered via `loadTranslations` | Ensure `loadTranslations(selectedLanguage, moduleName)` is called for each module — it adds to the 'translation' namespace |
| Cascading renders warning | `setState` in `useEffect` without transition | Wrap in `startTransition` |
| Translations not loading on switch | Locale not in queryKey | Use `[translations, selectedLanguage]` in queryKey |
| Extension not working on localhost | `projectKey` not in localStorage | Ensure `localStorage.setItem('projectKey', projectKey)` is called on app init |

---

## Verification

Run through the Verification Checklist in `SKILL.md` after setup. Key checks:

1. Dev server starts — no hydration errors
2. App loads with translated text immediately — default language loads on first render (no language selection needed)
3. Navigate between pages — `common` + route-specific modules fetched
4. Switch language via the header selector — translations update
5. Key-mode extension toggle — keys display instead of values
6. `references/key-mode-debugging.md` — full extension integration pattern
