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

### Step 0 — Check Project Exists

Before scanning, verify the project directory is accessible:

```
Check: Does the target directory exist?
Check: Does it contain .tsx, .ts, .jsx, or .js files?
```

**If the directory does not exist or contains no source files:**
→ Generate the CSV skeleton immediately (see Step 3 — Skeleton Path). Do not skip or stop. Always produce output.

**If the directory exists but no `useTranslation()` calls are found:**
→ Ask the user if they want to generate a manual template skeleton or if the project uses a different i18n setup.

---

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

This step has **two paths**. Choose the appropriate path based on what was found in Step 0 and Step 1.

---

#### Path A — Keys Found

Generate a **single CSV file** containing all extracted keys:

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

#### Path B — No Keys Found (or no source files)

Generate a **CSV skeleton** that the user can fill in manually. The skeleton is always the correct format — just with no keys yet:

```csv
ItemId,ModuleId,Module,KeyName,en-US,de-DE,fr-FR
,,common,,"No keys found — add manually below",,
,,home,,"","",
,,auth,,"","",
```

> The module rows (`common`, `home`, `auth`) are starting placeholders. The user adds their own keys under each module.

**How to generate the skeleton:**
1. Write the header row: `ItemId,ModuleId,Module,KeyName,en-US,de-DE,fr-FR`
2. Add one row per known module (ask the user which modules they have): `,,{module},,"","",""`
3. Add a note row under each module: `,,{module},,"No keys found — add manually below","",""`

**This path is NOT an error** — it is a valid workflow. The user may want to populate keys manually or use the skeleton as a template for future scanning.

---

### Step 4 — Present Results

**Path A (keys found):**
1. Total key count per module
2. The generated CSV file content (or save to a file)
3. Suggested next steps:
   - Open the CSV in a spreadsheet editor to fill in translations
   - Import the completed CSV into UILM via `import-uilm`
   - Or call `save-key` directly to batch-create keys

**Path B (skeleton):**
1. Confirm which modules the user wants (e.g., `common`, `home`, `auth`)
2. Present the skeleton CSV with module rows
3. Tell the user: "No keys were extracted from source files. This template has the correct CSV format — fill in the KeyName and en-US columns manually, then import via `import-uilm`"
4. Suggested next steps:
   - Fill in keys manually under each module
   - Run the scan again later once `useTranslation()` is added to the project
   - Import the completed CSV into UILM via `import-uilm`

---

## Error Handling

| Step | Error | Action |
|------|-------|--------|
| Step 0 | Directory not found | Generate skeleton (Path B) |
| Step 0 | No .tsx/.ts/.jsx/.js files in directory | Generate skeleton (Path B) |
| Step 1 | No `useTranslation` calls found | Ask user if they want Path A (manual key entry) or Path B (skeleton) |
| Step 1 | Scan errors (permission denied) | Ask user to verify directory path |
| Step 1 | Source files exist but `t()` calls use hardcoded strings | Generate a **partial CSV** with whatever was found, and note which files contain hardcoded strings that could not be extracted |
| Any | Source language not configured | Prompt to run `language-setup` flow first |

---

## Frontend Output

This flow generates files rather than frontend components:

| File | Purpose |
|------|---------|
| `translations-template.csv` | Single CSV with all modules and keys — either filled (Path A) or skeleton (Path B) |

**Path A (keys found):** Save the filled CSV to the project root, offer to open in a spreadsheet editor for translation, or call `save-key` to batch-create keys in UILM directly.

**Path B (skeleton):** Save the skeleton CSV, explicitly tell the user it is a template, and guide them to fill in keys manually before importing.
