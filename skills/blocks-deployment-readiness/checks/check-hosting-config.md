# check-hosting-config

Verifies that a project has the required hosting and domain configuration for deployment to Azure Kubernetes Service (AKS).

## When to Run

Part of the deployment-readiness check suite. Run alongside other check actions in parallel.

## How to Check

### Step 1: Verify Domain Configuration

For Azure deployment, the domain/ingress configuration is managed via Helm values files in the infrastructure repository (`l0-yml-infrastructure-helm`). Check:

- The project name matches the expected namespace format in AKS
- The `SERVICE_NAME` and `REPO_NAME` variables in `.github/variables/vars.env` are set correctly
- The namespace format used in workflows is `dev-$REPO_NAME`, `stg-$REPO_NAME`, `prod-$REPO_NAME`

### Step 2: Verify Ingress Configuration

The GitHub workflows deploy via Helm using values files from the infrastructure repository. The ingress configuration typically includes:

```yaml
ingress:
  hosts:
    - paths:
        - path: "/"
```

The Helm chart used is `new-templates/ecap3-webclient/` from the infrastructure repo.

### Step 3: Verify OIDC Redirect URIs

Check that `VITE_BLOCKS_OIDC_REDIRECT_URI` in each env file matches the expected domain pattern:

| Environment | Expected URI Pattern |
|-------------|---------------------|
| Dev | `https://dev-<app>.seliseblocks.com/oidc` |
| Staging | `https://stg-<app>.seliseblocks.com/oidc` |
| Production | `https://<app>.seliseblocks.com/oidc` |

### Step 4: Verify nginx Configuration for SPA

The `nginx.conf` must have the SPA fallback to handle client-side routing:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Without this, direct navigation to non-root paths will return 404.

### Step 5: Verify Docker Host Settings

If the project needs to run on a specific host (for local development), check `vite.config.ts`:

```typescript
server: {
  host: true, // binds to all interfaces
  allowedHosts: true, // allows all tenant domains
}
```

### Step 6: Verify Build Output Directory

The Docker build stage compiles to `build/` (or `dist/`). Ensure:
- `vite.config.ts` `build.outDir` matches the Dockerfile `COPY --from=builder /app/build` path
- The standard convention is `build` for Vite/React projects

## Output Format

```
Hosting configuration check:
✅ Domain namespace pattern — Matches AKS namespace convention
✅ nginx.conf SPA fallback — Present (try_files $uri $uri/ /index.html)
✅ VITE_BLOCKS_OIDC_REDIRECT_URI — Configured per environment
⚠️  allowedHosts — Consider setting to true for multi-tenant deployment
⚠️  Custom domain setup — User must configure DNS after deployment
```

## If Missing

If hosting configuration is missing or incorrect:

1. Verify `nginx.conf` has the SPA fallback rule
2. Check `vite.config.ts` for `allowedHosts: true` if deploying to custom domains
3. Guide user on updating `VITE_BLOCKS_OIDC_REDIRECT_URI` per environment
4. Note that actual DNS/ingress configuration in AKS is handled by the infrastructure repository Helm charts

## Reference

See `references/canonical-example.md` for the canonical example and `references/dockerfile-template.md` for nginx configuration.

---

## Verification Checklist

After checking hosting configuration, verify your report includes:

### Domain & Namespace
- [ ] SERVICE_NAME matches project name in vars.env
- [ ] REPO_NAME matches GitHub repo name in vars.env
- [ ] Namespace format follows dev/stg/prod-$REPO_NAME pattern
- [ ] OIDC redirect URIs configured for each environment:
      - Dev: https://dev-<app>.seliseblocks.com/oidc
      - Stg: https://stg-<app>.seliseblocks.com/oidc
      - Prod: https://<app>.seliseblocks.com/oidc

### nginx SPA Configuration
- [ ] nginx.conf has try_files $uri $uri/ /index.html
- [ ] nginx.conf has gzip enabled
- [ ] nginx.conf has correct root path (/usr/share/nginx/html/)

### Vite Config for Hosting
- [ ] vite.config.ts has allowedHosts: true (for multi-tenant)
- [ ] vite.config.ts has host: true (for local dev with custom domains)
- [ ] build.outDir matches Dockerfile COPY path

### AKS/Helm (Infrastructure)
- [ ] Helm chart referenced: new-templates/ecap3-webclient
- [ ] Ingress configuration present in values
- [ ] Image tag uses GitHub SHA (${{ github.sha }})

### Structured Output
- [ ] Each configuration area checked
- [ ] Status indicators used (✅ configured, ⚠️ missing, ❌ incorrect)
- [ ] DNS/ingress setup documented for user (beyond AI scope)
- [ ] CLI guidance provided for Blocks platform configuration
