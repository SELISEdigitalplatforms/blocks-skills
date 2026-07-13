# Get into a project (login → pick project → impersonate)

**Run this first, before any configuration call.** Configuring a Blocks service (data, IAM, …) happens *inside a project/tenant*, so you must obtain an **impersonated, project-scoped token**. This flow is shared by all Blocks configuration skills — the steps are identical whether you're configuring the data gateway or IAM SSO.

It produces three things the config flows use:
- `ACCOUNT_TENANT` — the **bootstrap/account tenant id**, from the login token's `tenant_id` claim. Used only to enter a project: `Project/Gets`, impersonation status, and `impersonate`.
- `PTENANT` — the **target project's tenant id** (from Project/Gets, or given by the user). This is the **project scope** for configuration: put it in **`projectKey`** (and equivalent body/query fields) on every in-project service call. It is **not** the `x-blocks-key` on configuration calls — that stays `ACCOUNT_TENANT` (see below).
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
Tokens are short-lived (~5 min). If a later call returns `session_expired`/401, run **[Token renewal](#token-renewal-401--session_expired)** below instead of retrying with a stale `PTOK`.

## Step 2 — List the projects, pick one

```bash
curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  "${bootstrap_hdr[@]}"
```
The response is a **bare JSON array of tenant-groups**, each `{ tenantGroupId, projects[], isShared, nonSharedProject }`. Each entry in **`projects[]`** has at least:
- `name`, **`tenantId`** (→ `PTENANT`), `organizationId`, `itemId`, `isProduction`
- **`environment`** — segregates which environment the user is working in (e.g. `Development`, `Staging`, `Production`)
- **`applications[]`** — array of app entries; each has a **`domain`** property — this is the **applicationDomain** (often a full URL like `https://dfsgso.slsblx.com`)

There is **no** top-level `applicationDomain` on the project object — read it from **`applications[].domain`**.

**Picking a project:** match the user's project name if given; otherwise list `name` + `environment` and ask. **Picking an environment:** if only one project (or one distinct `environment`) matches, use it; if several environments exist, ask which environment the user is working on.

**Resolving applicationDomain:** from the chosen project, inspect **`applications[]`**:
- **One application** → use its `domain`.
- **Multiple applications** → the domains may look like `https://dfsgso.slsblx.com`, `https://other.slsblx.com` — **ask the user which to pick** if it's not obvious from context.
- Strip the URL scheme for hosts/cert/dev-server use: `https://dfsgso.slsblx.com` → `dfsgso.slsblx.com`.

See **[blocks-frontend-local-https](../../blocks-frontend-local-https/flows/setup-local-https.md)** for the full domain-resolution walkthrough (local HTTPS / OIDC `redirectUri`).

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
- If **false** (or pointed at a different tenant), request an impersonated token. **`impersonate` requires a `client_id`** in the body (verified live) — without it the endpoint returns `401 {"error":"invalid_client","error_description":"Client configuration not found"}`. Use the fixed client id **`57214b67-aa9c-4307-92ab-a25e35180fac`** — a constant used **only** for this impersonate request (not a per-project or derived value, so don't compute it). Impersonate on the **standard host** (`$BLOCKS_API_URL/iam/v4`, same base as every other call — there is no separate host):

```bash
CLIENT_ID="57214b67-aa9c-4307-92ab-a25e35180fac"   # fixed constant, only for the impersonate request

PTOK=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth/impersonate" \
  "${bootstrap_hdr[@]}" -H "Content-Type: application/json" \
  --data "{\"targeted_tenant_id\":\"$PTENANT\",\"refresh_token\":\"$RT\",\"client_id\":\"$CLIENT_ID\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```
Response is `{ "impersonation_mode": true, "access_token": "...", "expires_in": 10, "impersonation_session_id": "...", ... }`. Notes (verified live): **`client_id` is required** (the missing field was the cause of `invalid_client`); the `refresh_token` is **single-use** — a successful impersonate consumes it, so re-run step 1 to get a fresh one before retrying; **`expires_in: 10` is cosmetic** — the JWT's real lifetime is ~600s (check the `exp` claim). Send `targeted_tenant_id` (the target project tenant id), the `refresh_token`, and the fixed `client_id` — no `organization_id` needed. Impersonating into a tenant not shared with your account returns 403 `"Target tenant is not shared with the requesting user"` — pick a project from step 2's list. If the constant `client_id` above ever returns `invalid_client`, fall back to the account's `blocks-idp` client id from `GET /iam/v4/auth/identity-providers`. To end impersonation, `POST /iam/v4/auth/impersonation/stop` with `{ "refresh_token", "impersonation_id": "<impersonation_session_id>" }`.

## The header/key convention for every config call

Configuration for **data, IAM, storage, and localization** uses a strict split — do not swap these:

```bash
hdr=(-H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $PTOK")
# ...and put projectKey: $PTENANT (or ProjectKey) in request bodies / query params

assert_config_scope() {
  : "${ACCOUNT_TENANT:?missing bootstrap tenant; run get-into-project}"
  : "${PTENANT:?missing project tenant; run get-into-project}"
  : "${PTOK:?missing impersonated token; run get-into-project}"
  [ "$PTENANT" = "$ACCOUNT_TENANT" ] && {
    echo "ABORT: PTENANT equals ACCOUNT_TENANT; not impersonated into a project"
    return 1
  }
}
```

- **`x-blocks-key` header = `ACCOUNT_TENANT` (root tenant id), never `PTENANT`.** Verified for configuring data, IAM, storage, and localization — the header is always the root/account tenant; the impersonated token (`PTOK`) carries the project scope.
- **`Authorization` = `PTOK`** (the impersonated token). Do not use the raw login token for project-scoped admin/config calls.
- **`projectKey` / `ProjectKey` in bodies or query = `PTENANT`** — the target project's tenant id (same value as `targeted_tenant_id` in impersonate). This selects *which project* you are configuring; it does **not** replace `x-blocks-key`.
- **Guard before every config call:** run `assert_config_scope` and confirm `hdr` uses `$ACCOUNT_TENANT`, not `$PTENANT`, as `x-blocks-key`.

## Token renewal (401 / session_expired)

`PTOK` expires. When a configuration call returns 401 or `session_expired`, **do not** keep retrying the same token — renew and re-impersonate:

```bash
# 1) mint a fresh login access token
RENEW=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-token" \
  -H "x-blocks-key: $ACCOUNT_TENANT" -H "Content-Type: application/json" \
  --data "{\"refresh_token\":\"$RT\"}")
TOK=$(echo "$RENEW" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
RT=$(echo "$RENEW"  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('refresh_token', sys.argv[1]))" "$RT")
bootstrap_hdr=(-H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $TOK")

# 2) impersonate again (re-run step 3) to get a fresh PTOK for the same PTENANT
```

If `auth-token` fails (refresh revoked/expired), re-run **step 1** (`auth-login`) to obtain a new `RT`, then **step 3** to impersonate again.

Now continue with the service you're configuring — [configure-schema.md](configure-schema.md) for the data gateway, or the IAM SSO config skill.
