# Flow: auth-setup

Sets up authentication for a React (Vite or Next.js) application using React Query for data fetching. All auth API calls go through the service layer, mutations use `useMutation`, queries use `useQuery`, and token refresh is handled automatically via interceptors.

## Prerequisites

Before starting:
1. **Run the pre-flight audit** in `SKILL.md` — detect stack, existing auth, env vars
2. **Credentials available**: `API_BASE_URL` and `X_BLOCKS_KEY`
3. **Determine the login methods**: email/password, social login, or OIDC (check `get-login-options` or ask the user)

---

## Stack Detection

Detect from `package.json`:

| Indicator | Stack |
|-----------|-------|
| `"next"` in `dependencies` + `app/` dir or `next.config.js` | Next.js App Router |
| `"vite"` + `"react"` in `dependencies` | Vite + React SPA |
| `angular.json` exists | Angular — see `references/angular.md` |
| `pubspec.yaml` exists | Flutter — see `references/flutter.md` |
| `*.csproj` exists | Blazor .NET — see `references/blazor-dotnet.md` |
| Otherwise | Vanilla / generic JS |

For Angular, Flutter, Blazor, and other non-React stacks, the file-creation steps below apply to React stacks only. See the respective framework references.

---

## Step 1 — Install Dependencies

```bash
npm install @tanstack/react-query axios
```

Skip if `@tanstack/react-query` or `axios` already exist in `package.json`.

---

## Step 2 — Create Environment Variables

For **Next.js**:
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

For **Vite + React**:
```env
# .env
VITE_API_BASE_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=your-project-key
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
```

> Never store `ACCESS_TOKEN` or `REFRESH_TOKEN` in environment variables. They are runtime values obtained after authentication.

---

## Step 3 — Create File: `src/lib/auth.types.ts`

Defines all the types used throughout the auth layer. Use exact field names from `contracts.md`.

```
Create: src/lib/auth.types.ts
Key patterns:
  - TokenResponse: access_token, token_type, expires_in, refresh_token, id_token
  - MfaRequiredResponse: enable_mfa: true, mfaType, mfaId, message
  - AuthResponse = TokenResponse | MfaRequiredResponse
  - isMfaResponse guard function
  - User type: itemId, firstName, lastName, email, profileImageUrl, OrganizationMembership
  - All request/response types from contracts.md
```

```typescript
// src/lib/auth.types.ts

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string | null;
}

export interface MfaRequiredResponse {
  enable_mfa: true;
  mfaType: "email" | "authenticator";
  mfaId: string;
  message: string;
}

export type AuthResponse = TokenResponse | MfaRequiredResponse;

export const isMfaResponse = (res: AuthResponse): res is MfaRequiredResponse =>
  (res as MfaRequiredResponse).enable_mfa === true;

export interface User {
  itemId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  userName?: string;
  salutation?: string;
  lastName?: string;
  language?: string;
  OrganizationMembership?: OrganizationMembership[];
  active?: boolean;
  isVarified?: boolean;
  mfaEnabled?: boolean;
  userMfaType?: number;
  userCreationType?: number;
  department?: string;
  employeeId?: string;
}

export interface OrganizationMembership {
  organizationId: string;
  roles: string[];
  permissions: string[];
}

export interface LoginOptions {
  type: "Email" | "SocialLogin" | "SSO";
  providers: string[];
}

export interface LoginOptionsResponse {
  loginOptions: LoginOptions[];
  isSuccess: boolean;
  errors: Record<string, string>;
}
```

---

## Step 4 — Create File: `src/lib/auth.service.ts`

Contains all raw API calls to the IDP backend. This is the single source of truth for auth HTTP calls.

