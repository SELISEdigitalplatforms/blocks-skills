# Connect GitHub and enable auto-deploy

Use when a project has no GitHub link yet, when you need to browse repos/branches through the
release service, or when you want pushes to a repo to trigger builds automatically.

Preconditions: `x-blocks-key` header + Bearer token (see blocks-setup). No GitHub-side setup is
needed beyond an account that can grant OAuth access to the target repos.

All endpoints below are documented in `../endpoints.md#auth` and `../endpoints.md#github`.
Base URL: `https://api.seliseblocks.com/release/v4`.

## Steps

1. `GET /api/Auth/TestPing` — optional connectivity sanity check before debugging anything else.
   Response shape not documented in swagger — treat any 200 as "service reachable".

2. `GET /api/Auth/IsAuthorized` — is a GitHub account already linked to this project?
   Response shape not documented in swagger — inspect the live response; expect some boolean-ish
   indicator. If already authorized, skip to step 4.

3. Authorize GitHub. The OAuth *initiation* (GitHub consent screen) is **not exposed in the v4
   swagger** — start it from OS portal (project → CI/CD / GitHub integration). The swagger only
   exposes the code exchange:
   - `GET /api/Auth/AccessToken?code=<oauth_code>` — exchanges a GitHub OAuth `code` for a stored
     authorization. You only call this yourself if you obtained a `code` through your own OAuth
     redirect; the OS portal flow handles it for you. Response shape not documented in swagger.
   Re-run step 2 afterwards to confirm.

4. `GET /api/Github/user` — confirm *which* GitHub account is linked (avoid building against the
   wrong org/user). Response shape not documented in swagger — inspect; expect GitHub account info.

5. `GET /api/Github/repos?Search=<filter>&PageNumber=1&PageSize=20` — find the repository.
   All three query params are optional; `Search` filters by name, `PageNumber`/`PageSize` paginate.
   Keep the repo's identifier and full name from the response (shape not documented in swagger —
   inspect; you need whatever the platform uses as `repoId` and the `owner/name` string).

6. `GET /api/Github/branches?repo=<owner/name>` — list branches so the user can pick a deploy
   branch. For a quick existence check on an already-registered repo there is also
   `GET /api/Github/GithubBranchExists?repoId=<repoId>`. Note the casing: `repo` here, `repoId`
   there. Response shapes not documented in swagger.

7. `GET /api/Github/CreateWebhook?RepoId=<repoId>` — register the push webhook on the repo.
   **This GET mutates** (it creates a webhook on GitHub) — do not call it speculatively or retry it
   blindly. Note the PascalCase `RepoId`. Response shape not documented in swagger.

8. Nothing to call for the webhook itself: GitHub will now POST to
   `POST /api/Github/webhook?x-blocks-key=<key>` on every push (that is why the key is a query
   parameter — GitHub cannot send custom headers). You do not call this endpoint from your own
   code; it exists so that pushes trigger builds.

### Branches / error paths

- **401 on any step** → token expired; refresh per blocks-setup, retry once.
- **Step 2 says not authorized and no OS portal access** → you cannot complete this flow via
  API alone (no OAuth-initiation endpoint in v4); hand off to someone with Portal access.
- **Disconnect GitHub** → two endpoints exist and the swagger does not document the difference:
  `DELETE /api/Auth/DeleteAuthorization` and `POST /api/Auth/RemoveAuthorization`. Try
  `DELETE /api/Auth/DeleteAuthorization` first; verify with `GET /api/Auth/IsAuthorized`. If the
  authorization persists, try `POST /api/Auth/RemoveAuthorization`. Report which one worked so the
  user can note it.
- **Repo missing from `/api/Github/repos`** → the linked account lacks access to it, or the OAuth
  grant didn't include that org. Re-authorize with the right account/org scope (step 3).

## Verify

- `GET /api/Auth/IsAuthorized` reflects the linked state.
- `GET /api/Github/user` returns the expected account.
- On GitHub: repo → Settings → Webhooks shows a hook pointing at
  `…/release/v4/api/Github/webhook` after step 7.
- End-to-end: push a trivial commit to the deploy branch, then check that a new build appears
  (`GET /api/Build?buildId=…` once you have an id, or via the configure-and-run-build flow's
  listing steps / OS portal build history).
