# check-build-config

Verifies that a project has the required build configuration: `package.json` with proper build scripts, `vite.config.ts` (or equivalent), and related tooling.

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Detect Project Type

Check the project root for:

- `package.json` + `vite.config.ts` → Vite/React project
- `package.json` + `angular.json` → Angular project
- `package.json` + `next.config.js` → Next.js project
- `*.csproj` → .NET/Blazor project
- `pubspec.yaml` → Flutter project
- `pom.xml` or `build.gradle` → Java project

### Step 2: Verify package.json Build Scripts

For Vite/React projects, `package.json` must have these scripts:

- `build:dev` or `build:development` — builds for dev environment
- `build:stg` or `build:staging` — builds for staging environment
- `build:prod` or `build:production` — builds for production environment
- `set-env` (optional but recommended) — runs `set-env.cjs` to switch env files

Example from `blocks-react-construct`:
```json
{
  "scripts": {
    "build:dev": "BUILD_ENV=dev npm run set-env && vite build",
    "build:stg": "BUILD_ENV=stg npm run set-env && vite build",
    "build:prod": "BUILD_ENV=prod npm run set-env && vite build",
    "set-env": "node set-env.cjs"
  }
}
```

### Step 3: Verify Build Tool Configuration

For Vite projects, check `vite.config.ts`:
- `envPrefix: 'VITE_'` — ensures Vite_ prefixed variables are exposed
- `build.outDir` — output directory (typically `build` or `dist`)
- `server.port` — dev server port (default 3000)

### Step 4: Verify set-env.cjs (Optional)

If `build:dev`/`build:stg`/`build:prod` call `set-env`, verify `set-env.cjs` exists in the project root. It should:
- Copy `.env.{env}` to `.env` based on `BUILD_ENV` environment variable
- Exit with error if the target env file doesn't exist
- Print a success message on completion

See `references/canonical-example.md` for the canonical `set-env.cjs` implementation.

### Step 5: Verify Node.js Version

Check `package.json` engines field or `.nvmrc` file for Node version compatibility. The `blocks-react-construct` reference uses Node 21.7.0.

## Output Format

```
Build configuration check:
✅ package.json — Present with build scripts (build:dev, build:stg, build:prod)
✅ vite.config.ts — Present
✅ set-env.cjs — Present
✅ envPrefix: 'VITE_' — Configured
❌ .nvmrc — Missing (add Node 21 for consistency)
```

## If Missing

If build configuration is missing:

1. Offer to generate `set-env.cjs` from the template
2. Offer to add build scripts to `package.json`
3. Offer to generate a `vite.config.ts` template
4. Remind the user that build scripts must match the CI/CD pipeline environment names (dev/stg/prod)

## Reference

See `references/canonical-example.md` for the canonical example and `references/env-variables.md` for required environment variables.

---

## Verification Checklist

After checking build configuration, verify your report includes:

- [ ] Project type detected (Vite/React, Angular, Next.js, .NET, Flutter)
- [ ] package.json present and scripts checked
- [ ] build:dev script calls set-env.cjs (BUILD_ENV=dev node set-env.cjs && vite build)
- [ ] build:stg script calls set-env.cjs (BUILD_ENV=stg node set-env.cjs && vite build)
- [ ] build:prod script calls set-env.cjs (BUILD_ENV=prod node set-env.cjs && vite build)
- [ ] set-env.cjs exists and has correct logic (fs.copyFileSync .env.{env} to .env)
- [ ] vite.config.ts has envPrefix: 'VITE_'
- [ ] vite.config.ts build.outDir matches Dockerfile COPY path (build or dist)
- [ ] Node.js version checked (.nvmrc or engines field)
- [ ] Angular dist path adjusted if Angular project
- [ ] Structured output format used (✅ present, ⚠️ missing, ❌ broken)
- [ ] If generating set-env.cjs: matches canonical example from blocks-react-construct
