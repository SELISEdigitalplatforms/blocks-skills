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

Access tokens are short-lived (~5 min). To mint a fresh one without sending the user back through login, call the OIDC token endpoint with the refresh token — a **`POST` with a form-encoded body**, not JSON:

```bash
curl -s -X POST "https://api.seliseblocks.com/iam/v4/oidc/token" \
  -H "x-blocks-key: $PROJECT_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "refresh_token=$REFRESH_TOKEN"
```

- **Content-Type is `application/x-www-form-urlencoded`.** The body carries exactly `grant_type=refresh_token`, `client_id` (the OIDC `clientId`), and `refresh_token`.
- **`x-blocks-key` is required**, like every Blocks call.
- On success Blocks issues a **new `access_token` and `refresh_token` and sets them in cookies** — so send the request with `credentials: "include"` from the browser so the `Set-Cookie` applies to your domain. The rotated refresh token replaces the old one (single-use), so always keep the newest.
- **When to call it:** reactively, when a Blocks call returns 401 (refresh, then retry the original request once); or proactively, shortly before the access token expires.
- **Where the `refresh_token` comes from:** this call needs the refresh token in the body, so your app must have it. If your session is entirely HttpOnly-cookie-based you may not be able to read it in JS — confirm for your project how the refresh token is exposed to the client (e.g. returned by the callback, or a readable cookie). The response body is expected to follow the OIDC token shape (`access_token`, `refresh_token`, `expires_in`, `token_type`); verify the exact fields against your project, since the tokens also arrive as cookies.

## Notes

- `initiate` is a data fetch; only step 2 is a navigation. Pointing the browser straight at `/idp/initiate` skips reading `redirect_uri` and won't work.
- Keep `redirectUri` byte-identical across the client registration, the `initiate` call, and the IAM callback — mismatches are rejected.
- The session lives in an HttpOnly cookie; the app typically doesn't hold the access token in JS. Make sure the app's domain lines up with the project's `cookieDomain`.

React wiring: [../references/react.md](../references/react.md).
