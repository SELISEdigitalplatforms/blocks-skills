# Switch organization context; impersonate a user

Two token-reissue operations for multi-tenant apps:

- **Org switch** — a user who belongs to several organizations changes which org
  their token is scoped to.
- **Impersonation** — an admin temporarily acts as another user/tenant, then reverts.

> Note: impersonation is also the platform's standard mechanism for **entering a project
> context** — a cloud-level session impersonates into a project's tenant
> (`targeted_tenant_id`) before working in it. That developer-workflow variant is documented
> in `blocks-setup` → `flows/project-impersonation.md`; this flow covers the in-app admin
> use cases.

Both use **snake_case** bodies. Preconditions: authenticated (Bearer + `x-blocks-key`).
Multi-org must be enabled for switching (`isMultiOrgEnabled` — set via
`POST /api/iam/organizations/config`; the GET returns an untyped `object`, inspect live).

## Part A — Organization switch

1. `GET /api/iam/organizations/my` — the user's org memberships:

   ```json
   { "isSuccess": true, "organizations": [ { "itemId": "…", "name": "…", "createdDate": "…" } ] }
   ```

   Render these as the org picker. (The full org directory is
   `GET /api/iam/organizations`, but note its `Filter.Name` query param is marked
   required; `organizations/my` is the right call for a switcher UI.)

2. `POST /api/auth/switch-org` (endpoints.md → [Authentication](../endpoints.md#authentication)):

   ```json
   { "organization_id": "<itemId from step 1>" }
   ```

   Reissues the token pair scoped to the new organization. Response undocumented —
   expect new tokens; inspect live and replace both stored tokens. Roles and
   permissions are per-org (`roles: { "<orgId>": [...] }` on the user document), so
   the effective permissions change with the switch.

3. Refresh app state: re-fetch `GET /api/auth/me` / `GET /api/iam/me` and invalidate
   any cached, org-scoped queries.

## Part B — Impersonation (admin)

1. Start: `POST /api/auth/impersonate` — body fields exactly as in swagger:

   ```json
   {
     "targeted_tenant_id": "<tenant to act in>",
     "organization_id": "<org context>",
     "refresh_token": "<admin's current refresh token>",
     "impersonation_id": "<target user id>",
     "impersontingUserId": "<admin user id>"
   }
   ```

   Yes, `impersontingUserId` is spelled that way in the swagger — send it verbatim.
   Which fields are required, and the response shape, are undocumented — verify
   against the live API. Expect a token pair representing the impersonated context;
   store it separately from the admin's own tokens so you can revert.

2. While impersonating, call APIs with the impersonation access token. Check state
   anytime with `POST /api/auth/impersonation/status` (no body; response
   undocumented — inspect live).

3. Stop: `POST /api/auth/impersonation/stop`:

   ```json
   { "refresh_token": "<impersonation refresh token>", "impersonation_id": "<target user id>" }
   ```

   Reverts to the original admin context (response undocumented — expect the admin's
   token context restored; verify live).

Guardrails: gate the UI behind an admin role, banner the impersonated state
prominently, and never persist impersonation tokens beyond the session.

## Verify

- After switch-org: `GET /api/auth/me` reflects the new organization context, and an
  org-scoped call (e.g. `POST /api/iam/users` with `filter.org_id`) returns that
  org's data.
- During impersonation: `POST /api/auth/impersonation/status` reports it, and
  `GET /api/auth/me` returns the target user's claims.
- After stop: `GET /api/auth/me` returns the admin's claims again.
- Audit: events appear in `GET /api/iam/history` / `GET /api/iam/sessions`
  (filter by `Filter.UserId`).
