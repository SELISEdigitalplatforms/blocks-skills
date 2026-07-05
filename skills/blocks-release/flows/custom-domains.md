# Assign custom deployment domains

Use when a deployed app should be served from the user's own domain (e.g. `app.example.com`)
instead of the default platform domain — for one repo or for several repos in one environment.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup); repo registered for builds
(`GET /Build/repos-list` shows it); the user controls DNS for the domain.

Endpoints: `../endpoints.md#build`. Base URL: `https://api.seliseblocks.com/release/v4`.

## Steps

1. `GET /Build/repos-list` — get the `repoId`(s) to map. Response shape not documented in
   swagger — inspect.

2. `GET /Build/repo-details?RepoId=<repoId>` — check the current `customDomain` /
   deployment state before changing anything (PascalCase `RepoId`; response shape not documented
   in swagger).

3. Pick one of two write paths:

   **A. Single repo, alongside other settings** — `POST /Build/repo-settings-update`
   (`RepoUpdateRequest`; `projectKey` = your Blocks Key — the same value as `$X_BLOCKS_KEY`):

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",
     "repoId": "<repoId>",
     "customDomain": "app.example.com"
   }
   ```

   Response shape not documented in swagger.

   **B. Batch, per environment** — `POST /Build/repo-update` (`RepoDomainUpdateRequest`):

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",
     "projectEnv": "<environment name — allowed values not documented in swagger; match what OS portal shows>",
     "repoWithDomains": [
       {
         "repoId": "<repoId>",
         "repoUrl": "<repo URL>",
         "customDeploymentDomain": "app.example.com"
       }
     ]
   }
   ```

   This one has a documented response (`BaseApiResponse`): check `isSuccess`; on failure read the
   `errors` dictionary. Note the field name difference: `customDomain` in path A,
   `customDeploymentDomain` in path B — copy exactly.

4. Point DNS at the deployment. The release swagger exposes no DNS-verification endpoint;
   platform-wide domain verification lives in the **blocks-monitor** skill (Domain controller) —
   use it (or OS portal) to add and verify the domain, and set the DNS record (typically a
   CNAME to your platform domain — confirm the exact target in OS portal).

   **Auth cookies on the new domain:** configure the project's cookie domain to match —
   `POST /monitor/v4/Domain/Configure` with `{ projectKey, cookieDomain }` (blocks-monitor).
   Without this, the app serves but sessions/cookies fail on the custom domain. A few follow-up
   tweaks are commonly needed (exact domain form, re-login) — verify against your project.
   Read back the effective values via `GET /os/v4/Project/Gets` (`cookieDomain`,
   `customDomain`, `isDomainVerified`).

5. Redeploy if needed — trigger a build (`configure-and-run-build.md`) so the new domain binding
   is applied to a live deployment.

### Branches / error paths

- **401** → refresh token per blocks-setup, retry once.
- **`isSuccess: false` from repo-update** → `errors` dictionary explains per-field problems
  (bad `projectEnv`, unknown `repoId`, malformed domain).
- **Domain serves but with a certificate error** → certificate/domain provisioning status is not
  exposed in this swagger; check the Domain tooling in blocks-monitor / OS portal.

## Verify

- `GET /Build/repo-details?RepoId=<repoId>` reflects the new domain (response fields are
  undocumented — compare against what you sent).
- After DNS propagation and a deploy, `https://app.example.com` serves the app with a valid
  certificate.
