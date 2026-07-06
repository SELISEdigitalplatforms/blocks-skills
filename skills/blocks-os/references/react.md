# React integration — blocks-os

Stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand (matches `blocks-construct-react`). This guide wires the OS service's client-safe endpoints into a React app: captcha challenges (pre-login), platform MFA OTP/TOTP, and read-only platform data (notification configs, subscriptions).

Do **not** call Secrets or Storage endpoints from the browser — their responses contain credentials. Keep those server-side (see [flows/secrets-management.md](../flows/secrets-management.md) and [flows/storage-config.md](../flows/storage-config.md)).

## Environment

```bash
# .env — client-safe values only (VITE_ prefix exposes them to the bundle)
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<your x-blocks-key>
```

Never put passwords or non-public keys in `VITE_` vars. Token acquisition/refresh is covered by the **blocks-setup** skill; this guide assumes a Zustand auth store holding `accessToken`.

## Types

Copy the interfaces you need from [contracts.md](../contracts.md) into `src/types/blocks-os.ts` verbatim — e.g. `CreateCaptchaRequestResponse`, `SubmitCaptchaRequest`, `SubmitCaptchaRequestResponse`, `OtpGenerationRequest`, `OtpGenerationResponse`, `VerifyOtpRequest`, `OtpVerificationResponse`, `SetUpUserTotpResponse`, `GetNotificationConfigurationsResponse`, `GetSubscriptionsResponse`, `BaseResponse`.

## API client slice

```ts
// src/lib/blocks-os-client.ts
import { useAuthStore } from "@/stores/auth"; // Zustand store from blocks-setup wiring

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/os/v4`;

export class BlocksApiError extends Error {
  constructor(
    public status: number,
    public errors?: Record<string, string>,
  ) {
    super(`blocks-os ${status}: ${JSON.stringify(errors ?? {})}`);
  }
}

async function osFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": import.meta.env.VITE_X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    // Expired token: refresh via blocks-setup's refresh routine, then retry once.
    throw new BlocksApiError(401);
  }
  if (!res.ok) throw new BlocksApiError(res.status);
  const body = (await res.json()) as T & { isSuccess?: boolean; errors?: Record<string, string> };
  // HTTP 200 does not imply success on Blocks — check the envelope.
  if (body.isSuccess === false) throw new BlocksApiError(res.status, body.errors);
  return body;
}

export const osGet = <T>(path: string) => osFetch<T>(path);
export const osPost = <T>(path: string, payload: unknown) =>
  osFetch<T>(path, { method: "POST", body: JSON.stringify(payload) });
```

Note: GET endpoints use **PascalCase query params** (`ProjectKey`, `UserId`, `Page`) — build query strings verbatim from endpoints.md.

## TanStack Query hooks

```ts
// src/hooks/use-blocks-os.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { osGet, osPost } from "@/lib/blocks-os-client";
import type {
  CreateCaptchaRequestResponse,
  SubmitCaptchaRequest,
  SubmitCaptchaRequestResponse,
  OtpGenerationRequest,
  OtpGenerationResponse,
  VerifyOtpRequest,
  OtpVerificationResponse,
  SetUpUserTotpResponse,
  GetNotificationConfigurationsResponse,
  GetSubscriptionsResponse,
} from "@/types/blocks-os";

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY; // projectKey = your Blocks Key

// --- Captcha (see flows/captcha-lifecycle.md) ---

export function useCreateCaptcha() {
  return useMutation({
    mutationFn: (configurationName: string) =>
      osPost<CreateCaptchaRequestResponse>("/Captcha/Create", { configurationName }),
  });
}

export function useSubmitCaptcha() {
  return useMutation({
    mutationFn: (req: SubmitCaptchaRequest) =>
      osPost<SubmitCaptchaRequestResponse>("/Captcha/Submit", req),
  });
}

// --- Platform MFA (see flows/platform-mfa-otp.md) ---

