---
name: blocks-localization
description: "Use this skill for any task involving localization, i18n, translations, or multilingual content on SELISE Blocks — including adding project languages and setting a default, creating/updating/deleting translation keys (single or bulk), searching keys by module or missing language, machine-translating untranslated keys, getting AI translation suggestions with glossary context, managing glossaries and modules, generating and downloading UILM language files, importing/exporting translation files, auditing the localization timeline, rolling back key changes, and configuring the localization webhook. Trigger when the user mentions localization, i18n, l10n, translation keys, language files, glossary, auto-translate, multilingual setup, UILM, blocks-uilm (legacy name), or the SELISE Blocks localization service."
---

# Blocks Localization

The localization service (`https://api.seliseblocks.com/localization/v4`) manages everything a multilingual SELISE Blocks app needs on the backend: the list of project languages, translation keys grouped into modules, per-language values (resources), glossaries that steer AI translation, queue-based machine translation, generated language files your frontend consumes at runtime, a change timeline with rollback, and a webhook that notifies your systems when translations change. Reach for it whenever an app needs more than one language, or when translation content must be managed outside the codebase. (Pre-v4 this service was called **UILM** — the file-generation endpoints still carry that name.)

## Prerequisites

- Follow **blocks-setup** for env vars (`BLOCKS_API_URL`, `X_BLOCKS_KEY`, `PROJECT_SLUG`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`) and for obtaining/refreshing a Bearer token.
- Every request needs the `x-blocks-key` header; management operations also need `Authorization: Bearer <access_token>`.
- Almost every request carries the project identifier: `projectKey` in JSON bodies, `ProjectKey` as a query param. Use your project's short key (same value as `PROJECT_SLUG` / login `client_id`).

## What's where

| I need to… | Go to |
|---|---|
| Add/list/delete languages, set the default | [endpoints.md#language](endpoints.md#language), flow: [language-setup](flows/language-setup.md) |
| Create/update/delete translation keys, single or bulk | [endpoints.md#key](endpoints.md#key), flow: [key-management](flows/key-management.md) |
| Search keys (by module, text, missing language, partial translation) | `POST /api/Key/Gets` in [endpoints.md#key](endpoints.md#key) |
| Machine-translate missing values (one key / many / all) | flow: [ai-translation](flows/ai-translation.md) |
| Get an AI suggestion for one string, with glossary context | `POST /api/Assistant/GetTranslationSuggestion` in [endpoints.md#assistant](endpoints.md#assistant), flow: [ai-translation](flows/ai-translation.md) |
| Manage glossaries and tag them to modules | [endpoints.md#glossary](endpoints.md#glossary), [endpoints.md#module](endpoints.md#module), flow: [ai-translation](flows/ai-translation.md) |
| Create/list modules | [endpoints.md#module](endpoints.md#module) |
| Generate + download language files for the frontend | flow: [language-files-and-webhook](flows/language-files-and-webhook.md) |
| Export/import translation files (offline/agency workflow) | `POST /api/Key/UilmExport` / `UilmImport` in [endpoints.md#key](endpoints.md#key) |
| Get notified when translations change (webhook) | [endpoints.md#config](endpoints.md#config), flow: [language-files-and-webhook](flows/language-files-and-webhook.md) |
| See who changed what, and undo it | flow: [timeline-and-rollback](flows/timeline-and-rollback.md) |
| Upload the file for UilmImport | **blocks-os** (Storage) |
| Log in / refresh tokens | **blocks-iam** / **blocks-setup** |

## Key concepts

- **Language** — a project-level language: `{ languageName, languageCode, isDefault }`. Exactly one language should be the default; it is the source language for machine translation.
- **Module** — a named group of keys (e.g. `common`, `dashboard`). Language files are generated per module. Keys reference modules by `moduleId` (the module's `itemId`), not by name.
- **Key** — one translatable string: `keyName` plus a `resources[]` array of per-language values. Also carries `routes[]` (where it's used), `context` (hint for translators/AI), `glossaryIds[]`, and flags like `isPartiallyTranslated` and `shouldPublish`.
- **Resource** — one language's value for a key: `{ value, culture, characterLength }`. `culture` must match a registered language's `languageCode`.
- **Glossary** — a terminology entry (`name`, `language`, `type`, `context`, `additionalNote`, `isGlobal`, `moduleIds`) that constrains AI translation so brand terms and domain vocabulary stay consistent.
- **UILM file** — the generated JSON language file for one module + language that your frontend loads at runtime. Generate first (`GenerateUilmFile`), then fetch (`GetUilmFile`).
- **Timeline / Operation** — every key change is logged with `previousData`/`currentData`. Bulk actions (SaveKeys, DeleteKeys, TranslateKeys) share one `operationId`. `RollBack` reverts to a previous state.
- **Webhook** — a single per-project config (`url`, `contentType`, secret header) that the platform calls when localization content changes.

## Flows

| Flow | Use when |
|---|---|
| [flows/language-setup.md](flows/language-setup.md) | Setting up or changing project languages, incl. the default language |
| [flows/key-management.md](flows/key-management.md) | Adding/updating translation keys — single, bulk, upsert-by-name, delete |
| [flows/ai-translation.md](flows/ai-translation.md) | AI-assisted translation: glossaries, per-string suggestions, queue-based bulk translate |
| [flows/language-files-and-webhook.md](flows/language-files-and-webhook.md) | Generating/fetching language files, export/import, webhook config |
| [flows/timeline-and-rollback.md](flows/timeline-and-rollback.md) | Auditing localization changes and rolling back mistakes |

## Conventions & gotchas

- **Casing split:** JSON bodies use camelCase (`projectKey`, `keyName`); query params on GET/DELETE use PascalCase (`ProjectKey`, `ItemId`, `PageSize`). Exception: `GET /api/Glossary/Get` uses lowercase `itemId` / `projectKey` query params — match endpoints.md exactly per endpoint.
- **Save responses don't return the new item's id.** `Language/Save`, `Key/Save`, `SaveKeys`, `Glossary/Save`, `Module/Save`, `Config/SaveWebHook` all return the `ApiResponse` envelope `{ success, errorMessage, validationErrors }` — **no `itemId`**. To get ids after a create, re-query the matching list endpoint (`Language/Gets`, `Key/GetsByKeyNames`, `Glossary/Gets`, `Module/Gets`). Only `Module/TagGlossary` returns the `BaseMutationResponse` shape (`{ isSuccess, errors, itemId }`) — note the different success flag names (`success` vs `isSuccess`).
- **Upserts, not PUTs.** All writes are `POST …/Save` endpoints: omit `itemId` to create, include it to update. Deletes are query-param `DELETE`s — except `DELETE /api/Key/DeleteKeys`, which takes a **JSON body** (some HTTP clients need explicit support for DELETE-with-body).
- **Languages are deleted by name**, not id: `DELETE /api/Language/Delete?LanguageName=…&ProjectKey=…`.
- **Machine translation is asynchronous.** `TranslateKey` / `TranslateKeys` / `TranslateAll` enqueue work and return immediately; all four request fields (`keyId(s)`, `messageCoRelationId`, `projectKey`, `defaultLanguage`) are required — generate a GUID for `messageCoRelationId`. Verify completion by re-querying keys or the timeline, not from the (undocumented) response.
- **`GenerateUilmFile` before `GetUilmFile`** — the swagger says so explicitly; fetching without generating returns stale or missing content.
- **Many responses are undocumented in swagger** (all Translate* endpoints, `GetUilmFile`, `GetLanguageFileGenerationHistory`, `GetUilmExportedFiles`, `RollBack`, `Language/SetDefault`, `Language/Delete`, key deletes, `Glossary/Get`, `Assistant/GetTranslationSuggestion`). Inspect the live response before coding against it — do not assume shapes.
- **`UilmExportRequest.outputType` is an integer enum `0–5` with no published member names** — treat meanings as unverified; test which value yields the format you need. Note the export request selects modules via `appIds[]`, not `moduleIds`.
- **Pagination:** list endpoints use `PageNumber`/`PageSize` query params (or `pageNumber`/`pageSize` in the `Key/Gets` body) plus a `totalCount` in documented responses.
- Old v1 routes (`/uilm/v1/…`, `/lmt/…`) are dead. Everything is under `https://api.seliseblocks.com/localization/v4`.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
