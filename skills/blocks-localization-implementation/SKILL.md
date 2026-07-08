---
name: blocks-localization-implementation
description: "Implement runtime localization / i18n in a SELISE Blocks frontend: load the project's languages (`/Language/Gets`) and modules (`/Module/Gets`), fetch the generated translation files (`/Key/GetUilmFile?Language=<culture>&ModuleName=<module>`), render UI by translation key, and build a language switcher that swaps the active language live. Use whenever the user wants to make a Blocks app multilingual on the client — add a language switcher/dropdown, load translations, replace hard-coded strings with translation keys, apply the selected language to page titles/labels/buttons, or wire i18n into React. This is the frontend side; the translations themselves are authored with blocks-localization-configuration. No project impersonation needed — it uses the public project key."
---

# Blocks Localization — Implementation (frontend)

Make an app render its static content in the user's language. The translations were authored and generated with **[blocks-localization-configuration](../blocks-localization-configuration/SKILL.md)**; this skill loads them at runtime and applies them, with a switcher to change language on the fly.

Base: `https://api.seliseblocks.com/localization/v4`. **No initial steps / impersonation** — the frontend uses the **project key** (`x-blocks-key` = the project tenant id, public and shippable). Translation content is read-only from the app.

## The runtime model

1. **On app load, list languages** — `GET /Language/Gets?ProjectKey=<projectKey>` → `[{ languageName, languageCode, isDefault }]`. Build the switcher from this and preselect the one with `isDefault: true` (or the user's saved choice).
2. **Know your modules** — `GET /Module/Gets?ProjectKey=<projectKey>` lists the available modules (`common`, `login`, …). The app loads translations per module — usually a shared `common` plus the current feature's module.
3. **Fetch the translation file** for the active language + module — `GET /Key/GetUilmFile?Language=<culture>&ModuleName=<module>&ProjectKey=<projectKey>`. This returns the generated key→value map for that language/module. Cache it per `(language, module)`.
4. **Render by key** — replace static strings in the UI with a lookup `t("LOGIN")` that reads the fetched map; the value is the translated text (`"Anmelden"` for `de-DE`).
5. **Switch language** — on switcher change, set the active `culture`, (re)fetch the UILM files for the loaded modules in that language, and re-render. Persist the choice (e.g. `localStorage`) so it survives reloads.

Details + React wiring: [flows/render-and-switch.md](flows/render-and-switch.md), [references/react.md](references/react.md).

## Key concepts

- **`Language` = a culture code** (`en-US`, `de-DE`, `bn-BD`) — the `languageCode` from `/Language/Gets`, passed as the `Language` query param.
- **`ModuleName` = a module's name** (not id) from `/Module/Gets` — you fetch one UILM file per module you need.
- **Keys are the contract with config.** The app references keys like `LOGIN`; the config side must have a key of that name (in that module) with a value for each language, and must have run `GenerateUilmFile`. A missing translation shows up as a missing key at runtime → fall back to the key name or the default language.
- **`GetUilmFile` reflects the last generation.** If a translation looks stale or absent, the config side likely didn't run `/Key/GenerateUilmFile` after editing (see blocks-localization-configuration).

## Gotchas

- **`x-blocks-key` = the project key** (project tenant id). No impersonation; this is public frontend access.
- **Cache per (language, module)** and invalidate on language switch — don't refetch every render.
- **Preload the default language** before first paint (or gate UI) so users don't see raw keys flash.
- **`culture` must match exactly** — request `de-DE`, not `de`; it must equal a configured `languageCode`.
- **Whether a bearer token is required** for these reads can depend on the project (public pages need translations pre-login). Send `x-blocks-key` always; add the user's token if your project requires auth on these endpoints — verify against your project.
