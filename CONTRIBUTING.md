# Contributing

This repo is a set of Claude Code skills for the SELISE Blocks v4 API. The bar for every contribution is the same: **everything Claude might act on must be grounded in the generated swagger docs.**

## Repo structure

```
skills/blocks-<svc>/
├── SKILL.md            ← hand-authored: routing table, key concepts, flow index, gotchas
├── endpoints.md        ← GENERATED — every endpoint with exact params and shapes
├── contracts.md        ← GENERATED — TypeScript types for all schemas
├── flows/*.md          ← hand-authored: multi-endpoint procedures (3–6 per skill)
└── references/react.md ← hand-authored: typed client + TanStack Query hooks
tools/generate-api-docs.py   ← the generator
.swagger-cache/              ← cached swagger.json per service (gitignored)
```

This consolidated layout replaced the old per-endpoint `actions/` files, per-skill `README.md`, and `meta.json`. Do not add those back. `blocks-setup` is the one skill without generated files (it has no service swagger; it points to `blocks-iam`).

## The grounding rule (non-negotiable)

**Never hand-write or hand-edit endpoint documentation.** `endpoints.md` and `contracts.md` are generated from the live v4 swagger and are ground truth. If they are wrong or stale, regenerate them:

```bash
python3 tools/generate-api-docs.py              # all services
python3 tools/generate-api-docs.py iam data     # specific services
```

The generator reads `.swagger-cache/<svc>.json`, downloading from `https://api.seliseblocks.com/<svc>/v4/swagger/v1/swagger.json` on a cache miss. Delete a cached file to force a re-download.

For hand-authored files (SKILL.md, flows, references):

- Every endpoint path, HTTP method, request field, response field, header, and type name must exist **verbatim** in that skill's `endpoints.md` / `contracts.md`. Cross-references to another service's routes must name the owning skill.
- Never use old v1 routes (`/idp/v1/`, `/uds/v1/`, `/uilm/v1/`, `/lmt/`, `/deployment/v1/` are all dead). Old names may appear only as recognition aliases in SKILL.md descriptions.
- Many endpoints have **no response schema in swagger**. Say so explicitly ("response shape not documented in swagger — inspect the live response") and type them `unknown` in react.md. Do not fabricate response JSON.
- Integer enums have no member names in swagger. Reference the numeric union from contracts.md and flag any interpretation as unverified.
- If a logical step has no v4 endpoint, say so honestly ("not exposed in v4 — do this in OS portal instead"). Do not invent routes.

## Adding or improving a flow

1. Pick a real multi-step sequence developers actually need; keep each skill at 3–6 high-value flows.
2. Create `skills/blocks-<svc>/flows/<kebab-name>.md`:
   - When to use + preconditions (token? role? existing resources?).
   - Numbered steps: `METHOD /path` — why, the request fields the step turns on, what to keep from the response. Link `endpoints.md` anchors instead of duplicating shapes.
   - Branches and error paths (401 → refresh via `blocks-setup`; captcha/MFA branches; etc.).
   - A **Verify** section: which GET to call and what to look for.
3. Add a row to the skill's `## Flows` table in SKILL.md.

## Adding or improving a reference

`references/react.md` targets React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand. Content: a typed API client slice for the service (fetch wrapper adding `x-blocks-key` + Bearer token, base URL from env), hooks for the 4–8 most useful endpoints importing types from contracts.md by name, one realistic component sketch, and a pointer to `blocks-setup` for auth/refresh handling. Keep it roughly 150–300 lines.

## Adding a new service skill

When a service's v4 swagger is published (e.g. `studio`, `agent`):

1. **Register the service** in `tools/generate-api-docs.py`: add its key to `SERVICES`. If the service embeds shared platform controllers (or introduces controllers that other services will also serve), map each shared route tag to its canonical service in `SHARED_TAG_CANONICAL` — a shared route is documented in full only in its canonical skill; everywhere else it becomes a pointer-table line.
2. **Run the generator** for all services, not just the new one — adding a service can change pointer tables in existing skills:
   ```bash
   python3 tools/generate-api-docs.py
   ```
   This creates `skills/blocks-<svc>/endpoints.md` and `contracts.md`.
3. **Author the hand-written layers** following any existing skill as the pattern:
   - `SKILL.md` — frontmatter `name` + trigger-rich third-person `description` (≤ ~900 chars, include old v1 aliases as recognition words only), then Prerequisites (point to `blocks-setup`), "What's where" table, key concepts, flow index, conventions & gotchas, files list.
   - `flows/` — 3–6 flows per the template above.
   - `references/react.md`.
4. Read the generated `endpoints.md` **before** writing anything; note per-endpoint "no response schema" markers and carry them into flows and react.md.

## PR expectations

- **No hand edits to generated files.** If a PR touches `endpoints.md`/`contracts.md`, it must be the output of a generator run (say so in the description, with the date the swagger was fetched) or a change to the generator itself.
- **Grounding check:** every route/field added in hand-authored files must be traceable to the skill's generated docs. Reviewers will spot-check; a quick grep of new paths against `endpoints.md` before pushing saves a round trip.
- **Honesty over completeness:** unverified semantics, undocumented responses, and swagger quirks (typos, mixed casing, mutating GETs) are documented as such, never smoothed over.
- Style: imperative, concrete, American spelling, tables over prose walls, no marketing language.
- Scope: one skill (or the generator) per PR where practical.

By contributing you agree your contributions are licensed under the MIT License.
