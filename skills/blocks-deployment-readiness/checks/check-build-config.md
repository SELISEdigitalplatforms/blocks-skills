# check-build-config

Verifies that a project has the required build configuration for deployment.

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Detect Project Type

Check the project root for:

| Indicator | Framework |
|-----------|-----------|
| `package.json` + `next.config.ts` with `output: 'standalone'` | Next.js (standalone) |
| `package.json` + `vite.config.ts` | Vite / React |
| `package.json` + `angular.json` | Angular |
| `pubspec.yaml` | Flutter Web |
| `*.csproj` | Blazor |

### Step 2: Verify Build Scripts (Node.js projects)

Only applies to projects with `package.json`. Skip for Flutter and Blazor.

**Next.js projects**, `package.json` must have:

```json
{
  "scripts": {
    "build:dev": "NEXT_ENV=development next build",
    "build:prod": "NEXT_ENV=production next build"
  }
}
```

> There is no `build:stg` script. Staging builds use `build:dev` with the staging API URL in `.env.dev`.

**Vite/React projects**, `package.json` must have:

```json
{
  "scripts": {
    "build:dev": "vite build",
    "build:stg": "vite build",
    "build:prod": "vite build"
  }
}
```

### Step 3: Verify Build Tool Configuration

**Next.js projects**, check `next.config.ts`:
- `output: 'standalone'` — required for standalone mode
- No `output: 'export'` — this is not a static export
- `images.remotePatterns` — add all external image hostnames (CDNs, cloud storage)

**Vite projects**, check `vite.config.ts`:
- `envPrefix: 'VITE_'` — ensures VITE_* prefixed variables are exposed
- `build.outDir` — output directory (typically `build` or `dist`)

**Angular projects**, extract the project name from `angular.json`:
1. Find the project with `"root": ""` (the root-level project)
2. Read `architect.build.options.outputPath` (e.g., `dist/myapp` → output is `/app/dist/myapp`)
3. Pass as `--build-arg ANGULAR_PROJECT=myapp` to the Dockerfile build

```bash
# Extract the Angular project name
ANGULAR_PROJECT=$(jq -r '.projects[] | select(.root == "") | .architect.build.options.outputPath' angular.json)
# Example output: "myapp" → dist/myapp
```

### Step 4: Verify Flutter SDK (Flutter Web only)

Skip for all other project types.

Verify the CI environment has Flutter available:

```bash
flutter --version
flutter doctor
```

If Flutter is not installed in the CI environment:
- **Recommended:** Use a Docker image with Flutter pre-installed (e.g., `ghcr.io/nicknisi/dart:latest`)
- **Fallback:** Install Flutter SDK at build time (adds ~2min per build)

Also verify `flutter config --enable-web` is set in the build process:

```bash
flutter config --enable-web
flutter pub get
flutter build web
```

Output: `build/web/` directory.

### Step 5: Verify Blazor SDK (Blazor only)

Skip for all other project types.

Verify the `.csproj` has the correct SDK for web deployment:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>
```

**Blazor WebAssembly:** Builds to `publish/wwwroot/`. Use `dotnet publish -c Release`.

**Blazor Server:** Runs as a self-contained process. Use `dotnet build -c Release` and the `mcr.microsoft.com/dotnet/aspnet:8.0` runtime image.

Build command: `dotnet publish -c Release -o publish`. Output: `publish/wwwroot/`.

### Step 6: Verify start.sh (Next.js only)

Skip for all other project types.

For Next.js standalone projects, verify `start.sh` exists in the project root:

```sh
#!/bin/sh
set -e
node server.js &
sleep 2
nginx -g 'daemon off;'
```

Must be executable (`chmod +x`).

### Step 7: Verify Runtime Version

**Node.js projects:** Check `package.json` engines field or `.nvmrc` file. The canonical reference uses Node 21.

**Flutter projects:** Check `pubspec.yaml` environment `sdk:` constraint.

**Blazor projects:** Check the `.csproj` `<TargetFramework>` (e.g., `net8.0`).

## Output Format

```
Build configuration check:
✅ package.json — Present with build scripts (build:dev, build:prod)
✅ next.config.ts — Present with output: 'standalone'
✅ images.remotePatterns — Configured for external CDNs
✅ start.sh — Present and executable
✅ Flutter SDK — Pre-built image in Dockerfile
✅ Angular project name — dist/myapp extracted from angular.json
❌ .nvmrc — Missing (add Node 21 for consistency)
```

## If Missing

If build configuration is missing:

1. Offer to add build scripts to `package.json`
2. Offer to generate `next.config.ts` with `output: 'standalone'` and `images.remotePatterns`
3. Offer to generate `start.sh` for Next.js projects
4. For Angular: show how to extract the project name with `jq` and pass as `--build-arg ANGULAR_PROJECT=...`
5. For Flutter: recommend a pre-built Docker image with Flutter, or document the SDK installation step
6. Remind the user that build scripts must match the CI/CD pipeline environment names

## Reference

See `references/canonical-example.md` for the canonical example and `references/env-variables.md` for required environment variables.

---

## Verification Checklist

After checking build configuration, verify your report includes:

### Detection
- [ ] Project type detected (Next.js, Vite, Angular, Flutter, Blazor)

### Build Scripts (Node.js only)
- [ ] package.json present with scripts checked
- [ ] Next.js: `build:dev` uses `NEXT_ENV=development`, `build:prod` uses `NEXT_ENV=production`
- [ ] Next.js: no `build:stg` (staging uses `build:dev`)
- [ ] Vite: `build:dev`, `build:stg`, `build:prod` scripts present

### Build Tool Configuration
- [ ] next.config.ts has `output: 'standalone'` (Next.js only)
- [ ] next.config.ts has `images.remotePatterns` for external image CDNs (Next.js only)
- [ ] no `output: 'export'` (Next.js only)
- [ ] vite.config.ts has `envPrefix: 'VITE_'` (Vite only)
- [ ] Angular project name extracted from `angular.json` with `jq` (Angular only)

### SDK Verification
- [ ] Flutter pre-built image in Dockerfile OR SDK installation documented (Flutter only)
- [ ] `flutter config --enable-web` in build process (Flutter only)
- [ ] `.csproj` uses `Microsoft.NET.Sdk.Web` SDK (Blazor only)
- [ ] Runtime version checked (.nvmrc, pubspec.yaml, TargetFramework)

### Startup (Next.js only)
- [ ] start.sh exists and is executable

### Structured Output
- [ ] Each configuration area checked
- [ ] Status indicators used (✅ present, ⚠️ missing, ❌ broken)
