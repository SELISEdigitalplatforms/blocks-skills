# First-time setup (signup → first project → `.env`)

The two browser steps an agent cannot do for the user, plus the credentials file. Hand off, wait, verify with [../scripts/preflight.sh](../scripts/preflight.sh) after each step — don't assume.

## Step 1 — Sign up (no Blocks account yet)

Send the user to **https://os.seliseblocks.com** and tell them to create an account (a free tier exists; email verification is part of signup). What to tell them:

- Use an email + password they'll put in the `.env` afterwards — social login works for the portal, but the skills' CLI login (`/iam/v4/auth-login`) needs a **username + password**, so a password must be set on the account.
- Come back and say when the account is ready.

Verify: have them create the `.env` (step 3), then run preflight — exit `4` (no projects) confirms the account + credentials work.

## Step 2 — Create the first project (account, but `Project/Gets` is empty)

Projects are created in the portal, not via API. Tell the user, in **https://os.seliseblocks.com**:

1. Create a new project — pick a name (provisioning takes a few minutes).
2. Note which **environment** they're setting up (e.g. Development); the skills will ask.
3. Say when it's done.

Verify: re-run preflight — exit `0` and the project appears with its `tenantId`.

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
| preflight exit `4` after project creation | Provisioning not finished, or wrong account | Wait a few minutes, re-run; confirm the user created the project under the same account as the `.env` |
| Login succeeds in the portal but preflight exit `3` | Portal uses social login; no password set | Set a password on the account (portal profile/security settings) |
