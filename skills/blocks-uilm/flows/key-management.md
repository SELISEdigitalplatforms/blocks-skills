# Flow: key-management

## Trigger

User wants to add, edit, or translate translation keys within a module.

> "add translation keys to the auth module"
> "translate all untranslated keys"
> "add a new key with English and German translations"
> "AI translate the missing German translations"
> "create keys for the dashboard page"
> "batch add translation keys"

---

## Pre-flight Questions

Before starting, confirm:

1. Which module should keys be added to? (run `get-modules` if unsure)
2. Are you adding keys manually or using AI translation to fill in values?
3. If adding manually: provide key names and translation values per language.
4. If AI-translating: should all untranslated keys in the module be translated, or only a specific key?
5. **Key naming**: the key name must follow semantic conventions — see the Translation Key Naming Conventions section in `SKILL.md`. No `BTN_`, `FOOTER_`, `FEATURE_`, or layout-based prefixes.
6. **Module assignment**: keys that appear on only one page go in that page's module, not `common`. See the "What Goes in the Common Module" section in `SKILL.md`.

---

## Flow Steps

### Step 1 — Select or Confirm Module

Call `get-modules` to show available modules. Confirm which module the user wants to work with.

```
Action: get-modules
Input:  projectKey = $PROJECT_KEY
Output: list of modules with IDs
```

Store the chosen `moduleId` and `moduleName` for subsequent steps — `moduleId` is used for key operations, `moduleName` is used for module operations.

---

### Step 2A — Create Keys Manually (if user provides key data)

For a single key, call `save-key`. For multiple keys at once, call `save-keys`.

**Single key:**
```
Action: save-key
Input:
  keyName    = "LOGIN_TITLE"
  moduleId   = <chosen moduleId (from get-modules)>
  projectKey = $PROJECT_KEY
  resources = [
    { value: "Welcome Back", culture: "en", characterLength: 11 },
    { value: "Willkommen zurück", culture: "de", characterLength: 16 }
  ]
```

**Multiple keys (batch):**
```
Action: save-keys
Input:
  projectKey  = $PROJECT_KEY
  moduleId    = <chosen moduleId (from get-modules)>
  keys = [ { keyName, resources[] }, ... ]
```

---

### Step 2B — AI Translate All Untranslated (if user requests)

Call `translate-all` for the module. This fills in any missing translation values using AI.

```
Action: translate-all
Input:
  projectKey          = $PROJECT_KEY
  moduleId            = <chosen moduleId (from get-modules)>
  defaultLanguage     = source language code (e.g. "en")
  messageCoRelationId = generate a new UUID for each request
```

After success, call `get-keys` to display updated translations.

---

### Step 2C — AI Translate a Specific Key (if user specifies a single key)

First retrieve the key ID if not already known:

```
Action: get-keys-by-names
Input:
  projectKey  = $PROJECT_KEY
  moduleId    = <chosen moduleId (from get-modules)>
  keyNames    = ["KEY_NAME"]
```

Then call `translate-key`:

```
Action: translate-key
Input:
  keyId              = <key itemId from get-keys>
  projectKey         = $PROJECT_KEY
  defaultLanguage    = source language code (e.g. "en")
  messageCoRelationId = generate a new UUID for each request
```

---

### Step 3 — Verify

Call `get-keys` to confirm all keys and translations are correct.

```
Action: get-keys
Input:
  projectKey  = $PROJECT_KEY
  moduleIds   = [<chosen moduleId>]
  pageNumber  = 1
  pageSize    = 20
```

Display results to the user showing key names and per-language values.

---

### Step 4 — Regenerate Compiled File (optional)

If the user wants to download the updated translation file, call `generate-uilm-file` then `get-uilm-file`.

```
Action: generate-uilm-file
Input:
  projectKey   = $PROJECT_KEY
  moduleName   = <chosen moduleName>
  languageCode  = <target language code>

Action: get-uilm-file
Input:
  language    = <target language code>
  moduleName  = <chosen moduleName>
  projectKey  = $PROJECT_KEY
```

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 2A | 400 | Key name already exists | Inform user; use `save-key` with the existing key's `itemId` to update instead |
| Step 2B | 400 | Missing `messageCoRelationId` | Ensure UUID is generated and included in the translate-all request |
| Step 2B | 400 | No untranslated keys found | Inform user — all keys are already translated |
| Step 2B/C | 500 | AI service error | Retry the translate request |
| Step 4 | 404 | No compiled file | Ensure `generate-uilm-file` was called first |
| Any | 401 | Invalid or missing credentials | Check `x-blocks-key` header |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/localization/pages/keys/keys-page.tsx` | Main translation editor page — module selector + key list |
| `modules/localization/components/key-list/key-list.tsx` | Paginated table of keys with search, language filter, and untranslated toggle |
| `modules/localization/components/key-form/key-form.tsx` | Create/edit key modal with per-language translation inputs |
| `modules/localization/components/key-timeline/key-timeline.tsx` | Version history drawer showing previous values with rollback button |
| `modules/localization/components/translate-progress/translate-progress.tsx` | Loading indicator and result toast for translate-all operation |
| `modules/localization/hooks/use-localization.tsx` | `useGetKeys`, `useSaveKey`, `useSaveKeys`, `useTranslateAll`, `useTranslateKey`, `useGetKeyTimeline` hooks |
| `modules/localization/services/localization.service.ts` | `getKeys()`, `saveKey()`, `saveKeys()`, `translateAll()`, `translateKey()`, `getKeyTimeline()` |
| `modules/localization/types/localization.type.ts` | `TranslationKey`, `Translation`, `SaveKeyPayload`, `SaveKeysPayload`, `GetKeysParams` types |
