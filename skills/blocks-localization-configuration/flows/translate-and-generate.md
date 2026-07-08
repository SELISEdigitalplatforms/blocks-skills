# Author keys, translate, and generate the runtime files

Turn a list of static UI strings into translated keys the app can load. Preconditions: languages + module exist ([languages-and-modules.md](languages-and-modules.md)); you have `$PTENANT`, the `hdr` array, the target **`moduleId`**, and the set of language `culture`s from `/Language/Gets`.

## Step 1 — Decide the keys

For each piece of static content, pick a stable **`keyName`** the app will reference — uppercase, descriptive, e.g. `LOGIN`, `SAVE_BUTTON`, `DASHBOARD_TITLE`. The app renders by key, so the name shouldn't change once shipped. If a name is ambiguous, put a hint in `context` (helps you and the AI translator).

## Step 2 — Translate each key into every language

For every key, produce a `value` for **each** configured `culture` by translating the intended string (from `keyName`/`context`, or an existing source-language value). Assemble the `resources` array — one `{ value, culture }` per language:

```json
{
  "keyName": "LOGIN",
  "moduleId": "<moduleId>",
  "resources": [
    { "value": "Login",    "culture": "en-US" },
    { "value": "Anmelden", "culture": "de-DE" },
    { "value": "লগইন",     "culture": "bn-BD" }
  ],
  "routes": [],
  "glossaryIds": [],
  "isPartiallyTranslated": false,
  "isNewKey": true,
  "itemId": "",
  "context": "",
  "shouldPublish": true,
  "projectKey": "<PTENANT>"
}
```
- `culture` must match a language's `languageCode` **exactly**.
- Cover every language, or set `isPartiallyTranslated: true` for the ones you couldn't.
- Editing an existing key? First `POST /Key/GetsByKeyNames` (`{ keyNames, moduleId, projectKey }`) to get its `itemId` and current resources, then send with that `itemId` and `isNewKey: false`.

_Alternative — let the platform machine-translate:_ save the keys with only the default-language value, then `POST /Key/TranslateKeys` (`{ keyIds, defaultLanguage, messageCoRelationId, projectKey }`) and review the output before step 4. Default flow here is that **you** fill the values.

## Step 3 — Save the keys

- **Multiple keys → `POST /Key/SaveKeys`** with an **array** of the object above (recommended).
- **A single key → `POST /Key/Save`** with the object.

```bash
curl -s -X POST "$BLOCKS_API_URL/localization/v4/Key/SaveKeys" "${hdr[@]}" -H "Content-Type: application/json" --data-raw '[ { …key1… }, { …key2… } ]'
```
Response `{ success, errorMessage, validationErrors[] }` — confirm `success: true`; on failure read `validationErrors`.

## Step 4 — Generate the runtime files (mandatory)

Saved keys are staged until you generate the UILM language files. Run once **per module** you changed:

```bash
curl -s -X POST "$BLOCKS_API_URL/localization/v4/Key/GenerateUilmFile" "${hdr[@]}" -H "Content-Type: application/json" \
  --data-raw "{\"guid\":\"$(uuidgen)\",\"moduleId\":\"<moduleId>\",\"projectKey\":\"$PTENANT\"}"
```
`guid` is any correlation UUID. Until this succeeds, the frontend's `/Key/GetUilmFile` returns stale content — this is the localization "reload".

## Verify

- `POST /Key/Gets` (`{ pageNumber:1, pageSize:50, moduleIds:["<moduleId>"], projectKey }`) → your keys appear with full `resources`; `isPartiallyTranslated` reflects coverage.
- Find gaps: `POST /Key/Gets` with `missingLanguages: ["de-DE"]` lists keys still missing German.
- Runtime check (implementation side): `GET /Key/GetUilmFile?Language=de-DE&ModuleName=<moduleName>&ProjectKey=$PTENANT` returns your German values — see **[blocks-localization-implementation](../../blocks-localization-implementation/SKILL.md)**.
