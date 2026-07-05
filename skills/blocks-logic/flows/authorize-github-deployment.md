# Authorize GitHub and pick a repo/branch for a logic deployment

Use when a logic deployment needs to read from GitHub: first-time GitHub connection,
checking an existing connection, browsing repos/branches to configure a deployment, or
revoking access. The build/release pipeline that consumes this authorization is the
`blocks-release` skill — this flow only establishes and inspects the GitHub connection.

Preconditions: token + `x-blocks-key` (`blocks-setup`); a GitHub account with access to
the target repositories.

All `/api/Deployment/*` endpoints ([endpoints.md#deployment](../endpoints.md#deployment))
return the `DeploymentDriverBaseApiResponse` envelope: check `isSuccess`, read the payload
from `data` (untyped `unknown` in swagger — inspect the live response for its shape), and
look at `error` / `reason` / `statusCode` on failure.

## Steps

1. `GET /api/Deployment/IsAuthorized` — check whether this project already has a GitHub
   authorization. `isSuccess` + the `data` payload tell you if a connection exists
   (payload shape undocumented — inspect live).

2. If not authorized, run the GitHub OAuth handshake:
   - Start the OAuth authorization from the Blocks OS portal (deployment/GitHub
     connect UI). The GitHub OAuth client and authorize URL are **not exposed in the v4
     swagger** — the portal initiates the redirect to GitHub.
   - After the user approves, GitHub redirects back with an authorization `code`.
   - `GET /api/Deployment/AccessToken?code=<code>` — exchanges the code and stores the
     resulting GitHub access token against the project. Only call this with a code
     produced by that OAuth redirect.

3. `GET /api/Deployment/GetUser` — confirm which GitHub identity is connected
   (login/account details arrive in `data`; shape undocumented — inspect live).

4. Browse repositories, either:
   - `GET /api/Deployment/GetRepos?Search=<text>&PageNumber=<n>&PageSize=<n>` — paged,
     searchable; use for large accounts, or
   - `GET /api/Deployment/GetReposList` — unpaged list.
   Keep the repo identifier your deployment needs from `data` (the exact field —
   name vs id — is undocumented; inspect live).

5. `GET /api/Deployment/GetBranches?repo=<repo>` — list branches for the chosen repo,
   then pick the branch the deployment should build from.

6. Optional sanity check: `GET /api/Deployment/GithubBranchExists?repoId=<repoId>` —
   verifies branch existence for a repo. It takes only `repoId` (no branch parameter in
   swagger), so which branch it checks — likely the one already configured for the
   deployment — is undocumented; verify against your live project.

7. Configure the deployment itself with the chosen repo/branch and run builds via the
   `blocks-release` skill — creating/running the CI pipeline is not part of
   `/api/Deployment/*` on this service.

Revoking access — two endpoints exist and swagger documents no difference between them;
verify behavior live before automating:
- `POST /api/Deployment/RemoveAuthorization`
- `DELETE /api/Deployment/DeleteAuthorization`
After revoking, re-run step 1 to confirm, and re-authorize via step 2 when needed.

Error paths:
- `401` on Blocks endpoints → refresh the Bearer token (`blocks-setup`).
- `isSuccess: false` with `error`/`reason` set → the stored GitHub token may be expired
  or revoked on the GitHub side; redo the OAuth handshake (step 2).
- Repo missing from `GetRepos` → the connected GitHub account lacks access to it, or the
  OAuth grant didn't include that org — reconnect with the right account/permissions.

## Verify

- `GET /api/Deployment/IsAuthorized` returns `isSuccess: true` with a positive payload.
- `GET /api/Deployment/GetUser` resolves to the expected GitHub account.
- `GET /api/Deployment/GetBranches?repo=<repo>` returns the branch you intend to deploy.
