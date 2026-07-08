---
name: blocks-iam-account
description: "SELISE Blocks IAM account/session actions — activate a newly-created user account (`/auth/activate`, completing signup with the emailed code + a chosen password) and log a user out (`/auth/logout`, revoking the refresh token and clearing the session). Use whenever the user wants to activate/confirm a new account, finish signup with an activation code, set the initial password on activation, or implement logout / end-session in a Blocks app or admin tool. Works for both admin tooling and frontend implementation. This is distinct from SSO/OIDC login (see blocks-iam-sso-oidc-implementation) — activate and logout are direct account-lifecycle calls."
---

# Blocks IAM — Account Activation & Logout

Two direct account/session calls on the IAM service, usable from admin tooling or a frontend app:

- **Activate** — turn a freshly-created (inactive) user into an active one by validating the activation code and setting a password. After this the user can log in.
- **Logout** — revoke the refresh token, invalidate the session, clear cookies.

Base: `https://api.seliseblocks.com/iam/v4` (no `/api/` prefix — the swagger's `/api` is not part of the served URL). These are `/auth/*` endpoints.

## Auth

- Header **`x-blocks-key: <project key>`** on every call — the project's tenant id (what the portal exposes as `BLOCKS_X_BLOCKS_KEY`; public, safe in a client).
- **Activate** does not need a bearer token (the activation code is the credential). **Logout** needs `Authorization: Bearer <access_token>` for the session being ended.

## Activate a user — `POST /iam/v4/auth/activate`

Completes account setup for a user created in an inactive state (the activation `code` arrives by email).

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

## Log out — `POST /iam/v4/auth/logout`

```json
{ "refreshToken": "<the session's refresh token>" }
```
Send with `Authorization: Bearer <access_token>`. Revokes the refresh token, invalidates the session, and clears cookies. Then drop any tokens the client holds. To end **every** session for the user across devices, use `POST /iam/v4/auth/logout-all` (body `{ "useBackchannel": false }`).

## Frontend wiring

See [references/react.md](references/react.md) for an activation form and a logout action (React 19 / TanStack Query).

## Gotchas

- **`x-blocks-key` = the project key** (tenant id). A wrong key → 401.
- **Activation code is single-use and time-limited** — if it's expired, the user needs a fresh activation email (resend is a separate signup/user-management concern).
- **Logout body casing is `refreshToken`** (camelCase), unlike `auth-login`/`refresh` which use snake_case `refresh_token`. Match it exactly.
- If your app uses the hosted SSO flow, the session lives in an HttpOnly cookie; call logout with `credentials: "include"` so the cookie is cleared server-side.