```
Create: src/lib/auth.service.ts
Key patterns:
  - Base URL: import.meta.env.VITE_API_BASE_URL (Vite) or process.env.NEXT_PUBLIC_API_BASE_URL (Next.js)
  - x-blocks-key header on ALL requests
  - Token endpoint uses form-encoded body (Content-Type: application/x-www-form-urlencoded)
  - All other endpoints use JSON body (Content-Type: application/json)
  - Authenticated endpoints add Authorization: Bearer <token> header
  - See contracts.md for all request/response shapes
```

```typescript
// src/lib/auth.service.ts

const API_BASE =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL!;

const X_BLOCKS_KEY =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_X_BLOCKS_KEY
    : process.env.NEXT_PUBLIC_X_BLOCKS_KEY!;

export { X_BLOCKS_KEY };

const headers = () => ({
  "x-blocks-key": X_BLOCKS_KEY,
  "Content-Type": "application/json",
});

const formHeaders = () => ({
  "x-blocks-key": X_BLOCKS_KEY,
  "Content-Type": "application/x-www-form-urlencoded",
});

// ─── Token ────────────────────────────────────────────────────────────────────

export async function getToken(formBody: Record<string, string>) {
  const params = new URLSearchParams(formBody);
  const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
    method: "POST",
    headers: formHeaders(),
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(`Token error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getLoginOptions() {
  const res = await fetch(`${API_BASE}/idp/v1/Authentication/GetLoginOptions`, {
    headers: { "x-blocks-key": X_BLOCKS_KEY },
  });
  return res.json();
}

// ─── Social Login ──────────────────────────────────────────────────────────────

export async function getSocialLoginEndpoint(provider: string, redirectUri: string) {
  const res = await fetch(`${API_BASE}/idp/v1/Authentication/GetSocialLogInEndPoint`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({
      provider,
      redirectUri,
      projectKey: X_BLOCKS_KEY,
    }),
  });
  return res.json();
}

// ─── Authenticated ─────────────────────────────────────────────────────────────
// All authenticated service calls go through authFetch, which automatically handles
// 401 token expiry by refreshing and retrying. The refreshPromise singleton prevents
// race conditions when multiple requests fail simultaneously.
// The authState module-level object is exported so use-auth-store.ts can sync React state.

export const authState: {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number;
} = { accessToken: null, refreshToken: null, expiresAt: 0 };

const tokenSubscribers: Array<() => void> = [];
export function onTokenChange() { tokenSubscribers.forEach((cb) => cb()); }

let refreshPromise: Promise<{ access_token: string; refresh_token: string; expires_in: number }> | null = null;

async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const doFetch = async (token: string, refresh: string) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json();
    if (res.status === 401 && token) {
      // Token expired — refresh and retry once
      if (!refreshPromise) {
        refreshPromise = (async () => {
          if (!refresh) throw new Error("No refresh token");
          const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refresh,
          });
          const res = await fetch(`${API_BASE}/idp/v1/Authentication/Token`, {
            method: "POST",
            headers: formHeaders(),
            body: params.toString(),
          });
          const d = await res.json();
          if (!res.ok || !d.access_token) throw new Error("Refresh failed");
          authState.accessToken = d.access_token;
          authState.refreshToken = d.refresh_token;
          authState.expiresAt = Date.now() + d.expires_in * 1000;
          onTokenChange();
          return d;
        })().finally(() => { refreshPromise = null; });
      }
      try {
        const tokens = await refreshPromise;
        return doFetch(tokens.access_token, tokens.refresh_token);
      } catch {
        authState.accessToken = null;
        authState.refreshToken = null;
        authState.expiresAt = 0;
        onTokenChange();
        throw new Error("Token refresh failed");
      }
    }
    return data;
  };

  const { accessToken, refreshToken, expiresAt } = authState;
  if (accessToken && expiresAt && Date.now() < expiresAt - 30_000) {
    return doFetch(accessToken, refreshToken ?? "");
  }
  if (refreshToken) {
    return doFetch(accessToken ?? "", refreshToken);
  }
  throw new Error("Not authenticated");
}

