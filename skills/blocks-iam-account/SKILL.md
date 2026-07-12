---
name: blocks-iam-account
description: "SELISE Blocks IAM account/session actions — activate a newly-created user account (`/auth/activate`, completing signup with the emailed code + a chosen password) and log a user out (`/auth/Logout`, a cookie/session-based call that revokes the session and clears the auth cookies). Use whenever the user wants to activate/confirm a new account, finish signup with an activation code, set the initial password on activation, or implement logout / end-session in a Blocks app or admin tool. Works for both admin tooling and frontend implementation. This is distinct from SSO/OIDC login (see blocks-iam-sso-oidc-implementation) — activate and logout are direct account-lifecycle calls."
---

# Blocks IAM — Account Activation & Logout

Two direct account/session calls on the IAM service, usable from admin tooling or a frontend app:

- **Activate** — turn a freshly-created (inactive) user into an active one by validating the activation code and setting a password. After this the user can log in.
- **Logout** — revoke the refresh token, invalidate the session, clear cookies.

Base: `https://api.seliseblocks.com/iam/v4` (no `/api/` prefix — the swagger's `/api` is not part of the served URL). These are `/auth/*` endpoints.

## Auth

- Header **`x-blocks-key: <PTENANT>`** on every call — the project's tenant id (what the portal exposes as `BLOCKS_X_BLOCKS_KEY`; public, safe in a client).
- **Activate** does not need a bearer token (the activation code is the credential). **Logout** is **cookie/session based — no bearer token**: it identifies the session from the auth cookies the browser sends, so the call must go out with `credentials: "include"` and the cookies must reach the API (same-site).

## Activate a user — `POST /iam/v4/auth/activate`

Completes account setup for a user created in an inactive state (the activation `code` arrives by email).

Headers: `content-type: application/json` and `x-blocks-key: <PTENANT>`. **No `Authorization` header** — the activation code is the credential, but the project key is still mandatory.

```json
{
  "code": "<activation code from the email>",
  "password": "<the user's chosen password>",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "captchaCode": "",
  "mailPurpose": "",
  "preventPostEvent": false
}
```
- **`code` and `password` are the essential fields.** `captchaCode` and `mailPurpose` are **optional — send them empty** (`""`) unless your project specifically requires a captcha challenge or a non-default mail purpose.
- `firstName` / `lastName` set the profile at activation; `preventPostEvent` suppresses downstream post-activation events (leave `false` normally).
- On success the account is active and can log in (via SSO — **blocks-iam-sso-oidc-implementation** — or your auth flow).

## Log out — `POST /iam/v4/auth/Logout`

Note the capital **`L`** in the served path. This is a **cookie/session** call, not a token call:

- Headers: `accept: application/json`, `content-type: application/json`, and `x-blocks-key: <PTENANT>`. **No `Authorization` header.**
- Body: **empty object** — `{}`.
- **Must be sent with the browser's auth cookies** (`credentials: "include"`). The server reads the session from those cookies, revokes it, and clears them in the response `Set-Cookie`.

```jsonc
// request body — exactly this
{}
```

The cookies the browser sends (all HttpOnly, set by the hosted SSO login — **your app never reads or sets them**) are the project-scoped session id `idp_session_id_<project key>`, the access-token cookie, and the refresh-token cookie. Sending `{}` with those cookies present is all the endpoint needs. After the response, also clear any local client state so the UI reflects signed-out immediately.

## Frontend wiring

See [references/react.md](references/react.md) for an activation form and a logout action (React 19 / TanStack Query).

## Gotchas

- **`x-blocks-key` = `PTENANT`** (the project tenant id). Activation has no bearer token, but it still needs this project key. A wrong key → 401.
- **Activation code is single-use and time-limited** — if it's expired, the user needs a fresh activation email (resend is a separate signup/user-management concern).
- **Logout path is `/auth/Logout` (capital L) and the body is `{}`** — it is not a token endpoint. Don't send `Authorization` or a `refreshToken` in the body; the session comes from the cookies.
- **Cookies must actually reach the API.** Logout only works when the session cookies are delivered to `api.seliseblocks.com`. That happens automatically when your app is served from the same registrable domain (`*.seliseblocks.com`, so the request is `same-site`). On a different domain the auth cookies are cross-site — they only ride along if they were issued `SameSite=None; Secure`; otherwise the call reaches the server without a session and cannot clear it.
- Always clear local client state after calling logout **even if the network call fails**, so the UI never shows a stale signed-in state.
