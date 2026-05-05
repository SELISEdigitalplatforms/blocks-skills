# check-env-files

Verifies that a project has the required `.env` files with the necessary environment variables for deployment.

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Look for Environment Files

Check for the existence of these files in the project root:

- `.env.dev` — development environment
- `.env.prod` — production environment

For Next.js standalone projects, the canonical pattern only requires these two files. There is no `.env.stg` — staging uses `build:dev` with the staging API URL in `.env.dev`.

For Vite/Angular projects, also check:
- `.env.stg` — staging environment

Use glob patterns or file search to verify presence.

### Step 2: Verify Required Variables in Each Env File

Each env file must contain the required variables based on the framework:

**Next.js required variables:**
- `NEXT_PUBLIC_BLOCKS_API_URL` — API endpoint URL for the environment
- `NEXT_PUBLIC_X_BLOCKS_KEY` — Blocks project key

**Next.js optional variables:**
- `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID` — OIDC client ID for authentication
- `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI` — OIDC redirect URI

**Vite required variables:**
- `VITE_API_BASE_URL` — API endpoint URL for the environment
- `VITE_X_BLOCKS_KEY` — Blocks project key
- `VITE_PROJECT_SLUG` — Project identifier
- `VITE_BLOCKS_OIDC_CLIENT_ID` — OIDC client ID for authentication

**Vite optional variables:**
- `VITE_BLOCKS_OIDC_REDIRECT_URI` — OIDC redirect URI
- `VITE_CAPTCHA_SITE_KEY` — CAPTCHA site key
- `VITE_CAPTCHA_TYPE` — reCaptcha or hCaptcha

### Step 3: Check Variable Consistency

- All env files should have the same variable keys (values differ per environment)
- API URLs should point to the correct environment endpoint
- The `.env.prod` file should use placeholder values if deploying via Cloud Portal Direct

### Step 4: Security Check

- Ensure no real credentials are embedded in templates — use placeholder comments like `# NEXT_PUBLIC_X_BLOCKS_KEY = <your-project-key>`
- The env file templates should guide users to fill in values via the Blocks Cloud Portal

## Output Format

Return a structured report:

```
.env files check:
✅ .env.dev — Present (2 required vars found)
✅ .env.prod — Present (2 required vars found)
⚠️  NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID — Optional, missing
```

## If Missing

If any env files are missing or have missing variables:

1. Offer to generate env file templates from `references/env-variables.md`
2. Remind the user to fill in placeholder values with actual credentials from the Blocks Cloud Portal
3. Do NOT generate files with real credentials — use placeholder comments

## Reference

See `references/env-variables.md` for full variable documentation and `references/canonical-example.md` for the canonical example.

---

## Verification Checklist

After checking env files, verify your report includes:

- [ ] Each env file checked individually (`.env.dev`, `.env.prod`)
- [ ] For Next.js: `NEXT_PUBLIC_BLOCKS_API_URL`, `NEXT_PUBLIC_X_BLOCKS_KEY` verified
- [ ] For Vite: `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY`, `VITE_PROJECT_SLUG`, `VITE_BLOCKS_OIDC_CLIENT_ID` verified
- [ ] Optional variables noted: `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID`, `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI`
- [ ] Placeholder values detected (`<your-project-key>`, `<placeholder>`) — not real credentials
- [ ] API URLs match environment (dev/prod endpoints)
- [ ] Structured output format used (✅ present, ⚠️ optional missing, ❌ required missing)
- [ ] If generating templates: placeholder comments used, no real credentials