export async function getUserInfo() {
  return authFetch("/idp/v1/Authentication/GetUserInfo");
}

export async function logout(refreshToken: string) {
  return authFetch("/idp/v1/Authentication/Logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  sort?: { property: string; isDescending?: boolean };
  filter?: Record<string, any>;
  projectKey?: string;
}) {
  return authFetch("/idp/v1/Iam/GetUsers", {
    method: "POST",
    body: JSON.stringify({ page: 1, pageSize: 20, ...params, projectKey: X_BLOCKS_KEY }),
  });
}

export async function getUser(userId: string) {
  return authFetch(`${API_BASE}/idp/v1/Iam/GetUser?ItemId=${userId}&ProjectKey=${X_BLOCKS_KEY}`);
}

export async function createUser(payload: Record<string, any>) {
  return authFetch("/idp/v1/Iam/SaveUser", {
    method: "POST",
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
}

export async function updateUser(payload: Record<string, any>) {
  return authFetch("/idp/v1/Iam/SaveUser", {
    method: "POST",
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
}

export async function deactivateUser(userId: string) {
  return authFetch("/idp/v1/Iam/DeactivateUser", {
    method: "POST",
    body: JSON.stringify({ userId, projectKey: X_BLOCKS_KEY }),
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function getPermissions(params?: {
  page?: number;
  pageSize?: number;
  filter?: Record<string, any>;
}) {
  return authFetch("/idp/v1/Iam/GetPermissions", {
    method: "POST",
    body: JSON.stringify({ ...params, projectKey: X_BLOCKS_KEY }),
  });
}

export async function createPermission(payload: {
  name: string;
  type: number;
  resource: string;
  resourceGroup: string;
  description?: string;
  permissionSeverity?: number;
  tags?: string[];
}) {
  return authFetch("/idp/v1/Iam/SavePermission", {
    method: "POST",
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
}

export async function saveRolesAndPermissions(
  payload: {
    userId: string;
    OrganizationMembership: { organizationId: string; roles: string[]; permissions: string[] }[];
  }
) {
  return authFetch("/idp/v1/Iam/SaveRolesAndPermissions", {
    method: "POST",
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function getRoles(params?: {
  page?: number;
  pageSize?: number;
  sort?: { property: string; isDescending?: boolean };
  filter?: Record<string, any>;
}) {
  return authFetch("/idp/v1/Iam/GetRoles", {
    method: "POST",
    body: JSON.stringify({ ...params, projectKey: X_BLOCKS_KEY }),
  });
}

export async function createRole(payload: {
  name: string;
  slug: string;
  description?: string;
}) {
  return authFetch("/idp/v1/Iam/SaveRole", {
    method: "POST",
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
}

export async function setUserRoles(userId: string, roles: string[]) {
  return authFetch("/idp/v1/Iam/SetRoles", {
    method: "POST",
    body: JSON.stringify({ userId, roles, projectKey: X_BLOCKS_KEY }),
  });
}

// ─── Organizations ─────────────────────────────────────────────────────────────

export async function getOrganizations() {
  return authFetch(
    `${API_BASE}/idp/v1/Iam/GetOrganizations?Language=en&ProjectKey=${X_BLOCKS_KEY}`
  );
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

export async function generateOtp(userId: string, mfaType: number = 1) {
  return authFetch("/idp/v1/Iam/GenerateOtp", {
    method: "POST",
    body: JSON.stringify({ userId, projectKey: X_BLOCKS_KEY, mfaType }),
  });
}

export async function verifyOtp(mfaId: string, verificationCode: string, authType: number = 1) {
  return authFetch("/idp/v1/Iam/VerifyOtp", {
    method: "POST",
    body: JSON.stringify({
      mfaId,
      verificationCode,
      authType,
      projectKey: X_BLOCKS_KEY,
      isFromTokenCall: false,
    }),
  });
}

export async function setupTotp(userId: string) {
  return authFetch(
    `${API_BASE}/idp/v1/Iam/SetUpUserTotp?UserId=${userId}&ProjectKey=${X_BLOCKS_KEY}`
  );
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessions(params?: {
  page?: number;
  pageSize?: number;
  sortProperty?: string;
  sortIsDescending?: boolean;
  userId?: string;
}) {
  const qs = new URLSearchParams({
    ProjectKey: X_BLOCKS_KEY,
    Page: String(params?.page ?? 1),
    PageSize: String(params?.pageSize ?? 20),
    ...(params?.sortProperty ? { "Sort.Property": params.sortProperty } : {}),
    ...(params?.sortIsDescending !== undefined ? { "Sort.IsDescending": String(params.sortIsDescending) } : {}),
    ...(params?.userId ? { "Filter.UserId": params.userId } : {}),
  });
  return authFetch(`${API_BASE}/idp/v1/Iam/GetSessions?${qs}`);
}

// ─── Password ───────────────────────────────────────────────────────────────

export async function changePassword(oldPassword: string, newPassword: string) {
  return authFetch("/idp/v1/Iam/ChangePassword", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword, projectKey: X_BLOCKS_KEY }),
  });
}

// ─── Registration ───────────────────────────────────────────────────────────

export async function checkEmailAvailable(email: string) {
  const res = await fetch(
    `${API_BASE}/idp/v1/Iam/CheckEmailAvailable?Email=${encodeURIComponent(email)}&ProjectKey=${X_BLOCKS_KEY}`
  );
  return res.json();
}

export async function validateActivationCode(code: string) {
  const res = await fetch(`${API_BASE}/idp/v1/Iam/ValidateActivationCode`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({ activationCode: code, projectKey: X_BLOCKS_KEY }),
  });
  return res.json();
}

export async function activateUser(payload: {
  code: string;
  password: string;
  captchaCode?: string;
  firstName?: string;
  lastName?: string;
}) {
  const res = await fetch(`${API_BASE}/idp/v1/Iam/ActivateUser`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({ ...payload, projectKey: X_BLOCKS_KEY }),
  });
  return res.json();
}

export async function resendActivation(userId: string, mailPurpose: string = "") {
  const res = await fetch(`${API_BASE}/idp/v1/Iam/ResendActivation`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({ userId, projectKey: X_BLOCKS_KEY, mailPurpose }),
  });
  return res.json();
}

// ─── Password Recovery ───────────────────────────────────────────────────────

export async function recoverUser(email: string, captchaCode: string = "") {
  const res = await fetch(`${API_BASE}/idp/v1/Iam/RecoveryUser`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({ email, projectKey: X_BLOCKS_KEY, captchaCode }),
  });
  return res.json();
}

export async function resetPassword(
  code: string,
  newPassword: string,
  captchaCode: string = "",
  logoutFromAllDevices: boolean = false
) {
  const res = await fetch(`${API_BASE}/idp/v1/Iam/ResetPassword`, {
    method: "POST",
    headers: { ...headers() },
    body: JSON.stringify({
      code,
      password: newPassword,
      projectKey: X_BLOCKS_KEY,
      captchaCode,
      logoutFromAllDevices,
    }),
  });
  return res.json();
}
```

---

## Step 5 — Create File: `src/lib/query-client.ts`

Configures React Query with automatic token refresh on 401.

```
Create: src/lib/query-client.ts
Key patterns:
  - QueryClient with default options
  - retry: false on 401 (don't retry auth failures)
  - refreshToken singleton pattern prevents race conditions
  - On refresh failure: redirect to /login
```

```typescript
// src/lib/query-client.ts

import { QueryClient } from "@tanstack/react-query";

let refreshPromise: Promise<void> | null = null;

async function doRefresh(
  refreshToken: string,
  setTokens: (tokens: { accessToken: string; refreshToken: string; expiresAt: number }) => void
) {
  const { getToken } = await import("@/lib/auth.service");

  const data = await getToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if ("enable_mfa" in data) {
    throw new Error("MFA required during refresh");
  }

  setTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
}

export async function refreshAndRetry(
  refreshToken: string,
  setTokens: (tokens: { accessToken: string; refreshToken: string; expiresAt: number }) => void,
  onFail: () => void
) {
  if (!refreshPromise) {
    refreshPromise = doRefresh(refreshToken, setTokens)
      .catch(() => {
        onFail();
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  await refreshPromise;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Step 6 — Create File: `src/lib/auth-hooks.ts`

React Query hooks for all auth operations. Use `useMutation` for writes, `useQuery` for reads.

```
Create: src/lib/auth-hooks.ts
Key patterns:
  - useLogin: useMutation → calls getToken with password grant
  - useRefreshToken: useMutation → calls getToken with refresh_token grant
  - useLogout: useMutation → calls logout service, clears tokens
  - useUser: useQuery → calls getUserInfo with current token
  - useGetUsers: useQuery → paginated user list
  - useGetRoles: useQuery → role list
  - useCreateUser: useMutation → creates user
  - useMfaVerify: useMutation → calls getToken with mfa_code grant
```

```typescript
// src/lib/auth-hooks.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getToken,
  getLoginOptions,
  getUserInfo,
  logout,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  getRoles,
  setUserRoles,
  getOrganizations,
  getSessions,
  getPermissions,
  saveRolesAndPermissions,
  generateOtp,
  setupTotp,
  checkEmailAvailable,
  validateActivationCode,
  activateUser,
  resendActivation,
  recoverUser,
  resetPassword,
} from "@/lib/auth.service";

// ─── Token management ────────────────────────────────────────────────────────

export function useLogin(
  setTokens: (t: { accessToken: string; refreshToken: string; expiresAt: number }) => void,
  onMfaRequired?: (mfaId: string, mfaType: string) => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      getToken({ grant_type: "password", username, password }),
    onSuccess: (data) => {
      if ("enable_mfa" in data && data.enable_mfa) {
        onMfaRequired?.(data.mfaId, data.mfaType);
      } else {
        setTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        });
      }
    },
    onError: (err: any) => {
      if (err.status === 401) onError?.("Invalid email or password");
      else onError?.("Something went wrong. Please try again.");
    },
  });
}

export function useMfaVerify(
  setTokens: (t: { accessToken: string; refreshToken: string; expiresAt: number }) => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: ({
      mfaId,
      mfaType,
      verificationCode,
    }: {
      mfaId: string;
      mfaType: string;
      verificationCode: string;
    }) =>
      getToken({
        grant_type: "mfa_code",
        mfa_id: mfaId,
        mfa_type: mfaType,
        verification_code: verificationCode,
      }),
    onSuccess: (data) => {
      if ("enable_mfa" in data) {
        onError?.("Invalid code. Please try again.");
      } else {
        setTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        });
      }
    },
    onError: () => onError?.("Invalid code. Please try again."),
  });
}

export function useLogout(
  refreshToken: string | null,
  clearTokens: () => void,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(refreshToken ?? ""),
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
      onSuccess?.();
    },
    onError: () => {
      clearTokens();
      queryClient.clear();
      onSuccess?.();
    },
  });
}

// ─── Authenticated queries ───────────────────────────────────────────────────

export function useUser() {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: () => getUserInfo(),
    enabled: !!store.accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginOptions() {
  return useQuery({
    queryKey: ["login-options"],
    queryFn: () => getLoginOptions(),
    staleTime: Infinity,
  });
}

// ─── Users ──────────────────────────────────────────────────────────────────

export function useGetUsers(
  params?: { page?: number; pageSize?: number; filter?: Record<string, any> }
) {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers({ ...params, projectKey: "" }),
    enabled: !!store.accessToken,
  });
}

export function useGetUser(userId: string) {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
    enabled: !!store.accessToken && !!userId,
  });
}

export function useCreateUser(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, any>) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
  });
}

export function useUpdateUser(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, any>) => updateUser(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["user", vars.itemId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
  });
}

export function useDeactivateUser(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
  });
}

export function useDisableUserMfa(onSuccess?: () => void, onError?: (msg: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => disableUserMfa(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
    onError: (err: any) => onError?.(err.message ?? "Failed to disable MFA"),
  });
}

export function useChangePassword(
  onSuccess?: () => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changePassword(oldPassword, newPassword),
    onSuccess,
    onError: (err: any) => onError?.(err.message ?? "Failed to change password"),
  });
}

// ─── Roles ──────────────────────────────────────────────────────────────────

export function useGetRoles(
  params?: { page?: number; pageSize?: number; filter?: Record<string, any> }
) {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => getRoles(params ?? {}),
    enabled: !!store.accessToken,
  });
}

export function useSetUserRoles(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      setUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
}

// ─── Organizations ──────────────────────────────────────────────────────────

export function useOrganizations() {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => getOrganizations(),
    enabled: !!store.accessToken,
  });
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export function useGetSessions(
  params?: { page?: number; pageSize?: number; sortProperty?: string; sortIsDescending?: boolean; userId?: string }
) {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () => getSessions(params),
    enabled: !!store.accessToken,
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export function useGetPermissions(
  params?: { page?: number; pageSize?: number; filter?: Record<string, any> }
) {
  const store = useAuthStore();
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: () => getPermissions(params),
    enabled: !!store.accessToken,
  });
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

export function useGenerateOtp(
  onSuccess?: () => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: ({ userId, mfaType }: { userId: string; mfaType: number }) =>
      generateOtp(userId, mfaType),
    onSuccess,
    onError: (err: any) => onError?.(err.message ?? "Failed to send OTP"),
  });
}

export function useSetupTotp(
  onSuccess?: (data: any) => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: (userId: string) => setupTotp(userId),
    onSuccess,
    onError: (err: any) => onError?.(err.message ?? "Failed to set up TOTP"),
  });
}

// ─── Registration ────────────────────────────────────────────────────────────

export function useCheckEmail(enabled: boolean = false) {
  return useQuery({
    queryKey: ["email-check"],
    queryFn: () => checkEmailAvailable(""),
    enabled: false, // call with specific email via refetch
  });
}

export function useValidateActivationCode(
  onSuccess?: (data: any) => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: (code: string) => validateActivationCode(code),
    onSuccess,
    onError: (err: any) => onError?.(err.message ?? "Invalid code"),
  });
}

export function useActivateUser(
  onSuccess?: (data: any) => void,
  onError?: (err: any) => void
) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof activateUser>[0]) => activateUser(payload),
    onSuccess,
    onError,
  });
}

export function useResendActivation(
  onSuccess?: () => void,
  onError?: (msg: string) => void
) {
  return useMutation({
    mutationFn: (userId: string) => resendActivation(userId),
    onSuccess,
    onError: (err: any) => onError?.(err.message ?? "Failed to resend"),
  });
}

// ─── Password Recovery ───────────────────────────────────────────────────────

export function useRecoverUser(
  onSuccess?: () => void,
  onError?: (err: any) => void
) {
  return useMutation({
    mutationFn: ({ email, captchaCode }: { email: string; captchaCode?: string }) =>
      recoverUser(email, captchaCode ?? ""),
    onSuccess,
    onError,
  });
}

export function useResetPassword(
  onSuccess?: () => void,
  onError?: (err: any) => void
) {
  return useMutation({
    mutationFn: ({
      code,
      newPassword,
      captchaCode,
    }: {
      code: string;
      newPassword: string;
      captchaCode?: string;
    }) => resetPassword(code, newPassword, captchaCode ?? ""),
    onSuccess,
    onError,
  });
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────

export function useSaveRolesAndPermissions(
  onSuccess?: () => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; OrganizationMembership: { organizationId: string; roles: string[]; permissions: string[] }[] }) =>
      saveRolesAndPermissions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
}
```

---

## Step 7 — Create File: `src/lib/use-auth-store.ts`

A minimal reactive store for token state (access token, refresh token, expiresAt). This replaces the need for localStorage in the auth hooks.

```
Create: src/lib/use-auth-store.ts
Key patterns:
  - Simple state: accessToken, refreshToken, expiresAt
  - setTokens, clearTokens, getAccessToken functions
  - This is the single source of truth for token state
```

```typescript
// src/lib/use-auth-store.ts
// Imports authState and onTokenChange from auth.service.ts so both the React
// store and authFetch share the same token state singleton.

import { useState, useCallback, useEffect } from "react";
import { authState, onTokenChange } from "./auth.service";

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export function useAuthStore() {
  const [tokens, setTokensState] = useState<TokenState>({
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    expiresAt: authState.expiresAt,
  });

  useEffect(() => {
    return onTokenChange((s) => setTokensState(s));
  }, []);

  const setTokens = useCallback(
    (data: { accessToken: string; refreshToken: string; expiresAt: number }) => {
      authState.accessToken = data.accessToken;
      authState.refreshToken = data.refreshToken;
      authState.expiresAt = data.expiresAt;
      setTokensState({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      });
      onTokenChange();
    },
    []
  );

  const clearTokens = useCallback(() => {
    authState.accessToken = null;
    authState.refreshToken = null;
    authState.expiresAt = 0;
    setTokensState({ accessToken: null, refreshToken: null, expiresAt: null });
    onTokenChange();
  }, []);

  const getAccessToken = useCallback((): string | null => {
    if (!tokens.accessToken || !tokens.expiresAt) return null;
    if (Date.now() >= tokens.expiresAt - 30_000) return null; // expired (30s buffer)
    return tokens.accessToken;
  }, [tokens.accessToken, tokens.expiresAt]);

  const isAuthenticated = !!tokens.accessToken;

  return { ...tokens, setTokens, clearTokens, getAccessToken, isAuthenticated };
}
```

---

## Step 8 — Create File: `src/contexts/auth-context.tsx` (React SPA) or `src/contexts/auth-context.tsx` (Next.js)

Provides auth state to the entire app. Wraps the app with React Query's `QueryClientProvider` and exposes the auth store.

**For Vite + React SPA:**
```
Create: src/contexts/auth-context.tsx
Key patterns:
  - AuthProvider wraps children
  - Exposes: isAuthenticated, isLoading, user, login, logout, tokens
  - useLogin/useLogout/useUser hooks from auth-hooks.ts
  - Redirect to /login on logout
  - Load user on mount if token exists
```

```tsx
// src/contexts/auth-context.tsx

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/use-auth-store";
import { useLogin, useLogout, useUser } from "@/lib/auth-hooks";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  mfaRequired: boolean;
  mfaId: string | null;
  mfaType: string | null;
  verifyMfa: (code: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();
  const [mfaState, setMfaState] = useState<{ mfaId: string; mfaType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin(
    (t) => {
      store.setTokens(t);
      setError(null);
    },
    (mfaId, mfaType) => {
      setMfaState({ mfaId, mfaType });
    },
    (msg) => setError(msg)
  );

  const mfaVerify = useMfaVerify(
    (t) => {
      store.setTokens(t);
      setMfaState(null);
      setError(null);
    },
    (msg) => setError(msg)
  );

  const logoutMutation = useLogout(
    store.refreshToken,
    () => {
      store.clearTokens();
      setMfaState(null);
    },
    () => {
      window.location.href = "/login";
    }
  );

  const { data: userData, isLoading: userLoading } = useUser();

  const login = async (username: string, password: string) => {
    setError(null);
    await loginMutation.mutateAsync({ username, password });
  };

  const verifyMfa = async (code: string) => {
    if (!mfaState) return;
    setError(null);
    await mfaVerify.mutateAsync({
      mfaId: mfaState.mfaId,
      mfaType: mfaState.mfaType,
      verificationCode: code,
    });
  };

  const logout = () => {
    if (store.accessToken) {
      logoutMutation.mutate(store.accessToken);
    } else {
      store.clearTokens();
      window.location.href = "/login";
    }
  };

  const isLoading = loginMutation.isPending || mfaVerify.isPending || userLoading;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: store.isAuthenticated,
        isLoading,
        user: userData ?? null,
        login,
        logout,
        mfaRequired: !!mfaState,
        mfaId: mfaState?.mfaId ?? null,
        mfaType: mfaState?.mfaType ?? null,
        verifyMfa,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
```

> For **Next.js App Router**, see `references/nextjs-app-router.md` for the equivalent AuthProvider and Server Actions pattern.

---

## Step 9 — Create File: `src/components/protected-route.tsx`

Guards routes that require authentication.

```tsx
// src/components/protected-route.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

---

## Step 10 — Wire Up the Root

**Vite + React SPA — `src/main.tsx`:**
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/contexts/auth-context";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

**Vite + React SPA — `src/App.tsx` routes:**
```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { LoginPage } from "@/pages/auth/login";
import { DashboardPage } from "@/pages/dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
```

---

## Directory Structure

After setup, the auth layer should look like this:

```
src/
├── lib/
│   ├── auth.types.ts         # All auth types and guards
│   ├── auth.service.ts       # All raw API calls
│   ├── auth-hooks.ts         # React Query hooks (useMutation, useQuery)
│   ├── use-auth-store.ts    # Token state management
│   └── query-client.ts      # QueryClient config + refresh singleton
├── contexts/
│   └── auth-context.tsx      # AuthProvider + useAuth hook
├── components/
│   └── protected-route.tsx   # Route guard
├── pages/
│   └── auth/
│       └── login.tsx         # Login page
└── App.tsx / main.tsx        # Root with providers
```

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `login` mutation always returns error | Token endpoint using JSON body | Use `application/x-www-form-urlencoded` for token endpoint |
| `isSuccess` always false in responses | Checking `success` instead of `isSuccess` | Always use `isSuccess` from the response envelope |
| User list returns empty | Wrong field name for user ID | Use `itemId`, not `id` |
| 401 on every request | Token expired and refresh not working | Check `refreshPromise` singleton pattern in `query-client.ts` |
| MFA loop | Wrong `mfaType` enum value sent | Use `UserMfaType` enum: `1` for OTP, `2` for TOTP |

---

## Verification

After setup, verify:

1. Login form submits and stores tokens in `useAuthStore`
2. Authenticated routes redirect to `/login` when unauthenticated
3. `useUser()` hook returns the authenticated user
4. `useGetUsers()` returns paginated user list
5. Logout clears tokens and redirects to `/login`
6. See the Verification Checklist in `SKILL.md` for full list

---

## Next Steps

After `auth-setup` is complete, use the following flows for specific features:

| Feature | Flow |
|---------|------|
| Login with email/password, social, OIDC | `flows/login-flow.md` |
| Self-registration, account activation | `flows/user-registration.md` |
| Forgot password, reset password | `flows/password-recovery.md` |
| MFA enrollment (OTP, TOTP) | `flows/mfa-setup.md` |
| Admin creates user + assigns roles | `flows/user-onboarding.md` |
| View sessions, single/all logout | `flows/session-management.md` |
| Roles, permissions, RBAC | `flows/role-permission-setup.md` |
| OIDC client, SSO, authorize URL | `flows/oidc-sso-setup.md` |
| Machine-to-machine credentials | `flows/client-credentials.md` |
