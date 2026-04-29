# Contributing to Blocks AI Skills

Thanks for helping improve Blocks AI Skills! This guide covers how to add new actions, flows, and domains.

## Structure Overview

```
skills/
├── blocks-idp/          ← Identity Provider: auth, users, roles, MFA, SSO
├── blocks-uilm/         ← UI Localization: languages, translation keys, i18n files
└── <new-domain>/        ← Add new domains here following the same structure
    ├── SKILL.md         ← Domain definition with intent mapping
    ├── README.md        ← Domain documentation
    ├── meta.json        ← Version, name, description metadata
    ├── contracts.md     ← TypeScript/C# type definitions
    ├── actions/          ← Individual API actions
    ├── flows/            ← Multi-step workflow documentation
    ├── references/       ← Framework-specific implementation guides
    └── evals/            ← Evaluation test cases
```

## Domain Structure Details

Each domain (`blocks-*`) follows this consistent structure:

| Directory | Purpose |
|-----------|---------|
| `actions/` | Single API endpoint documentation with curl examples and responses |
| `flows/` | Multi-step workflows combining multiple actions |
| `references/` | Framework-specific guides (React, Angular, Flutter, etc.) |
| `evals/` | Evaluation test cases (`evals.json`) |

Core files in each domain:

| File | Purpose |
|------|---------|
| `SKILL.md` | Intent-to-action mapping for AI routing |
| `meta.json` | Domain metadata (version, description) |
| `contracts.md` | TypeScript/C# type definitions |

## How to Add a New Action

1. **Find the API endpoint** from Swagger or tested API responses
2. **Create** `skills/<domain>/actions/<action-name>.md`
3. **Include these sections:**
   - HTTP method + URL with `$API_BASE_URL` and service path
   - Required headers (`$X_BLOCKS_KEY`, `Bearer $ACCESS_TOKEN`)
   - Request body with real field names and types
   - Example curl command
   - Success response (real JSON)
   - Error responses (status codes + meaning)
4. **Update `SKILL.md`** intent mapping table with the new action
5. **Update `contracts.md`** with TypeScript request/response types

### Action File Template

```markdown
# Action Name

## Endpoint

`POST $API_BASE_URL/<service>/v1/<path>`

## Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `x-blocks-key` | `$X_BLOCKS_KEY` |
| `Authorization` | `Bearer $ACCESS_TOKEN` |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field | string | Yes | Description |

## Example

```bash
curl -X POST "$API_BASE_URL/<service>/v1/<path>" \
  -H "Content-Type: application/json" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"field": "value"}'
```

## Response

```json
{
  "isSuccess": true,
  "data": {}
}
```

## Errors

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad request | Check request body |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check role permissions |
```

## How to Add a New Flow

1. **Identify the multi-step pattern** (e.g., "create user → assign role → send activation")
2. **Create** `skills/<domain>/flows/<flow-name>.md`
3. **Document the step sequence** with decision branches
4. **Reference existing actions** — don't duplicate action details in the flow
5. **Update `SKILL.md`** intent mapping table with the new flow

## How to Add a New Domain

1. **Create the directory structure:**
   ```bash
   mkdir -p skills/<domain-name>/{actions,flows,references,evals}
   ```

2. **Create required files:**
   - `meta.json` — version, name, description
   - `SKILL.md` — purpose and intent mapping
   - `README.md` — domain documentation
   - `contracts.md` — TypeScript types

3. **Add content:**
   - Add action files to `actions/`
   - Add flow files to `flows/` (if needed)
   - Add framework guides to `references/`
   - Create `evals/evals.json` with test cases

## Reference Documentation

Add framework-specific guides in `references/`:
- `react-vite.md` — React + Vite integration
- `react-native.md` — React Native integration
- `nextjs-app-router.md` — Next.js App Router
- `angular.md` — Angular integration
- `flutter.md` — Flutter integration
- `blazor-dotnet.md` — Blazor/.NET integration

## Guidelines

- Ground all actions in real Swagger docs or tested API responses
- Use real JSON examples, not placeholder schemas
- Keep SKILL.md focused — put heavy reference material in separate files
- Match field names exactly as the API returns them
- Don't add speculative features — only document what works today
- Each action file should be self-contained with curl examples
- Use consistent naming: kebab-case for files (`get-users.md`)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
