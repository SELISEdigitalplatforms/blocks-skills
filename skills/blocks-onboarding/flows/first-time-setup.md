# First-time setup (signup → `.env` → first project)

The one browser step an agent cannot do for the user (signup), the credentials file, and the first project (which the agent creates via API). Verify with [../scripts/preflight.sh](../scripts/preflight.sh) after each step — don't assume.

## Step 1 — Sign up (no Blocks account yet)

Send the user to **https://os.seliseblocks.com** and tell them to create an account (a free tier exists; email verification is part of signup). What to tell them:

- Use an email + password they'll put in the `.env` afterwards — social login works for the portal, but the skills' CLI login (`/iam/v4/auth-login`) needs a **username + password**, so a password must be set on the account.
- Come back and say when the account is ready.

Verify: have them create the `.env` (step 3), then run preflight — exit `4` (no projects) confirms the account + credentials work.

## Step 2 — Create the first project (account, but `Project/Gets` is empty)

The **agent creates the project via API** — don't send the user to the browser for this. Be proactive:

1. Ask **what they want to build** and suggest a project name derived from it.
2. **Suggest a `dev`-only environment as the default** — tell the user more environments (`test`, `stg`, `uat`, `prod`, …) can be added at any time later and deleted again, so starting minimal costs nothing.
3. On the user's go-ahead, create it — [manage-projects.md](manage-projects.md) has the exact `Project/Create` call, and the add/delete-environment calls for later.

(The portal at https://os.seliseblocks.com works too, if the user prefers clicking.)

Verify: re-run preflight — exit `0` and the project appears with its `tenantId`.

> **Order note:** this step needs working credentials, so in practice it runs *after* step 3 (`.env`) — preflight exit `4` is exactly this state.

## Step 3 — The `.env`

The **user** writes this file in the working directory (never paste passwords through the chat):

```bash
BLOCKS_API_URL=https://api.seliseblocks.com
BLOCKS_USERNAME=<login email>
BLOCKS_PASSWORD=<password>
```

Then: add `.env` to `.gitignore`, run preflight, and continue with the skill that brought you here (its `flows/get-into-project.md` does the login → impersonate steps).

## If something fails

| Symptom | Meaning | Fix |
|---|---|---|
| preflight exit `2` | `.env` missing/incomplete | (Re)create it — step 3 |
| preflight exit `3` | Bad username/password | Re-check values; reset password at the portal login |
| preflight exit `4` after project creation | `Project/Create` didn't stick, or wrong account | Check the create response was `isSuccess: true`; re-run preflight; confirm the `.env` account is the one the project was created under. Don't blindly re-POST — check `Project/Gets` first ([manage-projects.md](manage-projects.md)) |
| Login succeeds in the portal but preflight exit `3` | Portal uses social login; no password set | Set a password on the account (portal profile/security settings) |
