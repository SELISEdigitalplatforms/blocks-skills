# Flow: import-export

## Trigger

User wants to import an existing translation file into the system, or export/download compiled translation files.

> "import my existing translation JSON"
> "upload en.json to the auth module"
> "export all translations as a zip"
> "download the compiled French translation file"
> "generate CSV for all translations"
> "create translation file for the app"
> "bulk import keys from a CSV file"

---

## Translation File Formats

### CSV Format (preferred for bulk operations)

Generate a **single CSV file** containing all modules with this format:

```
ItemId,ModuleId,Module,KeyName,en-US,de-DE,fr-FR,it-IT
,,common,NAV_FEATURES,"Features","Funktionen","Fonctionnalités","Funzionalità"
,,common,NAV_SIGN_IN,"Sign In","Anmelden","Connexion","Accedi"
,,common,ERROR_REQUIRED,"This field is required","Dieses Feld ist erforderlich","Ce champ est obligatoire","Questo campo est obbligatorio"
,,home,HOME_HERO_TITLE,"Build faster with Blocks OS","Schneller entwickeln mit Blocks OS","Construisez plus vite avec Blocks OS","Costruisci più velocemente avec Blocks OS"
,,home,HOME_SHIP_HOURS_TITLE,"Ship in Hours","In Stunden versenden","Expédier en heures","Spedisci in ore"
,,home,HOME_SECURITY_SOC2_DESC,"SOC 2 compliant architecture","SOC 2-konforme Architektur","Architecture conforme SOC 2","Architettura conforme SOC 2"
```

**Row structure (per data row):**
- Exactly **2 commas** before the module name: `,,{module},{key},"{value}"`
  - 1st comma → empty `ItemId` column
  - 2nd comma → empty `ModuleId` column
  - Then module name, key name, and quoted values
- **Common mistake:** 4 commas `,,,,{key},"{value}"` — this skips the `Module` column entirely. Always include the module name in the 3rd column.
- **Always double-quote all string values** — even short English text like `"Features"` or `"Sign In"`
- **Empty cells** for untranslated languages — leave the cell blank (no placeholder)

> [!WARNING]
> Key names must be **semantic** — describe the meaning, not the UI type. Do NOT use `BTN_`, `FOOTER_`, `FEATURE_`, `HERO_`, `DESC_1`, `BADGE_`, or layout-based prefixes. See the Translation Key Naming Conventions section in `SKILL.md`.
>
> Brand names (e.g. "Selise Blocks"), copyright text, and legal boilerplate should **not** be added as translation keys.

### JSON Format (for UILM API import)

For UILM API import, use flat JSON objects per module:

```json
{
  "NAV_FEATURES": "Features",
  "NAV_PRICING": "Pricing",
  "GET_STARTED": "Get Started"
}
```

### Compiled JSON (all modules combined)

For client-side i18n, generate a single JSON per language containing all modules:

```json
{
  "common": {
    "NAV_FEATURES": "Features",
    "GET_STARTED": "Get Started"
  },
  "home": {
    "HERO_TITLE": "Build faster with SELISE Blocks"
  }
}
```

---

## Pre-flight Questions

**For Import:**
1. Which module should the file be imported into?
2. Which language does the file contain?
3. Do you have the translation file ready? (CSV or flat JSON format)

**For Export/Download:**
1. Which modules do you want to export?
2. Do you need one specific language file (use `get-uilm-file`) or all languages for selected modules (use `export-uilm`)?

**For Generate:**
1. Which modules need translation files?
2. What languages are supported?
3. What file format (CSV and/or JSON)?

---

## Flow Steps — Import

### Step 1 — Confirm Module and Language

Call `get-modules` and `get-languages` to confirm the target module and language exist.

```
Action: get-modules
Action: get-languages
```

If the module or language doesn't exist, run the `language-setup` flow first.

---

### Step 2 — Upload File

> [!IMPORTANT]
> `UilmImport` takes a `fileId` (string reference), not a raw file upload. Upload the file through the UILM admin UI or separate upload mechanism first to obtain the `fileId`.

```
Action: import-uilm
Input:
  fileId             = <fileId from prior upload>
  messageCoRelationId = <optional UUID for tracking>
  projectKey         = $PROJECT_KEY
```

The file must be a flat JSON object: `{ "KEY_NAME": "translated value" }`.

---

### Step 3 — Verify Import

Call `get-keys` to confirm keys were imported successfully.

```
Action: get-keys
Input:
  projectKey = $PROJECT_KEY
  moduleIds  = [<chosen moduleId>]
  pageNumber = 1
  pageSize   = 20
```

---

## Flow Steps — Download Single Language File

### Step 1 — Regenerate File

Call `generate-uilm-file` to rebuild the compiled JSON for the requested module.

```
Action: generate-uilm-file
Input:
  projectKey = $PROJECT_KEY
  moduleId   = <chosen moduleId from get-modules>
  guid       = <optional UUID>
```

---

### Step 2 — Download File

Call `get-uilm-file` to retrieve the compiled JSON.

```
Action: get-uilm-file
Input:
  language   = <language code, e.g. "fr">
  moduleName = <chosen moduleName>
  projectKey = $PROJECT_KEY
```

The response is the **raw flat JSON** — trigger a browser download using `URL.createObjectURL`.

> [!IMPORTANT]
> `get-uilm-file` returns a flat object directly — `{ "KEY": "value" }` — NOT wrapped in `{data}` or `{translations: {...}}`.

---

## Flow Steps — Export All Modules

### Step 1 — Trigger Export

Call `export-uilm` with the module IDs to export.

```
Action: export-uilm
Input:
  projectKey         = $PROJECT_KEY
  appIds           = ["<MODULE_ID_1>", "<MODULE_ID_2>"]
  languages         = <optional array of language codes>
  outputType       = <optional, defaults to 0>
  messageCoRelationId = <optional UUID>
```

---

### Step 2 — Get Download Link

Call `get-exported-files` to retrieve the download URL for the generated export.

```
Action: get-exported-files
Input:
  projectKey = $PROJECT_KEY
  pageNumber = 1
  pageSize   = 10
```

Present the most recent entry's `downloadUrl` to the user.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Import Step 2 | 400 | Invalid fileId or format | Confirm the file was uploaded and the fileId is correct |
| Import Step 2 | 400 | Module or language not found | Run `language-setup` flow first |
| Download Step 1 | 400 | Invalid moduleId | Check that module exists via `get-modules` |
| Download Step 2 | 404 | No compiled file | Ensure `generate-uilm-file` succeeded before calling `get-uilm-file` |
| Export Step 1 | 400 | Empty appIds array | Ask user to select at least one module |
| Any | 401 | Invalid or missing credentials | Check `x-blocks-key` header |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/localization/components/import-export/import-panel.tsx` | File upload panel with module/language selectors and drag-and-drop |
| `modules/localization/components/import-export/export-panel.tsx` | Module multi-select and export trigger with download history |
| `modules/localization/pages/keys/keys-page.tsx` | Hosts the import/export panels alongside the key list |
| `modules/localization/hooks/use-localization.tsx` | `useImportUilm`, `useExportUilm`, `useGenerateUilmFile`, `useGetUilmFile`, `useGetExportedFiles` hooks |
| `modules/localization/services/localization.service.ts` | `importUilm()`, `exportUilm()`, `generateUilmFile()`, `getUilmFile()`, `getExportedFiles()` |
| `modules/localization/types/localization.type.ts` | `ExportUilmPayload`, `ExportedFile`, `GenerationHistory` types |
