---
name: blocks-onboarding
description: "Onboard a user into SELISE Blocks before any other Blocks skill can run — detect their current state and get them to a working setup: no Blocks account yet (guide signup at https://os.seliseblocks.com), account but no project (ask what they want to build and create the project via API — suggest a dev-only default), project but no credentials file (have the user create the `.env`), or everything present (verify and hand off). Also covers adding more environments (test/stg/uat/prod/…) to an existing project and deleting environments, via API. Use whenever a user is new to Blocks, asks how to get started / sign up / create a project / add or remove an environment, or when a prerequisite fails in another skill — missing `.env` or `BLOCKS_USERNAME`, `auth-login` returns 401/invalid credentials, or `Project/Gets` returns no projects. Only SIGNUP is portal-only (browser, not API); project and environment management is scriptable. Run the preflight here whenever the user's account/project state is unknown."
---

# Blocks — Onboarding & Preflight

Every other Blocks skill assumes three things exist: a **Blocks account**, at least one **project**, and a **`.env`** with credentials (`BLOCKS_API_URL`, `BLOCKS_USERNAME`, `BLOCKS_PASSWORD`). This skill detects which of those are missing and closes the gap — from "never heard of Blocks" to a state where the configuration skills' initial steps (`get-into-project`) just work.

## Probe first, ask second

Most state is discoverable — don't interrogate the user. Run **[scripts/preflight.sh](scripts/preflight.sh)** (or make the equivalent calls) and branch on the exit code:

| Exit | State | What to do |
|---|---|---|
| `2` | No `.env` / vars missing | Ask one question: *"Do you already have a Blocks account?"* No → [flows/first-time-setup.md](flows/first-time-setup.md). Yes → have them create the `.env` (below), re-run preflight. |
| `3` | Login failed (401 / error) | Wrong username or password. Have the user re-check the `.env` values or reset the password via the portal login page (https://os.seliseblocks.com). Re-run preflight. |
| `4` | Account OK, **no projects** | **Proactively ask what they want to build**, propose a project (name + `dev` environment as the default), and create it via API — [flows/manage-projects.md](flows/manage-projects.md). Re-run preflight to verify. |
| `0` | Ready | Preflight prints the projects (`name · environment · tenantId`). Confirm which project + environment the user means, then continue with the skill that brought you here. |

When preflight succeeds, present the discovered projects and **confirm** — never guess a project or environment. If several environments exist for the chosen project, ask which one.

## Handing off to the portal

**Only signup is portal-only** (captcha-protected — do not try to script it). Hand off explicitly: tell the user exactly what to do in the browser (see [flows/first-time-setup.md](flows/first-time-setup.md)), ask them to tell you when they're done, then **verify by re-running preflight** rather than taking "done" on faith. Projects and environments, by contrast, are created, extended, and deleted **via API** — [flows/manage-projects.md](flows/manage-projects.md).

## Be proactive about project setup

Once credentials work, don't stall waiting for instructions — **ask the user what they want to do and how the project should look**, and propose a concrete default:

- **Default suggestion: one project, one `dev` environment.** Environments are cheap to add later (`test`, `stg`, `uat`, `prod`, …) and can be deleted again, so starting minimal is never a mistake — say so explicitly.
- Confirm the **project name** (suggest one from what they're building) before creating.
- Creation, adding environments, and deleting environments are all in [flows/manage-projects.md](flows/manage-projects.md) — each mutation is confirmed with the user first and verified with `Project/Gets` after.

## Credentials & `.env` — the user writes it

- Ask the **user** to create the `.env` file themselves (editor or `nano .env`) — don't have them paste their password into the chat, and never echo `BLOCKS_PASSWORD` back in any output or command.
- Required contents:
  ```bash
  BLOCKS_API_URL=https://api.seliseblocks.com
  BLOCKS_USERNAME=<their login email>
  BLOCKS_PASSWORD=<their password>
  ```
- Make sure `.env` is in `.gitignore` before anything is committed. `ACCOUNT_TENANT`, `PTENANT`, and `PTOK` are **not** `.env` values — they're derived at runtime by the initial steps.

## What to ask up front (once ready)

Answers that determine routing and configuration, in one batch rather than dribbled out:

1. **Which project + environment** (offer the preflight list) — or, if none exist, **what to name the new project and which environments it needs** (suggest `dev` only; more can be added/removed later — [flows/manage-projects.md](flows/manage-projects.md)).
2. **What are they building** — data model / CRUD app / SSO / translations / file upload → picks the skill.
3. **App domain** — on `*.seliseblocks.com`, or a custom domain? (Custom domain changes the frontend API base URL — see the SSO implementation skill.)
4. **Frontend stack** — the `blocks-construct-react` boilerplate or something else? (The `references/react.md` files target Construct.)

## Portal-only vs. API

| Action | Where |
|---|---|
| Sign up / reset password | Portal only (https://os.seliseblocks.com) |
| Create a project / add or delete environments | **API** — [flows/manage-projects.md](flows/manage-projects.md) (portal works too) |
| Generate mock/sample data | Portal only (API can inventory + delete) |
| Trust a local dev certificate | User's OS (manual) |
| Everything else in this repo | API — covered by the `blocks-*` skills |

## Gotchas

- **`auth-login` is the only Blocks call with no `x-blocks-key`** — if preflight's login fails with a key-related error, something else is wrong (URL typo, proxy).
- **Tokens are short-lived (~5 min).** Preflight output is a snapshot; the configuration flow re-logs-in via its own initial steps.
- **An empty `Project/Gets` is not an error** — it means "no project yet"; route to project creation ([flows/manage-projects.md](flows/manage-projects.md)), don't retry.
- **`Project/Disable` with the bootstrap token is a silent no-op** — it returns `isSuccess: true` but deletes nothing; it needs an impersonated token. Always verify mutations via `Project/Gets` (see [flows/manage-projects.md](flows/manage-projects.md)).
- **Never commit `.env`**, and never put `BLOCKS_PASSWORD` or `PTOK` in a `VITE_`-prefixed var or any frontend code.
