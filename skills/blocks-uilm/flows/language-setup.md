# Flow: language-setup

## Trigger

User wants to set up languages and modules for a project before managing translation keys.

> "set up languages for my project"
> "add English and German to the localization"
> "configure translation modules"
> "set English as the default language"
> "add French as a new language"
> "create the common and auth modules"

---

## Pre-flight Questions

Before starting, confirm:

1. Which languages do you want to add? (provide name and ISO 639-1 code, e.g. "English — en")
2. Which language should be the default (fallback)?
3. What translation modules do you need? (e.g. "common", "auth", "dashboard" — group keys by feature area)

---

## Flow Steps

### Step 1 — Add Languages

For each language requested, call `save-language`.

```
Action: save-language
Input:
  languageName  = language display name (e.g. "English")
  languageCode  = ISO 639-1 code (e.g. "en")
  isDefault    = true for the first/fallback language
  isRTL        = true for RTL languages (Arabic, Hebrew, etc.)
  projectKey   = $PROJECT_KEY
```
Action: save-language
Input:
  languageName  = language display name (e.g. "English")
  languageCode  = ISO 639-1 code (e.g. "en")
  projectKey    = $PROJECT_KEY
```

Repeat for each language. Continue to Step 2 after all languages are saved.

---

### Step 2 — Set Default Language

Call `set-default-language` with the language ID returned (or retrieved via `get-languages`) for the designated default.

```
Action: set-default-language
Input:
  languageName = languageName of the default language
  projectKey = $PROJECT_KEY
```

> If the user hasn't specified a default, ask before proceeding.

---

### Step 3 — Create Modules

For each module name provided, call `save-module`.

```
Action: save-module
Input:
  moduleName = module name (e.g. "common", "auth", "dashboard")
  projectKey = $PROJECT_KEY
```

Always create "common" module first — it's the default module loaded by every route.

---

### Step 4 — Confirm

Verify setup by calling `get-languages` and `get-modules`.

```
Action: get-languages
Action: get-modules
```

Display a summary to the user: languages configured, which is default, modules created.

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 1 | 400 | Language code already exists | Inform user, skip that language |
| Step 2 | 400 | Language ID not found | Re-fetch languages with `get-languages` and retry |
| Step 3 | 400 | Module name already exists | Inform user, skip that module |
| Any | 401 | Invalid or missing API key | Check environment variables and credentials |

---

## Frontend Output

| File | Purpose |
|------|---------|
| `modules/localization/pages/languages/languages-page.tsx` | Language management page — list, add, delete, set default |
| `modules/localization/components/language-list/language-list.tsx` | Table of languages with default badge and delete action |
| `modules/localization/components/language-form/language-form.tsx` | Add/edit language modal form |
| `modules/localization/pages/modules/modules-page.tsx` | Module management page — list and add modules |
| `modules/localization/components/module-list/module-list.tsx` | List of translation modules with add/edit actions |
| `modules/localization/components/module-form/module-form.tsx` | Add/edit module modal form |
| `modules/localization/hooks/use-localization.tsx` | `useGetLanguages`, `useSaveLanguage`, `useSetDefaultLanguage`, `useGetModules`, `useSaveModule` hooks |
| `modules/localization/services/localization.service.ts` | `getLanguages()`, `saveLanguage()`, `setDefaultLanguage()`, `getModules()`, `saveModule()` |
| `modules/localization/types/localization.type.ts` | `Language`, `TranslationModule`, `SaveLanguagePayload`, `SaveModulePayload` types |
