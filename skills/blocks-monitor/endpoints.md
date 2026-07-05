# blocks-monitor — API Endpoints

> Generated from `https://api.seliseblocks.com/monitor/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py monitor`.

**Base URL:** `https://api.seliseblocks.com/monitor/v4`

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**91 endpoints** across 7 controllers.

## Contents

- [Authentication](#authentication) (25)
- [Domain](#domain) (1)
- [Health](#health) (4)
- [Iam](#iam) (43)
- [Log](#log) (3)
- [Monitor](#monitor) (11)
- [Trace](#trace) (4)
- [Shared platform controllers](#shared-platform-controllers) — documented in other skills

## Authentication

### `GET /api/Authentication/Authorize`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `response_type` | query | string | no |  |
| `client_id` | query | string | no |  |
| `state` | query | string | no |  |
| `redirect_uri` | query | string | no |  |
| `scope` | query | string | no |  |
| `nonce` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/DeleteClientCredential`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Authentication/DeleteOIDCClient`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
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

### `POST /api/Authentication/DeleteSsoCredential`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Authentication/GenerateUserCode`

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

### `GET /api/Authentication/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Authentication/GetClientCredentials`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  name?: string | null
  clientSecret?: string | null
  roles?: string[]
  isActive?: boolean
  audiences?: string[]
}[]
```

### `GET /api/Authentication/GetLoginOptions`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Authentication/GetOIDCClient`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `ClientId` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  oIDCClientCredential?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationIds?: string[]
    tags?: string[]
    clientSecret?: string | null
    redirectUri?: string | null
    scope?: string | null
    audience?: string | null
    isAutoRedirect?: boolean
    clientLogoUrl?: string | null
    clientDisplayName?: string | null
    clientBrandColor?: string | null
  }
}
```

### `GET /api/Authentication/GetOIDCClients`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  oIDCClientCredentials?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationIds?: string[]
    tags?: string[]
    clientSecret?: string | null
    redirectUri?: string | null
    scope?: string | null
    audience?: string | null
    isAutoRedirect?: boolean
    clientLogoUrl?: string | null
    clientDisplayName?: string | null
    clientBrandColor?: string | null
  }[]
}
```

### `POST /api/Authentication/GetSocialLogInEndPoint`

**Request body** (`application/json`):

```ts
{
  provider: string | null
  audience: string | null
  nextUrl?: string | null
  sendAsResponse?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Authentication/GetSsoCredential`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `ItemId` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  provider: string | null
  audience: string | null
  clientId: string | null
  clientSecret: string | null
  authorizationUrl: string | null
  tokenUrl: string | null
  getProfileUrl: string | null
  redirectUrl: string | null
  wellKnownUrl?: string | null
  scope: string | null
  userRoles?: {
    itemId?: string | null
    name?: string | null
    slug?: string | null
    description?: string | null
    count?: number
  }[]
  userPermissions?: {
    itemId?: string | null
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
  }[]
  isDisabled?: boolean
  sendAsResponse?: boolean
}
```

### `GET /api/Authentication/GetSsoCredentials`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  provider: string | null
  audience: string | null
  clientId: string | null
  clientSecret: string | null
  authorizationUrl: string | null
  tokenUrl: string | null
  getProfileUrl: string | null
  redirectUrl: string | null
  wellKnownUrl?: string | null
  getEmailUrl?: string | null
  scope: string | null
  initialRoles?: string[]
  initialPermissions?: string[]
  isDisabled?: boolean
  sendAsResponse?: boolean
  ssoType?: 0 | 1 (int enum)
  teamId?: string | null
  keyId?: string | null
  privateKey?: string | null
  appleAudience?: string | null
}[]
```

### `GET /api/Authentication/GetUserCodes`

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

### `GET /api/Authentication/GetUserInfo`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/Login`

**Request body** (`application/json`):

```ts
{
  username?: string | null
  password?: string | null
  clientId?: string | null
  redirectUri?: string | null
  scope?: string | null
  state?: string | null
  nonce?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/Logout`

**Request body** (`application/json`):

```ts
{
  refreshToken?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/LogoutAll`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/SaveClientCredential`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  roles?: string[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Authentication/SaveOIDCClient`

**Request body** (`application/json`):

```ts
{
  redirectUri?: string | null
  scope?: string | null
  audience?: string | null
  isAutoRedirect?: boolean
  itemId?: string | null
  projectKey?: string | null
  clientLogoUrl?: string | null
  clientDisplayName?: string | null
  clientBrandColor?: string | null
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

### `POST /api/Authentication/SaveSsoCredential`

**Request body** (`application/json`):

```ts
{
  provider?: string | null
  audience?: string | null
  clientId?: string | null
  clientSecret?: string | null
  redirectUrl?: string | null
  wellKnownUrl?: string | null
  initialRoles?: string[]
  initialPermissions?: string[]
  projectKey?: string | null
  isDisabled?: boolean
  itemId?: string | null
  ssoType?: 0 | 1 (int enum)
  teamId?: string | null
  keyId?: string | null
  privateKey?: string | null
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

### `POST /api/Authentication/Token`

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Authentication/Update`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  refreshTokenValidForNumberMinutes?: number
  getNumberOfWrongAttemptsToLockTheAccount?: number
  accountLockDurationInMinutes?: number
  accessTokenValidForNumberMinutes?: number
  rememberMeRefreshTokenValidForNumberMinutes?: number
  allowedGrantTypes?: string[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Authentication/UpdateStatus`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  isEnabled?: boolean
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Authentication/UserAcknowledgement`

**Request body** (`application/json`):

```ts
{
  clientId?: string | null
  redirectUri?: string | null
  scope?: string | null
  state?: string | null
  nonce?: string | null
  isAcknowledged?: boolean
  username?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Domain

### `POST /api/Domain/Configure`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  cookieDomain?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

## Health

### `DELETE /api/Health/DeleteHealth`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Health/Ping/{itemId}`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | path | string | yes |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Health/SaveHealth`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  name?: string | null
  repoId?: string | null
  repoName?: string | null
  externalServiceId?: string | null
  isActive?: boolean
  intervalInSeconds?: number
  gracePeriodInSeconds?: number
  monitorSourceType?: string | null
  emails?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Health/UpdateHealth`

Updates an existing health configuration.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  name?: string | null
  repoId?: string | null
  repoName?: string | null
  externalServiceId?: string | null
  isActive?: boolean
  intervalInSeconds?: number
  gracePeriodInSeconds?: number
  monitorSourceType?: string | null
  emails?: string[]
  itemId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Iam

### `POST /api/Iam/Activate`

**Request body** (`application/json`):

```ts
{
  code?: string | null
  password?: string | null
  captchaCode?: string | null
  mailPurpose?: string | null
  preventPostEvent?: boolean
  projectKey?: string | null
  firstName?: string | null
  lastName?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/ChangePassword`

**Request body** (`application/json`):

```ts
{
  newPassword?: string | null
  oldPassword?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/Create`

**Request body** (`application/json`):

```ts
{
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
  varifiedType?: 0 | 1 | 2 | 3 (int enum)
  platform?: string | null
  profileImageUrl?: string | null
  profileImageId?: string | null
  userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
  mfaEnabled?: boolean
  allowedLogInType?: 0 | 1 | 2 | 3 (int enum)[]
  memberships?: {
    organizationId?: string | null
    roles?: string[]
    permissions?: string[]
  }[]
  projectKey?: string | null
  organizationId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/CreatePermission`

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
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/CreateRole`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  description?: string | null
  slug?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/Deactivate`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Iam/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: {
      timestamp?: number
      creationTime?: string (date-time)
    }
    accountActivationUrl?: string | null
    accountVerificationUrl?: string | null
    recoverAccountUrl?: string | null
    activationUrlLifetimeInMinutes?: number
    recoverAccountUrlLifetimeInMinutes?: number
    logoutOnPasswordChange?: boolean
    passwordStrengthCheckerRegex?: string | null
  }
  errors?: { [key: string]: string }
}
```

### `GET /api/Iam/GetAccount`

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    language?: string | null
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    memberships?: {
      organizationId?: string | null
      roles?: string[]
      permissions?: string[]
    }[]
    active?: boolean
    isVarified?: boolean
    profileImageUrl?: string | null
    mfaEnabled?: boolean
    isMfaVerified?: boolean
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    department?: string | null
    employeeId?: string | null
    lastLoggedInTime?: string (date-time)
    lastLoggedInDeviceInfo?: string | null
    logInCount?: number
  }
  errors?: { [key: string]: string }
  permissions?: {
    itemId?: string | null
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
  }[]
}
```

### `GET /api/Iam/GetAccountPermissions`

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/GetAccountRoles`

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    name?: string | null
    slug?: string | null
    description?: string | null
    count?: number
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `POST /api/Iam/GetAccounts`

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
    organizationId?: string | null
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
    language?: string | null
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    memberships?: {
      organizationId?: string | null
      roles?: string[]
      permissions?: string[]
    }[]
    active?: boolean
    isVarified?: boolean
    profileImageUrl?: string | null
    mfaEnabled?: boolean
    isMfaVerified?: boolean
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    department?: string | null
    employeeId?: string | null
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/GetHistories`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
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

### `GET /api/Iam/GetOrganization`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `ItemId` | query | string | no |  |

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
    organizationIds?: string[]
    tags?: string[]
    name?: string | null
    isEnable?: boolean
  }
}
```

### `GET /api/Iam/GetOrganizationConfig`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  allowCreationFromCloud?: boolean
  allowCreationFromConstruct?: boolean
  isMultiOrgEnabled?: boolean
  roles?: string[]
}
```

### `GET /api/Iam/GetOrganizations`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.Name` | query | string | no |  |
| `Filter.IsEnable` | query | boolean | no |  |
| `Filter.ItemId` | query | string | no |  |
| `Filter.CreatedDate` | query | string (date-time) | no |  |
| `Filter.LastUpdatedDate` | query | string (date-time) | no |  |
| `Filter.CreatedBy` | query | string | no |  |
| `Filter.Language` | query | string | no |  |
| `Filter.LastUpdatedBy` | query | string | no |  |
| `Filter.OrganizationIds` | query | array | no |  |
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
    organizationIds?: string[]
    tags?: string[]
    name?: string | null
    isEnable?: boolean
  }[]
  totalCount?: number
}
```

### `GET /api/Iam/GetPermission`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

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
    organizationIds?: string[]
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

### `POST /api/Iam/GetPermissions`

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
  projectKey?: string | null
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
    organizationIds?: string[]
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

### `GET /api/Iam/GetPermissionsGroupBySeverity`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  severityLevel?: string | null
  count?: number
}[]
```

### `GET /api/Iam/GetResourceGroups`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  resourceGroup?: string | null
  count?: number
}[]
```

### `GET /api/Iam/GetRole`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `Id` | query | string | no |  |

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
    organizationIds?: string[]
    tags?: string[]
    name?: string | null
    slug?: string | null
    description?: string | null
    count?: number
  }
  errors?: { [key: string]: string }
}
```

### `POST /api/Iam/GetRoles`

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
  projectKey?: string | null
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
    organizationIds?: string[]
    tags?: string[]
    name?: string | null
    slug?: string | null
    description?: string | null
    count?: number
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/GetSessions`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
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

### `GET /api/Iam/GetSignUpSetting`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  itemId?: string | null
  createdDate?: string (date-time)
  lastUpdatedDate?: string (date-time)
  createdBy?: string | null
  language?: string | null
  lastUpdatedBy?: string | null
  organizationIds?: string[]
  tags?: string[]
  isEmailPasswordSignUpEnabled?: boolean
  isSSoSignUpEnabled?: boolean
}
```

### `GET /api/Iam/GetUser`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    language?: string | null
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    memberships?: {
      organizationId?: string | null
      roles?: string[]
      permissions?: string[]
    }[]
    active?: boolean
    isVarified?: boolean
    profileImageUrl?: string | null
    mfaEnabled?: boolean
    isMfaVerified?: boolean
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    department?: string | null
    employeeId?: string | null
    lastLoggedInTime?: string (date-time)
    lastLoggedInDeviceInfo?: string | null
    logInCount?: number
  }
  errors?: { [key: string]: string }
}
```

### `GET /api/Iam/GetUserPermissions`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    name?: string | null
    type?: 0 | 1 | 2 | 3 (int enum)
    description?: string | null
    resource?: string | null
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/GetUserRoles`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Id` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    name?: string | null
    slug?: string | null
    description?: string | null
    count?: number
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/GetUserTimelines`

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
  organizationIds?: string[]
  tags?: string[]
  currentData?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationIds?: string[]
    tags?: string[]
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    memberships?: {
      organizationId?: string | null
      roles?: string[]
      permissions?: string[]
    }[]
    active?: boolean
    isVarified?: boolean
    varifiedType?: 0 | 1 | 2 | 3 (int enum)
    profileImageUrl?: string | null
    profileImageId?: string | null
    platform?: string | null
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    userPassType?: 0 | 1 | 2 (int enum)
    password?: string | null
    passwordSetTime?: string (date-time)
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    mfaEnabled?: boolean
    firstLoggedInTime?: string (date-time)
    lastLoggedInTime?: string (date-time)
    lastLoggedInDeviceInfo?: string | null
    logInCount?: number
    allowedLogInType?: 0 | 1 | 2 | 3 (int enum)[]
    isDefault?: boolean
    mailPurpose?: string | null
    isMfaVerified?: boolean
    externalUserId?: string | null
    department?: string | null
    employeeId?: string | null
  }
  event?: string | null
}[]
```

### `POST /api/Iam/GetUsers`

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
    organizationId?: string | null
  }
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  data?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    language?: string | null
    salutation?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    userName?: string | null
    phoneNumber?: string | null
    memberships?: {
      organizationId?: string | null
      roles?: string[]
      permissions?: string[]
    }[]
    active?: boolean
    isVarified?: boolean
    profileImageUrl?: string | null
    mfaEnabled?: boolean
    isMfaVerified?: boolean
    userMfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
    userCreationType?: 0 | 1 | 2 | 3 | 4 | 5 (int enum)
    department?: string | null
    employeeId?: string | null
    lastLoggedInTime?: string (date-time)
    lastLoggedInDeviceInfo?: string | null
    logInCount?: number
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Iam/IsEmailAvaiable`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Email` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/Recover`

