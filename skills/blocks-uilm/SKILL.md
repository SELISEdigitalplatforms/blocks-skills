---
name: blocks-uilm
description: "Use this skill for setting up languages, managing translation keys, AI-powered auto-translation, importing/exporting translation files, or configuring localization modules on SELISE Blocks. Also triggers when developers mention 'blocks-uilm', 'how to use blocks-uilm', 'localization skill', 'i18n setup', 'UILM', 'blocks i18n', 'blocks localization', 'translation skill', 'blocks translation', 'multilingual setup', or need i18n, translations, language setup, or locale management connected to the Blocks UILM API."
user-invocable: true
blocks-version: "1.0.0"
---

# Blocks Localization Skill

## Purpose

Handles all UI localization management for SELISE Blocks via the UILM v1 API. Covers language setup, translation module and key management, AI-assisted translation, file import/export, webhook configuration, and client-side i18n setup with runtime API integration.

---

## How to Answer "How do I use blocks-uilm?"

When a developer asks **"how to use blocks-uilm"**, **"what does blocks-uilm do"**, or **"how do I get started with blocks-uilm"**:

1. **Ask for their framework** — Next.js, React, Angular, Flutter, Blazor, etc.
2. **Ask what they want to do** — set up languages, add translation keys, configure AI translation, import/export files, etc.
3. **Point to the human overview** — direct them to `README.md` for a quick overview
4. **Point to the AI guide** — direct them to `SKILL.md` for the full execution guide
5. **Give a one-liner summary** — "blocks-uilm handles all localization: languages, translation keys, AI auto-translation, and file import/export for SELISE Blocks"

**Do NOT** generate a custom summary. The skill already has this information in `README.md` and `SKILL.md`. Link to those files instead of reproducing their content.

---

## When to Use

Example prompts that should route here:
- "Set up English and German as project languages"
- "Add translation keys for the login page"
- "Auto-translate all missing German translations using AI"
- "Import a JSON translation file for French"
- "Export all translations for the dashboard module"
- "Set up i18n in the Next.js app"
- "Translations aren't loading — fix the i18n setup"
- "Configure webhooks for localization changes"
- "Add a new language to the project"
- "Scan my project for translation keys and generate a CSV"
- "Migrate my existing ngx-translate / i18next setup to Blocks"

---

## Execution Context

Before executing any action or flow from this skill, read `skills/core/runtime/execution-context.md` for the required supporting files, load order, and cross-domain orchestration rules.

