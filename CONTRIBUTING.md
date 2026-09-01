# Contributing

This repo is a source of **agent instructions**, not application code. Nobody builds a Blocks app here — other repos consume these skills by vendoring the tree with [BOOTSTRAP.md](./BOOTSTRAP.md).

The bar for every contribution is the same: **everything must be grounded in behavior you actually ran** — not inferred from source, not assumed from a help string, not invented to fill a gap.

## Where things live

Skill *sources* are not in this repo. They live in [`SELISEdigitalplatforms/blocks-cli`](https://github.com/SELISEdigitalplatforms/blocks-cli/tree/main/blocks-skills) under `blocks-skills/`, which is what `BOOTSTRAP.md` vendors. The CLI does not bundle or serve the skill tree.

| Change | Repo |
|---|---|
| A skill's content — `SKILL.md`, flows, references | `blocks-cli`, under `blocks-skills/` |
| Routing table, hard rules, workflow | this repo, inside the `blocks-skills:distributable` markers in [AGENTS.md](./AGENTS.md) |
| The vendoring procedure | this repo, [BOOTSTRAP.md](./BOOTSTRAP.md) |

A new skill needs both: the content in `blocks-cli`, and a routing-table row here. **A skill missing from the routing table is invisible to agents and is never vendored** — `BOOTSTRAP.md` treats that table as its manifest.

A skill directory looks like this:

```
blocks-skills/blocks-<name>/
├── SKILL.md            ← required: frontmatter + surface, key concepts, gotchas
├── flows/*.md          ← step-by-step procedures, where the job has them
├── references/*.md     ← app-code patterns (typed hooks, components, config)
└── scripts/*           ← executable helpers, where a skill needs one
```

Skills are **focused** — one clear job each. Most are a single `SKILL.md`; add `flows/`, `references/`, or `scripts/` only where the job needs them.

Because vendoring copies each skill directory on its own, **every relative link inside a skill must resolve within that directory**. Link to `flows/x.md` and `../SKILL.md` from a flow; never to a sibling skill or any path above the skill's own directory.

## CLI or SDK — know which you're writing

Every skill is anchored to one of two surfaces, and getting this wrong misroutes the whole skill:

- **CLI** — terminal and admin work, project-scoped: defining schemas, registering an OIDC client, authoring translations, managing other users, rotating secrets, triggering deploys. Every mutating command is shown as `--dry-run` first, then `--yes`.
- **SDK** — application code acting as the signed-in user, via `@seliseblocks/client`: reading and writing records, uploading files, the login flow, rendering translations, sending mail.

Some areas legitimately span both (a skill may cover admin CLI commands *and* the SDK calls an app makes). When that happens, say which half owns which task rather than blurring them.

**Never document a raw `fetch` or `curl` against the platform API.** If a capability appears to have no CLI or SDK path, that is the finding — write it down as such (as `blocks-notification` and `blocks-release-deployment` do) rather than reaching around the supported surface.

## The grounding rule (non-negotiable)

**Run it before you document it.** Drive the real command or SDK call against a throwaway/dev project, and write down what actually happened.

- **Exact commands and flags.** Copy them from a run that worked. Don't guess a flag name because it would be symmetrical with another command.
- **Real output shapes.** If you can't verify a response shape, say "response shape not verified — inspect the live response" and type it `unknown`. **Never fabricate output.**
- **Quirks, verbatim.** Where behavior is surprising, record it and why. `blocks-notifier` documents that `notifier unread` flattens its subscription filter into query params because Fetch forbids a GET body — that is the standard to match.
- **Absences are findings.** "No SDK namespace exists for this" and "this is CLI-only by design" belong in the skill, stated plainly.
- **Destructive commands** are documented with their `--dry-run` step and a note that confirmation is required.

Honesty beats completeness. An unverified detail marked unverified is fine; a smoothed-over guess is not.

## Writing a `SKILL.md`

Frontmatter is `name` plus a trigger-rich, third-person `description`. The description is the entire routing signal — an agent picks the skill from it alone, so it must carry:

1. **What the skill does**, concretely, naming the CLI commands or SDK namespaces involved.
2. **The phrases and situations that should invoke it** — including how a user would actually phrase it, symptoms and error messages included ("redirect loops", "a session that doesn't stick").
3. **What it is not**, naming the sibling skill that owns that instead.

Lean slightly pushy. Under-triggering is the common failure — a skill nobody routes to might as well not exist. Point 3 matters as much as point 1: most misrouting is between neighbors, so `blocks-notification` explicitly disclaims sending and points at `blocks-notifier`.

The body then covers the surface, key concepts, and gotchas. Keep the conversational flow in the skill; keep exact command contracts where they belong and don't restate them in two places.

## Adding or improving a flow

1. Pick a real multi-step sequence a developer actually needs.
2. Create `blocks-skills/blocks-<name>/flows/<kebab-name>.md`:
   - **When to use, plus preconditions** — what must already be true (logged in, project selected, schema reloaded).
   - **Numbered steps** with the real, runnable command or call: why the step exists, and what to carry forward from its output.
   - **Branches and error paths**, including what the failure actually looks like.
   - A **Verify** section: the command that confirms success, and what to look for in its output.
3. Add it to the routing table in `SKILL.md`.

## Adding or improving a reference

`references/*.md` targets the stack `blocks new web` scaffolds: **React 18 + TypeScript + Vite + TanStack Query**. Include a realistic slice of app code — hooks for the highest-value operations and one component that uses them — built on the single shared `blocksClient`. Keep it roughly 150–300 lines. Never put secrets in client-side code or env vars.

## Adding a new skill

1. **Decide the surface** (CLI, SDK, or both) and the one job the skill owns. Split rather than sprawl.
2. **Verify everything live** (see the grounding rule).
3. **Write `SKILL.md`** — frontmatter first; it decides whether the skill is ever used.
4. **Disclaim** the siblings it borders — name them in the description so misrouting between neighbors is caught. Do not link across skill directories; vendoring copies them independently.
5. **Add it to the routing table in [AGENTS.md](./AGENTS.md)** — inside the distributable markers — and to the skills list in [README.md](./README.md). A skill missing from the routing table is invisible to agents and is never vendored.

## PR expectations

- **Verified, or labeled.** State that you ran the commands, and when. Anything unverified is marked unverified in the text.
- **Grounding check:** every command, flag, and field traces to something you ran.
- **Correct surface:** CLI vs SDK stated, no raw HTTP anywhere, `--dry-run` shown before `--yes`.
- **Routable:** frontmatter description carries triggers *and* disclaimers; the skill is listed in `AGENTS.md` and `README.md`.
- **Links resolve** within the skill's own directory — no links to a sibling skill or above the directory.
- **No AI-tool attribution** anywhere — not in docs, comments, or commit messages.
- **Style:** imperative, concrete, American spelling, tables over prose walls, no marketing language.
- **Scope:** one skill per PR where practical.

By contributing you agree your contributions are licensed under the MIT License.
