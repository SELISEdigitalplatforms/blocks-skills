# Contributing to Blocks AI Skills

Thanks for helping improve Blocks AI Skills! This guide covers how to add new actions, flows, and domains.

## Structure Overview

```
skills/
├── core/              ← Routing, conventions, frontend patterns
├── _template/         ← Copy this to start a new domain
├── identity-access/   ← Auth, users, roles, MFA
├── communication/     ← Email, notifications, templates
├── data-management/   ← Schemas, GraphQL, files
├── localization/        ← Languages, translation keys
├── ai-services/         ← AI agents, KB, models, chat
├── logging-monitoring/  ← Logs, traces, analytics
├── background-tasks/    ← Scheduled tasks (cron jobs)
└── webhooks/            ← Event-driven webhooks
```

## How to Add a New Action

1. **Find the Swagger endpoint** for the API you want to cover
2. **Create** `skills/<domain>/actions/<action-name>.md`
3. **Include these sections:**
   - HTTP method + URL
   - Required headers (with `$X_BLOCKS_KEY` and `Bearer $ACCESS_TOKEN`)
   - Request body (with real field names and types)
   - Example curl command
   - Success response (real JSON example)
   - Error responses (status codes + meaning)
4. **Add the action** to the domain's `SKILL.md` intent mapping table
5. **Update `contracts.md`** with TypeScript request/response types
6. **Run validation:** `./scripts/validate-skills.sh`

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

\`\`\`bash
curl -X POST "$API_BASE_URL/<service>/v1/<path>" \
  -H "Content-Type: application/json" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"field": "value"}'
\`\`\`

## Response

\`\`\`json
{
  "isSuccess": true,
  "data": {}
}
\`\`\`

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
5. **Add the flow** to the domain's `SKILL.md` intent mapping table

## How to Add a New Domain

Use the scaffolding script for a fully structured skeleton:

```bash
node scripts/generate-skill.js <domain-name>
# Example: node scripts/generate-skill.js payment-processing
```

This creates:
- `skills/<domain>/meta.json` — with version 1.0.0
- `skills/<domain>/SKILL.md` — with placeholders filled in
- `skills/<domain>/contracts.md` — TypeScript/C# type template
- `skills/<domain>/frontend.md` — generic frontend template
- `skills/<domain>/actions/` and `skills/<domain>/flows/` directories

Then:
1. **Edit** `SKILL.md` with your domain purpose and intent mapping
2. **Add** action files to `actions/`
3. **Add** flow files to `flows/` (if needed)
4. **Update** `skills/core/decision.md` to route to the new domain
5. **Run:** `node scripts/generate-index.js`
6. **Run:** `node scripts/validate-skills.js`

## Testing Your Changes

Test with Claude Code by asking natural-language prompts:

```
# For a new action:
"Show me all users" → should use get-users action

# For a new flow:
"Build a login page with MFA" → should use login-flow

# For a new domain:
"Set up CI/CD pipeline" → should route to new domain
```

## Guidelines

- Ground all actions in real Swagger docs or tested API responses
- Use real JSON examples, not placeholder schemas
- Keep SKILL.md under 500 lines — put heavy reference material in separate files
- Match field names exactly as the API returns them
- Don't add speculative features — only document what works today

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
