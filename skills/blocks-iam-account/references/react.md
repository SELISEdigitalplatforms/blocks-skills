# Frontend integration — activate & logout (React 19 / Vite / TanStack Query)

## Env

```bash
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_BLOCKS_PROJECT_KEY=<project tenant id>   # x-blocks-key (public)
```

## API

```ts
// src/features/account/api.ts
import { useAuthStore } from "@/stores/auth";

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

export async function logout(refreshToken: string) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // ensures the session cookie is cleared for hosted-SSO sessions
    body: JSON.stringify({ refreshToken }),
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
      const rt = useAuthStore.getState().refreshToken;
      if (rt) await logout(rt);
      useAuthStore.getState().clear(); // drop local tokens regardless
    },
  });
}
```

## Notes

- `captchaCode` / `mailPurpose` are optional — the API accepts empty strings; only populate them if your project enforces captcha or a custom mail purpose.
- Read the activation `code` from the activation link's query string on the activation page.
- After logout, clear all client tokens/state even if the network call fails, so the UI reflects a signed-out state.
