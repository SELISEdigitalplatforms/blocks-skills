---
name: blocks-localization
description: Implement SELISE Blocks UILM (UI Language Module) localization in any web project — stack-agnostic with reference implementations for Vanilla HTML/JS, Vite+React, and Next.js.
---

# Blocks UILM Localization

This skill adds multi-language support to a web application using the **SELISE Blocks UILM API**. It is **stack-agnostic** — the underlying API and patterns work with any frontend framework. Three reference implementations are included as working examples:

| Reference Example | Translation Library | Rendering Strategy |
|---|---|---|
| **Vanilla HTML/JS** | None (DOM `data-i18n` attributes) | Direct DOM manipulation |
| **Vite + React** | `i18next` + `react-i18next` | React Context + dynamic loading |
| **Next.js (App Router)** | `i18next` + `react-i18next` | SSR prefetch + client hydration |

For **any other stack** (Angular, SvelteKit, Nuxt, Remix, Gatsby, SolidJS, etc.), use the API reference in §2 and adapt the closest reference example to the target framework's idioms (services, stores, composables, pipes, etc.).

---

## Execution Workflow

Follow these steps **in order** when applying this skill to a project. Do NOT skip ahead — each step depends on the previous one.

### Step 1: Detect the stack

Check if a `package.json` exists in the project root.

- **If `package.json` exists** → Read its dependencies and identify the framework using the detection tree in §1.
- **If no `package.json`** → This is a **Vanilla HTML/JS** project. Look for `index.html` at the root. Use the §4A implementation pattern.

Record the stack name — it determines which env prefix, file structure, and patterns to use throughout.

### Step 2: Discover environment variables

Search the project for existing Blocks configuration:

```bash
# Search for env files
find . -maxdepth 2 -name '.env*' -not -path '*/node_modules/*' -not -path '*/.git/*'

# Search for Blocks API URL in any config
grep -ri 'BLOCKS_API_URL\|X_BLOCKS_KEY\|blocksApiUrl\|blocksApiKey\|x-blocks-key' \
  --include='*.env*' --include='*.ts' --include='*.js' --include='*.json' \
  -l 2>/dev/null
```

Then follow this decision tree:

```
Found env values?
├── YES, in a single .env file
│   └── Read and use those values. Confirm with the user.
│
├── YES, in multiple .env files (.env, .env.local, .env.development, etc.)
│   └── ASK THE USER: "I found Blocks configuration in multiple env files:
│       [list files]. Which environment should I use for this setup?"
│
├── YES, but only the API URL (no project key), or vice versa
│   └── ASK THE USER for the missing value.
│
└── NO, not found anywhere
    └── ASK THE USER: "I couldn't find Blocks API credentials in this project.
        I need two values to set up localization:
        1. Blocks API Base URL (e.g. https://api.example.com)
        2. X-Blocks-Key (your project key)
        Where can I find these, or can you provide them?"
```

> [!CAUTION]
> **Do NOT proceed past this step without both values.** Every subsequent step depends on them.

Once you have both values, add them to the appropriate env file using the stack's convention (see §1 env table). If no env file exists, create one (`.env.local` for Next.js, `.env` for Vite, `env.template.js` for vanilla).

### Step 3: Check for existing i18n setup

Before creating new files, check if the project already has internationalization.

**For projects with `package.json`:**

```bash
# Check for existing i18n libraries
grep -E 'i18next|react-intl|ngx-translate|vue-i18n|svelte-i18n|@angular/localize' package.json

# Check for existing i18n directories or config
find . -type f \( -name '*i18n*' -o -name '*locale*' -o -name '*translation*' \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null
```

**For vanilla HTML/JS projects (no `package.json`):**

```bash
# Check for existing translation scripts or config
find . -maxdepth 2 -type f \( -name '*i18n*' -o -name '*locale*' -o -name '*translat*' \) 2>/dev/null
```

- **If i18next is already installed** → Integrate with the existing config. Don't re-initialize — add the Blocks UILM loading and key-mode toggle to the existing setup.
- **If a different i18n library is installed** (react-intl, ngx-translate, etc.) → ASK THE USER: "This project uses [library]. Should I replace it with the Blocks UILM pattern, or integrate alongside it?"
- **If no i18n exists** → Proceed with a fresh setup using the reference implementation for the detected stack.

### Step 4: Check for an existing HTTP client

**Skip this step for vanilla HTML/JS projects** — they use plain `fetch` directly.

For framework-based projects, check if a centralized HTTP client exists that auto-injects the `x-blocks-key` header:

