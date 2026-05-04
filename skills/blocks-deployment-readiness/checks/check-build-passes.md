# check-build-passes

Verifies that the project's build scripts actually execute successfully. A deployment-ready project must have passing builds — configuration files alone are insufficient.

## When to Run

After `check-build-config` confirms build scripts exist. Run sequentially after the config check, or as part of the full readiness assessment. Do not run in parallel with other checks — build execution uses significant resources.

## Why This Check Exists

`check-build-config` verifies that build scripts are **configured** (the scripts exist). This check verifies they actually **work** (they produce a valid build output). A project can have perfectly structured build scripts and still fail at build time due to:

- Import/export mismatches
- Missing runtime dependencies
- TypeScript errors
- Environment variable reference errors (`process.env.NEXT_PUBLIC_*` missing)
- Bundle size exceeding memory limit
- Framework-specific SDK mismatches

## How to Check

### Step 1: Verify Working Directory and Dependencies

Ensure the check runs from the project root. For Node.js projects, verify `node_modules/` is present. For Flutter, verify the SDK is installed. For .NET, verify the SDK is installed.

### Step 2: Detect Framework

| Indicator | Framework | Build command |
|-----------|-----------|-------------|
| `next.config.ts` with `output: 'standalone'` | Next.js | `npm run build:dev` / `npm run build:prod` |
| `vite.config.ts` | Vite / React | `npm run build:dev` / `npm run build:prod` |
| `angular.json` | Angular | `npm run build:dev` / `npm run build:prod` |
| `pubspec.yaml` | Flutter Web | `flutter build web` |
| `*.csproj` (WASM target) | Blazor WASM | `dotnet publish -c Release` |
| `*.csproj` (Blazor Server) | Blazor Server | `dotnet build -c Release` |

### Step 3: Run Development Build

**For Next.js / Vite / Angular:**
```bash
npm run build:dev
```
Expected: exit code 0.

**For Flutter:**
```bash
flutter build web
```
Expected: exit code 0. Verify `build/web/index.html` exists.

**For Blazor WASM:**
```bash
dotnet publish -c Release -o publish
```
Expected: exit code 0. Verify `publish/wwwroot/index.html` exists.

**For Blazor Server:**
```bash
dotnet build -c Release
```
Expected: exit code 0.

### Step 4: Run Production Build

**For Next.js / Vite / Angular:**
```bash
npm run build:prod
```
Expected: exit code 0.

**For Flutter:** Production build is the same command (`flutter build web`). Run once.

**For Blazor:** Production build is the same command (`dotnet publish -c Release` or `dotnet build -c Release`). Run once.

Note: There is no `build:stg` for Next.js. Staging uses `build:dev` with the staging API URL in `.env.dev`.

### Step 5: Inspect Output

After each build, verify:

- Output directory exists and contains the expected entry file
- No error output in the console
- No TypeScript compilation errors (Node.js projects)
- Memory-related warnings addressed (ensure `NODE_OPTIONS="--max-old-space-size=4096"` is set in Dockerfile)
- Framework-specific output files present

### Step 6: Clean Up

Remove the generated output directories after successful checks to keep the repo clean:
- Node.js: `rm -rf build/ .next/`
- Angular: `rm -rf dist/`
- Flutter: `rm -rf build/`
- Blazor: `rm -rf publish/`

## Framework-Specific Output Verification

| Framework | Output directory | Entry file to inspect |
|-----------|----------------|---------------------|
| Next.js standalone | `.next/standalone/` | `server.js` |
| Vite / React | `build/` | `index.html` |
| Angular | `dist/<name>/` | `index.html` |
| Flutter Web | `build/web/` | `index.html` |
| Blazor WASM | `publish/wwwroot/` | `index.html` |
| Blazor Server | (binary build) | `bin/Release/` |

## Output Format

```
Build execution check:
✅ npm run build:dev — Passed (.next/standalone/ created, server.js present)
✅ npm run build:prod — Passed (.next/standalone/ created, server.js present)
```

```
Build execution check:
✅ flutter build web — Passed (build/web/ created, index.html present)
✅ flutter build web (prod) — Passed
```

On failure:

```
Build execution check:
✅ npm run build:dev — Passed
❌ npm run build:prod — Failed (exit code 1)
   └─ Error: NEXT_PUBLIC_X_BLOCKS_KEY is not defined
   └─ Fix: Ensure .env.prod exists and COPY .env.${ci_build} .env.local is in Dockerfile
```

