# Read build reports and wire code analytics

Use when the user asks "why did my build fail?", wants test/quality output for a build, or wants
SonarQube (code quality) / DependencyTrack (dependency vulnerabilities) attached to their builds.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup); a `buildId` from a triggered build
(`POST /api/Build/manual` returns one — see `configure-and-run-build.md`).

Endpoints: `../endpoints.md#build` and `../endpoints.md#analyticstool`.
Base URL: `https://api.seliseblocks.com/release/v4`.

## Steps

1. Get a `buildId`. Either from the trigger response (`BuildResponse.buildId`) or by asking the
   user / checking OS portal build history. `GET /api/Build?buildId=<id>` confirms the build
   exists and its state (response shape not documented in swagger — inspect).

2. `GET /api/Build/reports?buildId=<buildId>` — fetch all reports for the build. Response shape
   not documented in swagger — inspect the live response before parsing.

3. Optionally filter: `GET /api/Build/reports?buildId=<buildId>&type=<type>`. The set of valid
   `type` values is **not documented in swagger** — call without `type` first and derive the
   available values from what comes back, rather than guessing names.

4. Wire SonarQube: `GET /api/AnalyticsTool/ProcessSonarQubeUser?buildId=<buildId>`.
   Based on the route name this provisions/links a SonarQube user for the build's analysis; the
   swagger documents neither the response nor the exact semantics — treat both as unverified and
   inspect the live response. `buildId` is optional in the swagger; behavior without it is
   undocumented.

5. Wire DependencyTrack: `GET /api/AnalyticsTool/ProcessDependencyTrackUser?buildId=<buildId>`.
   Same caveats as step 4: name-inferred semantics, no documented response shape.

### Branches / error paths

- **401** → refresh token per blocks-setup, retry once.
- **Empty/404-ish reports on a fresh build** → reports may only exist after the build reaches a
  terminal state; poll `GET /api/Build?buildId=…` first.
- **Analytics endpoints return an error** → SonarQube/DependencyTrack may not be enabled for the
  project. Enabling the tools themselves is not exposed in the v4 swagger — do it in OS portal,
  then re-run steps 4–5.

## Verify

- Step 2 returns report content for the build (non-empty payload).
- After steps 4–5, the SonarQube / DependencyTrack dashboards linked from OS portal show the
  project/user, and subsequent builds carry analysis results in their reports.
- Nothing here can be verified from swagger alone — all five endpoints in this flow have
  undocumented response shapes, so confirm against the live project once and record what you saw.