```bash
# Look for HTTP client modules
find . -type f \( -name '*http*' -o -name '*client*' -o -name '*axios*' -o -name '*fetch*' \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  \( -name '*.ts' -o -name '*.js' \) 2>/dev/null

# Look for x-blocks-key header injection
grep -ri 'x-blocks-key' . --include='*.ts' --include='*.js' \
  -not -path '*/node_modules/*' -l 2>/dev/null
```

- **If found** → Use it in your translation service instead of plain `fetch`. This ensures consistent auth and base URL handling.
- **If not found** → Use plain `fetch` with manual header injection (as shown in the reference examples).

### Step 5: Scan for hardcoded strings and generate CSV

Follow §3 (Migrating Hardcoded Strings to Blocks CSV):

1. Scan all user-facing files for hardcoded text:
   ```bash
   # React/JSX — text between tags
   grep -rn '>[A-Z]' src/ --include='*.tsx' --include='*.jsx' | grep -v 'import\|export\|console\|//\|className\|style'

   # HTML — text content
   grep -rn '>[A-Z]' *.html | grep -v 'script\|style\|class=\|id=\|data-'

   # Angular templates
   grep -rn '>[A-Z]' src/ --include='*.html' --include='*.component.html' | grep -v 'class=\|style\|ngIf\|ngFor'

   # Vue/Svelte templates
   grep -rn '>[A-Z]' src/ --include='*.vue' --include='*.svelte' | grep -v 'script\|style\|class=\|v-if\|v-for'
   ```
2. Assign keys using the `{SECTION}_{ELEMENT}_{CONTEXT}` convention
3. Write the CSV file (`translations.csv`) **before** touching any source code
4. The CSV goes to the Blocks Portal for import

> [!IMPORTANT]
> The CSV must be written and saved BEFORE any code modifications. This is the safety net.

### Step 6: Install dependencies

Install the required i18n libraries based on the stack:

- **Vanilla HTML/JS** → No npm dependencies needed
- **React / Next.js** → `npm install i18next react-i18next`
- **React SPA with data fetching** → also add `@tanstack/react-query`
- **Angular** → No extra deps (uses `HttpClient` + custom service)
- **Vue / Nuxt** → `npm install vue-i18n`
- **Svelte / SvelteKit** → `npm install i18next` or use a Svelte store-based approach

### Step 7: Create the translation service

Create the API service layer that calls the Blocks UILM endpoints (§2). Use the project's existing HTTP client if found in Step 4, otherwise use plain `fetch`. See §4 for stack-specific reference implementations.

### Step 8: Create the language provider / context / store

Set up the state management layer for the active language:

- **React** → `LanguageContext` with `useContext` (see §4B.7)
- **Next.js** → `LanguageProvider` with SSR hydration (see §4C.7)
- **Angular** → `LanguageService` with signals
- **Vue / Nuxt** → Pinia store or composable
- **Svelte** → Writable store
- **Vanilla** → `Translator` class (see §4A)

### Step 9: Replace hardcoded strings with translation calls

