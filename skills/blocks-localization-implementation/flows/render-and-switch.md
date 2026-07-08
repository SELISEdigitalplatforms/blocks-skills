# Load translations, render by key, and switch language

The frontend runtime loop. No impersonation — `x-blocks-key: <projectKey>` (project tenant id) on each call. Base `https://api.seliseblocks.com/localization/v4`.

## Step 1 — Load languages (build the switcher)

```bash
curl -s "$BLOCKS_API_URL/localization/v4/Language/Gets?ProjectKey=<projectKey>" -H "x-blocks-key: <projectKey>"
```
→ `[{ languageName, languageCode, isDefault }]`. Populate the switcher; preselect `isDefault: true` unless the user has a saved preference (`localStorage`).

## Step 2 — Know the modules

```bash
curl -s "$BLOCKS_API_URL/localization/v4/Module/Gets?ProjectKey=<projectKey>" -H "x-blocks-key: <projectKey>"
```
→ `[{ moduleName, … }]`. The app loads translations per module — typically a shared `common` plus the current page's module. You usually hard-code which module names a screen needs; this call is for discovery / a config UI.

## Step 3 — Fetch the translation file for (language, module)

```bash
curl -s "$BLOCKS_API_URL/localization/v4/Key/GetUilmFile?Language=de-DE&ModuleName=common&ProjectKey=<projectKey>" -H "x-blocks-key: <projectKey>"
```
Returns the generated key→value map for that language + module (e.g. `{ "LOGIN": "Anmelden", "SAVE_BUTTON": "Speichern" }`). Inspect the exact shape in your project once and adapt the parser if it's wrapped. Cache the result under `(language, module)`.

## Step 4 — Render by key

Replace static strings with a lookup against the merged maps for the active language:
- `t("LOGIN")` → the value for `LOGIN` in the active language.
- Missing key → fall back to the default-language value, then to the key name itself, so nothing renders blank.

## Step 5 — Switch language

On switcher change:
1. Set the active `culture`.
2. Re-fetch `GetUilmFile` for each loaded module in the new language (or serve from cache if already fetched).
3. Re-render — components reading `t(...)` update.
4. Persist the choice (`localStorage`) so it survives reloads.

## Verify

- The switcher lists every language from `/Language/Gets`, default preselected.
- Switching to `de-DE` swaps visible labels/titles/buttons to German without a full reload.
- A key with no translation falls back gracefully (default language or key name), never a blank.
- If values look stale, the config side needs to re-run `/Key/GenerateUilmFile` — see **[blocks-localization-configuration](../../blocks-localization-configuration/SKILL.md)**.

React wiring (context + `t()` + switcher + TanStack Query caching): [../references/react.md](../references/react.md).