**Request body** (`application/json`):

```ts
{
  email?: string | null
  captchaCode?: string | null
  mailPurpose?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/ResendActivation`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  mailPurpose?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/ResetPassword`

**Request body** (`application/json`):

```ts
{
  code?: string | null
  password?: string | null
  captchaCode?: string | null
  logoutFromAllDevices?: boolean
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/Save`

**Request body** (`application/json`):

```ts
{
  accountActivationUrl?: string | null
  accountVerificationUrl?: string | null
  recoverAccountUrl?: string | null
  activationUrlLifetimeInMinutes?: number
  recoverAccountUrlLifetimeInMinutes?: number
  logoutOnPasswordChange?: boolean
  passwordStrengthCheckerRegex?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/SaveOrganization`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  name?: string | null
  itemId?: string | null
  isEnable?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Iam/SaveOrganizationConfig`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  allowCreationFromCloud?: boolean
  allowCreationFromConstruct?: boolean
  roles?: string[]
  isMultiOrgEnabled?: boolean
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /api/Iam/SaveRolesAndPermissions`

**Request body** (`application/json`):

```ts
{
  userId: string | null
  memberships?: {
    organizationId?: string | null
    roles?: string[]
    permissions?: string[]
  }[]
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/SaveSignUpSetting`

**Request body** (`application/json`):

```ts
{
  isEmailPasswordSignUpEnabled?: boolean
  isSSoSignUpEnabled?: boolean
  projectKey?: string | null
  itemId?: string | null
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

### `POST /api/Iam/SetRoles`

**Request body** (`application/json`):

```ts
{
  addPermissions?: string[]
  removePermissions?: string[]
  slug?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/Update`

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
  projectKey?: string | null
  memberships?: {
    organizationId?: string | null
    roles?: string[]
    permissions?: string[]
  }[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/UpdateAccount`

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
  projectKey?: string | null
  memberships?: {
    organizationId?: string | null
    roles?: string[]
    permissions?: string[]
  }[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/UpdatePermission`

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
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/UpdateRole`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  name?: string | null
  description?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Iam/ValidateActivationCode`

**Request body** (`application/json`):

```ts
{
  activationCode?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Log

### `POST /api/Log/GetLogs`

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
    startDate?: string (date-time) | null
    endDate?: string (date-time) | null
    level?: string | null
    traceId?: string | null
    spanId?: string | null
  }
  search?: string | null
  serviceName: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Log/GetLogsByDate`

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
    startDate?: string (date-time) | null
    endDate?: string (date-time) | null
    level?: string | null
    traceId?: string | null
    spanId?: string | null
  }
  search?: string | null
  serviceName: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  data?: unknown[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `GET /api/Log/Live`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Name` | query | string | yes |  |
| `LastDate` | query | string (date-time) | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Monitor

### `DELETE /api/Monitor/DeleteMonitor`

Deletes a monitor configuration by its ID.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `itemId` | query | string | no | The ID of the monitor configuration to delete. |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetIncidentList`

Retrieves a paginated list of incidents for a specific monitor.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `monitorId` | query | string | no | The ID of the monitor. |
| `pageNumber` | query | integer (int32) | no | The page number for pagination. |
| `pageSize` | query | integer (int32) | no | The number of items per page. |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorById`

Retrieves a list of monitor configurations for a given project.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `monitorId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorDetails`

Retrieves details of incidents for a specific monitor.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `monitorId` | query | string | no | The ID of the monitor. |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorDownTime`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `monitorId` | query | string | no |  |
| `startDate` | query | string | no |  |
| `endDate` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorList`

Retrieves a list of monitor configurations for a given project.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no | The project key to filter monitor configurations. |
| `monitorSourcetype` | query | string | no |  |
| `pageNumber` | query | integer (int32) | no |  |
| `pageSize` | query | integer (int32) | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorListByRepoId`

Retrieves a list of monitor configurations for a given project.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no | The project key to filter monitor configurations. |
| `repoId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/GetMonitorResponseTime`

Retrieves the response time logs for a monitor within a specified date range.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `monitorId` | query | string | no | The ID of the monitor. |
| `startDate` | query | string | no | The start date of the range (optional). |
| `endDate` | query | string | no | The end date of the range (optional). |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Monitor/IsExternalServiceConfigured`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `externalServiceId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Monitor/SaveMonitor`

Saves a new monitor configuration.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  repoId?: string | null
  repoName?: string | null
  externalServiceId?: string | null
  externalServiceName?: string | null
  name?: string | null
  url?: string | null
  monitorType?: string | null
  protocolType?: string | null
  httpMethodType?: string | null
  authorizationType?: string | null
  intervalInSeconds?: number | null
  timeoutInSeconds?: number | null
  isActive?: boolean
  monitorSourceType?: string | null
  expectedContent?: string | null
  customHttpHeaders?: string | null
  customPayload?: string | null
  successHttpResponseCodes?: string[]
  regions?: string[]
  emails?: string[]
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Monitor/UpdateMonitor`

Updates an existing monitor configuration.

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  repoId?: string | null
  repoName?: string | null
  externalServiceId?: string | null
  externalServiceName?: string | null
  name?: string | null
  url?: string | null
  monitorType?: string | null
  protocolType?: string | null
  httpMethodType?: string | null
  authorizationType?: string | null
  intervalInSeconds?: number | null
  timeoutInSeconds?: number | null
  isActive?: boolean
  monitorSourceType?: string | null
  expectedContent?: string | null
  customHttpHeaders?: string | null
  customPayload?: string | null
  successHttpResponseCodes?: string[]
  regions?: string[]
  emails?: string[]
  itemId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Trace

### `POST /api/Trace/GetOperationalAnalytics`

**Request body** (`application/json`):

```ts
{
  startTime: string (date-time)
  endTime: string (date-time)
  serviceName: string | null
  operationName?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Trace/GetServiceAnalytics`

**Request body** (`application/json`):

```ts
{
  startTime: string (date-time)
  endTime: string (date-time)
  serviceName?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/Trace/GetTrace`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `TraceId` | query | string | yes |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /api/Trace/GetTraces`

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
    startDate?: string (date-time) | null
    endDate?: string (date-time) | null
    services?: string[]
    excepts?: string[]
    statusCodes?: number[]
  }
  search?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Shared platform controllers

These routes are also served by this service but are platform-wide controllers.
They are documented in full in their canonical skill — use that skill's docs and
call them on this base URL only if you specifically need this service's instance.

### Documented in `blocks-logic`

| Method | Path | Summary |
|---|---|---|
| DELETE | `/api/Mail/Delete` |  |
| POST | `/api/Mail/Duplicate` |  |
| GET | `/api/Mail/Get` |  |
| GET | `/api/Mail/Gets` |  |
| POST | `/api/Mail/Save` |  |

### Documented in `blocks-os`

| Method | Path | Summary |
|---|---|---|
| GET | `/api/.well-known/jwks.json` |  |
| GET | `/api/.well-known/openid-configuration` |  |
| POST | `/api/ApiEndpointConfig/BulkUpdate` |  |
| POST | `/api/ApiEndpointConfig/GetList` |  |
| POST | `/api/ApiEndpointConfig/Update` |  |
| POST | `/api/Captcha/Create` |  |
| GET | `/api/Captcha/Get` |  |
| GET | `/api/Captcha/Gets` |  |
| POST | `/api/Captcha/Save` |  |
| POST | `/api/Captcha/Submit` |  |
| POST | `/api/Captcha/UpdateStatus` |  |
| GET | `/api/Captcha/Verify` |  |
| POST | `/api/Mfa/DisableUserMfa` |  |
| POST | `/api/Mfa/GenerateOTP` |  |
| GET | `/api/Mfa/Get` |  |
| POST | `/api/Mfa/ResendOtp` |  |
| POST | `/api/Mfa/Save` |  |
| GET | `/api/Mfa/SetUpTotp` |  |
| POST | `/api/Mfa/VerifyOTP` |  |
| POST | `/api/Migration/DataCleanup` |  |
| GET | `/api/Migration/GetMigrationStatus` | Gets the migration status for projects with incomplete services. |
| POST | `/api/Migration/Migrate` |  |
| POST | `/api/Migration/Verify` | Verifies the OTP code for the migration process. |
| DELETE | `/api/Notification/Delete` |  |
| GET | `/api/Notification/Get` |  |
| GET | `/api/Notification/Gets` |  |
| POST | `/api/Notification/Save` |  |
| POST | `/api/People/ConfirmInvitation` |  |
| POST | `/api/People/Gets` |  |
| POST | `/api/People/Invite` |  |
| POST | `/api/People/RemoveAccess` |  |
| POST | `/api/People/ResendInvitation` |  |
| POST | `/api/People/Signup` |  |
| POST | `/api/People/TransferOwnerShip` |  |
| POST | `/api/Project/AddAsset` |  |
| POST | `/api/Project/Create` |  |
| POST | `/api/Project/Disable` |  |
| GET | `/api/Project/Get` |  |
| GET | `/api/Project/GetAsset` |  |
| GET | `/api/Project/GetThirdPartyJWTClaims` |  |
| GET | `/api/Project/GetTokenValidationParameters` |  |
| GET | `/api/Project/Gets` |  |
| POST | `/api/Project/Restore` |  |
| POST | `/api/Project/SaveThirdPartyJWTClaims` |  |
| POST | `/api/Project/UpdateProject` |  |
| POST | `/api/Project/UpdateTenantGroup` |  |
| POST | `/api/Project/UpdateTokenValidationParameters` |  |
| POST | `/api/Service/GetAll` |  |
| POST | `/api/Service/Register` |  |
| POST | `/api/Storage/Delete` |  |
| GET | `/api/Storage/Get` |  |
| GET | `/api/Storage/Gets` |  |
| POST | `/api/Storage/Save` |  |
| GET | `/api/Subscription/Gets` |  |
