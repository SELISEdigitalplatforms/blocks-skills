# Frontend integration — activate & logout (React 19 / Vite / TanStack Query)

> Logout is `POST /iam/v4/auth/Logout` (capital L), body `{}`, sent with `credentials: "include"` so the browser's SSO session cookies are revoked and cleared server-side. Project/user values are never hardcoded — the tenant comes from `x-blocks-key`, the session from the cookies.

## Env

```bash
# Logout (and any cookie-based call) needs the API host to be SAME-SITE with your app domain, or the
# browser won't send the session cookies to it and the call can't clear them. Keep this default only if
# the app runs on *.seliseblocks.com; otherwise use https://blocksapi.<your-registrable-domain>:
#   app abc.slsblx.com → https://blocksapi.slsblx.com ; app xyz.blx10.com → https://blocksapi.blx10.com
# On a custom domain, ASK THE USER which base URL to use (they may keep the default).
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>   # x-blocks-key (public)
```

## API

```ts
// src/features/account/api.ts
const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ActivateInput {
  code: string;       // invitation token from /activate?code=
  password: string;
  firstName: string;
  lastName: string;
  captchaCode?: string;        // optional
  mailPurpose?: string;        // optional
  preventPostEvent?: boolean;  // optional
}

// Activation needs no bearer token — the invitation code is the credential.
export async function activate(input: ActivateInput) {
  const res = await fetch(`${BASE}/auth/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-blocks-key": KEY },
    body: JSON.stringify({
      captchaCode: "",
      mailPurpose: "",
      preventPostEvent: false,
      ...input,
    }),
  });
  if (!res.ok) throw new Error(`activate failed: ${res.status}`);
  return res.json();
}

// Logout is cookie/session based: capital-L `/auth/Logout`, empty `{}` body,
// no Authorization header. `credentials: "include"` sends the SSO session
// cookies so the server can revoke the session and clear them.
export async function logout() {
  const res = await fetch(`${BASE}/auth/Logout`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "x-blocks-key": KEY,
    },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`logout failed: ${res.status}`);
}
```

## Hooks + components

```tsx
// src/features/account/activate-page.tsx — mount at /activate
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { activate } from "./api";

export function ActivatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = useMemo(() => params.get("code") ?? "", [params]); // invitation token
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const m = useMutation({
    mutationFn: () => activate({ code, password, firstName, lastName }),
    onSuccess: () => navigate("/login", { replace: true }),
  });

  if (!code) return <p className="text-destructive text-sm">Missing invitation token — open the link from your invite email.</p>;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          setMismatch(true);
          return;
        }
        setMismatch(false);
        m.mutate();
      }}
    >
      <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      {mismatch && <p className="text-destructive text-sm">Passwords do not match.</p>}
      <button className="rounded bg-primary px-4 py-2 text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? "Activating…" : "Activate account"}
      </button>
      {m.isError && <p className="text-destructive text-sm">{String(m.error)}</p>}
    </form>
  );
}
```

```tsx
// logout action
import { useMutation } from "@tanstack/react-query";
import { logout } from "./api";
import { useAuthStore } from "@/stores/auth";

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await logout();               // cookie/session logout — no args
      } finally {
        useAuthStore.getState().clear(); // always drop local state, even on failure
      }
    },
  });
}
```

## Notes

- Mount **`/activate`** in the router **only when the app uses invite-and-activate** (users created/invited via portal or API without a password). Not required for SSO login — already-activated users sign in directly. Invite links land here with `?code=<invitation-token>`.
- The activate form needs **password + confirm password**; call `POST /auth/activate` only when they match. Payload: `{ code, password, firstName, lastName, captchaCode?, mailPurpose?, preventPostEvent? }` — confirm password is UI-only.
- **`captchaCode` / `mailPurpose` / `preventPostEvent`** are optional on the API — the helper defaults them to `""` / `false`; populate only when your project requires them.
- After logout, clear all client tokens/state even if the network call fails, so the UI reflects a signed-out state (the hook's `finally` block does this).
- The session cookies are HttpOnly and set by the hosted SSO login — the app can't read them; it only needs `credentials: "include"` so they ride along. On a domain outside `*.seliseblocks.com` the cookies are cross-site and only sent if issued `SameSite=None; Secure`.
