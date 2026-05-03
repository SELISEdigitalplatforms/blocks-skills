# check-build-passes

Verifies that the project's build scripts (`npm run build:dev`, `npm run build:stg`, `npm run build:prod`) actually execute successfully. A deployment-ready project must have passing builds — configuration files alone are insufficient.

## When to Run

After `check-build-config` confirms build scripts exist. Run sequentially after the config check, or as part of the full readiness assessment. Do not run in parallel with other checks — build execution uses significant resources.

## Why This Check Exists

`check-build-config` verifies that build scripts are **configured** (the scripts exist in package.json). This check verifies they actually **work** (they produce a valid build output). A project can have perfectly structured build scripts and still fail at build time due to:

- Import/export mismatches
- Missing runtime dependencies (declared in `dependencies` but not `devDependencies`)
- TypeScript errors
- Environment variable reference errors (`process.env.VITE_*` missing)
- Bundle size exceeding memory limit

## How to Check

### Step 1: Verify Working Directory

Ensure the check runs from the project root where `package.json` lives.

### Step 2: Run build:dev

```bash
npm run build:dev
```

Expected: exit code 0. Output directory (`build/` or `dist/`) must be created.

### Step 3: Run build:stg

```bash
npm run build:stg
```

Expected: exit code 0.

### Step 4: Run build:prod

```bash
npm run build:prod
```

Expected: exit code 0.

### Step 5: Inspect Output

After each build, verify:

- Output directory exists and contains `index.html`
- No `npm ERR!` in output
- No TypeScript compilation errors
- Memory-related warnings are addressed (ensure `NODE_OPTIONS="--max-old-space-size=4096"` is set)

### Step 6: Clean Up

Remove the generated `build/` or `dist/` directory after successful checks to keep the repo clean.

## Framework-Specific Notes

| Framework | Build command | Output dir | What to inspect |
|-----------|--------------|------------|-----------------|
| Vite / React | `npm run build:dev` | `build/` | `build/index.html`, `build/assets/` |
| Angular | `npm run build:dev` | `dist/<name>/` | `dist/<name>/index.html` |
| Next.js | `npm run build:dev` | `out/` | `out/index.html` |
| .NET Blazor | `dotnet build` | `bin/` | `bin/Release/` |

## Output Format

```
Build execution check:
✅ npm run build:dev — Passed (build/ created, index.html present)
✅ npm run build:stg — Passed (build/ created, index.html present)
✅ npm run build:prod — Passed (build/ created, index.html present)
```

On failure:

```
Build execution check:
✅ npm run build:dev — Passed
❌ npm run build:stg — Failed (exit code 1)
   └─ Error: VITE_API_BASE_URL is not defined
   └─ Fix: Ensure .env.stg exists and set-env.cjs is called before build
✅ npm run build:prod — Passed
```

## If Builds Fail

1. **Capture the error output** — copy the npm ERR! lines verbatim
2. **Identify the failure type** using the table below
3. **Offer specific remediation** based on the error type
4. **Do NOT proceed** with deployment readiness until builds pass

| Error pattern | Likely cause | Fix |
|---------------|-------------|-----|
| `Module not found` | Missing dependency | Run `npm install` before checking |
| `Cannot find module './xxx'` | Import path mismatch | Check relative imports in source |
| `Type error: TSxxxx` | TypeScript error | Fix type definitions in source |
| `VITE_* is not defined` | Env var not set | Verify `set-env.cjs` runs before build |
| `FATAL ERROR: CALL_AND_RETRY_LAST` | Memory exceeded | Add `NODE_OPTIONS="--max-old-space-size=4096"` to Dockerfile |
| `EISDIR` | Output dir is a directory | Check `vite.config.ts` `outDir` is not a folder name |
| `ERR_PACKAGE_PATH_NOT_EXPORTED` | Dependency version mismatch | Check `package.json` peerDependencies |

## Important Notes

- **Run on the actual source code** — do not run on a clean checkout that has never had `npm install` run. Ensure `node_modules/` is present.
- **Use CI-friendly builds** — if `build:dev`/`build:prod` require interactive prompts or flags, the CI pipeline will fail. Use `--ci` or `--no-interactive` flags where supported.
- **Next.js static export** — if using Next.js, confirm `output: 'export'` is in `next.config.js` before checking. Non-static Next.js apps are not supported by the Blocks deployment pipeline.
- **Clean before building** — if a previous build left stale output, `npm run build:dev` may fail due to conflicting artifacts. Run `rm -rf build/` before checking.

## Reference

See `references/canonical-example.md` for the canonical build scripts and `checks/check-build-config.md` for configuration verification.

---

## Verification Checklist

After checking build execution, verify your report includes:

- [ ] `node_modules/` present (run `npm install` if missing first)
- [ ] `npm run build:dev` executed and passed (exit code 0)
- [ ] `npm run build:stg` executed and passed (exit code 0)
- [ ] `npm run build:prod` executed and passed (exit code 0)
- [ ] Output directory created for each build (`build/`, `dist/`, or `out/`)
- [ ] `index.html` present in output directory for each build
- [ ] No `npm ERR!` in any build output
- [ ] No TypeScript compilation errors
- [ ] Memory warnings addressed (NODE_OPTIONS present)
- [ ] Build output cleaned up after verification (`rm -rf build/`)
- [ ] Error output captured verbatim for each failed build
- [ ] Failure type identified and remediation offered
- [ ] Structured output format used (✅ passed, ❌ failed)
