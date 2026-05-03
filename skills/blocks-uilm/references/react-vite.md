# React Vite Reference

React + Vite SPA integration with the Blocks UILM API via `i18next` + `react-i18next`.

**Primary guide: `flows/client-i18n-setup.md`** — follow that flow for the complete implementation. This reference provides the Vite-specific boilerplate, types, and environment config.

## Directory Structure

```
src/
├── lib/
│   ├── language.types.ts       # Language, Translation interfaces
│   ├── language.service.ts    # API calls: getUilmFile, getLanguages, getModules
│   ├── i18n.ts              # i18next init + key-mode toggle
│   ├── language-provider.tsx # LanguageProvider + useLanguage hook
│   └── route-module-map.ts   # Dual-module route resolution
├── components/
│   └── language-selector.tsx  # Locale switcher dropdown
└── App.tsx                   # Root app with LanguageProvider
```

## Types Layer

Match exact field names from `contracts.md`:

```
Create: src/lib/language.types.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

export interface Language {
  itemId: string;
  languageName: string;
  languageCode: string;
  isDefault: boolean;
  isRTL?: boolean;
  projectKey: string;
}

export type ModuleTranslations = Record<string, string>;

export interface Translation {
  languageCode: string;
  value: string;
}

export interface Resource {
  value: string;
  culture: string;
  characterLength: number;
}

export interface TranslationKey {
  itemId: string;
  keyName: string;
  moduleId: string;
  projectKey: string;
  resources: Resource[];
}
```

> [!IMPORTANT]
> Use exact field names: `itemId`, `languageName`, `languageCode`, `moduleName` (for modules), `moduleId` (for keys), `keyName` — not `id`, `name`, `code`, `moduleId` (for keys). Use `resources[]` not `translations[]`. See `contracts.md`.

## Services Layer

```
Create: src/lib/language.service.ts
Key patterns:
  - Base URL: import.meta.env.VITE_BLOCKS_API_URL
  - Headers: x-blocks-key: {projectKey}
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Record<string, string> directly — NOT wrapped in data or translations
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns Language[] array directly
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns array with { itemId, moduleName } directly
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

## i18n.ts, LanguageProvider, Route-Module Map

See `flows/client-i18n-setup.md` Steps 5, 6, and 7. The flow contains the complete `i18n.ts` pattern with key-mode toggle, `language-provider.tsx` skeleton, and `route-module-map.ts` pattern.

## Root App with Router

```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/language-provider";
import { Header } from "@/components/Header";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

function App({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <App>
        <Header /> {/* LanguageSelector is inside Header */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </App>
    </BrowserRouter>
  );
}
```

> The `LanguageSelector` component is placed inside the `Header` — it must be accessible from every page.

## Using Translations

> [!WARNING]
> Never add a second argument to `t()`. All translations come from the UILM API. Use `t("NAV_HOME")` instead of `t("NAV_HOME", "Home")`.
>
> Always use `useTranslation()` with no arguments. The `LanguageProvider` loads the correct modules per route — no namespace argument needed.

```typescript
// src/pages/HomePage.tsx
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();
  return <h1>{t("HERO_TITLE")}</h1>;
}
```

```typescript
// src/components/Header.tsx
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();
  return (
    <nav>
      <a href="/">{t("NAV_HOME")}</a>
      <a href="/about">{t("NAV_ABOUT")}</a>
    </nav>
  );
}
```

Namespaces are registered dynamically — the `ns` array in `i18n.ts` starts with `["common"]` only. Additional module namespaces are added via `i18n.addResourceBundle()` as modules are fetched from the `getModules` API.

## Environment Variables

```env
# .env
VITE_BLOCKS_API_URL=https://api.example.com
VITE_X_BLOCKS_KEY=your_project_key
```

> [!IMPORTANT]
> The `projectKey` value must be stored in `localStorage['projectKey']` on app init. This enables the UILM browser extension to inject key-mode on `localhost`. Read from localStorage first in the service layer, falling back to the env var:
> ```ts
> const projectKey = typeof window !== 'undefined'
>   ? localStorage.getItem('projectKey') ?? import.meta.env.VITE_X_BLOCKS_KEY
>   : import.meta.env.VITE_X_BLOCKS_KEY;
> ```

## Package Dependencies

```bash
npm install i18next react-i18next @tanstack/react-query react-router-dom
```

## SPA Navigation with Route Changes

In `language-provider.tsx`, use `useLocation` from `react-router-dom` to detect navigation and reload translations for the new route. See `flows/client-i18n-setup.md` Step 7.

## TODO Checklist

- [ ] Add `i18next react-i18next @tanstack/react-query react-router-dom` to dependencies
- [ ] See `flows/client-i18n-setup.md` for all file creation steps
- [ ] Create `.env` with `VITE_BLOCKS_API_URL` and `VITE_X_BLOCKS_KEY`
- [ ] Register all namespaces in `i18n.ts` `ns` array as modules are created
- [ ] Test key-mode toggle with UILM browser extension
