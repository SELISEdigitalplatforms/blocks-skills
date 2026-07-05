# blocks-iam — API Endpoints

> Generated from `https://api.seliseblocks.com/iam/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py iam`.

**Base URL:** `https://api.seliseblocks.com/iam/v4`

**URL pattern:** every endpoint is `{base}/{endpoint}` — do **not** prefix with `/api/`. e.g. `POST {base}/auth/login`, `GET {base}/iam/me`, `POST {base}/auth/activate`. The `/api/` from the swagger `basePath` is not part of the URL served by the gateway. (Exception: OIDC discovery stays at `GET {base}/.well-known/openid-configuration` etc.)

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**103 endpoints** across 9 controllers.

## Contents

- [Authentication](#authentication) (31)
- [Authorization](#authorization) (5)
- [Discovery](#discovery) (4)
- [Iam](#iam) (35)
- [Idp](#idp) (3)
- [IdpSession](#idpsession) (6)
- [Mfa](#mfa) (12)
- [OidcClients](#oidcclients) (4)
- [TokenManagement](#tokenmanagement) (3)

## Authentication

### `POST /auth/activate`

Activate user account  
Validates activation code and marks account as active  
User can log in after successful activation

**Request body** (`application/json`):

```ts
{
  code?: string | null
  password?: string | null
  captchaCode?: string | null
  mailPurpose?: string | null
  preventPostEvent?: boolean
  firstName?: string | null
  lastName?: string | null
}
```

**Response 200:** Account activated successfully — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** Invalid or expired activation code — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/change-password`

Update password for authenticated user  
Requires current password for security validation

**Request body** (`application/json`):

```ts
{
  newPassword?: string | null
  oldPassword?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/client-credentials`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `request` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationId?: string | null
  tags?: string[]
  name?: string | null
  clientSecret?: string | null
  roles?: string[]
  permissionsByOrg?: { [key: string]: string[] }
  isActive?: boolean
  audiences?: string[]
}[]
```

### `POST /auth/client-credentials`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  roles?: string[]
  permissionsByOrg?: { [key: string]: string[] }
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /auth/client-credentials/delete`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /auth/config`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `request` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/config`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  refreshTokenValidForNumberMinutes?: number
  absoluteRefreshTokenValidForNumberMinutes?: number
  accessTokenValidForNumberMinutes?: number
  rememberMeRefreshTokenValidForNumberMinutes?: number
  getNumberOfWrongAttemptsToLockTheAccount?: number
  accountLockDurationInMinutes?: number
  publicCertificatePath?: string | null
  accountActivationPath?: string | null
  accountVerificationPath?: string | null
  recoverAccountPath?: string | null
  isOidcEnabled?: boolean | null
  accountActionBaseUrl?: string | null
  useAccountActionBaseUrlAsDefault?: boolean | null
  activationUrlLifetimeInMinutes?: number
  recoverAccountUrlLifetimeInMinutes?: number
  logoutOnPasswordChange?: boolean | null
  passwordStrengthCheckerRegex?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /auth/identity-providers`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/identity-providers`

Create identity provider configuration  
Registers new OAuth 2.0 / OIDC provider for tenant  
Validates configuration and tests JWKS endpoint  
Requires authorization (admin role)

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationId?: string | null
  tags?: string[]
  provider: string | null
  providerType: string | null
  protocol?: string | null
  displayName?: string | null
  isActive?: boolean
  clientId: string | null
  clientSecret: string | null
  issuer?: string | null
  authorizationUrl?: string | null
  tokenUrl?: string | null
  userInfoUrl?: string | null
  jwksUri?: string | null
  wellKnownUrl?: string | null
  redirectUris?: string[]
  scope?: string | null
  responseType?: string | null
  grantTypes?: string[]
  requirePkce?: boolean
  tokenEndpointAuthMethod: string | null
  initialRoles?: string[]
  initialPermissions?: string[]
  icon?: string | null
  teamId?: string | null
  keyId?: string | null
  privateKey?: string | null
  appleAudience?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/identity-providers/{id}`

Get identity provider by ID  
Retrieves specific provider configuration  
Does NOT return sensitive credentials (client_secret)

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /auth/identity-providers/{id}`

Update identity provider configuration  
Modifies existing provider settings  
Validates configuration and tests endpoints if changed

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationId?: string | null
  tags?: string[]
  provider: string | null
  providerType: string | null
  protocol?: string | null
  displayName?: string | null
  isActive?: boolean
  clientId: string | null
  clientSecret: string | null
  issuer?: string | null
  authorizationUrl?: string | null
  tokenUrl?: string | null
  userInfoUrl?: string | null
  jwksUri?: string | null
  wellKnownUrl?: string | null
  redirectUris?: string[]
  scope?: string | null
  responseType?: string | null
  grantTypes?: string[]
  requirePkce?: boolean
  tokenEndpointAuthMethod: string | null
  initialRoles?: string[]
  initialPermissions?: string[]
  icon?: string | null
  teamId?: string | null
  keyId?: string | null
  privateKey?: string | null
  appleAudience?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PATCH /auth/identity-providers/{id}/status`

Enable or disable identity provider  
Toggles provider activation status without deleting configuration  
Preferred over deletion for temporary disabling

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Request body** (`application/json`):

```ts
{
  isActive?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/impersonate`

**Request body** (`application/json`):

```ts
{
  targeted_tenant_id?: string | null
  organization_id?: string | null
  refresh_token?: string | null
  impersonation_id?: string | null
  impersontingUserId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/impersonation/status`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/impersonation/stop`

Stop user impersonation (Revert to Original Admin)  
Admin stops impersonating user and reverts to original context

**Request body** (`application/json`):

```ts
{
  refresh_token?: string | null
  impersonation_id?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/login`

Execute password-based authentication (Embedded Login)  
Validates username and password against stored user account  
Issues access and refresh tokens on success

**Request body** (`application/json`):

```ts
{
  client_id?: string | null
  username?: string | null
  password?: string | null
  captcha_code?: string | null
  mfa_id?: string | null
  mfa_code?: string | null
  mfa_type?: 0 | 1 | 2 | 3 | 4 (int enum)
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/login-options`

Retrieve available login options (identity providers and their metadata)  
No authentication required - public discovery endpoint

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/logout`

Execute user logout  
Revokes refresh token, invalidates session, clears cookies

**Request body** (`application/json`):

```ts
{
  refreshToken?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/logout-all`

Execute global logout across all sessions (Logout All Devices)  
Revokes all refresh tokens for user across all devices  
User must re-authenticate on all devices  
Optionally triggers backchannel logout notifications

**Request body** (`application/json`):

```ts
{
  useBackchannel?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/me`

Retrieve authenticated user information (OIDC UserInfo Endpoint)  
Returns user claims per OpenID Connect 1.0 specification  
Includes standard OIDC claims (sub, email, name, picture) and custom Blocks claims  
RFC 3986: OpenID Connect UserInfo Endpoint

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/recover`

Initiate account recovery (password reset flow)  
Sends recovery link to registered email address

**Request body** (`application/json`):

```ts
{
  email?: string | null
  captchaCode?: string | null
  mailPurpose?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/refresh`

Refresh access token using refresh token  
Validates refresh token and issues new tokens  
Maintains session continuity without re-authentication  
RFC 6749: OAuth 2.0 Refresh Token Grant

**Request body** (`application/json`):

```ts
{
  refresh_token?: string | null
  client_id?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/resend-activation`

Resend account activation email  
Generates new activation code and sends to user's email  
Use if user did not receive initial activation email

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  mailPurpose?: string | null
}
```

**Response 200:** Activation email resent successfully — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** User not found or already activated — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/reset-password`

Execute password reset with recovery token  
Validates token before allowing password change

**Request body** (`application/json`):

```ts
{
  code?: string | null
  password?: string | null
  captchaCode?: string | null
  logoutFromAllDevices?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/signup`

Execute user registration (Sign Up)  
Creates new user account with provided credentials  
Issues access and refresh tokens on success

**Request body** (`application/json`):

```ts
{
  email?: string | null
  captchaCode?: string | null
  mailPurpose?: string | null
  isSsoSignup?: boolean
  provider?: string | null
  externalUserId?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  createOrganizationDuringSignup?: boolean
  organizationName?: string | null
  organizationDescription?: string | null
  attributes?: object
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/social/callback`

Social provider callback handler (API Pattern)  
Receives authorization code from social provider via POST body  
Exchanges code for tokens, validates JWT, creates/updates user  
Sets secure HTTP-only cookie with tokens  
Endpoint:  
- POST /social/callback with request body  
RFC 6749: OAuth 2.0 | RFC 3986: OpenID Connect | RFC 7519: JWT

**Request body** (`application/json`):

```ts
{
  client_id?: string | null
  code?: string | null
  state?: string | null
  provider?: string | null
  mfa_id?: string | null
  mfa_code?: string | null
  mfa_type?: 0 | 1 | 2 | 3 | 4 (int enum)
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/social/initiate`

Initiate social provider authentication (OAuth 2.0 Authorization Code Flow)  
Generates PKCE code challenge and state parameter  
Returns authorization URL to redirect user to social provider  
RFC 6749: OAuth 2.0 Framework | RFC 7636: PKCE

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `clientId` | query | string | no |  |
| `redirectUri` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /auth/switch-org`

Switch organization context (Multi-tenant Organization Switching)  
Authenticated user switches to different organization  
Reissues tokens with new organization context

**Request body** (`application/json`):

```ts
{
  organization_id?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /auth/user-codes`

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  code?: string | null
  userId?: string | null
  clientId?: string | null
  codeTtlInMinute?: number | null
  expiryDate?: string (date-time) | null
  note?: string | null
}[]
```

### `POST /auth/user-codes`

**Request body** (`application/json`):

```ts
{
  clientId?: string | null
  codeTtlInMinute?: number
  note?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /auth/validate-activation`

Validate account activation code  
Checks if activation code is valid without activating account  
Use to verify code before user interaction

**Request body** (`application/json`):

```ts
{
  activationCode?: string | null
}
```

**Response 200:** Activation code is valid — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** Invalid or expired activation code — no schema documented in swagger; verify the live response before relying on its shape.

## Authorization

### `GET /oidc/authorize`

OAuth 2.0 Authorization Endpoint (RFC 6749 Section 3.1)  
Initiates authorization code flow with PKCE

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `client_id` | query | string | no |  |
| `response_type` | query | string | no |  |
| `redirect_uri` | query | string | no |  |
| `scope` | query | string | no |  |
| `state` | query | string | no |  |
| `nonce` | query | string | no |  |
| `code_challenge` | query | string | no |  |
| `code_challenge_method` | query | string | no |  |
| `prompt` | query | string | no |  |
| `tenant_id` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /oidc/callback`

OIDC callback handler (Browser Redirect Pattern - GET)  
Receives authorization code from provider via browser redirect  
Exchanges code for tokens, validates JWT signature and claims  
RFC 6749: OAuth 2.0 | RFC 3986: OpenID Connect | RFC 7519: JWT | RFC 5280: X.509

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `code` | query | string | no |  |
| `state` | query | string | no |  |

**Request body** (`application/json`):

```ts
{
  code?: string | null
  state?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /oidc/callback`

OIDC callback handler (Browser Redirect Pattern - GET)  
Receives authorization code from provider via browser redirect  
Exchanges code for tokens, validates JWT signature and claims  
RFC 6749: OAuth 2.0 | RFC 3986: OpenID Connect | RFC 7519: JWT | RFC 5280: X.509

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `code` | query | string | no |  |
| `state` | query | string | no |  |

**Request body** (`application/json`):

```ts
{
  code?: string | null
  state?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /oidc/login`

OIDC Login Endpoint — authenticates credentials, sets IDP session, then issues authorization code.  
Use this for headless / API-based OIDC flows where the browser UI is not available.

**Request body** (`application/json`):

```ts
{
  username?: string | null
  password?: string | null
  client_id?: string | null
  redirect_uri?: string | null
  scope?: string | null
  state?: string | null
  nonce?: string | null
  code_challenge?: string | null
  code_challenge_method?: string | null
  tenant_id?: string | null
  provider_client_id?: string | null
  provider_redirect_uri?: string | null
  mfa_id?: string | null
  mfa_code?: string | null
  captcha_code?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /oidc/token`

OAuth 2.0 Token Endpoint (RFC 6749 Section 3.2)  
Supports both authorization_code and refresh_token grants

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Discovery

### `GET /{tenant_id}/.well-known/jwks.json`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `tenant_id` | path | string | yes |  |

**Response 200:**

```ts
{
  keys?: {
    kty?: string | null
    use?: string | null
    kid?: string | null
    alg?: string | null
    n?: string | null
    e?: string | null
  }[]
}
```

### `GET /{tenant_id}/.well-known/oauth-authorization-server`

OAuth Authorization Server Metadata Endpoint  
RFC 8414 Section 3.2  
  
Provides metadata for OAuth Authorization Servers  
Compatible with both OAuth and OIDC servers  
  
Standard response caching: 1 hour

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `tenant_id` | path | string | yes |  |

**Response 200:**

```ts
{
  issuer?: string | null
  authorization_endpoint?: string | null
  token_endpoint?: string | null
  jwks_uri?: string | null
  revocation_endpoint?: string | null
  introspection_endpoint?: string | null
  response_types_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
}
```

### `GET /{tenant_id}/.well-known/openid-configuration`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `tenant_id` | path | string | yes |  |

**Response 200:**

```ts
{
  issuer?: string | null
  authorization_endpoint?: string | null
  token_endpoint?: string | null
  userinfo_endpoint?: string | null
  revocation_endpoint?: string | null
  introspection_endpoint?: string | null
  jwks_uri?: string | null
  response_types_supported?: string[]
  grant_types_supported?: string[]
  subject_types_supported?: string[]
  id_token_signing_alg_values_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
  scopes_supported?: string[]
}
```

### `GET /{tenant_id}/jwks.json`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `tenant_id` | path | string | yes |  |

**Response 200:**

```ts
{
  keys?: {
    kty?: string | null
    use?: string | null
    kid?: string | null
    alg?: string | null
    n?: string | null
    e?: string | null
  }[]
}
```

## Iam

### `GET /iam/email/available`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Email` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/history`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.UserId` | query | string | no |  |

**Response 200:**

```ts
{
  data?: unknown[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /iam/me`

**Response 200:**

```ts
{
  data?: { [key: string]: unknown | null }
  errors?: { [key: string]: string }
}
```

### `PATCH /iam/me`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  salutation?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  tags?: string[]
  profileImageUrl?: string | null
  profileImageId?: string | null
  userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
  mfaEnabled?: boolean
  roles?: string[]
  permissions?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/organizations`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.Name` | query | string | yes |  |
| `Filter.Description` | query | string | no |  |
| `Filter.ParentOrganizationId` | query | string | no |  |
| `Filter.ShortCode` | query | string | no |  |
| `Filter.IsEnabled` | query | boolean | no |  |
| `Filter.DefaultRoleForMembers` | query | array | no |  |
| `Filter.DefaultPermissionsForMembers` | query | array | no |  |
| `Filter.Email` | query | string | no |  |
| `Filter.PhoneNumber` | query | string | no |  |
| `Filter.WebsiteUrl` | query | string | no |  |
| `Filter.Addresses` | query | array | no |  |
| `Filter.Theme.Name` | query | string | no |  |
| `Filter.Theme.PrimaryColor` | query | string | no |  |
| `Filter.Theme.SecondaryColor` | query | string | no |  |
| `Filter.Theme.TertiaryColor` | query | string | no |  |
| `Filter.Theme.Attributes` | query | object | no |  |
| `Filter.LogoUrl` | query | string | no |  |
| `Filter.LogoId` | query | string | no |  |
| `Filter.Industry` | query | string | no |  |
| `Filter.TimeZone` | query | string | no |  |
| `Filter.Currency` | query | string | no |  |
| `Filter.DateFormat` | query | string | no |  |
| `Filter.TimeFormat` | query | string | no |  |
| `Filter.Locale` | query | string | no |  |
| `Filter.Attributes` | query | object | no |  |
| `Filter.ItemId` | query | string | no |  |
| `Filter.CreatedDate` | query | string (date-time) | no |  |
| `Filter.LastUpdatedDate` | query | string (date-time) | no |  |
| `Filter.CreatedBy` | query | string | no |  |
| `Filter.Language` | query | string | no |  |
| `Filter.LastUpdatedBy` | query | string | no |  |
| `Filter.OrganizationId` | query | string | no |  |
| `Filter.Tags` | query | array | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  organizations?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name: string | null
    description?: string | null
    parentOrganizationId?: string | null
    shortCode?: string | null
    isEnabled?: boolean
    defaultRoleForMembers?: string[]
    defaultPermissionsForMembers?: string[]
    email?: string | null
    phoneNumber?: string | null
    websiteUrl?: string | null
    addresses?: {
      name?: string | null
      addressLine1?: string | null
      addressLine2?: string | null
      city?: string | null
      state?: string | null
      postalCode?: string | null
      country?: string | null
      isPrimary?: boolean
    }[]
    theme?: {
      name?: string | null
      primaryColor?: string | null
      secondaryColor?: string | null
      tertiaryColor?: string | null
      attributes?: object
    }
    logoUrl?: string | null
    logoId?: string | null
    industry?: string | null
    timeZone?: string | null
    currency?: string | null
    dateFormat?: string | null
    timeFormat?: string | null
    locale?: string | null
    attributes?: object
  }[]
  totalCount?: number
}
```

### `GET /iam/organizations/config`

**Response 200:**

```ts
object
```

### `POST /iam/organizations/config`

**Request body** (`application/json`):

```ts
{
  allowOrgCreationFromCloud?: boolean
  allowOrgCreationFromConstruct?: boolean
  allowOrgCreationFromSignup?: boolean
  allowOrgCreationFromPortal?: boolean
  isMultiOrgEnabled?: boolean
  consentForMultiOrgEnable?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /iam/organizations/create`

**Request body** (`application/json`):

```ts
{
  name: string | null
  description?: string | null
  defaultRoleForMembers?: string[]
  defaultPermissionsForMembers?: string[]
  email?: string | null
  phoneNumber?: string | null
  websiteUrl?: string | null
  addresses?: {
    name?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    isPrimary?: boolean
  }[]
  attributes?: object
  createdFrom?: 1 | 2 | 3 (int enum)
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
}
```

### `GET /iam/organizations/my`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  organizations?: {
    itemId?: string | null
    name?: string | null
    createdDate?: string (date-time)
  }[]
}
```

### `GET /iam/organizations/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  organization?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name: string | null
    description?: string | null
    parentOrganizationId?: string | null
    shortCode?: string | null
    isEnabled?: boolean
    defaultRoleForMembers?: string[]
    defaultPermissionsForMembers?: string[]
    email?: string | null
    phoneNumber?: string | null
    websiteUrl?: string | null
    addresses?: {
      name?: string | null
      addressLine1?: string | null
      addressLine2?: string | null
      city?: string | null
      state?: string | null
      postalCode?: string | null
      country?: string | null
      isPrimary?: boolean
    }[]
    theme?: {
      name?: string | null
      primaryColor?: string | null
      secondaryColor?: string | null
      tertiaryColor?: string | null
      attributes?: object
    }
    logoUrl?: string | null
    logoId?: string | null
    industry?: string | null
    timeZone?: string | null
    currency?: string | null
    dateFormat?: string | null
    timeFormat?: string | null
    locale?: string | null
    attributes?: object
  }
}
```

### `POST /iam/organizations/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Request body** (`application/json`):

```ts
{
  name?: string | null
  description?: string | null
  defaultRoleForMembers?: string[]
  defaultPermissionsForMembers?: string[]
  email?: string | null
  phoneNumber?: string | null
  websiteUrl?: string | null
  addresses?: {
    name?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    isPrimary?: boolean
  }[]
  attributes?: object
  theme?: {
    name?: string | null
    primaryColor?: string | null
    secondaryColor?: string | null
    tertiaryColor?: string | null
    attributes?: object
  }
  logoUrl?: string | null
  logoId?: string | null
  industry?: string | null
  timeZone?: string | null
  currency?: string | null
  dateFormat?: string | null
  timeFormat?: string | null
  locale?: string | null
  isEnable?: boolean | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /iam/permissions`

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: {
    search?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    permissionSeverity?: 0 | 1 | 2 | 3 | 4 (int enum)
    isBuiltIn?: string | null
    tags?: string[]
    resources?: string[]
    isArchived?: boolean
    resourceGroup?: string | null
  }
  roles?: string[]
}
```

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
    resourceGroup?: string | null
    isBuiltIn?: boolean
    isArchived?: boolean
    permissionSeverity?: 0 | 1 | 2 | 3 | 4 (int enum)
    dependentPermissions?: string[]
    roles?: string[]
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /iam/permissions/by-severity`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `request` | query | string | no |  |

**Response 200:**

```ts
{
  severityLevel?: string | null
  count?: number
}[]
```

### `POST /iam/permissions/create`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  type?: 0 | 1 | 2 | 3 (int enum)
  description?: string | null
  resource?: string | null
  resourceGroup?: string | null
  tags?: string[]
  dependentPermissions?: string[]
  isBuiltIn?: boolean
  permissionSeverity?: 0 | 1 | 2 | 3 | 4 (int enum)
  propagateToOtherOrg?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/permissions/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
    resourceGroup?: string | null
    isBuiltIn?: boolean
    isArchived?: boolean
    permissionSeverity?: 0 | 1 | 2 | 3 | 4 (int enum)
    dependentPermissions?: string[]
    roles?: string[]
  }
  errors?: { [key: string]: string }
}
```

### `POST /iam/permissions/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Request body** (`application/json`):

```ts
{
  name?: string | null
  type?: 0 | 1 | 2 | 3 (int enum)
  description?: string | null
  resource?: string | null
  resourceGroup?: string | null
  tags?: string[]
  dependentPermissions?: string[]
  isBuiltIn?: boolean
  permissionSeverity?: 0 | 1 | 2 | 3 | 4 (int enum)
  itemId?: string | null
  isArchived?: boolean
  propagateToOtherOrg?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/resource-groups`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `request` | query | string | no |  |

**Response 200:**

```ts
{
  resourceGroup?: string | null
  count?: number
}[]
```

### `GET /iam/resource/features`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Search` | query | string | no |  |
| `IsBuiltIn` | query | boolean | no |  |

**Response 200:**

```ts
{
  resource?: string | null
  name?: string | null
  description?: string | null
}[]
```

### `POST /iam/roles`

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: {
    search?: string | null
    slugs?: string[]
  }
}
```

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    slug?: string | null
    ancestorRoleSlugs?: string[]
    parentRoleSlug?: string | null
    canCreateOwn?: boolean
    description?: string | null
    count?: number
    createdFromDefault?: boolean
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `POST /iam/roles/assign-permissions`

**Request body** (`application/json`):

```ts
{
  addPermissions?: string[]
  removePermissions?: string[]
  slug?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/roles/assignable`

**Response 200:**

```ts
{
  hierarchy?: {
    slug: string | null
    name: string | null
  }[]
  standalone?: {
    slug: string | null
    name: string | null
  }[]
}
```

### `POST /iam/roles/create`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  description?: string | null
  slug?: string | null
  parentRoleSlug?: string | null
  propagateToOtherOrg?: boolean
  canCreateOwn?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /iam/roles/update`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  name?: string | null
  description?: string | null
  parentRoleSlug?: string | null
  propagateToOtherOrg?: boolean
  canCreateOwn?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/roles/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    slug?: string | null
    ancestorRoleSlugs?: string[]
    parentRoleSlug?: string | null
    canCreateOwn?: boolean
    description?: string | null
    count?: number
    createdFromDefault?: boolean
  }
  errors?: { [key: string]: string }
}
```

### `GET /iam/sessions`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.UserId` | query | string | no |  |

**Response 200:**

```ts
{
  data?: unknown[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /iam/signup-settings`

**Response 200:**

```ts
object
```

### `POST /iam/signup-settings`

**Request body** (`application/json`):

```ts
{
  isEmailPasswordSignUpEnabled?: boolean
  isSSoSignUpEnabled?: boolean
  defaultRolesForNewUserOnSignUp?: string[]
  defaultPermissionsForNewUserOnSignUp?: string[]
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
}
```

### `POST /iam/users`

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: {
    email?: string | null
    name?: string | null
    userIds?: string[]
    status?: {
      active?: boolean
      inactive?: boolean
    }
    mfa?: {
      enabled?: boolean
      disabled?: boolean
    }
    joinedOn?: string (date-time) | null
    lastLogin?: string (date-time) | null
    org_id?: string | null
  }
}
```

**Response 200:**

```ts
{
  data?: object[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `POST /iam/users/create`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  language?: string | null
  tags?: string[]
  email?: string | null
  userName?: string | null
  phoneNumber?: string | null
  password?: string | null
  salutation?: string | null
  firstName?: string | null
  lastName?: string | null
  mailPurpose?: string | null
  userPassType?: 0 | 1 | 2 (int enum)
  userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
  verifiedType?: 0 | 1 | 2 | 3 (int enum)
  platform?: string | null
  profileImageUrl?: string | null
  profileImageId?: string | null
  userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
  mfaEnabled?: boolean
  allowedLogInType?: 0 | 1 | 2 | 3 (int enum)[]
  roles?: string[]
  permissions?: string[]
  organizationId?: string | null
  attributes?: object
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /iam/users/deactivate`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /iam/users/org-update`

**Request body** (`application/json`):

```ts
{
  userId: string | null
  roles?: string[]
  permissions?: string[]
  organizationId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /iam/users/roles-and-permissions`

**Request body** (`application/json`):

```ts
{
  userId: string | null
  roles?: string[]
  permissions?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /iam/users/timeline`

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: {
    event?: string | null
  }
}
```

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  tags?: string[]
  currentData?: {
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    roles?: { [key: string]: string[] }
    permissions?: { [key: string]: string[] }
    active?: boolean
    isVerified?: boolean
    verifiedType?: 0 | 1 | 2 | 3 (int enum)
    profileImageUrl?: string | null
    profileImageId?: string | null
    platform?: string | null
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    provisioningSource?: 0 | 1 | 2 | 3 (int enum)
    userPassType?: 0 | 1 | 2 (int enum)
    password?: string | null
    passwordSetTime?: string (date-time)
    passwordChangedAtUtc?: string (date-time) | null
    lastCredentialRotationAtUtc?: string (date-time) | null
    failedLoginCount?: number
    lastFailedLoginUtc?: string (date-time) | null
    failedMfaCount?: number
    lastFailedMfaUtc?: string (date-time) | null
    lockoutUntilUtc?: string (date-time) | null
    lockoutCount?: number
    lastLockoutUtc?: string (date-time) | null
    securityStamp?: string | null
    tokenVersion?: number
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    mfaEnabled?: boolean
    mfaMethods?: {
      method?: string | null
      enrolledAtUtc?: string (date-time)
      verifiedAtUtc?: string (date-time) | null
      active?: boolean
    }[]
    firstLoggedInTime?: string (date-time)
    lastLoggedInTime?: string (date-time)
    lastUsedOrganizationId?: string | null
    lastLoggedInDeviceInfo?: string | null
    logInCount?: number
    allowedLogInType?: 0 | 1 | 2 | 3 (int enum)[]
    mailPurpose?: string | null
    isMfaVerified?: boolean
    emailVerifiedAtUtc?: string (date-time) | null
    phoneVerifiedAtUtc?: string (date-time) | null
    termsAcceptedAtUtc?: string (date-time) | null
    privacyAcceptedAtUtc?: string (date-time) | null
    status?: 0 | 1 | 2 | 3 (int enum)
    statusReason?: string | null
    deactivatedAtUtc?: string (date-time) | null
    deactivatedBy?: string | null
    externalUserId?: string | null
    externalIdentities?: {
      provider?: string | null
      providerUserId?: string | null
      issuer?: string | null
      linkedAtUtc?: string (date-time)
    }[]
    organizationIds?: string[]
    attributes?: object
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    tags?: string[]
  }
  event?: string | null
  userId: string | null
  organizationId: string | null
}[]
```

### `GET /iam/users/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |
| `organizationId` | query | string | no |  |

**Response 200:**

```ts
{
  data?: { [key: string]: unknown | null }
  errors?: { [key: string]: string }
}
```

### `POST /iam/users/{id}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | string | yes |  |

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  salutation?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  tags?: string[]
  profileImageUrl?: string | null
  profileImageId?: string | null
  userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
  mfaEnabled?: boolean
  roles?: string[]
  permissions?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Idp

### `GET /idp/callback`

Handle authorization code callback from IdP  
Receives authorization code and state, exchanges for tokens, creates session  
RFC 6749: OAuth 2.0 Authorization Code Flow | RFC 7636: PKCE

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `code` | query | string | no |  |
| `state` | query | string | no |  |
| `error` | query | string | no |  |
| `error_description` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /idp/initiate`

Initiate identity provider authentication flow for a specific client  
Delegates to IDP service for OIDC param generation and URL building

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `clientId` | query | string | no |  |
| `redirectUri` | query | string | no |  |
| `forwardedTo` | query | string | no |  |
| `x-blocks-key` | query | string | no | Project Blocks Key. Lives as a query param because the SPA issues this as a `fetch` (not a browser navigation) and the `x-blocks-key` header isn't set by browsers on top-level loads. From the platform integration doc — not in the swagger param table; verify it against your project. |

**Response 200:**

The platform returns the URL the browser must navigate to (Blocks IAM authorize
endpoint) in a JSON body. **The shape is not documented in swagger — verify
against your live response.** The single canonical field name is:

```jsonc
{
  "redirect_uri": "https://iam.seliseblocks.com/<X_BLOCKS_KEY>/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256&scope=openid"
}
```

Other field names observed in older clients / dev sandboxes (`redirectUrl`, `url`,
`authorizationUrl`, `authorization_url`, `authorizeUrl`, `authorize_url`) are
**not** what the live `iam/v4` returns — they're leftover assumptions from earlier
docs and should not be relied on. Code may keep a defensive fallback lookup that
also tries those names, but treat them as deprecated and only `redirect_uri` as
authoritative.

Alternatively the platform may issue a **30x redirect with a `Location` header**
instead of a 200 — the SPA handles both shapes. See `flows/oidc-login.md` and
`references/react.md` for the canonical `startLogin()` implementation.

### `GET /idp/oidc-ui-config`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## IdpSession

### `GET /oidc/session`

Get current session details  
GET /oidc/session

**Response 200:**

```ts
{
  sessionId?: string | null
  accounts?: {
    userId?: string | null
    tenantId?: string | null
    displayName?: string | null
    loginAt?: string (date-time)
  }[]
  createdAt?: string (date-time)
  lastActivityAt?: string (date-time)
  idleExpiresAt?: string (date-time)
  absoluteExpiresAt?: string (date-time)
}
```

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 404:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `POST /oidc/session/account/add`

Add another account to current session  
POST /oidc/session/add-account  
Allows user to authenticate with another account and add to same session  
OIDC multi-account SSO support

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  tenantId?: string | null
  displayName?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `POST /oidc/session/account/select`

Select which account to use in this session  
POST /oidc/session/select-account  
For multi-account SSO, switches context to different account  
CSRF protection required

**Request body** (`application/json`):

```ts
{
  userId?: string | null
}
```

**Response 200:**

```ts
{
  success?: boolean
  userId?: string | null
}
```

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `GET /oidc/session/accounts`

Get all accounts in current session  
GET /oidc/session/accounts  
Supports multi-account SSO - user can see all accounts logged in this session

**Response 200:**

```ts
{
  accounts?: {
    userId?: string | null
    tenantId?: string | null
    displayName?: string | null
    loginAt?: string (date-time)
  }[]
}
```

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `DELETE /oidc/session/accounts/{userId}`

Remove account from session  
DELETE /oidc/session/accounts/{userId}  
Removes account from multi-account session

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `userId` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

### `POST /oidc/session/revoke`

Revoke current session (logout)  
POST /oidc/session/revoke  
Logs out all accounts in this session  
CSRF protection required

**Request body** (`application/json`):

```ts
{
  reason?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

**Response 401:**

```ts
{
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
}
```

## Mfa

### `POST /mfa/admin/reset`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  reason?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /mfa/backup-codes`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/backup-codes/generate`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/backup-codes/use`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  code?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/disable`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/email/enable`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /mfa/policy`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /mfa/policy`

**Request body** (`application/json`):

```ts
{
  enableMfa?: boolean | null
  userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)[]
  mfaTemplate?: {
    templateName?: string | null
    templateId?: string | null
  }
  requireMfaForAllUsers?: boolean | null
  mfaRequiredRoles?: string[]
  mfaExemptRoles?: string[]
  allowUserOptOut?: boolean | null
  allowBackupCodes?: boolean | null
  backupCodesCount?: number | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `PUT /mfa/preferred-method`

**Request body** (`application/json`):

```ts
{
  mfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /mfa/status`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/totp/setup`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /mfa/totp/verify-setup`

**Request body** (`application/json`):

```ts
{
  code?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## OidcClients

### `GET /oidc-clients`

Retrieve all OIDC clients for the tenant  
Returns list of registered OAuth 2.0 / OIDC client applications  
Sensitive fields (client_secret) are excluded from response

**Response 200:** Successfully retrieved clients list — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** Invalid request parameters — no schema documented in swagger; verify the live response before relying on its shape.

**Response 401:** Authentication required — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /oidc-clients`

Create or update OIDC client configuration (Upsert)  
Registers new OIDC client or updates existing configuration  
Validates client metadata and OAuth/OIDC compliance  
Returns generated or existing client_secret

**Request body** (`application/json`):

```ts
{
  redirectUris?: string[]
  postLogoutRedirectUris?: string[]
  scope?: string | null
  allowedScopes?: string[]
  serviceAccessResource?: string | null
  allowedServiceAccessResources?: string[]
  allowedResponseTypes?: string[]
  requirePkce?: boolean
  requireConsent?: boolean
  frontChannelLogoutUri?: string | null
  backChannelLogoutUri?: string | null
  isAutoRedirect?: boolean
  externalDiscoveryEndpoint?: string | null
  isActive?: boolean
  loginMode?: string | null
  clientType?: string | null
  itemId?: string | null
  clientLogoUrl?: string | null
  clientDisplayName?: string | null
  clientBrandColor?: string | null
  useTokensCookie?: boolean
  requireMfa?: boolean
  allowedMfaMethods?: 0 | 1 | 2 | 3 | 4 (int enum)[]
}
```

**Response 200:** Successfully created/updated client — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** Invalid request payload or validation failure — no schema documented in swagger; verify the live response before relying on its shape.

**Response 401:** Authentication required — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /oidc-clients/{clientId}`

Delete OIDC client configuration  
Removes client application and revokes all issued tokens  
Note: Deletion is irreversible

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `clientId` | path | string | yes | Unique identifier of OIDC client to delete |

**Response 200:** Successfully deleted client — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** client_id is required or validation failure — no schema documented in swagger; verify the live response before relying on its shape.

**Response 401:** Authentication required — no schema documented in swagger; verify the live response before relying on its shape.

**Response 404:** Client not found — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /oidc-clients/{clientId}`

Retrieve specific OIDC client by client ID  
Returns detailed configuration for single client application  
Sensitive fields (client_secret) are excluded from response

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `clientId` | path | string | yes | Unique identifier of OIDC client |

**Response 200:** Successfully retrieved client details — no schema documented in swagger; verify the live response before relying on its shape.

**Response 400:** client_id is required — no schema documented in swagger; verify the live response before relying on its shape.

**Response 401:** Authentication required — no schema documented in swagger; verify the live response before relying on its shape.

**Response 404:** Client not found — no schema documented in swagger; verify the live response before relying on its shape.

## TokenManagement

### `POST /oidc/introspect`

RFC 7662: Token Introspection Endpoint  
Allows authorized clients to introspect tokens and get claims/metadata

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /oidc/revocation-history`

Get revocation history for audit trail

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /oidc/revoke`

RFC 7009: Token Revocation Endpoint  
Allows clients and resource owners to revoke access and refresh tokens

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.
