# Contributing

This repo is a set of Claude Code skills for the SELISE Blocks v4 API. The bar for every contribution is the same: **everything Claude might act on must be grounded in real, verified API behavior** — not assumed from a swagger read.

## Repo structure

```
skills/blocks-<name>/
├── SKILL.md            ← routing: auth model, endpoint map, key concepts, gotchas
├── flows/*.md          ← step-by-step procedures
│   └── get-into-project.md   ← the shared "initial steps" (configuration skills only)
├── endpoints.md        ← exact request/response contracts (where a skill warrants one)
└── references/react.md ← typed client + TanStack Query hooks (React 19 stack)
tools/generate-api-docs.py   ← optional bootstrap from swagger
```

Skills are **focused** — one clear job each (e.g. "GraphQL CRUD", "SSO configuration", "organizations"). Not every skill needs `endpoints.md` or `flows/`; include what the job needs. `skill-creator` is meta-tooling, not a product skill.

## Configuration vs. implementation (know which you're writing)

Every skill is one of two modes, and it changes the auth model and whether the initial steps apply:

- **Configuration** — admin action *on* a project (define schemas, wire SSO, seed roles, edit org settings). It happens inside a tenant, so it **requires the initial steps**: log in → `GET /os/v4/Project/Gets` → impersonate (`POST https://iam.seliseblocks.com/api/auth/impersonate` with `{ targeted_tenant_id, refresh_token }`). Calls use `x-blocks-key: <root-tenant-id>` + the impersonated token + `projectKey: <project-tenant-id>`. Configuration skills embed `flows/get-into-project.md` and every flow starts from it.
- **Implementation** — the frontend acting *as the signed-in user* (CRUD, uploads, SSO login, `/iam/me`). **No initial steps.** Uses the public **project key** (`x-blocks-key` = the project tenant id) + the user's session token.

Do not add the initial-steps flow to an implementation skill, and do not omit it from a configuration one. A management skill (users/roles/permissions/orgs) that serves both modes documents the two token sources explicitly rather than assuming one.

## The grounding rule (non-negotiable)

**Verify against the live API before you document it.** Drive the real endpoint with real credentials (a throwaway/dev project), and write down what actually happens:

- The **served path** — the swagger `basePath` `/api` is often *not* served (`/data/v4/...`, `/iam/v4/iam/...`). Confirm the real URL.
- The **real request and response shapes** — swagger frequently types responses as a bare `object` or omits them entirely. Capture the live shape; if you genuinely can't, write "response shape not documented — inspect the live response" and type it `unknown`. Never fabricate JSON.
- **Quirks, verbatim** — mutating GETs (a GET that needs a body → note it and how to call it from a browser), non-standard envelopes (`{isSuccess, organization}` vs `{data}`), casing splits (`refreshToken` vs `refresh_token`), list endpoints that are POST-with-body vs GET-with-query.
- **Integer enums have no member names** in swagger. Reference the numeric union and mark any interpreted meaning **unverified — confirm in the portal**.
- **Endpoints missing from swagger** (e.g. the GraphQL gateway) are discovered by introspection/probing and labeled as verified-live, with the method noted.

For hand-authored files, every path/method/field/header you write must match what you verified. Old v1 routes (`/idp/v1/`, `/uds/v1/`, …) are dead — use them only as recognition aliases in a `description`.

## Adding or improving a flow

1. Pick a real multi-step sequence a developer actually needs.
2. Create `skills/blocks-<name>/flows/<kebab-name>.md`:
   - **When to use + preconditions.** For configuration flows, the first precondition is running `get-into-project.md` (it exports `$ROOT`, `$PTENANT`, `$PTOK`/`hdr`). For implementation flows, state the project key + user token.
   - **Numbered steps:** `METHOD /path` — why, the fields the step turns on, what to keep from the response. Real, runnable curl where it helps.
   - **Branches and error paths** (401 / `session_expired` → re-login/impersonate; validation branches).
   - A **Verify** section: which call confirms success and what to look for.
3. Add it to the SKILL.md routing table.

## Adding or improving a reference

`references/react.md` targets React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand. Include: a typed client slice (fetch wrapper adding `x-blocks-key` + Bearer, base URL from `VITE_` env, 401-refresh-retry), hooks for the highest-value endpoints, and one realistic component. Client-safe values only in `VITE_` vars — the project key is public; tokens come from the auth store at runtime. Keep it ~150–300 lines.

## Adding a new skill

1. **Decide the mode** (configuration vs implementation) and the one job it owns. Keep it focused — split rather than sprawl.
2. **Verify the endpoints live** (see the grounding rule). Optionally seed `endpoints.md` with `python3 tools/generate-api-docs.py <svc>`, then correct it against live behavior — the generator is a starting point, not ground truth.
3. **Write `SKILL.md`:** frontmatter `name` + a trigger-rich, third-person `description` (say what it does *and* the phrases/contexts that should invoke it; be a little "pushy" to avoid under-triggering); then the auth model, an endpoint map, key concepts (marked "verified live"), and gotchas.
4. **Configuration skill?** Copy `flows/get-into-project.md` from an existing configuration skill and point flows at it.
5. **Cross-link** related skills by name (config ↔ implementation, "store a fileId here, set it there"). Keep relative links valid.

## PR expectations

- **Live-verified, or labeled.** State that you drove the endpoints (and the date). Anything you couldn't verify is marked unverified in the text, not smoothed over.
- **Grounding check:** every route/field in a hand-authored file traces to something you verified or to that skill's `endpoints.md`.
- **Honesty over completeness:** undocumented responses, unnamed enums, and platform quirks are documented as such.
- **Right mode:** initial steps present iff the skill is configuration; correct token source described.
- Style: imperative, concrete, American spelling, tables over prose walls, no marketing language.
- Scope: one skill per PR where practical; keep cross-links resolving.

By contributing you agree your contributions are licensed under the MIT License.
