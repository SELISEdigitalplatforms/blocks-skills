# blocks-uilm

Languages, translation keys, AI-powered auto-translation, and UILM file import/export for SELISE Blocks — via the UILM v1 API.

---

## What this skill does

This skill handles every localization operation in SELISE Blocks:

| Category | Coverage |
|----------|---------|
| **Languages** | Add, list, set default, delete |
| **Modules** | Create, list (route-based loading: `common` + route-specific) |
| **Translation keys** | Create, update, delete, batch create, search with filters |
| **Translations** | Add per-language values, AI-auto-translate all missing values |
| **File management** | Import JSON, export compiled JSON, regenerate, rollback |
| **Webhooks** | Configure localization change notifications |
| **Client-side i18n** | React i18next + React Query with runtime API calls to Blocks |

---

## Quick Start

```
claude
```

Then try:

```
Set up English and German as project languages
```

```
Set up i18n in the Next.js app
```

```
Add translation keys for the login page
```

```
Auto-translate all missing German translations using AI
```

---

## Skill Structure

```
skills/blocks-uilm/
├── SKILL.md                      ← Intent map, naming conventions, verification checklist
├── contracts.md                  ← All TypeScript types, request/response schemas
├── flows/                        ← Multi-step workflows
│   ├── client-i18n-setup.md     ← React + i18next + React Query scaffold
│   ├── language-setup.md         ← Add languages, set default, create modules
│   ├── key-management.md         ← Create keys, add translations, AI-translate
│   ├── import-export.md         ← Import JSON files, export/download compiled files
│   └── scan-and-generate.md     ← Scan source code, extract keys, generate CSV
└── actions/                      ← 23 single-API operations
    ├── save-language.md
    ├── get-languages.md
    ├── save-key.md
    ├── translate-all.md
    ├── get-uilm-file.md
    └── ... (18 more)
```

---

## How It Works

### 1. Set up languages first

Languages and modules must exist in UILM before keys can be created. Run `language-setup.md` once per project.

### 2. Set up client-side i18n

`client-i18n-setup.md` creates the full React scaffold — i18next config, LanguageProvider, route-module mapping, and key-mode debugging. This runs once per project.

### 3. Manage keys and translations

`key-management.md` covers creating keys with semantic names, adding translations per language, and AI-translating missing values.

### 4. Import/export

`import-export.md` handles bulk import from JSON files and export/download of compiled translation files.

---

## Translation Key Naming

Keys must use **semantic names** that describe meaning, not UI structure.

| Bad | Good | Why |
|-----|------|-----|
| `FOOTER_PRODUCT` | `PRODUCT` | Footer is a layout concern |
| `HERO_WELCOME_CLIENTS` | `WELCOME_CLIENTS` | Hero is a UI pattern |
| `FEATURES_ENTERPRISE_SECURITY_DESC_1` | `ENTERPRISE_SECURITY_DESC` | Count-based segments are fragile |
| `HOME_TESTIMONIALS_BADGE` | `TESTIMONIALS_BADGE` | Badge is a component |

**Rules:**
- No UI-type prefixes: `BTN_`, `CTA_`, `BADGE_`, `SECTION_`
- No layout names: `HEADER_`, `FOOTER_`, `SIDEBAR_`
- No component names: `CARD_`, `TABLE_`, `FORM_`
- No count segments: `DESC_1`, `OPTION_3`
- Use `SCREAMING_SNAKE_CASE`

See `SKILL.md` → Translation Key Naming Conventions for the full rules.

---

## Dual-Module Loading

Every route loads two modules simultaneously:

```
Route          → Modules Loaded
/              → ["common", "home"]
/about         → ["common", "about"]
/auth/login    → ["common", "auth"]
/dashboard     → ["common", "dashboard"]
```

- **`common`** — Shared keys (navigation, footer, shared UI) — always loaded
- **Route-specific** — Page content — only loaded when needed

`availableModules` is fetched dynamically from `GET /uilm/v1/Module/Gets` — never hardcoded.

---

## Common vs Route Modules

| Module | What goes in it |
|--------|----------------|
| `common` | `NAV_HOME`, `NAV_SIGN_IN`, `ERROR_REQUIRED`, `CONFIRM_DIALOG_TITLE` |
| `home` | `HOME_HERO_TITLE`, `HOME_SHIP_HOURS_DESC` |
| `auth` | `AUTH_LOGIN_SUBMIT`, `AUTH_FORGOT_PASSWORD` |
| `dashboard` | `DASHBOARD_STATS_HEADING`, `DASHBOARD_WELCOME` |

**Never put in `common`:**
- Hero text, feature descriptions, testimonials
- Route-specific CTAs
- Brand/legal text (hardcode these — they are not translatable)

---

## Key Conventions

The UILM API uses different field names for modules vs keys:

| Operation | Use this field |
|-----------|---------------|
| Key operations (Save, Gets, Translate) | `moduleId` |
| Module operations (Module/Save, Module/Gets) | `moduleName` |
| Translation values | `resources[]` with `{value, culture, characterLength}` |
| Key list response | `keys[]` (not `data[]`) |
| Auth header | `x-blocks-key: {projectKey}` (not `Authorization: ApiKey`) |

See `SKILL.md` → Field Names for the full reference table.

---

## API Base Path

All endpoints: `{apiUrl}/uilm/v1`

> **NOT** `/api/v1` — the localization API uses `/uilm/v1` as its prefix.

**API responses are NOT wrapped in `data`.** Responses are returned directly:
- `getLanguages()` → `Language[]` directly
- `getModules()` → `Module[]` directly
- `getUilmFile()` → `Record<string, string>` directly

---

## Environment Variables

```bash
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key

# For Vite + React
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=your-project-key
```

> The `projectKey` must also be stored in `localStorage` under the key `projectKey` on app init. This enables the UILM browser extension on `localhost`.

---

## Translation File Formats

### CSV (for bulk import/export)

```
ItemId,ModuleId,Module,KeyName,en-US,de-DE
,,common,NAV_FEATURES,"Features","Funktionen"
,,common,NAV_PRICING,"Pricing","Preise"
,,home,HERO_TITLE,"Build faster","Schneller entwickeln"
```

- Always double-quote all values
- 2 commas before module name (empty `ItemId` + `ModuleId`)
- Module column must be populated for every row

### Flat JSON (for import)

```json
{
  "NAV_FEATURES": "Features",
  "NAV_PRICING": "Pricing",
  "HERO_TITLE": "Build faster with SELISE Blocks"
}
```

### Compiled JSON (client-side consumption)

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

## Framework Support

| Stack | Reference |
|-------|-----------|
| React (Next.js / Vite) | `flows/client-i18n-setup.md` |
| React Native | `references/react-native.md` |
| Angular | `references/angular.md` |
| Flutter | `references/flutter.md` |
| Blazor .NET | `references/blazor-dotnet.md` |

---

## Version

**1.1.0** — Full standardization against UILM v1 Swagger spec:
- All responses updated with correct field names
- Key operations now use `moduleId` (not `moduleName`); module operations use `moduleName`
- `resources[]` replaces `translations[]` on all key objects
- `TranslateAll` and `TranslateKey` require `messageCoRelationId` (UUID)
- `UilmImport` uses `fileId` reference (not raw file upload)
- `UilmExport` uses `appIds[]` (not `moduleIds[]`)

Changelog: `meta.json`
