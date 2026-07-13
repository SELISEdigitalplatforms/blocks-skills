# SSO login flow (authorization-code, hosted)

The four-step client flow. You need three values from the configured project (see **[blocks-iam-sso-oidc-configuration](../../blocks-iam-sso-oidc-configuration/SKILL.md)**):
- `PROJECT_KEY` — the project's tenant id, sent as `x-blocks-key` (public, ship in client).
- `CLIENT_ID` — the OIDC client's `clientId`.
- `REDIRECT_URI` — your app's callback, matching what was registered on the client/provider.

## Step 1 — On "Login" click, fetch the authorize URL (do NOT redirect yet)

Pass `x-blocks-key` **both** as a query parameter and as a request header (same value):

```bash
curl -s "https://api.seliseblocks.com/iam/v4/idp/initiate?x-blocks-key=$PROJECT_KEY&clientId=$CLIENT_ID&redirectUri=$REDIRECT_URI" \
  -H "x-blocks-key: $PROJECT_KEY"
```
Response (verified):
```json
{ "redirect_uri": "https://iam.seliseblocks.com/api/oidc/authorize?tenant_id=...&client_id=...&response_type=code&redirect_uri=...&scope=openid&state=...&nonce=...&code_challenge=...&code_challenge_method=..." }
```
Blocks assembles the whole authorize URL — including `state`, `nonce`, and the PKCE `code_challenge`. You don't build it or manage the verifier.

## Step 2 — Redirect the browser to `redirect_uri`

Navigate the top-level window to the returned `redirect_uri`. The user lands on the Blocks-hosted login at `iam.seliseblocks.com` and authenticates there.

## Step 3 — IAM redirects back to your app

After login, IAM redirects the browser to your registered `REDIRECT_URI` with query params:
```
https://your.application-domain.com/callback?code=<auth code>&state=<state>
```
Your app needs a route mounted at that path to receive it.

## Step 4 — Exchange the code via the callback endpoint (sets the cookie)

From the callback route, call (with the `x-blocks-key` header — required on every Blocks call):
```
GET https://api.seliseblocks.com/iam/v4/idp/callback?code=<code>&state=<state>
Header: x-blocks-key: <PROJECT_KEY>
```
This **sets the session cookie**. Once it succeeds, the user is authenticated — subsequent requests carry the cookie automatically. Send this request with the browser's credentials (so the cookie is set on your domain), then route the user to the post-login landing page.

## Step 5 — Refresh the access token when it expires

Access tokens are short-lived (~5 min). To renew without sending the user back through login, call the OIDC token endpoint as a **`POST` with a form-encoded body**, not JSON. In the hosted SSO flow the refresh token may be HttpOnly, so start with cookie-based refresh and include a `refresh_token` form field only if your project explicitly exposes one to JavaScript:

```bash
curl -s -X POST "https://api.seliseblocks.com/iam/v4/oidc/token" \
  -H "x-blocks-key: $PROJECT_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "client_id=$CLIENT_ID"
# Add only when your project exposes a readable refresh token:
# --data-urlencode "refresh_token=$REFRESH_TOKEN"
```

- **Content-Type is `application/x-www-form-urlencoded`.** The body always carries `grant_type=refresh_token` and `client_id` (the OIDC `clientId`). Add `refresh_token` only when the token is intentionally available to JS.
- **`x-blocks-key` is required**, like every Blocks call.
- On success Blocks issues a fresh session and sets rotated cookies — so send the request with `credentials: "include"` from the browser so the `Set-Cookie` applies to your domain.
- **When to call it:** reactively, when a Blocks call returns 401 (refresh, then retry the original request once); or proactively, shortly before the access token expires.
- **Where the `refresh_token` comes from:** prefer not reading it at all. If your project requires the form field, confirm how the refresh token is exposed to the client (e.g. callback response or readable cookie) before wiring it into JS. If it is HttpOnly, JS cannot supply it; rely on cookie-based refresh or a backend-for-frontend endpoint.

## Notes

- `initiate` is a data fetch; only step 2 is a navigation. Pointing the browser straight at `/idp/initiate` skips reading `redirect_uri` and won't work.
- Keep `redirectUri` byte-identical across the client registration, the `initiate` call, and the IAM callback — mismatches are rejected.
- The session lives in an HttpOnly cookie; the app typically doesn't hold the access token in JS. Make sure the app's domain lines up with the project's `cookieDomain`.

## Optional — `/activate` (invite-and-activate, not SSO login)

**This is not part of the login flow.** Users who are **already activated** use steps 1–4 above directly — no `/activate` route required.

Wire `/activate` only when your app **creates or invites users** through the Blocks portal or IAM API and leaves them **inactive** until they set a password. The invite email links to **`/activate?code=<invitation-token>`**. The frontend page:

1. Reads **`code`** from the query string (invitation token).
2. Collects **`firstName`**, **`lastName`**, **password**, and **confirm password**.
3. Submits **`POST /iam/v4/auth/activate`** only when password === confirm password:

```json
{
  "code": "<invitation token>",
  "password": "<chosen password>",
  "captchaCode": "",           // optional
  "mailPurpose": "",           // optional
  "preventPostEvent": false,   // optional
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

Headers: `content-type: application/json`, `x-blocks-key: <PROJECT_KEY>`. No bearer token.

After activation the user is **active** and can sign in via steps 1–4. Wire the page with **[blocks-iam-account](../../blocks-iam-account/SKILL.md)**. See **[blocks-iam-sso-oidc-configuration](../../blocks-iam-sso-oidc-configuration/flows/configure-oidc.md)** for when to add this route.

React wiring: [../references/react.md](../references/react.md).
