# Consent Flow Reference

OIDC user consent and acknowledgment flow. Covers when consent is required, how to trigger the consent screen, and how to handle the acknowledgment redirect.

See `contracts.md` for the `AcknowledgeRequest` schema. See `actions/get-login-options.md` for detecting whether SSO is configured.

---

## When Consent Is Required

Consent is required in two scenarios:

1. **New scopes** — The user has previously authenticated with a subset of scopes and is now requesting additional scopes (e.g., adding `offline_access` or `email`)

2. **New user data claims** — The client is requesting access to claims the user has not previously authorized (e.g., `profile` claims after previously only having `email`)

The backend tracks the user's previous consent on a per-client, per-scope basis. When a new scope is requested, the backend returns a redirect to the consent page instead of completing the authorization.

The `isAutoRedirect` flag on the OIDC client controls whether returning users see a consent screen. When `isAutoRedirect: true`, the backend skips the Blocks consent screen and redirects directly to the SSO provider for users who have already consented.

See `references/oidc-sso-setup.md` for OIDC client configuration including the `isAutoRedirect` field.

---

## Authorization Endpoint and Consent

The `GET /idp/v1/Authentication/Authorize` endpoint handles consent. When consent is required, it returns a redirect to the consent page rather than to the redirect URI.

```typescript
// src/lib/authorize-flow.ts
import { buildAuthorizeUrl, generateState } from '@/lib/build-authorize-url'

export interface AuthorizeParams {
  clientId: string
  redirectUri: string
  scope: string
  state?: string
  nonce?: string
  codeChallenge?: string
}

export async function startAuthorization(params: AuthorizeParams): Promise<void> {
  const state = params.state ?? generateState()
  const nonce = params.nonce ?? generateState()

  const authUrl = buildAuthorizeUrl({
    authorizationEndpoint: `${API_BASE}/idp/v1/Authentication/Authorize`,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    state,
    scope: params.scope,
    nonce,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: 'S256',
  })

  sessionStorage.setItem('oidc_state', state)
  sessionStorage.setItem('oidc_nonce', nonce)

  window.location.href = authUrl
}
```

If consent is required, the response redirects to:

```
https://your-app.com/consent?client_id=...&scope=...&state=...&nonce=...
```

The user sees a consent screen where they approve or deny the requested scopes.

---

## UserAcknowledgement Action

`POST /idp/v1/Authentication/UserAcknowledgement`

Called after the user reviews the requested scopes and clicks Accept or Deny. This is a direct server-to-server call from your consent page, not a browser redirect.

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/UserAcknowledgement" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "clientId": "client-uuid-123",
    "redirectUri": "https://myapp.com/auth/callback",
    "scope": "openid profile email offline_access",
    "state": "random-state-value",
    "nonce": "random-nonce-value",
    "isAcknowledged": true,
    "username": "user@example.com"
  }'
```

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| clientId | string | yes | The OIDC client's itemId |
| redirectUri | string | yes | Must match the registered redirect URI |
| scope | string | yes | The scope the user is acknowledging |
| state | string | yes | The state value from the authorize redirect |
| nonce | string | yes | The nonce from the authorize redirect |
| isAcknowledged | boolean | yes | `true` to grant consent, `false` to deny |
| username | string | yes | The authenticated user's username or email |

Response when `isAcknowledged: true`:

```json
{
  "isSuccess": true,
  "errors": {}
}
```

The backend processes the acknowledgment and redirects the user to the redirect_uri with the authorization code.

Response when `isAcknowledged: false`:

```json
{
  "isSuccess": false,
  "errors": {
    "consent": "User denied consent"
  }
}
```

The backend redirects to the redirect_uri with an `error` query parameter instead of a `code`.

See `contracts.md` for the full `AcknowledgeRequest` schema.

---

## Handling the Consent Redirect

The callback page receives the authorization code from the redirect. The consent flow uses the same callback as the authorization flow — the backend differentiates between a first-authorization redirect and a post-consent redirect.

```typescript
// src/pages/auth/callback.tsx
export function OidcCallback() {
  useEffect(() => {
    handleCallback()
  }, [])

  return <div>Completing sign-in...</div>
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')
  const errorDescription = params.get('error_description')

  if (error) {
    if (error === 'consent_required') {
      navigate('/consent-required')
      return
    }
    navigate(`/login?error=${encodeURIComponent(errorDescription ?? error)}`)
    return
  }

  if (!code || !state) {
    navigate('/login?error=missing_params')
    return
  }

  const storedState = sessionStorage.getItem('oidc_state')
  if (state !== storedState) {
    navigate('/login?error=state_mismatch')
    return
  }

  sessionStorage.removeItem('oidc_state')
  sessionStorage.removeItem('oidc_nonce')

  const { verifier } = getPkceVerifier()
  if (verifier) {
    sessionStorage.removeItem('oidc_verifier')
    await exchangeCodeForToken(code, verifier)
  }

  navigate('/dashboard')
}
```

---

## isAcknowledged Flag Behavior

The `isAcknowledged` flag records the user's consent decision in the backend. Subsequent authorization requests from the same user+client+scope combination are automatically granted without showing the consent screen (unless `isAutoRedirect: false` on the client).

| Scenario | Result |
|----------|--------|
| New user, first login | Consent screen shown |
| Returning user, same scopes | No consent screen (auto-approved) |
| Returning user, new scope added | Consent screen shown for new scope only |
| User denied consent (`isAcknowledged: false`) | Redirect to redirect_uri with `access_denied` error |
| Admin disables auto-redirect | Consent screen shown even for returning users |

---

## Auto-Redirect for Already-Consented Users

When `isAutoRedirect: true` on the OIDC client, the backend bypasses the Blocks consent page entirely for users who have already acknowledged. The flow is:

```
User → Authorize → [consent needed?] → [yes] → Consent page
                                          → [no]  → SSO Provider → Callback