**NOW** (and only now) replace the hardcoded strings with `t('KEY')` calls (or the stack's equivalent). Use the CSV from Step 5 as the reference for which key maps to which string.

| Stack | Replacement syntax |
|---|---|
| Vanilla HTML | `<h1 data-i18n="KEY">Original</h1>` |
| React / Next.js | `<h1>{t('KEY')}</h1>` |
| Angular | `<h1>{{ 'KEY' \| translate }}</h1>` |
| Vue / Nuxt | `<h1>{{ $t('KEY') }}</h1>` |
| Svelte | `<h1>{$t('KEY')}</h1>` |

### Step 10: Add key-mode toggle

Add the UILM browser extension support following §5. This is required for all stacks.

### Step 11: Add the language switcher UI

Add a language selector component so users can change languages at runtime. See the reference implementations:
- Vite+React: `examples/vite-react/language-selector.tsx`
- Vanilla: `<div id="lang-switcher">` pattern in §4A.4
- Other stacks: create a dropdown that calls `setLanguage()` from your language provider

### Step 12: Verify

Run through the verification checklist in §8:
- [ ] Env vars set correctly
- [ ] Default language loads
- [ ] Language switching persists
- [ ] All text uses translation keys
- [ ] Fallback works when API is down
- [ ] Key-mode toggle works from DevTools console

---

## 1 — Prerequisites & Environment Variables

Every Blocks project needs two environment variables. The variable name prefix depends on the stack's conventions:

| Stack Convention | API Base URL | Project Key |
|---|---|---|
| Vanilla JS (runtime) | `VITE_BLOCKS_API_URL` (via `window.__APP_ENV__`) | `VITE_X_BLOCKS_KEY` |
| Vite / SvelteKit / Nuxt | `VITE_BLOCKS_API_URL` or `VITE_API_BASE_URL` | `VITE_X_BLOCKS_KEY` |
| Next.js / Remix / Gatsby | `NEXT_PUBLIC_BLOCKS_API_URL` | `NEXT_PUBLIC_X_BLOCKS_KEY` |
| Angular | `environment.blocksApiUrl` | `environment.blocksApiKey` |
| Any other | Use your framework's env convention | Same key, different prefix |

> [!IMPORTANT]
> Ask the user for their **Blocks API Base URL** and **Project Key** before starting.
> If they already have a `.env` file with these values, read it to discover them.

### Detecting the stack

Check `package.json` dependencies and project files to identify the framework:

```
1. No package.json       → Vanilla HTML/JS
2. "next" in deps        → Next.js (App Router)
3. "@sveltejs/kit"       → SvelteKit
4. "nuxt" or "@nuxt"     → Nuxt 3
5. "@remix-run/react"    → Remix
6. "gatsby"              → Gatsby
7. "@angular/core"       → Angular
8. "solid-js"            → SolidJS
9. "vite" + "react"      → Vite + React SPA
10. Otherwise             → Generic JS — use the Vanilla or Vite pattern
```

The three reference implementations (§4A–4C) have full working code in the `examples/` directory. For other stacks, map the core concepts (translation service, language context/store, key-mode toggle) to the framework's equivalent patterns.

---

## 2 — Blocks UILM API Reference

The UILM API exposes three endpoints. All require the `x-blocks-key` header and a `ProjectKey` query parameter.

### 2.1 — Get Translations

```
GET {baseUrl}/uilm/v1/Key/GetUilmFile
    ?ProjectKey={projectKey}
    &Language={languageCode}      // e.g. "en-US", "bn-BD", "de-DE"
    &ModuleName={moduleName}      // e.g. "common", "homepage", "dashboard"
```

**Headers:**
```
x-blocks-key: {projectKey}
Content-Type: application/json    // (for React/Next.js stacks)
```

**Response:** A flat JSON object of `{ "KEY": "translated value" }` pairs.

### 2.2 — Get Available Languages

```
GET {baseUrl}/uilm/v1/Language/Gets
    ?ProjectKey={projectKey}
```

**Response:** An array of language objects:
```json
[
  {
    "itemId": "...",
    "languageName": "English",
    "languageCode": "en-US",
    "isDefault": true,
    "projectKey": "..."
  }
]
```

### 2.3 — Get Available Modules

```
GET {baseUrl}/uilm/v1/Module/Gets
    ?ProjectKey={projectKey}
```

**Response:** An array of module objects:
```json
[
  {
    "itemId": "...",
    "moduleName": "common",
    "createDate": "...",
    "lastUpdateDate": "...",
    "tenantId": "..."
  }
]
```

---

## 3 — Migrating Hardcoded Strings to Blocks CSV

Before implementing the UILM runtime, you need translation keys and values in Blocks Cloud. This section covers migrating an existing project from hardcoded strings to a CSV that can be uploaded to the Blocks Portal.

> [!CAUTION]
> **ALWAYS write the CSV file BEFORE replacing any hardcoded strings in code.** This prevents text loss if the process is interrupted.

### 3.1 — CSV Format

Blocks Cloud accepts CSV files with this structure:

```csv
ItemId,ModuleId,Module,KeyName,en-US
,,common,NAV_HOME,Home
,,common,NAV_PRICING,Pricing
,,common,NAV_FAQ,FAQ
,,homepage,HERO_TITLE,Stop wiring. Start building.
,,homepage,HERO_SUBTITLE,"Deploy secure, scalable enterprise applications"
```

| Column | Description | Notes |
|---|---|---|
| `ItemId` | Leave blank | Populated by Blocks after import |
| `ModuleId` | Leave blank | Populated by Blocks after import |
| `Module` | Translation module name | `common`, `homepage`, `dashboard`, etc. |
| `KeyName` | Unique translation key | `{SECTION}_{ELEMENT}_{CONTEXT}` format |
| `en-US` | Default language value | The original hardcoded English text |

You can add extra language columns (`de-DE`, `fr-FR`, `bn-BD`, etc.) but they can be left blank — translations are typically added later in the Blocks Portal.

### 3.2 — Key Naming Convention

Keys should be **UPPERCASE**, **underscore-separated**, and **self-documenting**:

```
{SECTION}_{ELEMENT}_{CONTEXT}
```

**Examples:**

| Key | Meaning |
|---|---|
| `NAV_HOME` | Navigation → Home link |
| `NAV_PRICING` | Navigation → Pricing link |
| `HERO_TITLE` | Hero section → main title |
| `HERO_CTA_BTN` | Hero section → call-to-action button |
| `FOOTER_COPYRIGHT` | Footer → copyright text |
| `FAQ_Q1` | FAQ section → question 1 |
| `FAQ_A1` | FAQ section → answer 1 |
| `PRICING_FREE_TITLE` | Pricing → free tier title |
| `ERR_NOT_FOUND` | Error → 404 message |
| `LOADING_TEXT` | Global → loading spinner text |

**Rules:**

| Rule | Example |
|---|---|
| UPPERCASE with underscores | `HERO_TITLE` not `heroTitle` |
| Include section prefix | `NAV_`, `HERO_`, `FOOTER_`, `FAQ_` |
| Be specific, not generic | `FAQ_Q1` not `QUESTION` |
| Separate keys for reused text in different contexts | `HERO_BTN_LEARN_MORE` and `FOOTER_BTN_LEARN_MORE` even if both say "Learn More" — they may diverge in translation |

### 3.3 — Module Organization

**Put shared UI in `common`:**
- Navigation items (Home, Pricing, FAQ, etc.)
- Footer content
- Shared buttons (Submit, Cancel, Learn More, etc.)
- Error messages, loading states

**Put page-specific content in its own module:**
- Hero section → `homepage`
- Dashboard widgets → `dashboard`
- Profile form labels → `profile`
- Auth screens → `auth`

### 3.4 — Migration Workflow

Follow these steps **per page/component**:

#### Step 1: Scan for hardcoded strings

Search the codebase for all visible, user-facing text. This includes:
- HTML text content and attributes (`title`, `alt`, `placeholder`, `aria-label`)
- JSX/TSX string literals inside components
- Template literals in Angular/Svelte/Vue templates
- `textContent` and `innerHTML` assignments in vanilla JS

Ignore:
- Code comments
- Log messages (`console.log`, `console.error`)
- CSS class names and IDs
- URLs and file paths
- Technical identifiers (API keys, route paths)

#### Step 2: Assign keys and modules

For each string, determine:
1. **Which module** it belongs to (`common` or a page-specific module)
2. **A descriptive key** following the naming convention

#### Step 3: Write the CSV

Create a CSV file (e.g. `translations.csv`) with all the keys:

```csv
ItemId,ModuleId,Module,KeyName,en-US
,,common,NAV_HOME,Home
,,common,NAV_PRICING,Pricing
,,common,NAV_FAQ,FAQ
,,common,FOOTER_COPYRIGHT,© 2026 My Company
,,common,BTN_LEARN_MORE,Learn More
,,common,BTN_GET_STARTED,Get Started
,,homepage,HERO_TITLE,Build Something Amazing
,,homepage,HERO_SUBTITLE,"The fastest way to ship enterprise applications."
,,homepage,HERO_CTA_BTN,Start Free
,,homepage,FEATURES_TITLE,Why Choose Us
,,homepage,FAQ_Q1,How does pricing work?
,,homepage,FAQ_A1,"We offer a free tier with generous limits, and an enterprise tier for larger teams."
```

> [!IMPORTANT]
> - **The original text IS the `en-US` value.** Never paraphrase or fabricate text — copy it exactly.
> - **Wrap values containing commas in double quotes** (standard CSV escaping).
> - **One key per row.** Don't combine multiple strings.

#### Step 4: Upload to Blocks Cloud

1. Go to the **Blocks Portal** → **UILM** → **Import**
2. Upload the CSV file
3. Blocks will create the modules, keys, and `en-US` values
4. Translators can then add values for other languages (`de-DE`, `fr-FR`, etc.) in the portal

#### Step 5: Replace hardcoded strings in code

**ONLY after the CSV is saved**, replace the original strings with translation function calls. The syntax depends on the stack:

| Stack | Before | After |
|---|---|---|
| Vanilla HTML | `<h1>Build Something Amazing</h1>` | `<h1 data-i18n="HERO_TITLE">Build Something Amazing</h1>` |
| React (i18next) | `<h1>Build Something Amazing</h1>` | `<h1>{t('HERO_TITLE')}</h1>` |
| Angular (pipe) | `<h1>Build Something Amazing</h1>` | `<h1>{{ 'HERO_TITLE' \| translate }}</h1>` |
| Svelte (store) | `<h1>Build Something Amazing</h1>` | `<h1>{$t('HERO_TITLE')}</h1>` |
| Vue/Nuxt | `<h1>Build Something Amazing</h1>` | `<h1>{{ $t('HERO_TITLE') }}</h1>` |

### 3.5 — CSV Output Location

Save the CSV at the project root:

```
project/
├── translations.csv          # For upload to Blocks Portal
├── src/
│   └── ...
└── ...
```

For large projects with many pages, you may use multiple CSVs:

```
translations/
├── common.csv
├── homepage.csv
├── dashboard.csv
└── auth.csv
```

### 3.6 — Verifying Migration Completeness

After replacing all strings, search the codebase for remaining hardcoded text:

```bash
# For React/JSX — look for raw text between JSX tags
grep -rn '>[A-Z][a-z]' src/ --include='*.tsx' --include='*.jsx' | grep -v 'import\|export\|console\|//\|className'

# For HTML — look for text content not wrapped in data-i18n
grep -rn '>[A-Z][a-z]' *.html | grep -v 'data-i18n\|script\|style\|class=\|id='
```

These are heuristic searches — review the results manually and address any remaining hardcoded strings.

---

## 4 — Implementation by Stack

Follow the section that matches the detected stack. For stacks not listed here, use the API reference (§2) and adapt the closest example.

---

### 4A — Vanilla HTML/JS

Use this approach for static sites or single-page apps without a framework (plain HTML files served by a static server or CDN).

#### 4A.1 — Runtime Environment

Create `env.template.js` at the project root:

```js
window.__APP_ENV__ = {
  VITE_BLOCKS_API_URL: "__VITE_BLOCKS_API_URL__",
  VITE_API_BASE_URL: "__VITE_API_BASE_URL__",
  VITE_X_BLOCKS_KEY: "__VITE_X_BLOCKS_KEY__"
};
```

Include it in `index.html` **before** `i18n.js`:

```html
<script src="env.template.js"></script>
<script src="i18n.js"></script>
```

#### 4A.2 — i18n.js

Create `i18n.js` at the project root. This file:
- Reads runtime env from `window.__APP_ENV__`
- Resolves the UILM base URL (auto-appends `/uilm/v1` if missing)
- Defines supported cultures and module names
- Implements a `Translator` class that:
  - Snapshots original English innerHTML of all `[data-i18n]` elements
  - Fetches translations from the API per module
  - Replaces element content with translated text
  - Falls back to original content when a key is missing
  - Provides a language switcher UI (optional)
  - Persists language choice in `localStorage`
  - Auto-detects browser language on first visit

Reference implementation: see `examples/vanilla/i18n.js` in this skill folder.

#### 4A.3 — HTML Markup

Mark every translatable element with a `data-i18n` attribute whose value is the **translation key**:

```html
<h1 data-i18n="HERO_TITLE">Welcome to Our Site</h1>
<p data-i18n="HERO_SUBTITLE">Build something amazing.</p>
<a href="#" data-i18n="BTN_GET_STARTED">Get Started</a>
```

The English text inside the tags acts as the fallback when the API is unreachable.

#### 4A.4 — Language Switcher (Optional)

Add a switcher element in your HTML. The `Translator` class attaches click handlers automatically:

```html
<div id="lang-switcher" role="radiogroup" aria-label="Language">
  <button class="lang-btn active" data-lang="en-US" aria-checked="true">EN</button>
  <button class="lang-btn" data-lang="bn-BD" aria-checked="false">বাং</button>
</div>
```

#### 4A.5 — Configuration

Edit the `UILM_CONFIG` object in `i18n.js` to match the project:

```js
const UILM_CONFIG = {
  projectKey: resolvedConfig.projectKey,
  baseUrl: resolvedConfig.baseUrl,
  defaultCulture: 'en-US',                       // Fallback language
  modules: ['common', 'my-module'],               // Modules to fetch
  supportedCultures: {
    'en-US': { label: 'EN', name: 'English' },
    'bn-BD': { label: 'বাং', name: 'বাংলা' }      // Add more as needed
  }
};
```

---

### 4B — Vite + React (with i18next)

This approach uses `i18next`, `react-i18next`, and `@tanstack/react-query`.

#### 4B.1 — Install Dependencies

```bash
npm install i18next react-i18next @tanstack/react-query
```

#### 4B.2 — File Structure

Create the following files under `src/`:

```
src/
├── i18n/
│   ├── i18n.ts                    # i18next initialization + key-mode toggle
│   ├── language-context.tsx       # React context provider for language state
│   ├── route-module-map.ts        # Maps routes → translation modules
│   └── use-translation-loader.ts  # Hook to load translations per module
└── components/core/language-selector/
    ├── services/
    │   └── language.service.ts    # API calls (getUilmFile, getLanguage, getModule)
    ├── hooks/
    │   └── use-language.ts        # React Query hooks wrapping the service
    ├── types/
    │   └── language.types.ts      # TypeScript interfaces
    └── language-selector.tsx      # Dropdown UI component
```

#### 4B.3 — Types (`language.types.ts`)

```ts
export interface Language {
  itemId: string;
  languageName: string;
  languageCode: string;
  isDefault: boolean;
  projectKey: string;
}

export type LanguageResponse = Language[];

export interface UilmFileParams {
  language: string;
  moduleName: string;
}

export interface Module {
  itemId: string;
  createDate: string;
  lastUpdateDate: string;
  createdBy: string;
  lastUpdatedBy: string;
  tenantId: string;
  moduleName: string;
}

export type ModuleResponse = Module[];
```

#### 4B.4 — API Service (`language.service.ts`)

The service makes GET requests to the three UILM endpoints. It uses the project's HTTP client (or plain `fetch` if none exists). The `x-blocks-key` header is set automatically by the HTTP client or must be included manually.

Key functions:
- `getUilmFile({ language, moduleName })` → fetches translation key-value pairs
- `getLanguage()` → fetches available languages
- `getModule()` → fetches available modules

Each constructs a URL like `/uilm/v1/Key/GetUilmFile?Language=en-US&ModuleName=common&ProjectKey=XXX`.

> [!TIP]
> If the project already has an HTTP client (e.g. an `https.ts` module that auto-injects the `x-blocks-key`), use it. Otherwise, use plain `fetch` and set the header manually.

#### 4B.5 — i18next Initialization (`i18n.ts`)

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  returnNull: false,
  resources: {},    // Empty — loaded dynamically from the API
});