export function useGenerateOtp() {
  return useMutation({
    mutationFn: (req: OtpGenerationRequest) =>
      osPost<OtpGenerationResponse>("/Mfa/GenerateOTP", { projectKey, ...req }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (req: VerifyOtpRequest) =>
      osPost<OtpVerificationResponse>("/Mfa/VerifyOTP", { projectKey, ...req }),
  });
}

export function useTotpSetup(userId: string | undefined) {
  return useQuery({
    queryKey: ["os", "totp-setup", userId],
    enabled: !!userId,
    queryFn: () =>
      osGet<SetUpUserTotpResponse>(
        `/Mfa/SetUpTotp?ProjectKey=${encodeURIComponent(projectKey)}&UserId=${encodeURIComponent(userId!)}`,
      ),
  });
}

// --- Read-only platform data ---

export function useNotificationConfigs(page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["os", "notification-configs", page, pageSize],
    queryFn: () =>
      osGet<GetNotificationConfigurationsResponse>(
        `/Notification/Gets?ProjectKey=${encodeURIComponent(projectKey)}&Page=${page}&PageSize=${pageSize}`,
      ),
  });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: ["os", "subscriptions"],
    queryFn: () =>
      osGet<GetSubscriptionsResponse>(
        `/Subscription/Gets?ProjectKey=${encodeURIComponent(projectKey)}`,
      ),
  });
}
```

## Usage sketch: a captcha gate before login

`CaptchaGate` runs Create → render → Submit and hands the resulting `verificationCode` to its parent, which passes it as `captcha_code` in the blocks-iam login call.

```tsx
// src/components/captcha-gate.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCaptcha, useSubmitCaptcha } from "@/hooks/use-blocks-os";

export function CaptchaGate({
  configurationName,
  onVerified,
}: {
  configurationName: string;
  onVerified: (verificationCode: string) => void;
}) {
  const create = useCreateCaptcha();
  const submit = useSubmitCaptcha();
  const [value, setValue] = useState("");

  useEffect(() => {
    create.mutate(configurationName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configurationName]);

  const challenge = create.data; // { id, captcha }
  // `captcha` encoding is not documented in swagger — inspect the live response once.
  // If it's a bare base64 image, prefix a data URI; if it's already a data/http URL, use it directly.
  const src = challenge?.captcha?.startsWith("data:") || challenge?.captcha?.startsWith("http")
    ? challenge.captcha
    : challenge?.captcha
      ? `data:image/png;base64,${challenge.captcha}`
      : undefined;

  const handleSubmit = async () => {
    if (!challenge?.id) return;
    const res = await submit.mutateAsync({ id: challenge.id, value });
    if (res.verificationCode) {
      onVerified(res.verificationCode); // → captcha_code in blocks-iam login
    } else {
      setValue("");
      create.mutate(configurationName); // wrong answer: challenges are one-shot, get a new one
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {src && <img src={src} alt="captcha challenge" className="h-16 w-auto rounded border" />}
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter the characters" />
        <Button onClick={handleSubmit} disabled={!challenge?.id || submit.isPending}>
          Verify
        </Button>
      </div>
      <button
        type="button"
        className="self-start text-xs text-muted-foreground underline"
        onClick={() => create.mutate(configurationName)}
      >
        New challenge
      </button>
    </div>
  );
}
```

## Error and refresh handling

- `BlocksApiError` with status 401 → run the refresh routine from **blocks-setup** (`POST /iam/v4/auth/refresh` via your auth store), then retry the query (`queryClient.invalidateQueries`) — or wire the retry into a fetch interceptor once, centrally.
- `BlocksApiError` with `errors` populated → the platform rejected the operation despite HTTP 200 (`isSuccess: false`); surface `Object.values(errors)` to the user.
- Captcha/OTP failures are not exceptions: `Submit` returns an empty `verificationCode`, `VerifyOTP` returns `isValid: false`. Branch on those fields, not on catch blocks.