## If Builds Fail

1. **Capture the error output** — copy error lines verbatim
2. **Identify the failure type** using the table below
3. **Offer specific remediation** based on the error type
4. **Do NOT proceed** with deployment readiness until builds pass

### Node.js Projects (Next.js / Vite / Angular)

| Error pattern | Likely cause | Fix |
|-------------|-------------|-----|
| `Module not found` | Missing dependency | Run `npm install` before checking |
| `Cannot find module './xxx'` | Import path mismatch | Check relative imports in source |
| `Type error: TSxxxx` | TypeScript error | Fix type definitions in source |
| `NEXT_PUBLIC_* is not defined` | Env var not set (Next.js) | Verify `COPY .env.${ci_build} .env.local` in Dockerfile |
| `VITE_* is not defined` | Env var not set (Vite) | Verify `envPrefix: 'VITE_'` in vite.config.ts |
| `FATAL ERROR: CALL_AND_RETRY_LAST` | Memory exceeded | Add `NODE_OPTIONS="--max-old-space-size=4096"` to Dockerfile |
| `EISDIR` | Output dir is a directory | Check `next.config.ts` `output: 'standalone'` (Next.js) or `outDir` |
| `ERR_PACKAGE_PATH_NOT_EXPORTED` | Dependency version mismatch | Check `package.json` peerDependencies |
| `Angular: 'ng' is not recognized` | Angular CLI not installed | Add `npm install` to Dockerfile before `ng build` |

### Flutter Projects

| Error pattern | Likely cause | Fix |
|-------------|-------------|-----|
| `Flutter SDK not found` | SDK not installed in CI | Use a base image with Flutter pre-installed |
| `Web support not enabled` | `flutter config --enable-web` not run | Add `flutter config --enable-web` before build |
| `pubspec.yaml has not been updated` | Dependencies not resolved | Add `flutter pub get` before `flutter build web` |
| `Target file "build/web" not found` | Wrong output path | Verify `flutter build web` outputs to `build/web/` |

### Blazor Projects

| Error pattern | Likely cause | Fix |
|-------------|-------------|-----|
| `The SDK 'Microsoft.NET.Sdk.Web' not found` | Wrong SDK image | Use `mcr.microsoft.com/dotnet/sdk:8.0` with web SDK |
| `BlazorWebAssembly target not found` | Wrong project SDK | Ensure `<Project Sdk="Microsoft.NET.Sdk.Web">` in csproj |
| `publish/wwwroot/index.html not found` | Wrong publish output path | Verify `dotnet publish -c Release -o publish` |

## Important Notes

- **Run on the actual source code** — do not run on a clean checkout that has never had dependencies installed.
- **Flutter SDK** — if the CI environment doesn't have Flutter installed, use a pre-built Docker image or install Flutter first.
- **Next.js standalone** — confirm `output: 'standalone'` is in `next.config.ts` before checking.
- **Clean before building** — if a previous build left stale output, the build may fail. Run `rm -rf build/ .next/ dist/` before checking.

## Reference

See `references/canonical-example.md` for the canonical build scripts and `checks/check-build-config.md` for configuration verification.

---

## Verification Checklist

After checking build execution, verify your report includes:

- [ ] Framework correctly identified
- [ ] `node_modules/` present for Node.js projects (run `npm install` if missing first)
- [ ] Flutter SDK available for Flutter projects
- [ ] .NET SDK available for Blazor projects
- [ ] Development build executed and passed
- [ ] Production build executed and passed (or same as dev for Flutter/Blazor)
- [ ] Next.js: `.next/standalone/server.js` present
- [ ] Vite: `build/index.html` present
- [ ] Angular: `dist/<name>/index.html` present
- [ ] Flutter: `build/web/index.html` present
- [ ] Blazor WASM: `publish/wwwroot/index.html` present
- [ ] No error output in any build
- [ ] No TypeScript compilation errors (Node.js)
- [ ] Memory warnings addressed (`NODE_OPTIONS` present in Dockerfile)
- [ ] Build output cleaned up after verification
- [ ] Error output captured verbatim for each failed build
- [ ] Failure type identified and remediation offered
- [ ] Structured output format used (✅ passed, ❌ failed)
