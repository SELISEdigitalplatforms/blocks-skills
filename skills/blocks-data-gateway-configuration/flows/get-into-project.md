# Get into a project (login → pick project → impersonate)

**Run this first, before any configuration call.** Configuring a Blocks service (data, IAM, …) happens *inside a project/tenant*, so you must obtain an **impersonated, project-scoped token**. This flow is shared by all Blocks configuration skills — the steps are identical whether you're configuring the data gateway or IAM SSO.

It produces three things the config flows use:
- `ROOT` — the **root/account tenant id**, from the login token's `tenant_id` claim. Used as the `x-blocks-key` header **only** for the two account-level calls below (`Project/Gets` and `impersonate`).
- `PTENANT` — the **target project's tenant id** (from Project/Gets, or given by the user). This is the key that matters for the work: sent as the **`x-blocks-key` header** *and* as **`projectKey`** on every in-project service call. A service call keyed with `$ROOT` returns 401/403 unless root happens to be the project that owns that service (verified live).
- `PTOK` — an access token valid for the project. The impersonated token always works; the plain login token also works for projects your account can already reach.

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
hdr=(-H "x-blocks-key: $PTENANT" -H "Authorization: Bearer $PTOK")
# ...and put projectKey: $PTENANT in request bodies too
```

- **`x-blocks-key` header = `PTENANT`** — the project tenant id. **Not** `ROOT`: an in-project call keyed with the root tenant 401/403s (verified). `ROOT` is only the key for `Project/Gets` and `impersonate` in steps 2–3.
- **`Authorization` = `PTOK`** (the impersonated token; the plain login token also works if your account already has access to the project).
- **`projectKey` in bodies = `PTENANT`** (the target project's tenant id).

Now continue with the service you're configuring — [configure-schema.md](configure-schema.md) for the data gateway, or the IAM SSO config skill.