// --- loadTranslations helper ---
export const loadTranslations = async (language: string, moduleName: string): Promise<void> => {
  try {
    const translations = await getUilmFile({ language, moduleName });
    if (!translations) return;

    // Default namespace — direct access via t('KEY')
    i18n.addResourceBundle(language, 'translation', translations, true, true);
    // Module namespace — access via t('module:KEY')
    i18n.addResourceBundle(language, moduleName, translations, true, true);
  } catch (error) {
    console.error(`Failed to load translations for module ${moduleName}:`, error);
  }
};

export default i18n;
```

#### 4B.6 — Key-Mode Toggle

Add the key-mode toggle **after** i18n initialization. See **§5 — Key-Mode Debugging** for the full stack-agnostic implementation pattern and code. The Vite+React reference implementation is in `examples/vite-react/i18n.ts`.

#### 4B.7 — Language Context Provider (`language-context.tsx`)

This React context provider:
- Wraps the app at the top level
- Fetches available languages and modules via React Query hooks
- Determines the initial language from `localStorage` or the API default
- Loads translation modules based on the current route (using `route-module-map.ts`)
- Caches loaded modules to avoid redundant API calls
- Exposes `{ currentLanguage, setLanguage, isLoading, availableLanguages, availableModules }`
- Re-loads translations on route change

See `examples/vite-react/language-context.tsx` for the full reference implementation.

#### 4B.8 — Route Module Map (`route-module-map.ts`)

Maps each route to the translation modules it needs:

```ts
export const routeModuleMap: Record<string, string[]> = {
  '/dashboard': ['common', 'dashboard'],
  '/profile':   ['common', 'profile'],
  '/settings':  ['common', 'settings'],
  // Add more routes as needed
};
```

The `LanguageProvider` falls back to `defaultModules` (e.g. `['common', 'auth']`) for unmatched routes.

#### 4B.9 — Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('HERO_TITLE')}</h1>;
}
```

