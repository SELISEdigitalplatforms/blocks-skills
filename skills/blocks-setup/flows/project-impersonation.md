# Enter a project context via impersonation (cloud login → tenant impersonation)

SELISE Blocks is multi-tenant: **each project is a tenant**, and to work *inside* a project your
session must be impersonated into that project's tenant. The pattern: log in once at cloud level,
discover the project's `tenantId`, then `POST /api/auth/impersonate` with `targeted_tenant_id` —
the resulting session is project-scoped. Working in a different project means impersonating again
with that project's tenant id.

Endpoint shapes: `../../blocks-iam/endpoints.md#authentication` (impersonate) and
`../../blocks-os/endpoints.md#project` (project discovery). Several responses in this flow are
**not documented in swagger** — inspect the live payloads before wiring code to field names.

Preconditions: activated cloud account credentials; `.env` per
[bootstrap-project](bootstrap-project.md).

## Steps

### 1. Cloud login — `POST /iam/v4/api/auth/login`

Same call as bootstrap-project step 3, but with the **cloud-level `client_id`** instead of a
project slug:

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/login" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"$BLOCKS_CLOUD_CLIENT_ID\",
    \"username\": \"$BLOCKS_USERNAME\",
    \"password\": \"$BLOCKS_PASSWORD\"
  }"
```

The cloud `client_id` value comes from your Cloud Portal / SELISE onboarding — **verify in portal
UI** (it is not the project slug). Which `x-blocks-key` a cloud-level login expects (your
project-environment key, as shown, or a cloud-level one) is not documented in swagger —
**verify against your project**. Captcha/MFA branches behave exactly as in bootstrap-project.
Response 200 is undocumented in swagger — keep the access + refresh tokens (cloud-scoped).

### 2. Discover the project's tenant — `GET /os/v4/api/Project/Gets`

With the cloud token:

```bash
curl -s "$BLOCKS_API_URL/os/v4/api/Project/Gets?Filter.SearchKey=<project name>" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $CLOUD_ACCESS_TOKEN"
```

The documented response lists projects with, per project: `itemId`, `name`, **`tenantId`**,
`organizationId`, `environment`, `applicationDomain`, `cookieDomain`, `isCookieEnable`,
`customDomain`, `isDomainVerified`, `isProduction` (full shape:
`../../blocks-os/endpoints.md#project`). Pick your project (match `name` + `environment`) and keep:

- `tenantId` → the impersonation target (cache as `PROJECT_TENANT_ID` in `.env` to skip this step
  next time)
- `organizationId` → may be needed alongside the tenant id (see step 3)
- `cookieDomain` / `applicationDomain` / `customDomain` → the domain configuration that local
  HTTPS ([local-https-setup](local-https-setup.md)) and deployed domains must line up with

### 3. Impersonate into the project — `POST /iam/v4/api/auth/impersonate`

```bash
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/impersonate" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $CLOUD_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"targeted_tenant_id\": \"$PROJECT_TENANT_ID\"
  }"
```

Documented request fields (all optional/nullable in swagger): `targeted_tenant_id`,
`organization_id`, `refresh_token`, `impersonation_id`, and `impersontingUserId` (typo verbatim
from swagger). Whether `organization_id` or `refresh_token` must accompany `targeted_tenant_id`
is not documented — start with `targeted_tenant_id` alone and **verify against your project**.

Response 200 is **not documented in swagger** — expect project-scoped access/refresh tokens;
inspect the live payload for exact field names. From here on, use the impersonated token for all
project work (data schemas, localization keys, workflows, …) — the cloud token is only for
cloud-level operations like step 2.

### 4. Confirm the impersonated session

```bash
# whoami under the impersonated session
curl -s "$BLOCKS_API_URL/iam/v4/api/auth/me" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $PROJECT_ACCESS_TOKEN"

# impersonation status (response undocumented — inspect live)
curl -s -X POST "$BLOCKS_API_URL/iam/v4/api/auth/impersonation/status" \
  -H "x-blocks-key: $X_BLOCKS_KEY" \
  -H "Authorization: Bearer $PROJECT_ACCESS_TOKEN"
```

### 5. Leave the project context — `POST /iam/v4/api/auth/impersonation/stop`

"Revert to Original Admin" (swagger summary). Call it when switching projects or ending the
session; then impersonate again (step 3) with the next project's `tenantId`.

## Verify

- `GET /api/auth/me` with the impersonated token returns 200 and its claims reflect the project
  tenant (compare against the cloud-token `me` response — inspect live, shapes undocumented).
- A project-scoped call succeeds — e.g. `GET /data/v4/api/schemas` (blocks-data) returns the
  project's schemas instead of an authorization error.

## Related

- Acting as another **end user** (support/debugging) and org switching within a project:
  `blocks-iam` flow `org-switch-impersonation` — same endpoint family, different purpose.
- Token storage/refresh mechanics for whichever session is active: [token-lifecycle](token-lifecycle.md).
