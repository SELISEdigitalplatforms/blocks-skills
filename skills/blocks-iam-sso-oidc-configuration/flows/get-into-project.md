# Get into a project (login → pick project → impersonate)

**Run this first, before any configuration call.** Configuring a Blocks service (data, IAM, …) happens *inside a project/tenant*, so you must obtain an **impersonated, project-scoped token**. This flow is shared by all Blocks configuration skills — the steps are identical whether you're configuring the data gateway or IAM SSO.

It produces three things the config flows use:
- `ACCOUNT_TENANT` — the **bootstrap/account tenant id**, from the login token's `tenant_id` claim. Used only to enter a project: `Project/Gets`, impersonation status, and `impersonate`.
- `PTENANT` — the **target project's tenant id** (from Project/Gets, or given by the user). This is the key that matters after impersonation: sent as the **`x-blocks-key` header** *and* as **`projectKey`** on every in-project service call. A service call keyed with `$ACCOUNT_TENANT` is a bug.
- `PTOK` — the impersonated access token valid for the project. Use this token for all project-scoped admin/config calls. It is short-lived session output; do not treat it as a durable `.env` secret.

All verified live against `https://api.seliseblocks.com`.

## Step 1 — Log in, get the bootstrap account tenant id

```bash
set -a && . ./.env && set +a   # BLOCKS_API_URL, BLOCKS_USERNAME, BLOCKS_PASSWORD

LOGIN=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"username\":\"$BLOCKS_USERNAME\",\"password\":\"$BLOCKS_PASSWORD\"}")

TOK=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
RT=$(echo "$LOGIN"  | python3 -c "import sys,json;print(json.load(sys.stdin)['refresh_token'])")
# bootstrap account tenant id = the tenant_id claim inside the access token
ACCOUNT_TENANT=$(echo "$TOK" | cut -d. -f2 | python3 -c "import sys,base64,json;s=sys.stdin.read().strip();s+='='*(-len(s)%4);print(json.loads(base64.urlsafe_b64decode(s))['tenant_id'])")
bootstrap_hdr=(-H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $TOK")
```
Tokens are short-lived (~5 min). If a later call returns `session_expired`/401, re-run step 1 and impersonate again. Persist credentials and tenant ids in `.env`; regenerate `PTOK` per working session instead of relying on an old saved value.

## Step 2 — List the projects, pick one

```bash
curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  "${bootstrap_hdr[@]}"
```
The response is a **bare JSON array of tenant-groups**, each `{ tenantGroupId, projects[], isShared, nonSharedProject }`. Each `projects[]` entry has `name`, **`tenantId`**, `organizationId`, `applicationDomain`, `environment`, `isProduction`, `itemId`, …

- **If the user named a project/tenant**, find it in the array and confirm it's present.
- **Otherwise, ask the user which project to configure** — list the `name` + `environment` options. Don't guess.

Keep the chosen project's `tenantId` → `PTENANT` and `organizationId` → `PORG`:
```bash
# example: pick the first project (replace the filter with the user's choice)
PTENANT=$(curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  "${bootstrap_hdr[@]}" \
  | python3 -c "import sys,json;g=json.load(sys.stdin);print([x for grp in g for x in (grp.get('projects') or [])][0]['tenantId'])")
```

## Step 3 — Impersonate into the project

First check whether you're already impersonated:
```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/impersonation/status" \
  "${bootstrap_hdr[@]}"
# -> { "impersonated": bool, "originalTenantId": "...", "impersonatedTenantId": "..." }
```
- If `impersonated` is **true** and `impersonatedTenantId` is your target, you're done — use the current token.
- If **false** (or pointed at a different tenant), request an impersonated token. **Note the host: this call goes to `iam.seliseblocks.com/api`, not `api.seliseblocks.com/iam/v4`:**

```bash
PTOK=$(curl -s -X POST "https://iam.seliseblocks.com/api/auth/impersonate" \
  "${bootstrap_hdr[@]}" -H "Content-Type: application/json" \
  --data "{\"targeted_tenant_id\":\"$PTENANT\",\"refresh_token\":\"$RT\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```
Response is `{ "impersonation_mode": true, "access_token": "...", ... }`. Send just `targeted_tenant_id` (the target project's tenant id) and the `refresh_token` from login — no `organization_id` needed. Impersonating into a tenant not shared with your account returns 403 `"Target tenant is not shared with the requesting user"` — pick a project from step 2's list.

## The header/key convention for every config call

```bash
hdr=(-H "x-blocks-key: $PTENANT" -H "Authorization: Bearer $PTOK")
# ...and put projectKey: $PTENANT in request bodies too

assert_project_scope() {
  : "${ACCOUNT_TENANT:?missing bootstrap tenant; run get-into-project}"
  : "${PTENANT:?missing project tenant; run get-into-project}"
  : "${PTOK:?missing impersonated token; run get-into-project}"
  [ "$PTENANT" = "$ACCOUNT_TENANT" ] && {
    echo "ABORT: PTENANT equals ACCOUNT_TENANT; not impersonated into a project"
    return 1
  }
}
```

- **`x-blocks-key` header = `PTENANT`, never `ACCOUNT_TENANT`.** Configuration must run **after impersonation** and be **project-specific**: send the target project's tenant id (`PTENANT`). `ACCOUNT_TENANT` is a bootstrap-only key for entering the project; it must not appear in `hdr`, `projectKey`, or any project-scoped request.
- **Guard before every project-scoped call:** run `assert_project_scope` before sending a project admin/config request.
- **`Authorization` = `PTOK`** (the impersonated token). Do not use the raw login token for project-scoped admin/config calls.
- **`projectKey` in bodies = `PTENANT`** (the target project's tenant id).

Now continue with the service you're configuring — [configure-oidc.md](configure-oidc.md) for IAM SSO, or the data gateway configuration skill's schema flow.
