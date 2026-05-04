# Environment Variables Reference

Complete reference for all environment variables required for SELISE Blocks deployment.

---

## Framework Env Prefix

Each framework has its own convention for browser-exposed environment variables.

| Framework | Prefix | Example |
|-----------|--------|---------|
| Next.js | `NEXT_PUBLIC_` | `NEXT_PUBLIC_BLOCKS_API_URL`, `NEXT_PUBLIC_X_BLOCKS_KEY` |
| Vite / React SPA | `VITE_` | `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY` |
| Angular | None | `API_BASE_URL`, `X_BLOCKS_KEY` (Angular `environment.ts` files) |
| Flutter Web | None | `blocksApiUrl`, `blocksApiKey` (Dart constants) |
| Blazor WASM | None | `blocksApiUrl`, `blocksApiKey` (C# configuration) |

> **Next.js:** Uses `NEXT_PUBLIC_` to expose variables to the browser. Using `VITE_*` in a Next.js project will result in `undefined` values at runtime.

> **Angular:** Uses its own environment file system (`src/environments/environment.ts`). The Angular CLI substitutes values at build time. No prefix needed.

> **Flutter Web:** Uses Dart constants in `lib/config/api_config.dart`. Values are embedded at compile time. For web, store `projectKey` in `localStorage['projectKey']` to enable the UILM browser extension on `localhost`.

> **Blazor WebAssembly:** Uses `appsettings.json` or `IConfiguration`. Values are embedded in the WASM binary at compile time. For web, store `projectKey` in `localStorage` via JS interop to enable the UILM browser extension.

---

## Required Variables

These variables must be present in each environment.

### API Endpoint

**Purpose:** Base URL for the Blocks platform API.

| Framework | Variable | Dev Value | Prod Value |
|-----------|---------|-----------|------------|
| Next.js | `NEXT_PUBLIC_BLOCKS_API_URL` | `https://api.seliseblocks.com` | `https://api.seliseblocks.com` |
| Vite | `VITE_API_BASE_URL` | `https://api.seliseblocks.com` | `https://api.seliseblocks.com` |
| Angular | `API_BASE_URL` (in `environment.ts`) | `https://api.seliseblocks.com` | `https://api.seliseblocks.com` |
| Flutter | `apiUrl` (in `api_config.dart`) | `https://api.seliseblocks.com` | `https://api.seliseblocks.com` |
| Blazor | `ApiUrl` (in `appsettings.json`) | `https://api.seliseblocks.com` | `https://api.seliseblocks.com` |

### Project Key

**Purpose:** Blocks project key for authentication with the Blocks platform.

**Security:** This is a sensitive credential. NEVER hardcode the real value in templates. Use placeholder comments.

**How to get:**
1. Go to the Blocks Cloud Portal: `cloud.seliseblocks.com`
2. Navigate to your project → Settings → Project Key
3. Copy the key

**Per-framework template:**

```bash
# Next.js (.env.dev / .env.prod)
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

```bash
# Vite (.env.dev / .env.prod)
VITE_X_BLOCKS_KEY=<your-project-key>
```

```typescript
// Angular (src/environments/environment.ts)
export const environment = {
  production: false,
  blocksApiUrl: 'https://api.seliseblocks.com',
  blocksApiKey: '<your-project-key>',
  blocksProjectKey: '<your-project-key>',
};
```

```dart
// Flutter (lib/config/api_config.dart)
class ApiConfig {
  static const String apiUrl = 'https://api.seliseblocks.com';
  static const String apiKey = '<your-project-key>';
  static const String projectKey = '<your-project-key>';
}
```

```json
// Blazor WASM (wwwroot/appsettings.json)
{
  "Localise": {
    "ApiUrl": "https://api.seliseblocks.com",
    "ProjectKey": "<your-project-key>"
  }
}
```

> **Flutter Web and Blazor WASM:** Store the `projectKey` in `localStorage['projectKey']` on app init. This enables the UILM browser extension to inject key-mode on `localhost`. Read from localStorage first, falling back to the compile-time constant.

---

## Optional Variables

These variables enhance functionality but are not required for deployment.

### OIDC Client ID

**Purpose:** OIDC client ID for authentication with the Blocks identity provider.

| Framework | Variable |
|-----------|----------|
| Next.js | `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID` |
| Vite | `VITE_BLOCKS_OIDC_CLIENT_ID` |
| Angular | `BLOCKS_OIDC_CLIENT_ID` (in `environment.ts`) |

### OIDC Redirect URI

**Purpose:** Redirect URI for OIDC authentication flow. Must match the domain where the app is hosted.

| Environment | Pattern | Example |
|-------------|---------|---------|
| Dev | `https://dev-{slug}.seliseblocks.com/oidc` | `https://dev-myapp.seliseblocks.com/oidc` |
| Staging | `https://stg-{slug}.seliseblocks.com/oidc` | `https://stg-myapp.seliseblocks.com/oidc` |
| Production | `https://{slug}.seliseblocks.com/oidc` | `https://myapp.seliseblocks.com/oidc` |

| Framework | Variable |
|-----------|----------|
| Next.js | `NEXT_PUBLIC_BLOCKS_OIDC_REDIRECT_URI` |
| Vite | `VITE_BLOCKS_OIDC_REDIRECT_URI` |
| Angular | `BLOCKS_OIDC_REDIRECT_URI` (in `environment.ts`) |

---

## Template Generation Guidelines

When generating env file templates:

1. **NEVER include real credentials** — use placeholder `<your-project-key>`, `<your-oidc-client-id>`
2. **Use correct prefix per framework** — `NEXT_PUBLIC_*` for Next.js, `VITE_*` for Vite, Dart constants for Flutter, `appsettings.json` for Blazor
3. **Generate all three env files** — `.env.dev`, `.env.stg`, and `.env.prod` — always. For Path 2, `.env.prod` uses placeholder values since the portal injects real credentials at runtime. Never omit `.env.prod`.
4. **Use consistent variable keys** across all environments
5. **Differentiate values per environment** (dev/stg/prod endpoints, though Blocks uses the same API URL)
6. **Include comments** explaining each variable
7. **Group related variables** together
8. **Keep minimal** — only include variables the app actually uses

## Example Template: .env.dev (Next.js)

```bash
# Development Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

## Example Template: .env.stg (Next.js)

```bash
# Staging Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

## Example Template: .env.prod (Next.js)

```bash
# Production Environment
NEXT_PUBLIC_BLOCKS_API_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=<your-project-key>
```

## Example Template: .env.dev (Vite)

```bash
# Vite environment variables — Development
VITE_API_BASE_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your-project-key>
VITE_PROJECT_SLUG=<your-project-slug>
VITE_BLOCKS_OIDC_CLIENT_ID=<your-oidc-client-id>
VITE_BLOCKS_OIDC_REDIRECT_URI=https://dev-<slug>.seliseblocks.com/oidc
```

## Example Template: environment.ts (Angular)

```typescript
// src/environments/environment.ts (Development)
export const environment = {
  production: false,
  blocksApiUrl: 'https://api.seliseblocks.com',
  blocksApiKey: '<your-project-key>',
  blocksProjectKey: '<your-project-key>',
  blocksOidcClientId: '<your-oidc-client-id>',
  blocksOidcRedirectUri: 'https://dev-<slug>.seliseblocks.com/oidc',
};
```

```typescript
// src/environments/environment.prod.ts (Production)
export const environment = {
  production: true,
  blocksApiUrl: 'https://api.seliseblocks.com',
  blocksApiKey: '<your-project-key>',
  blocksProjectKey: '<your-project-key>',
  blocksOidcClientId: '<your-oidc-client-id>',
  blocksOidcRedirectUri: 'https://<slug>.seliseblocks.com/oidc',
};
```

## Example Template: api_config.dart (Flutter)

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String apiUrl = 'https://api.seliseblocks.com';
  static const String apiKey = '<your-project-key>';
  static const String projectKey = '<your-project-key>';
  static const String oidcClientId = '<your-oidc-client-id>';
  static const String oidcRedirectUri = 'https://dev-<slug>.seliseblocks.com/oidc';
}
```

> **Flutter Web:** Initialize localStorage on app start:
> ```dart
> import 'dart:html' as html;
> html.window.localStorage['projectKey'] = ApiConfig.projectKey;
> ```

## Example Template: appsettings.json (Blazor WASM)

```json
// wwwroot/appsettings.json (Development)
{
  "Localise": {
    "ApiUrl": "https://api.seliseblocks.com",
    "ProjectKey": "<your-project-key>",
    "OidcClientId": "<your-oidc-client-id>",
    "OidcRedirectUri": "https://dev-<slug>.seliseblocks.com/oidc"
  }
}
```

```json
// wwwroot/appsettings.Production.json (Production)
{
  "Localise": {
    "ApiUrl": "https://api.seliseblocks.com",
    "ProjectKey": "<your-project-key>",
    "OidcClientId": "<your-oidc-client-id>",
    "OidcRedirectUri": "https://<slug>.seliseblocks.com/oidc"
  }
}
```

> **Blazor WASM Web:** Initialize localStorage on app start in `Program.cs`:
> ```csharp
> await JS.InvokeVoidAsync("localStorage.setItem", "projectKey", config["Localise:ProjectKey"]);
> ```