#### 4B.10 — Wiring It Up

In `App.tsx` (or your root component), wrap everything in the providers:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '@/i18n/language-context';
import '@/i18n/i18n'; // Side-effect: initializes i18next

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider defaultLanguage="en-US" defaultModules={['common']}>
          {/* Your routes and components */}
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

### 4C — Next.js (App Router with SSR)

This approach adds SSR-compatible translations with client-side language switching.

#### 4C.1 — Install Dependencies

```bash
npm install i18next react-i18next
```

#### 4C.2 — File Structure

```
src/
├── i18n/
│   ├── i18n.ts                  # Client-side i18next init + key-mode toggle
│   ├── language-config.ts       # Static locale config & defaults
│   ├── language-provider.tsx    # Client-side context provider
│   ├── server-translations.ts   # Server-side translation fetching
│   └── translation-keys.ts     # (Optional) typed key constants
├── hooks/
│   └── use-translation.ts      # Convenience wrapper around useTranslation
└── lib/api/services/
    └── translation.service.ts   # Server & client translation API calls
```

#### 4C.3 — Language Config (`language-config.ts`)

```ts
export const STATIC_FALLBACK_LOCALES = ["en-US", "de-DE", "fr-FR"] as const;
export type Locale = (typeof STATIC_FALLBACK_LOCALES)[number] | string;
export const DEFAULT_LOCALE = "en-US";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const LOCALE_NAMES: Record<string, string> = {
  "en-US": "English",
  "de-DE": "Deutsch",
};
```

