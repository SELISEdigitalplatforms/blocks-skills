# blocks-os — API Endpoints

> Generated from `https://api.seliseblocks.com/os/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py os`.

**Base URL:** `https://api.seliseblocks.com/os/v4`

**URL pattern:** every endpoint is `{base}/{endpoint}` — do **not** prefix with `/api/`. e.g. `POST {base}/Captcha/Save`, `POST {base}/Mfa/Create`. The `/api/` from the swagger `basePath` is not part of the URL served by the gateway. (Exception: OIDC discovery stays at `GET {base}/.well-known/openid-configuration` etc.)

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**58 endpoints** across 12 controllers.

## Contents

- [ApiEndpointConfig](#apiendpointconfig) (3)
- [Captcha](#captcha) (7)
- [Discovery](#discovery) (2)
- [Mfa](#mfa) (7)
- [Migration](#migration) (4)
- [Notification](#notification) (4)
- [People](#people) (7)
- [Project](#project) (13)
- [Secrets](#secrets) (4)
- [Service](#service) (2)
- [Storage](#storage) (4)
- [Subscription](#subscription) (1)
- [Shared platform controllers](#shared-platform-controllers) — documented in other skills

## ApiEndpointConfig

### `POST /ApiEndpointConfig/BulkUpdate`

**Request body** (`application/json`):

```ts
{
  itemIds?: string[]
  isCaptchaRequired?: boolean
  isMfaRequired?: boolean
  disableAll?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /ApiEndpointConfig/GetList`

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
    resourceGroup?: string | null
    method?: string | null
    controller?: string | null
  }
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /ApiEndpointConfig/Update`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  isCaptchaRequired?: boolean
  isMfaRequired?: boolean
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Captcha

### `POST /Captcha/Create`

**Request body** (`application/json`):

```ts
{
  configurationName: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
  id?: string | null
  captcha?: string | null
}
```

### `GET /Captcha/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProviderName` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /Captcha/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  configurations?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    captchaKey?: string | null
    captchaSecret?: string | null
    provider?: string | null
    captchaGenerator?: string | null
    isEnable?: boolean
  }[]
}
```

### `POST /Captcha/Save`

**Request body** (`application/json`):

```ts
{
  captchaKey?: string | null
  captchaSecret?: string | null
  provider?: string | null
  captchaGenerator?: string | null
  isEnable?: boolean
  projectKey?: string | null
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

### `POST /Captcha/Submit`

**Request body** (`application/json`):

```ts
{
  id?: string | null
  value?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
  verificationCode?: string | null
}
```

### `POST /Captcha/UpdateStatus`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  isEnable?: boolean
  projectKey?: string | null
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

### `GET /Captcha/Verify`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `VerificationCode` | query | string | no |  |
| `ConfigurationName` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  itemId?: string | null
  verified?: boolean
  hostName?: string | null
}
```

## Discovery

### `GET /api/.well-known/jwks.json`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /api/.well-known/openid-configuration`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `projectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Mfa

### `POST /Mfa/DisableUserMfa`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
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

### `POST /Mfa/GenerateOTP`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  projectKey?: string | null
  mfaType?: 0 | 1 | 2 | 3 | 4 (int enum)
  sendPhoneNumberAsEmailDomain?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  mfaId?: string | null
}
```

### `GET /Mfa/Get`

**Response 200:**

```ts
{
  enableMfa?: boolean
  userMfaType?: 0 | 1 | 2 (int enum)[]
  mfaTemplate?: {
    templateName?: string | null
    templateId?: string | null
  }
}
```

### `POST /Mfa/ResendOtp`

**Request body** (`application/json`):

```ts
{
  mfaId?: string | null
  sendPhoneNumberAsEmailDomain?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  mfaId?: string | null
}
```

### `POST /Mfa/Save`

**Request body** (`application/json`):

```ts
{
  enableMfa?: boolean
  userMfaType?: 0 | 1 | 2 (int enum)[]
  mfaTemplate?: {
    templateName?: string | null
    templateId?: string | null
  }
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

### `GET /Mfa/SetUpTotp`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `UserId` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  qrImageUrl?: string | null
  qrCode?: string | null
}
```

### `POST /Mfa/VerifyOTP`

**Request body** (`application/json`):

```ts
{
  verificationCode?: string | null
  mfaId?: string | null
  authType?: 0 | 1 | 2 | 3 | 4 (int enum)
  projectKey?: string | null
  isFromTokenCall?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  isValid?: boolean
  userId?: string | null
}
```

## Migration

### `POST /Migration/DataCleanup`

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Migration/GetMigrationStatus`

Gets the migration status for projects with incomplete services.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `tenantGroupId` | query | string | no | The tenant group ID to check for migrations. |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Migration/Migrate`

**Request body** (`application/json`):

```ts
{
  projectKey: string | null
  targetedProjectKey: string | null
  tenantGroupId: string | null
  services: {
    shouldOverWriteExistingData?: boolean
    serviceName: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 (int enum)
  }[]
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  verificationId?: string | null
}
```

### `POST /Migration/Verify`

Verifies the OTP code for the migration process.

**Request body** (`application/json`):

```ts
{
  verificationId?: string | null
  verificationCode?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  isValid?: boolean
}
```

## Notification

### `DELETE /Notification/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /Notification/Get`

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
  organizationId?: string | null
  tags?: string[]
  name?: string | null
  channelToNotify?: 0 | 1 (int enum)
  notificationType?: 0 | 1 | 2 | 3 (int enum)
  notifyMethod?: string | null
  enablePersistence?: boolean
}
```

### `GET /Notification/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  totalCount?: number
  configurations?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    channelToNotify?: 0 | 1 (int enum)
    notificationType?: 0 | 1 | 2 | 3 (int enum)
    notifyMethod?: string | null
    enablePersistence?: boolean
  }[]
}
```

### `POST /Notification/Save`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  channelToNotify?: 0 | 1 (int enum)
  notificationType?: 0 | 1 | 2 | 3 (int enum)
  enablePersistence?: boolean
  notifyMethod?: string | null
  projectKey?: string | null
  isUpdateRequest?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

## People

### `POST /People/ConfirmInvitation`

**Request body** (`application/json`):

```ts
{
  code?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /People/Gets`

**Request body** (`application/json`):

```ts
{
  page?: number
  pageSize?: number
  sort?: {
    property?: string | null
    isDescending?: boolean
  }
  filter?: string | null
  projectGroupId?: string | null
  environmentIds?: string[]
  isInvitationConfirmed?: boolean | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  isOwner?: boolean
  peoples?: {
    peopleDetails?: {
      salutation?: string | null
      firstName?: string | null
      lastName?: string | null
      email?: string | null
      profileImageUrl?: string | null
      userId?: string | null
      allowResendActivation?: boolean
    }
    sharedEnviroments?: {
      itemId?: string | null
      tenantId?: string | null
      isInvitationSent?: boolean
      isInvitationConfirmed?: boolean
      isCreator?: boolean
      enviroment?: string | null
    }[]
  }[]
  totalCount?: number
  peoplesTotalCount?: number
}
```

### `POST /People/Invite`

**Request body** (`application/json`):

```ts
{
  invitations?: { [key: string]: {
      tenantId?: string | null
      roles?: string[]
    }[] }
  groupId: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /People/RemoveAccess`

**Request body** (`application/json`):

```ts
{
  email?: string | null
  projectKeys?: string[]
  groupId: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /People/ResendInvitation`

**Request body** (`application/json`):

```ts
{
  email?: string | null
  groupId?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /People/Signup`

**Request body** (`application/json`):

```ts
{
  email?: string | null
  captchaCode?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /People/TransferOwnerShip`

**Request body** (`application/json`):

```ts
{
  tenantGroupId?: string | null
  transferToUserEmail?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Project

### `POST /Project/AddAsset`

**Request body** (`application/json`):

```ts
{
  tenantGroupId?: string | null
  resource?: {
    resourceId?: string | null
    name?: string | null
    link?: string | null
  }
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /Project/Create`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  isAcceptBlocksTerms?: boolean
  isUseBlocksExclusively?: boolean
  isProduction?: boolean
  tenantGroupId?: string | null
  resources?: {
    resourceId?: string | null
    name?: string | null
    link?: string | null
  }[]
  applicationContexts?: {
    environment?: string | null
    domain?: string | null
    cookieDomain?: string | null
  }[]
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  tenantGroupId?: string | null
}
```

### `POST /Project/Disable`

**Request body** (`application/json`):

```ts
{
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

### `GET /Project/Get`

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
    applicationDomain?: string | null
    isProduction?: boolean
    tenantId?: string | null
    tenantGroupId?: string | null
    isDomainVerified?: boolean
    cookieDomain?: string | null
    isCookieEnable?: boolean
    environment?: string | null
    isDisabled?: boolean
    customDomain?: string | null
    tenantSlug?: string | null
  }
  errors?: { [key: string]: string }
}
```

### `GET /Project/GetAsset`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `TenantGroupId` | query | string | no |  |
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.Name` | query | string | no |  |
| `Filter.Link` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  assets?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    tenantGroupId?: string | null
    resources?: {
      resourceId?: string | null
      name?: string | null
      link?: string | null
    }[]
  }
  totalCount?: number
}
```

### `GET /Project/GetThirdPartyJWTClaims`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
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
  organizationId?: string | null
  tags?: string[]
  userId?: string | null
  email?: string | null
  name?: string | null
  userName?: string | null
  roles?: string | null
}
```

### `GET /Project/GetTokenValidationParameters`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Project/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `TenantGroupId` | query | string | no |  |
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter.SearchKey` | query | string | no |  |

**Response 200:**

```ts
{
  tenantGroupId?: string | null
  projects?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    applicationDomain?: string | null
    isProduction?: boolean
    tenantId?: string | null
    tenantGroupId?: string | null
    isDomainVerified?: boolean
    cookieDomain?: string | null
    isCookieEnable?: boolean
    environment?: string | null
    isDisabled?: boolean
    customDomain?: string | null
  }[]
  isShared?: boolean
  nonSharedProject?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    applicationDomain?: string | null
    isProduction?: boolean
    tenantId?: string | null
    tenantGroupId?: string | null
    isDomainVerified?: boolean
    cookieDomain?: string | null
    isCookieEnable?: boolean
    environment?: string | null
    isDisabled?: boolean
    customDomain?: string | null
  }[]
}[]
```

### `POST /Project/Restore`

**Request body** (`application/json`):

```ts
{
  projectId?: string | null
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

### `POST /Project/SaveThirdPartyJWTClaims`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  userId?: string | null
  email?: string | null
  name?: string | null
  userName?: string | null
  roles?: string | null
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

### `POST /Project/UpdateProject`

**Request body** (`application/json`):

```ts
{
  customDomain?: string | null
  applicationDomain?: string | null
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

### `POST /Project/UpdateTenantGroup`

**Request body** (`application/json`):

```ts
{
  tenantGroupId?: string | null
  name?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /Project/UpdateTokenValidationParameters`

**Request body** (`application/json`):

```ts
{
  providerName?: string | null
  publicCertificatePassword?: string | null
  issuer?: string | null
  audiences?: string[]
  publicCertificatePath?: string | null
  jwksUrl?: string | null
  cookieKey?: string | null
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

## Secrets

### `POST /Secrets/Delete`

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

### `GET /Secrets/Get`

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
  organizationId?: string | null
  tags?: string[]
  secretKey?: string | null
  keyValuePairs?: { [key: string]: string }
  keyPairs?: object
}
```

### `GET /Secrets/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `SecretKey` | query | string | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |

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
    secretKey?: string | null
    keyValuePairs?: { [key: string]: string }
    keyPairs?: object
  }[]
  totalCount?: number
}
```

### `POST /Secrets/Save`

**Request body** (`application/json`):

```ts
{
  secretKey?: string | null
  keyValuePairs?: { [key: string]: string }
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

## Service

### `POST /Service/GetAll`

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
    serviceId?: string | null
    serviceName?: string | null
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
    organizationId?: string | null
    tags?: string[]
    name?: string | null
    tenantId?: string | null
    description?: string | null
    serviceId?: string | null
    metadata?: object
    serviceBusConnectionString?: string | null
    serviceType?: string | null
  }[]
  errors?: { [key: string]: string }
  totalCount?: number
}
```

### `POST /Service/Register`

**Request body** (`application/json`):

```ts
{
  serviceName?: string | null
  description?: string | null
  metadata?: object
  tags?: string[]
  projectKey?: string | null
  serviceType?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Storage

### `POST /Storage/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `ConfigurationName` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `GET /Storage/Get`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `ConfigurationName` | query | string | no |  |

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
  connectionString?: string | null
  secretKey?: string | null
  accessKey?: string | null
  storageStrategy?: string | null
  cloudStorageRegionEndPoint?: string | null
  host?: string | null
  port?: string | null
  userName?: string | null
  password?: string | null
  remoteBasePath?: string | null
  sftpSecretKey?: string | null
}
```

### `GET /Storage/Gets`

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
  organizationId?: string | null
  tags?: string[]
  name?: string | null
  connectionString?: string | null
  secretKey?: string | null
  accessKey?: string | null
  storageStrategy?: string | null
  cloudStorageRegionEndPoint?: string | null
  host?: string | null
  port?: string | null
  userName?: string | null
  password?: string | null
  remoteBasePath?: string | null
  sftpSecretKey?: string | null
}[]
```

### `POST /Storage/Save`

**Request body** (`application/json`):

```ts
{
  name?: string | null
  connectionString?: string | null
  secretKey?: string | null
  accessKey?: string | null
  storageStrategy?: string | null
  cloudStorageRegionEndPoint?: string | null
  projectKey?: string | null
  updateRequest?: boolean
  itemId?: string | null
  host?: string | null
  port?: string | null
  userName?: string | null
  password?: string | null
  remoteBasePath?: string | null
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

## Subscription

### `GET /Subscription/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  subscriptions?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationId?: string | null
    tags?: string[]
    resource?: string | null
    resourceType?: string | null
    limit?: number
    usage?: number
    lifetime?: string (date-time)
    isActive?: boolean
    enableAutoRenew?: boolean
    tenantId?: string | null
    type?: string | null
  }[]
}
```

## Shared platform controllers

These routes are also served by this service but are platform-wide controllers.
They are documented in full in their canonical skill — use that skill's docs and
call them on this base URL only if you specifically need this service's instance.

### Documented in `blocks-monitor`

| Method | Path | Summary |
|---|---|---|
| POST | `/Log/GetLogs` |  |
| POST | `/Log/GetLogsByDate` |  |
| GET | `/Log/Live` |  |
| POST | `/Trace/GetOperationalAnalytics` |  |
| POST | `/Trace/GetServiceAnalytics` |  |
| GET | `/Trace/GetTrace` |  |
| POST | `/Trace/GetTraces` |  |