At minimum, this skill requires:
- `contracts.md` — for API response shapes and endpoint details
- `flows/` — for multi-step workflows (don't execute actions in isolation when a flow exists)
- `references/bridge-strategies.md` — when migrating from existing i18n tooling

### Field Names

Always use the **correct** field names from the UILM API. The API uses different identifiers for modules vs keys, and different structures for key resources:

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `id` | `itemId` | Language, Key delete/get, Rollback |
| `name` | `languageName` | Language |
| `code` | `languageCode` | Language, Resource.culture |
| `moduleName` | `moduleId` | Key operations (Save, Gets, TranslateAll) |
| `moduleName` | `moduleName` | Module operations (Module/Save, Module/Gets) |
| `translations[]` | `resources[]` | Key structures — `{value, culture, characterLength}` |
| `data[]` | `keys[]` | GetKeysQueryResponse |
| `keyId` | `itemId` | Key responses |
| `keyId` | `EntityId` | GetKeyTimeline query |
| `languageCode` | `culture` | Resource object |
| `languageId` | `languageName` | SetDefaultLanguage |
| `itemId` (delete language) | `LanguageName` (query) | Language/Delete |
| `filter.search` | `keySearchText` | GetKeysRequest |
| `filter.untranslatedOnly` | `isPartiallyTranslated` | GetKeysRequest |
| `moduleIds[]` (export) | `appIds[]` | UilmExportRequest |
| `Authorization: ApiKey` | `x-blocks-key` header | All requests |

Using wrong field names silently returns `undefined` or empty arrays.

---

## Translation Key Naming Conventions

Translation keys must use **semantic names** that describe the **meaning** of the text, not its **UI structure**.

### Good vs Bad Key Names

| Bad (don't use) | Good (use this) | Why |
|-----------------|-----------------|-----|
| `FOOTER_PRODUCT` | `PRODUCT` | Footer is a layout concern, not a semantic one |
| `HERO_WELCOME_CLIENTS` | `WELCOME_CLIENTS` | Hero is a UI pattern — name the content and location |
| `FEATURES_SHIP_HOURS_TITLE` | `SHIP_HOURS_TITLE` | Feature section is implementation — describe the benefit |
| `FEATURES_ENTERPRISE_SECURITY_DESC_1` | `ENTERPRISE_SECURITY_DESC` | Desc/N numbers are meaningless — use semantic meaning |
| `HOME_TESTIMONIALS_BADGE` | `TESTIMONIALS_BADGE` | Badge is a UI component |
| `HOME_FOUNDATION_SIX_TITLE` | `FOUNDATION_TITLE` | Six is a count that will change |
| `FOOTER_COMPANY_NAME` | *not a key* | Brand names are not translatable |
| `FOOTER_COPYRIGHT` | *not a key* | Copyright/legal text is not translatable |

### Rules

1. **No UI-type prefixes** — `LINK_`, `CTA_`, `BADGE_`, `SECTION_` all leak UI implementation. A "button" today is a "link" tomorrow.
2. **No layout names** — `HEADER_`, `FOOTER_`, `SIDEBAR_`, `MODAL_` are layout containers, not content. Use the content's purpose instead.
3. **No component names** — `CARD_`, `TABLE_`, `FORM_`, `TOOLTIP_`, `ALERT_` are implementation details.
4. **No count-based segments** — `DESC_1`, `DESC_2`, `OPTION_3` are fragile and become meaningless.
5. **Include page/route scope for non-common keys** — `HOME_HERO_TITLE`, `AUTH_LOGIN_HEADING`, `DASHBOARD_WELCOME`. Common module keys (shared everywhere) may omit scope: `NAV_HOME`, `NAV_SIGN_IN`.
6. **Use SCREAMING_SNAKE_CASE** — `HOME_HERO_TITLE`, `NAV_SIGN_IN`, `ERROR_REQUIRED_FIELD`.

### Naming Format by Module Type

| Module | Key Format | Example |
|--------|-----------|---------|
| `common` (shared) | `{CONTENT_PURPOSE}` | `NAV_HOME`, `ERROR_REQUIRED`, `BUTTON_SUBMIT`, `CONFIRM_DIALOG_TITLE` |
| Route-specific | `{ROUTE}_{CONTENT_PURPOSE}` | `HOME_HERO_TITLE`, `AUTH_LOGIN_SUBMIT`, `DASHBOARD_STATS_HEADING` |

---

## What Goes in the Common Module

The `common` module is loaded on **every page**. It should contain only text that is genuinely shared across multiple routes.

### Put in Common

- Navigation links: `NAV_HOME`, `NAV_SIGN_IN`, `NAV_SIGN_OUT`, `NAV_SETTINGS`
- Global error messages: `ERROR_REQUIRED`, `ERROR_INVALID_EMAIL`, `ERROR_NETWORK`
- Dialog labels: `CONFIRM_DIALOG_TITLE`, `CONFIRM_DIALOG_MESSAGE`, `DELETE_CONFIRM_TITLE`
- Page skeleton: `LOADING`, `NO_RESULTS`, `SEARCH_PLACEHOLDER`
- Accessibility labels: `ARIA_MENU`, `ARIA_CLOSE`, `ARIA_EXPAND`

### Do NOT Put in Common

- **Page-specific hero text** → `home` module: `HOME_HERO_TITLE`, `HOME_HERO_SUBTITLE`
- **Feature section content** → `home` module: `HOME_SHIP_HOURS_TITLE`, `HOME_SECURITY_SOC2_DESC`
- **Brand/legal text** → hardcode in the component, do not use translation keys
- **Testimonials** → `home` module
- **Route-specific CTAs** → the specific module: `PRICING_GET_STARTED`, `DOCS_QUICKSTART`

> [!WARNING]
> Putting every key in `common` defeats the purpose of route-based module loading. Each module should have a clear boundary. If a key is only used on one page, it belongs in that page's module, not `common`.

---

## Non-Translatable Content

Some content should **never** be added as translation keys.

### Never Translate These

| Content Type | Example | Why |
|-------------|---------|-----|
| Brand name | `Selise Blocks` | Brand names are not translatable |
| Company legal name | `SELISE Digital AG` | Legal entity names |
| Copyright text | `All rights reserved` | Legal boilerplate, not translatable |
| Trademarks | `™`, `®` symbols with name | Legal protection |
| Internal codenames | `project-alpha` | Internal-only identifiers |
| URLs / domain names | `https://example.com` | Not translatable |
| File extensions | `.pdf`, `.zip` | Not translatable |

### How to Handle Non-Translatable Content

```tsx
// BAD — brand name as a translation key
<h1>{t('BRAND_NAME')}</h1>

// GOOD — brand name hardcoded
<h1>Selise Blocks</h1>

// GOOD for product name shown in UI (if it changes per deployment)
<h1>{t('PRODUCT_NAME')}</h1>  // only if it actually changes per language
```

If a product or company name **does** need to change per language (e.g., a localized product line), create a key for it — but use a semantic name, not a brand name:

```tsx
// If "Blocks OS" is the localized product name
<productName>Blocks OS</productName>  // hardcode — product names are brand-adjacent

// If the UI needs a generic label for the product
<productLabel>{t('PRODUCT_LABEL')}</productLabel>  // semantic, not brand
```

---

## Pre-Flight Audit

Always run this audit before implementing anything. It determines the approach.

### Step 1: Detect Stack

Scan the project root for framework indicators:

| Indicator | Framework |
|-----------|-----------|
| `package.json` + `app/` dir or `next.config.js` | Next.js App Router |
| `package.json` + `vite.config.ts` | Vite + React SPA |
| `package.json` + `react-native.config.js` | React Native |
| `angular.json` | Angular |
| `pubspec.yaml` | Flutter |
| `*.csproj` / `Program.cs` | .NET Blazor |
| No framework files | Vanilla HTML/JS |

> If the app uses client-side routing (React Router, Next.js Link, etc.), enable SPA navigation handling in the `client-i18n-setup` flow. The LanguageProvider must detect route changes via `usePathname()` and reload translation modules on navigation.

### Step 2: Check Existing i18n

Look for existing localization tooling before setting up:

| Found | Implies | Action |
|-------|---------|--------|
| `i18next`, `react-i18next` in `package.json` | i18next already installed | Proceed with i18next flow, don't reinstall |
| `@ngx-translate/core` in Angular | ngx-translate in use | Read `references/bridge-strategies.md` first |
| `.arb` files in `lib/l10n/` or `src/locale/` | ARB-based Flutter/iOS | Read `references/bridge-strategies.md` |
| `.resx` files in `Resources/` | .NET RESX files | Read `references/bridge-strategies.md` |
| `flutter_localizations` in `pubspec.yaml` | Flutter built-in i18n | Use Flutter pattern from `references/flutter.md` |
| `localization.service.ts` or `useBlocksTranslation` in project | Old Blocks integration | Treat as legacy — read `references/bridge-strategies.md` |
| No i18n files found | Greenfield | Proceed with `client-i18n-setup` flow |

### Step 3: Check Blocks Localization Status

| Question | If Yes | If No |
|----------|--------|-------|
| Are languages/modules already set up in the UILM admin? | Skip to `key-management` flow | Run `language-setup` flow first |
| Is `client-i18n-setup` already implemented? | Verify with the Verification Checklist | Run `client-i18n-setup` flow |
| Is there a `.env.local` / `.env` with `BLOCKS_API_URL` and `X_BLOCKS_KEY`? | Credentials exist — use them | Ask user for credentials |

### Step 4: Route Decision

After the audit, route based on findings:

| Scenario | Flow to Use |
|----------|-------------|
| Greenfield + no existing i18n | `client-i18n-setup` → `language-setup` → `key-management` |
| Existing i18next project | `client-i18n-setup` (adapt, don't reinstall) |
| Existing ngx-translate / ARB / RESX | Read `references/bridge-strategies.md` → migrate |
| Languages/modules not set up | `language-setup` first |
| Keys need managing / translating | `key-management` |
| Import/export translation files | `import-export` |
| Generate CSV from source code | `scan-and-generate` |

---

## Intent Mapping

Use this table to route user requests. Check `flows/` first — if a flow covers the request, use it. For single-action requests, go directly to the action.

| User wants to... | Use |
|-------------------|-----|
| Set up languages for a project | `flows/language-setup.md` |
| Add translation keys and translate them | `flows/key-management.md` |
| Import an existing JSON translation file | `flows/import-export.md` |
| Export translations / download compiled JSON | `flows/import-export.md` |
| Set up client-side i18n with Blocks API | `flows/client-i18n-setup.md` |
| Generate translation files from source code | `flows/scan-and-generate.md` |
| Add route-module mapping for translations | `references/route-module-map.md` |
| Configure webhook for localization events | `flows/webhook-setup.md` |
| AI-translate all untranslated keys | `actions/translate-all.md` |
| AI-translate a single key | `actions/translate-key.md` |
| Add a language | `actions/save-language.md` |
| List languages | `actions/get-languages.md` |
| Delete a language | `actions/delete-language.md` |
| Set a default language | `actions/set-default-language.md` |
| Add a module | `actions/save-module.md` |
| List modules | `actions/get-modules.md` |
| Create or update a translation key | `actions/save-key.md` |
| Batch create/update translation keys | `actions/save-keys.md` |
| Search / list translation keys | `actions/get-keys.md` |
| Get keys by name array | `actions/get-keys-by-names.md` |
| Get a single key | `actions/get-key.md` |
| Delete a key | `actions/delete-key.md` |
| Get key edit history | `actions/get-key-timeline.md` |
| Download compiled translation JSON | `actions/get-uilm-file.md` |
| Regenerate compiled translation file | `actions/generate-uilm-file.md` |
| Import a JSON translation file | `actions/import-uilm.md` |
| Export translation modules | `actions/export-uilm.md` |
| List exported translation files | `actions/get-exported-files.md` |
| View file generation history | `actions/get-generation-history.md` |
| Rollback a key to a previous version | `actions/rollback-key.md` |
| Configure a webhook | `actions/save-webhook.md` |

---

## Flows

| Flow | File | Description |
|------|------|-------------|
| language-setup | flows/language-setup.md | Add languages, set default, and create modules for a project |
| key-management | flows/key-management.md | Create translation keys, add translations, AI-translate missing values |
| import-export | flows/import-export.md | Import JSON files into UILM or export/download compiled files |
| client-i18n-setup | flows/client-i18n-setup.md | Set up i18next + React Query with runtime API calls to Blocks UILM |
| scan-and-generate | flows/scan-and-generate.md | Scan source code for `useTranslation()` calls, extract keys, generate CSV/JSON for import |
| webhook-setup | flows/webhook-setup.md | Configure webhooks to receive notifications for localization events |

---

## API Base Path

All endpoints are prefixed with: `{apiUrl}/uilm/v1`

> [!WARNING]
> The API uses `/uilm/v1` as its path prefix, **not** `/api/v1`. If the env var is `https://api.example.com`, the full URL is `https://api.example.com/uilm/v1/Key/GetUilmFile`. Appending `/api/v1` instead will result in 404s.

Use `x-blocks-key: {projectKey}` header for all authenticated requests. The API also accepts `Authorization: Bearer {token}` for JWT-based auth. Store credentials in environment variables — see Step 3 of the Pre-Flight Audit.

> [!WARNING]
> **API responses are NOT wrapped in a `data` envelope.** All API calls return raw JSON directly:
> - `getLanguages()` → returns `Language[]` directly — NOT `{ data: Language[] }`
> - `getModules()` → returns `{itemId, moduleName}[]` directly — NOT `{ data: [...] }`
> - `getUilmFile()` → returns `Record<string, string>` directly — NOT `{ translations: {...} }`
>
> Never access `.data` on the response. If your code does `response.json().then(r => r.data)`, that is wrong — just use `response.json()` directly.

### HTTP Method Quick Reference

Use this table to quickly determine the method, endpoint pattern, and body format for each action. Full details (request body fields, query params, response shapes) are in `actions/{action-name}.md`.

| Action | Method | Endpoint Pattern | Body / Params |
|--------|--------|-----------------|---------------|
| get-languages | `GET` | `/Language/Gets?projectKey={key}` | Query param — no body |
| save-language | `POST` | `/Language/Save` | `{ languageName, languageCode, isDefault, isRTL }` |
| delete-language | `DELETE` | `/Language/Delete?LanguageName={name}&ProjectKey={key}` | Query params — no body |
| set-default-language | `POST` | `/Language/SetDefaultLanguage` | `{ languageName, projectKey }` |
| get-modules | `GET` | `/Module/Gets?projectKey={key}` | Query param — no body |
| save-module | `POST` | `/Module/Save` | `{ moduleName, projectKey }` |
| get-keys | `GET` | `/Key/Gets` | Query params — `moduleIds[]`, `keySearchText`, `isPartiallyTranslated` |
| get-key | `GET` | `/Key/GetById?itemId={id}&projectKey={key}` | Query params — no body |
| save-key | `POST` | `/Key/Save` | `{ keyName, moduleId, projectKey, resources[] }` |
| save-keys | `POST` | `/Key/Saves` | `{ keys[], projectKey }` |
| delete-key | `DELETE` | `/Key/Delete?itemId={id}&projectKey={key}` | Query params — no body |
| get-key-timeline | `GET` | `/Key/GetKeyTimeline?EntityId={id}&projectKey={key}` | Query params — no body |
| rollback-key | `POST` | `/Key/Rollback` | `{ itemId, versionNumber, projectKey }` |
| translate-key | `POST` | `/Key/TranslateKey` | `{ itemId, moduleId, messageCoRelationId, projectKey }` |
| translate-all | `POST` | `/Key/TranslateAll` | `{ moduleId, defaultLanguage, messageCoRelationId, projectKey }` |
| get-uilm-file | `GET` | `/Key/GetUilmFile` | Query params — `culture`, `moduleName`, `projectKey` |
| generate-uilm-file | `POST` | `/Key/GenerateUilmFile` | `{ culture, moduleName, projectKey }` |
| export-uilm | `POST` | `/Export/ExportUilm` | `{ culture, appIds[], projectKey }` |
| import-uilm | `POST` | `/Import/UilmImport` | `{ fileId, projectKey }` (fileId only — not multipart) |
| get-exported-files | `GET` | `/Export/Gets?projectKey={key}` | Query param — no body |
| get-generation-history | `GET` | `/Key/GetGenerationHistory?projectKey={key}` | Query param — no body |
| save-webhook | `POST` | `/Webhook/Save` | `{ webhookUrl, events[], projectKey }` |

**Example curl snippets by method:**

```bash
# GET — query params in URL
curl "{apiUrl}/uilm/v1/Language/Gets?projectKey={key}" \
  --header "x-blocks-key: {key}"

# POST with JSON body
curl "{apiUrl}/uilm/v1/Key/Save" \
  --header "x-blocks-key: {key}" \
  --header "Content-Type: application/json" \
  --data '{ "keyName": "NAV_HOME", "moduleId": "common", "projectKey": "{key}", "resources": [] }'

# DELETE — itemId in query param
curl --request DELETE "{apiUrl}/uilm/v1/Key/Delete?itemId={id}&projectKey={key}" \
  --header "x-blocks-key: {key}"
```

---

## Dual-Module Loading

Every route loads two modules:

1. **`common`** — Shared keys (navigation, footer, shared UI) — always loaded
2. **Route-specific** — Derived from pathname

```
Available Modules: fetched from GET /uilm/v1/Module/Gets → ["common", "home", "about", "dashboard"]

Route          → Modules Loaded
/              → ["common", "home"]
/about         → ["common", "about"]
/dashboard     → ["common", "dashboard"]
/auth/login    → ["common", "auth"]
/unknown-page  → ["common", "home"]  (falls back to "home")
```

### Why This Pattern?

| Alternative | Problem |
|-------------|---------|
| Single "common" module | Bloated; all keys loaded everywhere |
| All modules at once | Too many API calls; most unused |
| Route-specific only | Shared keys must be duplicated across modules |

### Module Discovery

`availableModules` is fetched dynamically from `GET /uilm/v1/Module/Gets` — never hardcoded. The API returns a flat array with `{ itemId, moduleName }`. Map to a string array for use in route resolution:

```typescript
const { data: moduleData } = useQuery({
  queryKey: ["availableModules"],
  queryFn: getModules,
});
const availableModules = moduleData?.map((m) => m.moduleName) ?? ["common"];
```

### Implementation

Two functions handle route-to-module resolution — create `src/lib/route-module-map.ts`:

```typescript
export const DEFAULT_MODULE = "common";

export function getRouteModuleName(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] || "home";
}

export function getModulesForRoute(
  pathname: string,
  availableModules: string[]
): string[] {
  const routeModule = getRouteModuleName(pathname);
  const modules = [DEFAULT_MODULE];

  if (routeModule !== DEFAULT_MODULE && availableModules.includes(routeModule)) {
    modules.push(routeModule);
  } else {
    // Unknown route — always fall back to ['common', 'home'].
    // This is intentional: unrecognized routes load the home module
    // so that landing-page content is available even on 404 pages.
    if (routeModule !== "home" && availableModules.includes("home")) {
      modules.push("home");
    }
  }

  return [...new Set(modules)];
}
```

> Always load `["common", "home"]` as minimum — even unknown routes get these two modules.

See `references/route-module-map.md` for full implementation including the dynamic module discovery pattern.

---

## Key-Mode Debugging

Key mode shows **translation keys** instead of values, toggled via the UILM browser extension. Useful for auditing which keys are used in the UI.

```
Normal mode:  t('HERO_TITLE')  →  "Stop wiring. Start building."
Key mode:     t('HERO_TITLE')  →  "HERO_TITLE"
```

### How It Works

The browser extension sends `{ action: "keymode", keymode: true }` via `window.postMessage`. The app listens, toggles a global flag, wraps `i18n.t()` to return keys when active, and emits `languageChanged` to force re-renders.

### 5 Required Pieces

**1. i18next init with `returnNull: false` — in `i18n.ts`:**
```typescript
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}

i18n.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  returnNull: false,
  resources: {},
});
```

**2. `loadTranslations` function — fetches and registers translations:**
```typescript
export const loadTranslations = async (language: string, moduleName: string): Promise<void> => {
  try {
    const translations = await getUilmFile({ language, moduleName });
    if (!translations) return;

    // Add to 'translation' (default) namespace — enables useTranslation() with no arguments
    i18n.addResourceBundle(language, 'translation', translations, true, true);
    // Also add to module-specific namespace for organized access
    i18n.addResourceBundle(language, moduleName, translations, true, true);
  } catch (error) {
    console.error(`Failed to load translations for module ${moduleName}:`, error);
  }
};
```

> [!IMPORTANT]
> Always add translations to the `'translation'` namespace (the default namespace). This is what makes `useTranslation()` with no arguments resolve keys correctly.

**3. Global flag — in `i18n.ts`:**
```typescript
declare global {
  interface Window { __i18nKeyMode?: boolean; }
}
if (typeof window !== "undefined") {
  window.__i18nKeyMode = false;
}
```

**4. Wrapped `t()` function — return key when flag is true:**
```typescript
const originalT = i18n.t.bind(i18n);
(i18n as any).t = (key: string | string[], options?: object) => {
  if (typeof window !== "undefined" && window.__i18nKeyMode) {
    return Array.isArray(key) ? key[0] : key;
  }
  return originalT(key, options);
};
```

**5. `postMessage` listener — in `i18n.ts`:**
```typescript
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const { data } = event;
    if (!data || typeof data !== "object") return;

    const { action, keymode } = data as { action?: string; keymode?: boolean };
    if (action === "keymode" && typeof keymode === "boolean") {
      const previous = window.__i18nKeyMode;
      window.__i18nKeyMode = keymode;
      if (previous !== keymode) {
        (i18n as any).emit("languageChanged", i18n.language);
      }
    }
  });
}
```

When the flag changes, `i18n.emit("languageChanged", i18n.language)` forces all `useTranslation()` components to re-render with keys visible.

### Quick Test

Open DevTools console on the app and run:
```javascript
window.__i18nKeyMode = true;
window.postMessage({ action: "keymode", keymode: true }, "*");
```
All text should now show key names. Reverse to restore translations.

See `references/key-mode-debugging.md` for the full implementation including the `getUilmFile` import.

---

## Common Pitfalls

> [!WARNING]
>
> - **Don't use UI-type prefixes in key names** — `BTN_SIGN_IN`, `FOOTER_PRODUCT`, `FEATURE_SHIP_HOURS_TITLE`, `DESC_1` all leak implementation details. Keys should describe meaning, not UI type or layout position. When a button becomes a link, the key name becomes misleading.
> - **Don't put route-specific content in the `common` module** — Hero text, feature descriptions, testimonials, and page-specific CTAs belong in their page's module (e.g., `home`, `dashboard`). Only genuinely shared text (navigation, form elements, global errors) goes in `common`.
> - **Don't create translation keys for brand names or legal text** — "Selise Blocks", "All rights reserved", trademark text, and domain names are not translatable. Hardcode them in components instead.
> - **Don't forget to store `projectKey` in localStorage** — the UILM browser extension reads `localStorage['projectKey']` to enable key-mode on `localhost`. Always set `localStorage.setItem('projectKey', projectKey)` on app init, reading from localStorage first in the service layer and falling back to the env var.
> - **Don't require manual language selection on first load** — the `LanguageProvider` must auto-load the default language (the one with `isDefault: true`) and its `common` module on mount. Users should see translated text immediately without selecting a language first.
> - **Don't place the LanguageSelector in a page component** — it belongs in the `Header` component so it is visible and accessible from every route.
> - **Don't use `localStorage` in Next.js SSR** — it's not available on server. Use backend `isDefault` flag instead.
> - **Don't use the wrong auth header** — Use `x-blocks-key: {projectKey}` header. `Authorization: ApiKey` is deprecated.
> - **Don't fetch all modules at once** — use route-based loading to minimize API calls.
> - **Don't generate standalone setup scripts** (`setup-localization.js`, `seed-translations.ts`, etc.) that manually create languages, modules, or keys via raw fetch calls. Languages and modules are created via the Blocks Portal UI or the `save-language` / `save-module` / `save-keys` actions. For bulk seeding, use CSV import via `import-uilm`.
> - **Don't initialize i18n during render in Next.js** — Translation resources must be added in `useEffect`, not during component render. Initializing during render causes server/client text mismatches.
> - **Don't import `react-i18next` in Server Components** — Add `"use client"` to `i18n.ts` and only use it in Client Components. Do NOT import `i18n` directly in `layout.tsx`.
> - **Don't use a namespace argument in `useTranslation()`** — Always use `useTranslation()` with no arguments. The `LanguageProvider` already loads the correct modules (common + route-specific) per route, so all keys are available. Adding a namespace argument causes keys to not resolve.
> - **Don't forget to register all namespaces** — Modules are registered via `i18n.addResourceBundle()` as they are fetched from the `getModules` API. Ensure each module's namespace is registered before its keys are used.
> - **Don't generate synthetic keys for scan-and-generate** — The scan flow must extract keys from actual source files using grep/search tools. Never invent keys like `NAV_HOME` or `BUTTON_SUBMIT` from memory. If no project directory is available, tell the user you cannot scan without one.
> - **Don't assume API response structure** — `GetUilmFile` returns a flat object directly, not `{data}` or `{translations: {...}}`. Accessing `.translations` will return undefined. `GetKeys` returns `keys[]` not `data[]`.
> - **Don't skip default modules in SPA** — Always load `["common", "home"]` for every route to ensure shared UI works.
> - **Don't call `setState` synchronously in `useEffect`** — Wrap state updates in `startTransition` when making client-only decisions in effects.
> - **Don't use wrong field names for key operations** — For key operations (Save, Gets, TranslateAll), use `moduleId`. For module operations (Module/Save, Module/Gets), use `moduleName`. These are different identifiers — mixing them up causes 404s.
> - **Don't use `translations[]` on key objects** — Use `resources[]` with `{value, culture, characterLength}`. The `translations[]` pattern does not exist in the API.
> - **Don't forget `messageCoRelationId` in translate actions** — `TranslateAll` and `TranslateKey` require a UUID for `messageCoRelationId`. Without it, the request fails with 400.
> - **Don't pass a raw file to import** — `UilmImport` takes a `fileId` (string reference), not a multipart file upload. Upload the file separately first.
> - **Don't add default values to `t()`** — All translations come from the UILM API. Use `t("FOOTER_PRODUCT")` instead of `t("FOOTER_PRODUCT", "Product")`. Hardcoded defaults bypass the translation system entirely.
> - **Don't hardcode `availableModules`** — Fetch from `GET /uilm/v1/Module/Gets` to get the live list of modules. Hardcoding causes missing modules and 404s when new modules are created.
> - **Don't use `itemId` for Language/Delete** — Use `LanguageName` query param. The delete endpoint uses the name, not the ID.

---

## Verification Checklist

After implementing client i18n setup, verify:

- [ ] **Environment variables** set correctly (`NEXT_PUBLIC_BLOCKS_API_URL` + `NEXT_PUBLIC_X_BLOCKS_KEY`)
- [ ] **Key names are semantic** — no `BTN_`, `FOOTER_`, `FEATURE_`, `DESC_1`, `HERO_` prefixes
- [ ] **Common module contains only shared text** — no route-specific content
- [ ] **Non-translatable content hardcoded** — brand names, copyright, and legal text are not translation keys
- [ ] **Auth header** uses `x-blocks-key: {projectKey}` — not `Authorization: ApiKey`
- [ ] **projectKey stored in localStorage** — `localStorage.setItem('projectKey', projectKey)` called on init for extension support
- [ ] **Default language loads automatically on first render** — `loadTranslations(defaultLanguage, "common")` called in `useEffect` on mount; no manual language selection required
- [ ] **LanguageSelector placed in Header** — visible and accessible from every route
- [ ] **Default language** loads from backend `isDefault` flag (not localStorage or cookie)
- [ ] **All translatable text** uses translation keys (no hardcoded strings)
- [ ] **Fallback behavior** — English text shows when API is unreachable
- [ ] **Dual-module loading** — Both "common" and route-specific modules are loaded
- [ ] **Module key merging** — No key collisions between common and route modules
- [ ] **Route-based module loading** — only needed modules fetched per page
- [ ] **Dynamic module discovery** — `availableModules` fetched from `GET /uilm/v1/Module/Gets`, not hardcoded
- [ ] **No default values in `t()`** — All `t()` calls use `t("KEY")` without a second argument
- [ ] **SPA navigation** — Modules reload correctly on client-side navigation (only if the app uses client-side routing)
- [ ] **Key-mode toggle** — UILM browser extension can toggle keys/values
- [ ] **RTL support** — `dir` attribute updates for RTL languages
- [ ] **No hydration mismatch** — Language selector shows placeholder until hydrated, then displays correct locale
- [ ] **Namespaces registered dynamically** — Each module's namespace is added via `i18n.addResourceBundle()` when fetched from the API
- [ ] **GetKeys uses `moduleIds[]`** — Filter by module uses array of `moduleId` values, not `moduleName`
- [ ] **Translate actions include `messageCoRelationId`** — UUID generated for each translate request

---

## Translation File Formats

**When to use which format:**
- **CSV** — bulk import/export, hand off to translators in a spreadsheet editor, large key sets
- **Flat JSON** — import into UILM via `import-uilm`, API-based workflows
- **Compiled JSON** — client-side i18n consumption, runtime loading

### CSV Format (for import/export)

When generating translation files, use the following CSV format with a **single file containing all modules**:

```
ItemId,ModuleId,Module,KeyName,en-US,de-DE,fr-FR,it-IT
,,common,NAV_FEATURES,"Features","Funktionen","Fonctionnalités","Funzionalità"
,,common,NAV_PRICING,"Pricing","Preise","Tarifs","Prezzi"
,,common,GET_STARTED,"Get Started","Loslegen","Commencer","Inizia"
,,home,HERO_TITLE,"Build faster with SELISE Blocks","Schneller entwickeln mit SELISE Blocks","Construisez plus vite avec SELISE Blocks","Costruisci più velocemente avec SELISE Blocks"
```

**Column layout — each data row maps directly to a header column:**

```
Col 1: ItemId    ← leave empty (UILM assigns on import)
Col 2: ModuleId  ← leave empty
Col 3: Module    ← populated: common, home, auth, dashboard, etc.
Col 4: KeyName   ← populated: NAV_HOME, HERO_TITLE, etc.
Col 5+: en-US    ← populated: translated value, double-quoted
         de-DE   ← populated or empty
         fr-FR   ← populated or empty
```

**One data row labeled column-by-column:**

```
,,common,NAV_HOME,"Home",""
↑  ↑   ↑      ↑       ↑     ↑
1  2   3      4       5     6
empty empty module  key  en-US de-DE (empty)
```

**Rules:**
- **Always 2 commas before the Module column** — not 0, 1, or 3. Two commas = skipping ItemId + ModuleId.
- **Always double-quote every string value** — key names and all translations. Quotes protect against commas, quotes, and newlines inside values.
- **Leave untranslated cells empty** — no placeholder like `-`, `""`, or `N/A`.
- **Module column is required** — every row must have `common`, `home`, `auth`, etc. in column 3.

> [!WARNING]
> Common mistakes:
> - **Wrong:** `,,,,NAV_HOME,"Home"` — 4 commas before key means the Module column is skipped entirely. The key lands in the wrong column.
> - **Right:** `,,common,NAV_HOME,"Home"` — 2 commas, then module, then key.
> - **Wrong:** `,,common,NAV_HOME,Home` — unquoted value breaks parsing when the value contains a comma.
> - **Right:** `,,common,NAV_HOME,"Home"` — all values quoted.

**Row template:** `,,{module},{key},"{en-US}","{de-DE}"`

### JSON Format (flat key-value)

For UILM import, use flat JSON objects:

```json
{
  "NAV_FEATURES": "Features",
  "NAV_PRICING": "Pricing",
  "GET_STARTED": "Get Started",
  "HERO_TITLE": "Build faster with SELISE Blocks"
}
```

**Key naming conventions:**
- Use `SCREAMING_SNAKE_CASE` for keys (e.g., `NAV_FEATURES`, `BTN_SUBMIT`)
- Prefix by type: `BTN_` (buttons), `LABEL_` (labels), `HINT_` (hints), `ERROR_` (errors), `SUCCESS_` (success messages), `NAV_` (navigation), `FOOTER_` (footer items)
- Group related keys with prefixes (e.g., `FOOTER_PRODUCT`, `FOOTER_FEATURES`)

### Compiled JSON (all modules combined)

Generate a single compiled JSON file per language containing all modules:

```json
{
  "common": {
    "NAV_FEATURES": "Features",
    "NAV_PRICING": "Pricing"
  },
  "home": {
    "HERO_TITLE": "Build faster with SELISE Blocks"
  }
}
```

---

## Troubleshooting

### HTTP Status Codes

| Status | Meaning | Common Triggers |
|--------|---------|----------------|
| **200** | Success | Normal response — no error |
| **400** | Bad request | Missing required fields, wrong field names, invalid UUID for `messageCoRelationId`, using raw file instead of `fileId` for import, module/language not found |
| **401** | Unauthorized | Missing or invalid `x-blocks-key` header. Fix: add `x-blocks-key: {projectKey}` to all requests |
| **403** | Forbidden | Valid key but insufficient permissions for this operation |
| **404** | Not found | Wrong endpoint path (`/api/v1/` instead of `/uilm/v1/`), wrong field name for module filter (`moduleName` instead of `moduleId`), or entity does not exist |
| **409** | Conflict | Duplicate key name already exists in this module |
| **429** | Rate limited | Too many requests. Retry after a delay |
| **500** | Server error | AI service error (TranslateAll/TranslateKey), or internal UILM service failure. Retry the request |
| **502/503/504** | Gateway error | UILM service unavailable. Check Blocks Portal status |

### Problem → Cause → Fix

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Keys showing instead of values | Namespace argument passed to `useTranslation()` | Remove the namespace argument — always use `useTranslation()` with no arguments |
| Keys showing instead of values | `window.__i18nKeyMode` is `true` | Run `window.__i18nKeyMode = false` in DevTools |
| Translations not loading at all | Wrong auth header | Use `x-blocks-key: {projectKey}` — `Authorization: ApiKey` is deprecated |
| Extension not working on localhost | `projectKey` not in localStorage | Ensure `localStorage.setItem('projectKey', projectKey)` is called on app init |
| App shows keys instead of text on first load | Default language not loaded on mount | Ensure `loadTranslations(defaultLanguage, "common")` is called in `useEffect` on mount |
| LanguageSelector not visible on all pages | Selector placed inside a page component | Move `LanguageSelector` into the `Header` component that wraps all pages |
| Translations not loading at all | Namespace not registered via `addResourceBundle` | Ensure `i18n.addResourceBundle()` is called for each module when its translations are fetched |
| Translations not updating on route change | `currentPathname` not updated in provider | Add `usePathname()` listener and reload modules on change |
| Hydration mismatch errors | Language initialized during SSR render | Move all i18n initialization into `useEffect` |
| 400 on import | Using raw file instead of `fileId` | `UilmImport` takes a `fileId` string, not multipart file upload |
| 400 on import | Module or language not found | Run `language-setup` flow first to create them |
| 400 on translate | Missing `messageCoRelationId` | Generate a UUID and include it as `messageCoRelationId` in the request |
| 400 on key save | Missing `moduleId` or `keyName` | Check request body fields — see `actions/save-key.md` |
| 404 on GetKeys | Wrong module filter field | Use `moduleIds[]` (array, plural) with `moduleId` values — not `moduleName` |
| 404 on any endpoint | Wrong path prefix | Use `/uilm/v1/` not `/api/v1/` |
| GetUilmFile returns undefined | Wrong response structure | `getUilmFile` returns flat `{KEY: value}` directly — NOT `data.translations` |
| GetKeys returns empty array | Wrong field name for module filter | Use `moduleIds[]` (array, plural) with `moduleId` values — not `moduleName` |
| Missing translation values | Wrong field names | For key operations use `moduleId`; for module operations use `moduleName`. Use `resources[]` not `translations[]`. See `contracts.md` |
| Keys look like `BTN_SIGN_IN` | Key names use UI-type prefixes | Rename keys to semantic names: `NAV_SIGN_IN`. See key naming conventions. |
| Key not found on route | Key placed in wrong module | Move route-specific keys to the correct module. Only `common` keys are available everywhere. |
| 401 on all requests | Missing `x-blocks-key` header | Add `x-blocks-key: {projectKey}` to all requests |
| 500 on translate | AI service error | Retry the request. If persistent, check Blocks Portal status |

---

## Reference Implementations

| Stack | Reference | Notes |
|-------|-----------|-------|
| React (Next.js / Vite) | `flows/client-i18n-setup.md` | Primary implementation guide |
| React Native | `references/react-native.md` | React Native patterns |
| Angular | `references/angular.md` | Angular HttpClient + UILM API |
| Flutter | `references/flutter.md` | Riverpod + UILM API |
| Blazor .NET | `references/blazor-dotnet.md` | Blazor patterns |
| Key-mode debugging | `references/key-mode-debugging.md` | Browser extension integration |
| Route-module map | `references/route-module-map.md` | Dual-module loading pattern |
| Bridge strategies | `references/bridge-strategies.md` | Migrating from legacy i18n |
| Sync protocol | `references/sync-protocol.md` | Push/pull sync patterns |
| API contracts | `contracts.md` | Field names and endpoints |

---

## Action Index

### Languages
| Action | File | Description |
|--------|------|-------------|
| save-language | actions/save-language.md | Create or update a language |
| get-languages | actions/get-languages.md | List all languages for a project |
| delete-language | actions/delete-language.md | Delete a language |
| set-default-language | actions/set-default-language.md | Set the default language for a project |

### Modules
| Action | File | Description |
|--------|------|-------------|
| save-module | actions/save-module.md | Create or update a translation module |
| get-modules | actions/get-modules.md | List all modules for a project |

### Keys
| Action | File | Description |
|--------|------|-------------|
| save-key | actions/save-key.md | Create or update a single translation key |
| save-keys | actions/save-keys.md | Batch create or update translation keys |
| get-keys | actions/get-keys.md | Get keys with filtering and pagination |
| get-keys-by-names | actions/get-keys-by-names.md | Get keys by key name array |
| get-key | actions/get-key.md | Get a single key by ID |
| delete-key | actions/delete-key.md | Delete a key |
| get-key-timeline | actions/get-key-timeline.md | Get edit history for a key |
| get-uilm-file | actions/get-uilm-file.md | Download compiled translation JSON for a language/module |
| generate-uilm-file | actions/generate-uilm-file.md | Regenerate compiled translation file |
| translate-all | actions/translate-all.md | AI-translate all untranslated keys |
| translate-key | actions/translate-key.md | AI-translate a specific key |
| import-uilm | actions/import-uilm.md | Import a JSON translation file (multipart) |
| export-uilm | actions/export-uilm.md | Export translation modules |
| get-exported-files | actions/get-exported-files.md | List previously exported files |
| get-generation-history | actions/get-generation-history.md | View file generation history |
| rollback-key | actions/rollback-key.md | Rollback a key to a previous version |

### Config
| Action | File | Description |
|--------|------|-------------|
| save-webhook | actions/save-webhook.md | Configure a webhook for localization events |
