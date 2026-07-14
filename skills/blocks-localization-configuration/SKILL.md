---
name: blocks-localization-configuration
description: "Configure app localization on a SELISE Blocks project via the localization API (`https://api.seliseblocks.com/localization/v4`): manage languages (`/Language/Gets|Save|Delete|SetDefault`), feature modules that group translation keys (`/Module/Gets|Save`), and translation keys with per-language values (`/Key/Save`, `/Key/SaveKeys`, `/Key/Gets`, `/Key/GetsByKeyNames`) — then generate the runtime language files (`/Key/GenerateUilmFile`) so the translations actually reach the app. Use whenever the user wants to set up translations/i18n for static UI content (page titles, labels, button text, descriptions), add or edit a language, create a translation module, add/translate keys, translate a batch of keys into multiple languages, or 'generate the language files' on Blocks. This is the admin/config side (translations are authored here); the frontend that loads and switches languages is blocks-localization-implementation. Requires impersonating into the project first."
---

# Blocks Localization — Configuration

Author the translations an app uses for its static content — page titles, labels, button text, descriptions — so it can render in multiple languages. The pipeline is: **languages → modules → keys (with a value per language) → generate the runtime files.** The frontend that consumes the result (a language switcher that loads and applies translations) is **[blocks-localization-implementation](../blocks-localization-implementation/SKILL.md)**.

Base: `https://api.seliseblocks.com/localization/v4` — PascalCase controllers (`/Language/*`, `/Module/*`, `/Key/*`). No `/api/` prefix (the swagger's `/api` is not served).

## Auth & keys — start here

> **Prerequisites:** a Blocks account, at least one project, and a `.env` with `BLOCKS_API_URL`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`. Missing or unknown — no `.env`, `auth-login` 401, empty `Project/Gets` — run the **blocks-onboarding** skill first.

Localization authoring is project configuration, so it runs **inside a project/tenant** — do the shared initial steps first: **[flows/get-into-project.md](flows/get-into-project.md)** (login → list projects → impersonate). It yields:
- **`ACCOUNT_TENANT`** — root/account tenant id. Used as **`x-blocks-key`** on every localization configuration call after impersonation.
- **`PTENANT`** — the target project's tenant id → **`projectKey`** body field / **`ProjectKey`** query param. **Not** `x-blocks-key` on configuration calls.
- **`PTOK`** — the impersonated access token valid for the project → `Authorization: Bearer`.

**Strict rule:** configuring localization uses **`x-blocks-key: ACCOUNT_TENANT`** + **`Authorization: Bearer PTOK`** + **`projectKey`/`ProjectKey`: `PTENANT`**. Never send `PTENANT` as `x-blocks-key` on `/Language`, `/Module`, or `/Key` calls.

> ⚠️ **Do not swap the keys.** Authoring happens **after impersonation** — `PTOK` carries project scope, but the header stays the root tenant. On `PTOK` expiry, renew with `POST /iam/v4/auth-token` then re-impersonate (get-into-project).

## The pipeline

| Step | Do | Flow |
|---|---|---|
| 0 | Get an impersonated project token | [flows/get-into-project.md](flows/get-into-project.md) |
| 1 | Ensure the languages exist and pick the default | [flows/languages-and-modules.md](flows/languages-and-modules.md) |
| 2 | Ensure the feature module(s) exist | [flows/languages-and-modules.md](flows/languages-and-modules.md) |
| 3 | Create keys, **fill a value per language** (the translation), save | [flows/translate-and-generate.md](flows/translate-and-generate.md) |
| 4 | **Generate the runtime files** — nothing reaches the app without this | [flows/translate-and-generate.md](flows/translate-and-generate.md) |

Full request/response contracts: [endpoints.md](endpoints.md).

## Key concepts (from the live swagger)

- **Language** — `{ itemId, languageName, languageCode, isDefault, projectKey }`. `languageCode` is a culture like `en-US`, `de-DE`, `bn-BD` — the same value that appears as a resource's `culture` and as the `Language` query param at runtime. One language is the default (`isDefault` / `/Language/SetDefault`).
- **Module** — a named group of keys for a feature area (e.g. `common`, `login`, `dashboard`): `{ itemId, moduleName, projectKey }`. Keys belong to a module by `moduleId`; the runtime fetches translations **per module** (`ModuleName`). Keep a `common` module for shared strings.
- **Key** — one translatable string: `{ keyName, moduleId, resources[], … }`. **`keyName`** is the stable token the app references (e.g. `LOGIN`, `SAVE_BUTTON`). **`resources`** is the list of per-language values: `[{ value, culture }]` — one entry per language, where `value` is the translated text for that `culture`.
- **You (the agent) produce the translations.** For each key, translate `keyName` (or the source-language value / `context`) into every configured language and put the result in the matching `resources[].value`. `isPartiallyTranslated: true` flags a key that doesn't yet cover all languages. (The platform also offers AI translation via `/Key/TranslateKeys` — optional; see endpoints.md — but the default here is that you fill the values.)
- **Generate or it didn't happen.** Saved keys are staged; the app only sees them after **`POST /Key/GenerateUilmFile`** produces the runtime UILM language files. This is the localization equivalent of the data gateway's "reload".

## Gotchas

- **`GenerateUilmFile` is mandatory** after any key change, per module — skip it and the frontend's `/Key/GetUilmFile` won't reflect your edits.
- **Bulk over single.** Use `POST /Key/SaveKeys` (an array) when saving more than one key; `POST /Key/Save` is for a single key.
- **`culture` must match a configured language's `languageCode` exactly** (`de-DE`, not `de`), or the value won't map at runtime.
- **`x-blocks-key` = `ACCOUNT_TENANT`** on configuration calls; **`projectKey`/`ProjectKey` = `PTENANT`**. Never send `PTENANT` as `x-blocks-key` when authoring translations.
- **Responses are `{ success, errorMessage, validationErrors[] }`** for saves (not the data-service envelope); check `success` and read `validationErrors` on failure.
- New key? Set `isNewKey: true` and leave `itemId: ""`; editing? pass the existing `itemId`.
