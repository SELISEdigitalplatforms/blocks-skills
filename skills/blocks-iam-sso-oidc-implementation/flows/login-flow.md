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

From the callback route, call:
```
GET https://api.seliseblocks.com/iam/v4/idp/callback?code=<code>&state=<state>
```
This **sets the session cookie**. Once it succeeds, the user is authenticated — subsequent requests carry the cookie automatically. Send this request with the browser's credentials (so the cookie is set on your domain), then route the user to the post-login landing page.

## Notes

- `initiate` is a data fetch; only step 2 is a navigation. Pointing the browser straight at `/idp/initiate` skips reading `redirect_uri` and won't work.
- Keep `redirectUri` byte-identical across the client registration, the `initiate` call, and the IAM callback — mismatches are rejected.
- The session lives in an HttpOnly cookie; the app typically doesn't hold the access token in JS. Make sure the app's domain lines up with the project's `cookieDomain`.

React wiring: [../references/react.md](../references/react.md).