#### 4C.4 — Translation Service (`translation.service.ts`)

Two server-safe functions (no `window`, no `localStorage`):

- `fetchTranslations(locale, module)` — calls `GetUilmFile`, uses `next: { revalidate: 0 }` for fresh data
- `fetchAvailableLanguages()` — calls `Language/Gets`

Both use `process.env.NEXT_PUBLIC_BLOCKS_API_URL` and `process.env.NEXT_PUBLIC_X_BLOCKS_KEY`.

#### 4C.5 — Server Translations (`server-translations.ts`)

Called from `layout.tsx` (server component) to prefetch translations:

```ts
export async function getServerTranslations(locale: Locale = DEFAULT_LOCALE) {
  const [homepage, common] = await Promise.all([
    fetchTranslations(locale, "homepage"),
    fetchTranslations(locale, "common"),
  ]);
  return { homepage, common };
}
```

#### 4C.6 — Client i18n Init (`i18n.ts`)

Same pattern as Vite+React (section 4B.5 + 4B.6), but with:
- `useSuspense: true` in the React config
- `initAsync: false` for SSR compatibility
- Namespaces matching the modules: `ns: ["homepage", "common"]`

#### 4C.7 — Language Provider (`language-provider.tsx`)

A `"use client"` component that:
- Receives SSR translations via props from `layout.tsx`
- Hydrates i18n synchronously during the first render (no flash)
- Provides `setLocale()` for client-side language switching
- Persists the locale in a cookie (`blocks-website-locale`) for SSR reads
- Polls `fetchAvailableLanguages()` every 30s to detect new languages added from the Blocks Portal

