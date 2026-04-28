# Action: get-uilm-file

## Purpose

Download the compiled translation JSON for a specific language and module.

---

## Endpoint

```
GET {apiUrl}/uilm/v1/Key/GetUilmFile?Language={language}&ModuleName={moduleName}&ProjectKey={projectKey}
```

---

## curl

```bash
curl --location "{apiUrl}/uilm/v1/Key/GetUilmFile?Language=en&ModuleName=common&ProjectKey={projectKey}" \
  --header "x-blocks-key: {projectKey}"
```

---

## Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| Language | string | yes | Language code — capital `L` (not `languageCode`) |
| ModuleName | string | yes | Module name — capital `M` and `N` (not `moduleId`) |
| ProjectKey | string | yes | Use $PROJECT_KEY |

---

## On Success (200)

```json
// TODO: REPLACE_WITH_ACTUAL_API_TYPES
{
  "NAV_HOME": "Home",
  "NAV_ABOUT": "About",
  "BTN_SUBMIT": "Submit",
  "LOGIN_TITLE": "Welcome Back"
}
```

> [!IMPORTANT]
> Returns a **flat JSON object directly** — `{ "KEY": "value" }` — NOT wrapped in `{data}` or `{translations: {...}}`. Do NOT access `.data` or `.translations` on the response.

---

## On Failure

* 400 — invalid language or module name
* 404 — no compiled file found (call `generate-uilm-file` first)
* 401 — invalid or missing API key — check credentials
