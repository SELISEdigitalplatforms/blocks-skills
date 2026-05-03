# Next.js App Router Reference

Next.js 13+ App Router integration with the Blocks UILM API via `i18next` + `react-i18next`.

**Primary guide: `flows/client-i18n-setup.md`** — follow that flow for the complete implementation. This reference provides the Next.js-specific boilerplate, types, and environment config.

## Directory Structure

```
src/
├── lib/
│   ├── language.types.ts       # Language, Translation interfaces
│   ├── language.service.ts    # API calls: getUilmFile, getLanguages, getModules
│   ├── i18n.ts              # i18next init + key-mode toggle
│   ├── language-provider.tsx  # LanguageProvider + useLanguage hook
│   └── route-module-map.ts  # Dual-module route resolution
├── components/
│   └── language-selector.tsx  # Locale switcher dropdown
└── app/
    └── layout.tsx            # Root layout with LanguageProvider
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
  - Base URL: process.env.NEXT_PUBLIC_BLOCKS_API_URL
  - Headers: x-blocks-key: {projectKey}
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Record<string, string> directly — NOT wrapped in data or translations
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns Language[] array directly
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns array with { itemId, moduleName } directly
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

> [!WARNING]
> **Critical: Do NOT wrap API responses in `{data: ...}`**
> All three endpoints return raw JSON directly — no envelope. Common mistake:
> ```typescript
> // WRONG — returns { data: {...} } instead of the actual value
> const data = await response.json();
> return data; // ❌ returns UilmFileResponse or wrapper
>
> // CORRECT — return the JSON directly
> return await response.json(); // ✅ returns Record<string, string> / Language[] / Module[]
> ```

## i18n.ts, LanguageProvider, Route-Module Map

See `flows/client-i18n-setup.md` Steps 5, 6, and 7. The flow contains the complete `i18n.ts` pattern with key-mode toggle, `language-provider.tsx` skeleton, and `route-module-map.ts` pattern.

## Root Layout

```typescript
// app/layout.tsx
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/language-provider";
import { Header } from "@/components/header";

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Header /> {/* LanguageSelector is inside Header */}
          {children}
        </LanguageProvider>
      </body>
    </html>
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
// app/home/page.tsx
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();
  return <h1>{t("HERO_TITLE")}</h1>;
}
```

```typescript
// components/Header.tsx
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
# .env.local
NEXT_PUBLIC_BLOCKS_API_URL=https://api.example.com
NEXT_PUBLIC_X_BLOCKS_KEY=your_project_key
```

> [!IMPORTANT]
> The `projectKey` value must be stored in `localStorage['projectKey']` on app init. This enables the UILM browser extension to inject key-mode on `localhost`. Read from localStorage first in the service layer, falling back to the env var:
> ```ts
> const projectKey = typeof window !== 'undefined'
>   ? localStorage.getItem('projectKey') ?? process.env.NEXT_PUBLIC_X_BLOCKS_KEY
>   : process.env.NEXT_PUBLIC_X_BLOCKS_KEY;
> ```

## Package Dependencies

```bash
npm install i18next react-i18next @tanstack/react-query
```

## Middleware for Locale Detection (Optional)

For projects needing URL-based locale routing (e.g., `/en/...`, `/de/...`):

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLocales = ["en", "de", "fr", "es"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = supportedLocales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const acceptLang = request.headers.get("accept-language") || "";
    const detectedLocale =
      acceptLang
        .split(",")
        .map((l) => l.split(";")[0].trim().substring(0, 2))
        .find((l) => supportedLocales.includes(l)) || defaultLocale;

    return NextResponse.redirect(new URL(`/${detectedLocale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

> [!NOTE]
> For runtime i18n, locale middleware is optional. `LanguageProvider` handles default language from the backend `isDefault` flag.

## TODO Checklist

- [ ] Add `i18next react-i18next @tanstack/react-query` to dependencies
- [ ] See `flows/client-i18n-setup.md` for all file creation steps
- [ ] Create `.env.local` with `NEXT_PUBLIC_BLOCKS_API_URL` and `NEXT_PUBLIC_X_BLOCKS_KEY`
- [ ] Register all namespaces in `i18n.ts` `ns` array as modules are created
- [ ] Test key-mode toggle with UILM browser extension
