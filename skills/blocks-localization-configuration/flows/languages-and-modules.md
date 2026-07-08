# Set up languages and modules

Before you can author translations you need the target **languages** and the **module(s)** that group your keys. Preconditions: an impersonated project token from **[get-into-project.md](get-into-project.md)** — you have the `hdr` array (`x-blocks-key: $ROOT` + Bearer `$PTOK`) and `$PTENANT`. Base: `https://api.seliseblocks.com/localization/v4`.

## Languages

1. List what's already there:
   ```bash
   curl -s "$BLOCKS_API_URL/localization/v4/Language/Gets?ProjectKey=$PTENANT" "${hdr[@]}"
   ```
   → `[{ itemId, languageName, languageCode, isDefault, projectKey }]`. Note the `languageCode`s (cultures like `en-US`, `de-DE`) — these are what you'll use in every key's `resources[].culture` and at runtime.

2. Add any missing language — `POST /Language/Save`:
   ```json
   { "itemId": "", "languageName": "German", "languageCode": "de-DE", "isDefault": false, "projectKey": "<PTENANT>" }
   ```
   Repeat per language. Response `{ success, errorMessage, validationErrors[] }` — check `success`.

3. Make sure the right default is set — `POST /Language/SetDefault` with `{ "languageName": "English", "projectKey": "<PTENANT>" }`. The default is what the runtime switcher selects first.

Delete a language with `DELETE /Language/Delete?LanguageName=<name>&ProjectKey=$PTENANT` (removes its column from translations — use with care).

## Modules

Modules group keys by feature area (`common`, `login`, `dashboard`, …). The runtime loads translations **per module**, so put shared strings in a `common` module and feature strings in their own.

1. List modules:
   ```bash
   curl -s "$BLOCKS_API_URL/localization/v4/Module/Gets?ProjectKey=$PTENANT" "${hdr[@]}"
   ```
   → `[{ itemId, moduleName, name, tenantId, … }]`. **Keep the `itemId`** of the module you'll add keys to — that is the `moduleId` in the key payloads.

2. Create a missing module — `POST /Module/Save`:
   ```json
   { "itemId": "", "moduleName": "login", "projectKey": "<PTENANT>" }
   ```
   Then re-list (step 1) to get its `itemId` if the save response doesn't return it.

## Verify

- `GET /Language/Gets` shows every language you need with the intended `isDefault`.
- `GET /Module/Gets` shows your module; capture its `itemId` for [translate-and-generate.md](translate-and-generate.md).

Next: author and translate keys, then generate the runtime files → [translate-and-generate.md](translate-and-generate.md).
