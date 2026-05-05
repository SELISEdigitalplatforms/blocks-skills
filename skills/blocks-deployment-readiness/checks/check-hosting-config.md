# check-hosting-config

Verifies that a project has the required hosting and domain configuration for deployment.

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Detect Framework

Determine the framework from the project structure:

| Indicator | Framework | Env Config Location |
|-----------|-----------|---------------------|
| `next.config.ts` with `output: 'standalone'` | Next.js | `.env.*` files (`NEXT_PUBLIC_*`) |
| `vite.config.ts` | Vite / React SPA | `.env.*` files (`VITE_*`) |
| `angular.json` | Angular | `src/environments/environment.ts` |
| `pubspec.yaml` | Flutter Web | `lib/config/api_config.dart` |
| `*.csproj` | Blazor | `wwwroot/appsettings.json` |

### Step 2: Verify OIDC Redirect URIs

Check the OIDC redirect URI matches the expected domain pattern:

| Environment | Expected URI Pattern |
|-------------|---------------------|
| Dev | `https://dev-<app>.seliseblocks.com/oidc` |
| Staging | `https://stg-<app>.seliseblocks.com/oidc` |
| Production | `https://<app>.seliseblocks.com/oidc` |

**Per-framework variable:**

| Framework | Variable |
|-----------|----------|
| Next.js | `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI` |
| Vite | `VITE_BLOCKS_OIDC_REDIRECT_URI` |
| Angular | `blocksOidcRedirectUri` in `environment.ts` |
| Flutter | `oidcRedirectUri` in `api_config.dart` |
| Blazor | `OidcRedirectUri` in `appsettings.json` |

### Step 3: Verify nginx Configuration

**For Next.js projects**, verify `nginx.conf` is a reverse proxy:
```nginx
location / {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

**For Vite/Angular/Flutter/Blazor WASM projects**, verify `nginx.conf` serves static files with SPA fallback:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Step 4: Verify Build Output Directory

| Framework | Expected output path | Dockerfile COPY path |
|-----------|--------------------|--------------------|
| Next.js standalone | `.next/standalone/` | Copy `.next/standalone/` directory |
| Vite | `build/` | `/app/build` |
| Angular | `dist/<name>/` | `/app/dist/<name>` |
| Flutter Web | `build/web/` | `/app/build/web` |
| Blazor WASM | `publish/wwwroot/` | `/app/publish/wwwroot` |

**For Angular:** Extract the project name from `angular.json`:
```bash
# Get the default project name from angular.json
jq -r '.projects[] | select(.root == "") | .architect.build.options.outputPath' angular.json
```

**For Flutter:** Verify `pubspec.yaml` includes `web` in the platform list. The build output is always `build/web/` regardless of project name.

**For Blazor WASM:** The output path is `publish/wwwroot/` when using `dotnet publish -c Release -o publish`.

### Step 5: Verify Docker Host Settings

**Vite only:** If the project needs to run on a specific host, check `vite.config.ts`:
```typescript
server: {
  host: true,
  allowedHosts: true,
}
```

**Next.js standalone:** No `allowedHosts` configuration is needed since nginx handles all incoming requests.

**Angular/Flutter/Blazor:** No additional host configuration needed — nginx serves all traffic.

### Step 6: Verify WebSocket Support

**Blazor Server** requires SignalR WebSocket support. Verify the hosting platform (AKS) has WebSocket enabled. If deploying Blazor Server, nginx cannot be used — use the dotnet runtime image instead.

## Output Format

```
Hosting configuration check:
✅ nginx.conf — Present with reverse proxy (Next.js)
✅ OIDC redirect URIs — Configured per environment
✅ Angular project name — Extracted from angular.json: "myapp"
⚠️  allowedHosts — Not needed for Next.js standalone (nginx handles routing)
```

## If Missing

If hosting configuration is missing or incorrect:

1. Verify `nginx.conf` has the correct pattern (proxy for Next.js, static for Vite/Angular/Flutter/Blazor)
2. Check `vite.config.ts` for `allowedHosts: true` if deploying to custom domains (Vite only)
3. Extract Angular project name from `angular.json` before generating Dockerfile
4. Guide user on updating OIDC redirect URIs per environment
5. Note that actual DNS/ingress configuration in AKS is handled by the infrastructure repository Helm charts

## Reference

See `references/canonical-example.md` for the canonical example and `references/dockerfile-template.md` for nginx configuration.

---

## Verification Checklist

After checking hosting configuration, verify your report includes:

### Framework Detection
- [ ] Framework correctly identified (Next.js / Vite / Angular / Flutter / Blazor)
- [ ] Appropriate env config location checked per framework

### OIDC Configuration
- [ ] OIDC redirect URI configured per environment:
  - Dev: https://dev-<app>.seliseblocks.com/oidc
  - Stg: https://stg-<app>.seliseblocks.com/oidc
  - Prod: https://<app>.seliseblocks.com/oidc

### nginx Configuration
- [ ] Next.js: nginx.conf proxies to `http://localhost:3000`
- [ ] Vite/Angular/Flutter/Blazor: nginx.conf has `try_files $uri $uri/ /index.html`
- [ ] nginx.conf has gzip enabled
- [ ] nginx.conf has `server_tokens off;` for security

### Build Output Paths
- [ ] Next.js: `.next/standalone/` verified
- [ ] Vite: `build/` matches Dockerfile COPY path
- [ ] Angular: `dist/<name>/` path extracted from `angular.json`
- [ ] Flutter: `build/web/` verified
- [ ] Blazor WASM: `publish/wwwroot/` verified

### Blazor Server (if applicable)
- [ ] Uses dotnet runtime image (not nginx)
- [ ] WebSocket/SignalR support confirmed in hosting config

### Structured Output
- [ ] Each configuration area checked
- [ ] Status indicators used (✅ configured, ⚠️ missing, ❌ incorrect)
- [ ] DNS/ingress setup documented for user (beyond AI scope)