```

When `isAutoRedirect: false`, the user always lands on the consent page, even for returning users. Use this when the application needs to display scope explanations on every login.

---

## Scope Explanations

Show human-readable descriptions for each requested scope on the consent screen.

```typescript
// src/lib/scope-descriptions.ts
export const SCOPE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  openid: {
    title: 'Sign you in',
    description: 'Verify your identity through the identity provider.',
  },
  profile: {
    title: 'Your profile information',
    description: 'Access your name, profile photo, and other basic profile data.',
  },
  email: {
    title: 'Your email address',
    description: 'Access the email address associated with your account.',
  },
  offline_access: {
    title: 'Keep you signed in',
    description: 'Maintain your session even after closing the browser. A refresh token will be issued.',
  },
}

export function renderScopeList(scope: string): { title: string; description: string }[] {
  return scope
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => SCOPE_DESCRIPTIONS[s] ?? { title: s, description: 'Additional access' })
}
```

Consent page component:

```tsx
// src/pages/consent.tsx
export function ConsentPage() {
  const params = new URLSearchParams(window.location.search)
  const clientId = params.get('client_id') ?? ''
  const scope = params.get('scope') ?? ''
  const state = params.get('state') ?? ''
  const nonce = params.get('nonce') ?? ''

  const scopeList = renderScopeList(scope)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAcknowledge = async (acknowledged: boolean) => {
    setIsSubmitting(true)

    await fetch(`${API_BASE}/idp/v1/Authentication/UserAcknowledgement`, {
      method: 'POST',
      headers: {
        'x-blocks-key': X_BLOCKS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        redirectUri: CALLBACK_URL,
        scope,
        state,
        nonce,
        isAcknowledged: acknowledged,
        username: getCurrentUsername(),
      }),
    })

    setIsSubmitting(false)
  }

  return (
    <div className="consent-page">
      <h2>Permissions Request</h2>
      <p>The application is requesting the following access:</p>
      <ul>
        {scopeList.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button onClick={() => handleAcknowledge(false)} disabled={isSubmitting}>
          Deny
        </button>
        <button onClick={() => handleAcknowledge(true)} disabled={isSubmitting}>
          Accept
        </button>
      </div>
    </div>
  )
}
```

---

## State Parameter Handling

The `state` parameter is critical for security. Always generate and validate it.

```typescript
// src/lib/state-manager.ts
export function generateState(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function generateNonce(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Usage in login flow
const state = generateState()
const nonce = generateNonce()

sessionStorage.setItem('oidc_state', state)
sessionStorage.setItem('oidc_nonce', nonce)

// Usage in callback
const storedState = sessionStorage.getItem('oidc_state')
if (state !== storedState) {
  throw new Error('State mismatch — possible CSRF attack')
}

sessionStorage.removeItem('oidc_state')
sessionStorage.removeItem('oidc_nonce')
```

The state parameter prevents:
- CSRF attacks (attacker pre-fills authorization and tricks user into authorizing)
- Session fixation (attacker sets the state to a known value)
- Callback tampering (attacker modifies the redirect URI)

---

## Consent Flow — Complete Sequence

```
1. User clicks "Sign in with SSO"
2. SPA generates state + nonce + PKCE pair
3. SPA stores verifier in sessionStorage, redirects to /idp/v1/Authentication/Authorize
4. Blocks backend detects new scope → redirects to /consent page
5. User reviews scope explanations
6. User clicks "Accept"
7. SPA calls POST /idp/v1/Authentication/UserAcknowledgement with isAcknowledged: true
8. Blocks backend records consent, redirects to SSO provider
9. User authenticates with SSO provider
10. Provider redirects back to callback URL with code
11. SPA exchanges code for tokens
12. User is logged in
```

On subsequent logins (with `isAutoRedirect: true`):
```
1. User clicks "Sign in with SSO"
2. SPA generates state + nonce + PKCE pair
3. SPA redirects to /idp/v1/Authentication/Authorize
4. Blocks backend sees user already consented → redirects directly to SSO provider
5. User authenticates with SSO provider
6. Provider redirects to callback with code
7. SPA exchanges code for tokens
8. User is logged in (no consent screen)
```