#### 4C.8 — Root Layout (`layout.tsx`)

```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const availableLanguages = await fetchAvailableLanguages();

  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("blocks-website-locale")?.value;
  const initialLocale = savedLocale && availableLanguages.some(l => l.languageCode === savedLocale)
    ? savedLocale
    : DEFAULT_LOCALE;

  const initialTranslations = await getServerTranslations(initialLocale);

  return (
    <html lang={initialLocale}>
      <body>
        <LanguageProvider
          initialLocale={initialLocale}
          initialTranslations={initialTranslations}
          availableLanguages={availableLanguages}
        >
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

#### 4C.9 — Using Translations in Components

```tsx
"use client";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

export function useTranslation() {
  const { t } = useI18Translation(["homepage", "common"], { i18n });
  return { t, i18n, isRTL: i18n.language === "ar" || i18n.language === "he" };
}
```

---

## 5 — Key-Mode Debugging (UILM Browser Extension)

Key mode is a debugging feature that shows **translation keys** instead of translated values in the UI. It is toggled by the SELISE UILM browser extension via `window.postMessage`. This section explains the pattern for **any stack**.

### 5.1 — How It Works

```
Normal mode:   t('HERO_TITLE')  →  "Stop wiring. Start building."
Key mode ON:   t('HERO_TITLE')  →  "HERO_TITLE"
```

This lets developers and translators see exactly which key maps to which UI element without reading source code.

### 5.2 — The Protocol

The browser extension sends messages via `window.postMessage`:

```js
// Toggle key mode ON
window.postMessage({ action: 'keymode', keymode: true }, window.location.origin);

// Toggle key mode OFF
window.postMessage({ action: 'keymode', keymode: false }, window.location.origin);
```

Your application listens for these messages and toggles the behavior of the translation function.

### 5.3 — Universal Implementation Pattern

Regardless of stack, key mode requires three things:

1. **A global flag** — `window.__i18nKeyMode` (boolean)
2. **A wrapped translation function** — intercepts calls; returns the raw key when flag is `true`
3. **A message listener** — listens for `postMessage` from the browser extension and flips the flag

### 5.4 — Implementation by Stack

#### For i18next-based stacks (React, Next.js, SvelteKit + i18next)

Add this **after** `i18n.init()`:

```ts
// 1. Global flag
declare global {
  interface Window { __i18nKeyMode?: boolean; }
}
if (typeof window !== 'undefined') {
  window.__i18nKeyMode = false;
}

// 2. Wrap the translation function
const originalT = i18n.t.bind(i18n);
(i18n as any).t = (key: string | string[], options?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.__i18nKeyMode) {
    return Array.isArray(key) ? key[0] : key;
  }
  return (originalT as any)(key, options);
};

