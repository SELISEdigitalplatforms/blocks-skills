# Get into a project (login → pick project → impersonate)

**Run this first, before any configuration call.** Configuring a Blocks service (data, IAM, …) happens *inside a project/tenant*, so you must obtain an **impersonated, project-scoped token**. This flow is shared by all Blocks configuration skills — the steps are identical whether you're configuring the data gateway or IAM SSO.

It produces three things the config flows use:
- `ROOT` — the **root tenant id**, from the login token's `tenant_id` claim. Sent as the **`x-blocks-key` header** on config calls.
- `PTENANT` — the **target project's tenant id** (from Project/Gets, or given by the user). Sent as **`projectKey`** in request bodies. *In a single-project account `ROOT` and `PTENANT` are the same value.*
- `PTOK` — the **impersonated access token**. Sent as `Authorization: Bearer`.

All verified live against `https://api.seliseblocks.com`.

## Step 1 — Log in, get the root tenant id

```bash
set -a && . ./.env && set +a   # BLOCKS_API_URL, BLOCKS_USERNAME, BLOCKS_PASSWORD

LOGIN=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"username\":\"$BLOCKS_USERNAME\",\"password\":\"$BLOCKS_PASSWORD\"}")

TOK=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
RT=$(echo "$LOGIN"  | python3 -c "import sys,json;print(json.load(sys.stdin)['refresh_token'])")
# root tenant id = the tenant_id claim inside the access token
ROOT=$(echo "$TOK" | cut -d. -f2 | python3 -c "import sys,base64,json;s=sys.stdin.read().strip();s+='='*(-len(s)%4);print(json.loads(base64.urlsafe_b64decode(s))['tenant_id'])")
```
Tokens are short-lived (~5 min). If a later call returns `session_expired`/401, re-run step 1.

## Step 2 — List the projects, pick one

```bash
curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  -H "x-blocks-key: $ROOT" -H "Authorization: Bearer $TOK"
```
The response is a **bare JSON array of tenant-groups**, each `{ tenantGroupId, projects[], isShared, nonSharedProject }`. Each `projects[]` entry has `name`, **`tenantId`**, `organizationId`, `applicationDomain`, `environment`, `isProduction`, `itemId`, …

- **If the user named a project/tenant**, find it in the array and confirm it's present.
- **Otherwise, ask the user which project to configure** — list the `name` + `environment` options. Don't guess.

Keep the chosen project's `tenantId` → `PTENANT` and `organizationId` → `PORG`:
```bash
# example: pick the first project (replace the filter with the user's choice)
PTENANT=$(curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  -H "x-blocks-key: $ROOT" -H "Authorization: Bearer $TOK" \
  | python3 -c "import sys,json;g=json.load(sys.stdin);print([x for grp in g for x in (grp.get('projects') or [])][0]['tenantId'])")
```

## Step 3 — Impersonate into the project

First check whether you're already impersonated:
```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/impersonation/status" \
  -H "x-blocks-key: $ROOT" -H "Authorization: Bearer $TOK"
# -> { "impersonated": bool, "originalTenantId": "...", "impersonatedTenantId": "..." }
```
- If `impersonated` is **true** and `impersonatedTenantId` is your target, you're done — use the current token.
- If **false** (or pointed at a different tenant), request an impersonated token. **Note the host: this call goes to `iam.seliseblocks.com/api`, not `api.seliseblocks.com/iam/v4`:**

```bash
PTOK=$(curl -s -X POST "https://iam.seliseblocks.com/api/auth/impersonate" \
  -H "x-blocks-key: $ROOT" -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  --data "{\"targeted_tenant_id\":\"$PTENANT\",\"refresh_token\":\"$RT\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```
Response is `{ "impersonation_mode": true, "access_token": "...", ... }`. Send just `targeted_tenant_id` (the target project's tenant id) and the `refresh_token` from login — no `organization_id` needed. Impersonating into a tenant not shared with your account returns 403 `"Target tenant is not shared with the requesting user"` — pick a project from step 2's list.

## The header/key convention for every config call

```bash
hdr=(-H "x-blocks-key: $ROOT" -H "Authorization: Bearer $PTOK")
# ...and put projectKey: $PTENANT in request bodies (NOT the root tenant id)
```

- **`x-blocks-key` header = `ROOT`** (root tenant id).
- **`Authorization` = the impersonated token `PTOK`.**
- **`projectKey` in bodies = `PTENANT`** (the target project's tenant id).

Now continue with the service you're configuring — [configure-schema.md](configure-schema.md) for the data gateway, or the IAM SSO config skill.
