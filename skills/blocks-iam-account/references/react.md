# Frontend integration — activate & logout (React 19 / Vite / TanStack Query)

> Logout is `POST /iam/v4/auth/Logout` (capital L), body `{}`, sent with `credentials: "include"` so the browser's SSO session cookies are revoked and cleared server-side. Project/user values are never hardcoded — the tenant comes from `x-blocks-key`, the session from the cookies.

## Env

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>   # x-blocks-key (public)
```

## API

```ts
// src/features/account/api.ts
const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4`;
const KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ActivateInput {
  code: string;
  password: string;
  firstName?: string;
  lastName?: string;
  captchaCode?: string;   // optional — send "" if unused
  mailPurpose?: string;   // optional — send "" if unused
  preventPostEvent?: boolean;
}

// Activation needs no bearer token — the code is the credential.
export async function activate(input: ActivateInput) {
  const res = await fetch(`${BASE}/auth/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-blocks-key": KEY },
    body: JSON.stringify({ captchaCode: "", mailPurpose: "", preventPostEvent: false, ...input }),
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
// src/features/account/activate-form.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { activate } from "./api";

export function ActivateForm({ code }: { code: string }) {  // code usually read from the URL
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const m = useMutation({ mutationFn: () => activate({ code, password, firstName, lastName }) });

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input type="password" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="rounded bg-primary px-4 py-2 text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? "Activating…" : "Activate account"}
      </button>
      {m.isError && <p className="text-destructive text-sm">{String(m.error)}</p>}
      {m.isSuccess && <p className="text-sm">Account activated — you can now sign in.</p>}
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

- `captchaCode` / `mailPurpose` are optional — the API accepts empty strings; only populate them if your project enforces captcha or a custom mail purpose.
- Read the activation `code` from the activation link's query string on the activation page.
- After logout, clear all client tokens/state even if the network call fails, so the UI reflects a signed-out state (the hook's `finally` block does this).
- The session cookies are HttpOnly and set by the hosted SSO login — the app can't read them; it only needs `credentials: "include"` so they ride along. On a domain outside `*.seliseblocks.com` the cookies are cross-site and only sent if issued `SameSite=None; Secure`.
