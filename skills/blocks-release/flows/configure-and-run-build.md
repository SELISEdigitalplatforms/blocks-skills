# Configure build settings and run a build

Use when the user wants to deploy code: pick a repo, set (or confirm) its hosting configuration,
trigger a build, and watch it finish.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup); GitHub authorized and the repo
visible to the service (see `connect-github.md`). `projectKey` in request bodies = your Blocks
Key — the same value as `$X_BLOCKS_KEY`.

Endpoints: `../endpoints.md#build`. Base URL: `https://api.seliseblocks.com/release/v4`.

## Steps

1. `GET /api/Build/repos-list` — list repos the release service knows about; pick the target and
   keep its `repoId`. Response shape not documented in swagger — inspect the live response. If the
   repo is not listed, it has not been registered for builds yet — register it in OS portal (no
   dedicated "connect repo" endpoint is exposed in the v4 swagger; `POST /api/Build/repo-update`
   only associates repo↔domain pairs, see `custom-domains.md`).

2. `GET /api/Build/settings` — fetch the hosting catalog available to this project. Response shape
   not documented in swagger, but the request-side types in contracts.md (`HostingProvider` →
   `Region` → `MachineConfig`, each with `id`/`name`/`status`, machine specs with
   `ram`/`cpu`/`bandwidth`) tell you what to look for. Collect the `id`s of the provider, region,
   and machine config the user picks.

3. `GET /api/Build/repo-details?RepoId=<repoId>` — current settings for the repo (note PascalCase
   `RepoId`). Response shape not documented in swagger. If the repo already has the desired
   hosting configuration, skip step 4.

4. `POST /api/Build/repo-settings-update` — persist hosting/deployment settings. Body
   (`RepoUpdateRequest`, all fields optional — send what you're changing):

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",
     "repoId": "<repoId>",
     "hostingProviderId": "<from step 2>",
     "regionId": "<from step 2>",
     "machineConfigId": "<from step 2>",
     "deploymentType": "<string — allowed values not documented in swagger; check repo-details/Portal>",
     "customDomain": "<optional, see custom-domains.md>"
   }
   ```

   The body also accepts a nested `deploySettings` object (full `HostingProvider`/`Region`/
   `MachineConfig` structures — see endpoints.md); the flat `*Id` fields are the simpler path.
   Response shape not documented in swagger — check `isSuccess` if the envelope is present.

5. `POST /api/Build/manual` — trigger the build. Body (`RepoBuildRequest`):

   ```json
   {
     "repoId": "<repoId>",
     "projectKey": "<X_BLOCKS_KEY>",
     "hostingProviderId": "<optional override>",
     "regionId": "<optional override>",
     "machineConfigId": "<optional override>"
   }
   ```

   Documented response (`BuildResponse`): `{ isSuccess, errors, data, message, statusCode, buildId }`.
   On `isSuccess: true` keep `buildId`. On `isSuccess: false` surface the `errors` dictionary
   (`{ field: message }`) to the user.

   Alternative: `POST /api/Build/run-build` takes the same body, but its response and its
   difference from `manual` are not documented in swagger. Prefer `manual`; only use `run-build`
   after testing it against the project.

6. Poll `GET /api/Build?buildId=<buildId>` until the build reaches a terminal state. Response
   shape not documented in swagger — inspect the first response to find the status field, then
   poll every ~10s with a timeout. Historically statuses were strings like Succeeded/Failed —
   verify against the live payload rather than assuming.

7. `GET /api/Build/reports?buildId=<buildId>` — pull reports/artifacts once terminal (see
   `build-reports-and-analytics.md` for the report/analytics details).

### Branches / error paths

- **401** → refresh the token per blocks-setup and retry once.
- **`isSuccess: false` on trigger** → read `errors` (dictionary keyed by field). Typical causes:
  missing hosting settings (redo step 4), repo not registered (step 1), branch/webhook problems
  (see `connect-github.md`).
- **Build stuck non-terminal** → keep the `buildId` and check reports plus OS portal logs;
  build cancellation is not exposed in the v4 swagger.

## Verify

- Step 5 returned `isSuccess: true` and a non-null `buildId`.
- `GET /api/Build?buildId=…` shows a terminal success state.
- `GET /api/Build/repo-details?RepoId=…` reflects the settings you wrote in step 4 (field names in
  the response are undocumented — compare against what you sent).
- The deployed app responds on its domain (default platform domain or the repo's `customDomain`).