// 3. Message listener
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
        // Force re-render by emitting a language change event
        (i18n as any).emit('languageChanged', i18n.language);
      }
    }
  });
}
```

#### For Angular (service-based)

In your `TranslationService`:

```ts
t(key: string): string {
  if (typeof window !== 'undefined' && (window as any).__i18nKeyMode) {
    return key;
  }
  return this.translations()[key] || key;
}
```

Add the message listener in the constructor or `ngOnInit` of your root component.

#### For Vue / Nuxt (composable-based)

Wrap `$t` in a composable:

```ts
export function useTranslation() {
  const { t: originalT } = useI18n();
  const t = (key: string) => {
    if (typeof window !== 'undefined' && window.__i18nKeyMode) return key;
    return originalT(key);
  };
  return { t };
}
```

#### For Svelte (store-based, without i18next)

Wrap the derived store:

```ts
export const t = derived(translations, ($translations) => {
  return (key: string): string => {
    if (typeof window !== 'undefined' && window.__i18nKeyMode) return key;
    return $translations[key] || key;
  };
});
```

#### For Vanilla HTML/JS

The `Translator.t()` method checks the flag directly:

```js
t(key) {
  if (window.__i18nKeyMode) return key;
  return this.translations[key] || this.originals[key] || key;
}
```

And `applyTranslations()` also checks before writing to the DOM:

```js
applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (window.__i18nKeyMode) {
      el.textContent = key;
      return;
    }
    el.textContent = this.translations[key] || this.originals[key];
  });
}
```

### 5.5 — Re-render Trigger

When the flag changes, the UI must re-render. The mechanism depends on the stack:

| Stack | Trigger |
|---|---|
| i18next (React/Next.js) | `i18n.emit('languageChanged', i18n.language)` — forces `useTranslation` to re-render |
| Angular | Call `ChangeDetectorRef.markForCheck()` or use signals |
| Vue / Nuxt | Set a reactive ref that `$t` depends on |
| Svelte | Update the writable store that `t` derives from |
| Vanilla JS | Call `translator.applyTranslations()` directly |

### 5.6 — Security

Always validate incoming messages:

| Check | Purpose |
|---|---|
| `event.source !== window` | Reject messages from iframes |
| `event.origin !== window.location.origin` | Prevent cross-origin attacks |
| `typeof data !== 'object'` | Validate message structure |
| `typeof keymode === 'boolean'` | Validate keymode value type |

### 5.7 — Manual Testing

Open browser DevTools console and run:

```js
// Toggle ON — all translated text should show keys
window.postMessage({ action: 'keymode', keymode: true }, window.location.origin);

// Toggle OFF — translated text should return
window.postMessage({ action: 'keymode', keymode: false }, window.location.origin);
```

---

## 6 — Translation Key Constants (Optional, Recommended)

For type safety and autocomplete, define translation key constants:

```ts
export const COMMON_KEYS = {
  NAV_HOME: "NAV_HOME",
  NAV_PRICING: "NAV_PRICING",
  FOOTER_COPYRIGHT: "FOOTER_COPYRIGHT",
  CTA_SPEAK_CONSULTANT: "CTA_SPEAK_CONSULTANT",
} as const;

export const HOME_KEYS = {
  HERO_TITLE: "HERO_TITLE",
  HERO_SUBTITLE: "HERO_SUBTITLE",
  FEATURES_TITLE: "FEATURES_TITLE",
} as const;
```

Usage: `t(HOME_KEYS.HERO_TITLE)` instead of `t("HERO_TITLE")`.

---

## 7 — Language Persistence Strategy

| Stack | Storage | Details |
|---|---|---|
| Vanilla JS | `localStorage('selectedLanguage')` | Read on page load, set on language change |
| Vite + React | `localStorage('language')` + `localStorage('language_user_selected')` | Distinguishes explicit user choice from API default |
| Next.js | `cookie('blocks-website-locale')` | SSR reads cookie for correct initial render; no localStorage |

---

## 8 — Verification Checklist

After implementation, verify the following:

- [ ] **Environment variables** are set correctly (API URL + Project Key)
- [ ] **Default language loads** on first visit (from API's `isDefault` or config fallback)
- [ ] **Language switching** works and persists across page reloads
- [ ] **All translatable text** uses translation keys (no hardcoded strings)
- [ ] **Fallback behavior** — English text shows when API is unreachable
- [ ] **Route-based module loading** (React/Next.js) — only needed modules are fetched
- [ ] **Key-mode toggle** — UILM browser extension can toggle between keys and values
- [ ] **RTL support** — `dir` attribute updates for RTL languages (if applicable)
- [ ] **SSR hydration** (Next.js only) — no flash of untranslated content

---

## 9 — Common Pitfalls

> [!WARNING]
> - **Don't hardcode the `/uilm/v1` path** — some API base URLs already include it. Always normalize.
> - **Don't use `localStorage` in Next.js SSR** — it's not available on the server. Use cookies instead.
> - **Don't forget the `x-blocks-key` header** — the API will return 401 without it.
> - **Don't fetch all modules at once** — use route-based loading to minimize API calls.
> - **Don't skip the key-mode toggle** — the UILM browser extension relies on it for translation management.
