# Manage projects via API (create · add environment · delete environment)

Projects and their environments are fully manageable through the API — no portal needed. All calls verified live against `https://api.seliseblocks.com` (2026-07-15). A **project** is a `tenantGroup`; each **environment** in it is its own tenant (`tenantId` = env letter + `tenantGroupId`, e.g. `D…` for dev, `T…` for test).

**Ask before you mutate.** Creation and deletion are user-facing decisions — always confirm the plan first (see "What to ask" below). Never retry a failed `Create` blindly; check `Project/Gets` first so you don't produce duplicate tenant groups.

## What to ask (proactively, before creating anything)

Don't wait for the user to spell it out — propose a default and let them adjust:

1. **What do you want to build?** (Routes to the right follow-up skill after setup.)
2. **Project name** — suggest one derived from what they're building (3–100 chars).
3. **Environments** — **suggest starting with `dev` only** (the default). More can be added at any time later, and environments can be deleted again, so starting minimal costs nothing. Valid values:

   | value | label |
   |---|---|
   | `dev` | Development |
   | `test` | Testing |
   | `stg` | Staging |
   | `iat` | IAT |
   | `uat` | UAT |
   | `prod-shadow` | Prod Shadow |
   | `pre-prod` | Pre-Prod |
   | `prod` | Production |

Example proposal: *"I'll create a project called `acme-shop` with a `dev` environment — we can add `test`/`prod` later or remove environments anytime. OK?"*

## Step 0 — Login (bootstrap token)

```bash
set -a && . ./.env && set +a
LOGIN=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"username\":\"$BLOCKS_USERNAME\",\"password\":\"$BLOCKS_PASSWORD\"}")
TOK=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
RT=$(echo "$LOGIN"  | python3 -c "import sys,json;print(json.load(sys.stdin)['refresh_token'])")
ACCOUNT_TENANT=$(echo "$TOK" | cut -d. -f2 | python3 -c "import sys,base64,json;s=sys.stdin.read().strip();s+='='*(-len(s)%4);print(json.loads(base64.urlsafe_b64decode(s))['tenant_id'])")
bootstrap_hdr=(-H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $TOK")
```

## Create a project

`POST /os/v4/Project/Create` with the **bootstrap** token (no impersonation — there is no project yet):

```bash
SUF=$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 5)
curl -s -X POST "$BLOCKS_API_URL/os/v4/Project/Create" \
  "${bootstrap_hdr[@]}" -H "Content-Type: application/json" \
  --data-raw "{
    \"name\": \"<project name>\",
    \"isAcceptBlocksTerms\": true,
    \"isUseBlocksExclusively\": true,
    \"isProduction\": false,
    \"resources\": [],
    \"applicationContexts\": [
      {\"environment\": \"dev\", \"domain\": \"https://dev-$SUF.seliseblocks.com\", \"cookieDomain\": \"seliseblocks.com\"}
    ]
  }"
# → {"tenantGroupId":"<group id>","errors":null,"isSuccess":true}
```

- One entry in `applicationContexts` per environment; the same payload can create several environments at once.
- **The `domain` you send is ignored** — the backend assigns its own (e.g. `https://djzqto.slsblx.com`, cookie domain `slsblx.com`, env letter + random). Send a well-formed placeholder anyway (the portal does); read the real domain back from `Project/Gets` → `applications[].domain`.
- `isAcceptBlocksTerms: true` is the user accepting Blocks' terms — only send it after the user has agreed to create the project.
- Provisioning is fast (seconds, not minutes). **Verify, don't assume**: re-run `Project/Gets` (or the preflight) and confirm the new environment(s) appear with a `tenantId`.

## Add an environment to an existing project

Same endpoint, same payload — plus the existing **`tenantGroupId`**:

```bash
curl -s -X POST "$BLOCKS_API_URL/os/v4/Project/Create" \
  "${bootstrap_hdr[@]}" -H "Content-Type: application/json" \
  --data-raw "{
    \"name\": \"<existing project name>\",
    \"isAcceptBlocksTerms\": true,
    \"isUseBlocksExclusively\": true,
    \"isProduction\": false,
    \"resources\": [],
    \"tenantGroupId\": \"<existing tenantGroupId>\",
    \"applicationContexts\": [
      {\"environment\": \"test\", \"domain\": \"https://test-$SUF.seliseblocks.com\", \"cookieDomain\": \"seliseblocks.com\"}
    ]
  }"
# → {"tenantGroupId":"<same group id>","errors":null,"isSuccess":true}
```

The new environment appears in the same tenant group with its own `tenantId` (`T<groupId>` for `test`, etc.). Verify via `Project/Gets`.

## Delete (disable) an environment

`POST /os/v4/Project/Disable` with `{"projectKey": "<the environment's tenantId>"}` — the portal presents this as **deleting the environment**; it disappears from `Project/Gets`.

**Trap (verified live): the bootstrap token silently no-ops here.** With the login token, `Disable` returns `{"isSuccess":true}` but the environment stays active. You must use an **impersonated token** (any tenant of the account works; impersonating into the environment being deleted is fine):

```bash
CLIENT_ID="57214b67-aa9c-4307-92ab-a25e35180fac"   # fixed constant, only for impersonate
PTOK=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/impersonate" \
  "${bootstrap_hdr[@]}" -H "Content-Type: application/json" \
  --data "{\"targeted_tenant_id\":\"<env tenantId>\",\"refresh_token\":\"$RT\",\"client_id\":\"$CLIENT_ID\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X POST "$BLOCKS_API_URL/os/v4/Project/Disable" \
  -H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $PTOK" \
  -H "Content-Type: application/json" \
  --data-raw '{"projectKey":"<env tenantId>"}'
# → {"errors":null,"isSuccess":true}
```

- **Confirm with the user before deleting** — name the project and environment explicitly.
- **Verify**: `Project/Gets` no longer lists the environment. Because the bootstrap-token call *also* says `isSuccess: true`, the `Gets` check is the only real confirmation.
- The refresh token is single-use; a successful impersonate consumes it. Re-login if you need another.
- Deleting the last environment of a project effectively removes the whole project from the console.

## Gotchas

- **`isSuccess: true` ≠ it happened** — `Disable` with the wrong token class succeeds cosmetically. Always confirm mutations via `Project/Gets`.
- **Don't fabricate `tenantGroupId`** — omitting it creates a new project; passing a wrong one may attach the environment to the wrong group. Read it from `Project/Gets` first.
- **Signup is still portal-only** (captcha-protected) — this flow starts from a working login.
