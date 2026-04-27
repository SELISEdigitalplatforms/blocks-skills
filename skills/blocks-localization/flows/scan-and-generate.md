# Flow: scan-and-generate

Scans source code for `useTranslation()` calls, extracts all translation keys, and generates a CSV translation template for import into UILM. Use this when starting localization on a project that has hardcoded strings, or when auditing existing translation coverage.

> [!IMPORTANT]
> This flow generates output from **actual source code scanning** — not from knowledge of the app. Always use the search/grep tools to find `t()` calls in the user's project directory. Do NOT generate synthetic keys like `NAV_HOME`, `BUTTON_SUBMIT`, or `ARIA_MENU` from memory. If the user has a project, scan it. If no project directory is available, report that no keys can be extracted without a project to scan.

## Trigger

> "scan my project for translation keys"
> "generate a translation template from my source code"
> "find all hardcoded strings that need translation"
> "create a CSV of all text in the app"
> "audit translation coverage"

---

## Pre-flight Questions

Before starting, confirm:

1. Which directory should be scanned? (e.g., `src/`, `app/`, `lib/`)
2. Which module should the keys belong to? (e.g., "common", "home", "auth")
3. Which language is the source language? (the one with full translations in the source)
4. Are there any file patterns to exclude? (e.g., test files, node_modules, generated files)

---

## Flow Steps

### Step 1 — Scan Source Code

Search the target directory for all `useTranslation()` usages:

```
Pattern to search: useTranslation
Include: .tsx, .ts, .jsx, .js files
Exclude: *.test.ts, *.spec.ts, node_modules/, .next/, dist/, build/
```

For each match, extract:
- The file path
- All keys passed to `t()` — strings inside `t("KEY")`, `t('KEY')`, or `t(`KEY`)`

**Key extraction rules:**
- `t("NAV_HOME")` → `NAV_HOME`
- `t("SUBMIT", { count })` → `SUBMIT` (ignore interpolation params)
- `t("SUBMIT" + suffix)` → skip (dynamic keys can't be statically analyzed)
- `t(keyVariable)` → skip (dynamic keys)

Group results by namespace:
```
common:    NAV_HOME, NAV_ABOUT, SUBMIT, ERROR_REQUIRED, ...
home:      HERO_TITLE, HERO_SUBTITLE, FEATURES_HEADING, ...
auth:      LOGIN_TITLE, LOGIN_EMAIL, LOGIN_PASSWORD, ...
```

---

### Step 2 — Deduplicate and Validate

- Remove duplicate keys within each namespace
- Validate naming: keys must be `SCREAMING_SNAKE_CASE` with **semantic names** only
- **Reject UI-type prefixes**: `BTN_*`, `FOOTER_*`, `HERO_*`, `DESC_*`, `FEATURE_*`, `BADGE_*`, `ARIA_*` are all forbidden — rename to semantic equivalents (e.g., `BTN_SUBMIT` → `SUBMIT`, `ARIA_MENU` → `MENU`)
- **Reject route-specific content in common**: hero text, feature descriptions, and page-specific CTAs belong in their route module — move them out of the common module
- Flag keys that look like variables or dynamic content (skip these)
- Report key count per namespace

---

### Step 3 — Generate CSV Template

Generate a **single CSV file** containing all modules. Use full language codes (`en-US`, `de-DE`, etc.) matching the configured languages:

```csv
ItemId,ModuleId,Module,KeyName,en-US,de-DE,fr-FR
,,common,NAV_HOME,"Home",,
,,common,NAV_ABOUT,"About",,
,,common,SUBMIT,"Submit",,
,,home,HERO_TITLE,"Build faster",,
,,auth,LOGIN_TITLE,"Sign In",,
```

**Row structure:** `ItemId,ModuleId,Module,KeyName,en-US` → `,,{module},{key},"{value}"`
- Exactly **2 commas** before the module name (empty ItemId + empty ModuleId)
- Every string value wrapped in double quotes
- Target language columns: leave the cell empty (no placeholder)

**Rules:**
- `ItemId` and `ModuleId`: leave empty (filled by UILM on import)
- `Module`: the namespace/module name (e.g., `common`, `home`, `auth`)
- `KeyName`: the extracted key in SCREAMING_SNAKE_CASE — semantic names only (e.g., `SUBMIT`, not `BTN_SUBMIT`)
- Language columns: use full language codes (e.g., `en-US`, `de-DE`, `fr-FR`) — **not** `en`, `de`, `fr`
- Source language column: fill with the extracted value from the source text
- Values: always quoted strings

**CSV rules (RFC 4180):**
- Wrap all values in double quotes
- Double quotes inside values: escape as `""`
- No trailing commas on lines
- **Wrong:** `,,,,NAV_HOME,Home` — 4 commas skipping the Module column
- **Correct:** `,,common,NAV_HOME,"Home"`

---

### Step 4 — Present Results

Show the user:
1. Total key count per module
2. The generated CSV file content (or save to a file)
3. Suggested next steps:
   - Open the CSV in a spreadsheet editor to fill in translations
   - Import the completed CSV into UILM via `import-uilm`

---

## Error Handling

| Step | Error | Action |
|------|-------|--------|
| Step 1 | No `useTranslation` calls found | Inform user — no keys to extract |
| Step 1 | Scan errors (permission denied) | Ask user to verify directory path |
| Step 3 | Empty scan result | Report 0 keys and suggest the directory may be wrong |
| Any | Source language not configured | Prompt to run `language-setup` flow first |

---

## Frontend Output

This flow generates files rather than frontend components:

| File | Purpose |
|------|---------|
| `translations-template.csv` | Single CSV with all modules and keys, source language filled, target columns empty |

After generating, offer to:
- Save the CSV to the project root
- Open in a spreadsheet editor for translation
- Call `save-keys` to batch-create all keys in UILM directly
