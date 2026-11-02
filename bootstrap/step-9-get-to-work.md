# Step 9 — Get to work (only if asked)

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 8](step-8-report.md).

Steps 0–8 are a file copy and stop there. Run this step **only** when the user asked to continue into project work — by supplying an `x-blocks-key`, or by asking to be signed in, set up, or shown around. In a repo that is already bootstrapped, this is the only file you need.

This step does not reimplement bootstrap. The skill you just installed owns that flow: read `.agents/skills/blocks-bootstrap/SKILL.md` and follow it. What is below is only the entry point — which branch to enter on, and what to show at the end.

**The user never supplies a URL.** The CLI's endpoints are built in and self-correcting. The only URL you ever mention is the **portal**, `https://os.seliseblocks.com`, and only for what the CLI genuinely cannot do: **create an account**, and add further environments to a project that already exists. Creating the project itself is no longer portal-only — `blocks projects create` does it. Never ask "what's your Blocks OS URL" — there isn't one to ask for.

## Prerequisite — the CLI

Run `blocks --version`. If it's missing, **ask before installing** (`npm install -g @seliseblocks/cli-os@latest`) — never install it unprompted. If the user declines, stop and report; nothing past here works without it.

## Branch A — the user supplied an `x-blocks-key`

1. `blocks auth status --json`. If not logged in, run `blocks login` **yourself** — it's a device-code flow, so read back the verification URL and user code it prints so the user can approve. Re-run `blocks auth status --json` to confirm rather than assuming it worked.
2. `blocks use <x-blocks-key>` — the key *is* the project tenant id, so it's the literal argument.
3. If selection fails, don't guess at the key. Run `blocks projects list --json` and show what the account can actually reach; the usual cause is a key belonging to a different account, or a typo.
4. Continue to **The brief**.

## Branch B — greenfield: no key, unknown state

1. `blocks auth status --json`.
2. **No account yet?** Signing up is the one thing the CLI can't do. Send them to `https://os.seliseblocks.com` to create an account and wait — don't proceed on the assumption it worked.
3. `blocks login` (device-code, as above).
4. `blocks projects list --json`. Show the full list; never silently adopt a prior session's selection.
   - **Empty?** Create one with the CLI — `blocks projects create "<name>"`. Ask for a name (3–100 characters) and get explicit consent before running it: the call **accepts the Blocks terms on the user's behalf** (`isAcceptBlocksTerms`, `isUseBlocksExclusively`), which is not yours to accept silently. Run `blocks help projects create --json`, then `--dry-run --json`; use `--yes` only after approval. It creates exactly one app in the `dev` environment, and the platform replaces the placeholder domain with the assigned domain. It does not select the project, so continue to step 5. Add further environments from the portal (`https://os.seliseblocks.com`); there is no CLI path for that.
   - **One or more?** Ask which project, and which environment. Don't pick for them.
5. `blocks use <x-blocks-key>` with the chosen project's key.
6. Continue to **The brief**.

## The brief

Before asking what to build, show what's already there. All read-only:

```bash
blocks projects list --json                 # selected project + everything else reachable
blocks auth oidc-clients list --json        # is the app's browser client registered?
blocks auth config get --json               # isOidcEnabled
blocks data schema list --json              # what is already modelled
blocks localization language list --json    # which languages exist
```

Summarize it plainly: project name, key, and app domain; how many other projects the account can reach; whether login is actually wired up (`isOidcEnabled`, plus whether a public OIDC client exists); the existing schemas; the configured languages. Then ask what they want to build.

Two failures this prevents: proposing a schema that already exists, and scaffolding an app whose login silently cannot work because `isOidcEnabled` is `false`.

If one of these commands fails, report that line as unavailable and continue — a missing schema list is no reason to abandon the summary. `data schema list` failing usually just means no data source is configured yet, which is itself worth saying.

## Then hand off

Route the user's answer through the routing table in the `AGENTS.md` you just installed. Don't re-derive any flow here — the skills own it.
