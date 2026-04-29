# Identity & Access Contracts

Validated against IDP v1 Swagger spec at `https://api.seliseblocks.com/idp/v1/swagger/v1/swagger.json`.

---

## Common Headers

### Authenticated Requests

```
Authorization: Bearer $ACCESS_TOKEN
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

### Public Requests (no token)

```
x-blocks-key: $X_BLOCKS_KEY
Content-Type: application/json
```

---

## Response Envelope Convention

All API responses follow one of these patterns:

### BaseResponse (action performed, no data returned)

```json
{
  "isSuccess": true,
  "errors": {
    "fieldName": "error message"
  }
}
```

> `errors` is a **dictionary** (key = field name, value = error message), not an array.

### Single-Item Response

```json
{
  "data": { ... },
  "errors": { ... }
}
```

### Paginated List Response

```json
{
  "data": [ ... ],
  "errors": { ... },
  "totalCount": 100
}
```

---

## Field Name Conventions

Critical differences from common assumptions. Using wrong names silently returns empty results.

| Wrong (don't use) | Correct (use this) | Context |
|-------------------|-------------------|---------|
| `success` | `isSuccess` | All response envelopes |
| `id` | `itemId` | User, org, credential, permission, role get/save/delete |
| `languageName` | `language` | User fields (`salutation`, `firstName`, `lastName`, etc.) |
| `language` | `languageName` | Language-specific filter on GetOrganizations |
| `filter.userId` | `Filter.UserId` | Query param for GetSessions, GetHistories |
| `filter.property` | `Sort.Property` | Query param for pagination |
| `filter.isDescending` | `Sort.IsDescending` | Query param for pagination |
| `otp` | `verificationCode` | VerifyOtpRequest body |
| `itemId` (delete language) | `LanguageName` | Language-specific delete operations |
| `GetHistorysResponse` | `GetHistorysResponse` | Swagger has this typo — preserve it |

---

## Enumerations

All enums are **integer values** in the API. Use the integer value when sending, or the string name when the API accepts both.

### PermissionSeverity

| Value | Name |
|-------|------|
| 0 | Critical |
| 1 | High |
| 2 | Medium |
| 3 | Low |
| 4 | Info |

### ResourceType

| Value | Name |
|-------|------|
| 0 | Module |
| 1 | Component |
| 2 | Feature |
| 3 | API |

### SSOType

| Value | Name |
|-------|------|
| 0 | Standard |
| 1 | Apple |

### UserCreationType

| Value | Name |
|-------|------|
| 0 | Direct |
| 1 | EmailInvitation |
| 2 | SocialSignUp |
| 3 | API |
| 4 | AdminCreated |
| 5 | SelfService |

### UserLogInType

| Value | Name |
|-------|------|
| 0 | Email |
| 1 | SocialLogin |
| 2 | SSO |
| 3 | Biometric |

### UserMfaType

| Value | Name |
|-------|------|
| 0 | None |
| 1 | OTP |
| 2 | TOTP |
| 3 | Biometric |
| 4 | Multiple |

### UserPassType

| Value | Name |
|-------|------|
| 0 | Plain |
| 1 | Hashed |
| 2 | SsoOnly |

### UserVarifiedType

| Value | Name |
|-------|------|
| 0 | NotVerified |
| 1 | EmailVerified |
| 2 | PhoneVerified |
| 3 | BothVerified |

---

## Shared Schemas

### OrganizationMembership

Embedded in `CreateUserRequest`, `UpdateUserRequest`, `SaveRolesAndPermissionsRequest`, and `GetUser` responses.

```json
{
  "organizationId": "string",
  "roles": ["string"],
  "permissions": ["string"]
}
```

### BaseSortRequest

```json
{
  "property": "string",
  "isDescending": false
}
```

---

## Authentication

### Token Endpoint — All Grant Types

`POST /idp/v1/Authentication/Token`

**Content-Type: `application/x-www-form-urlencoded` or `multipart/form-data`**

#### password grant

```
grant_type=password&username=...&password=...&x-blocks-key=...
```

#### refresh_token grant

```
grant_type=refresh_token&refresh_token=...&x-blocks-key=...
```

#### mfa_code grant

```
grant_type=mfa_code&mfa_id=...&mfa_type=...&otp=...&x-blocks-key=...
```

#### authorization_code grant

```
grant_type=authorization_code&code=...&redirect_uri=...&client_id=...&x-blocks-key=...
```

#### client_credentials grant (machine-to-machine)

```
grant_type=client_credentials&client_id=...&client_secret=...&scope=...&x-blocks-key=...
```

#### Token Response — Success (no MFA)

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 8000,
  "refresh_token": "538b8ede...",
  "id_token": null
}
```

#### Token Response — MFA Required

```json
{
  "enable_mfa": true,
  "mfaType": "email",
  "mfaId": "abc123",
  "message": "OTP sent to your email"
}
```

> `mfaType` values here are `"email"` or `"authenticator"` — these are OAuth response strings, NOT the `UserMfaType` enum values used in OTP generation requests.

### LogoutRequest

```json
{
  "refreshToken": "string"
}
```

### AcknowledgeRequest (OIDC consent)

```json
{
  "clientId": "string",
  "redirectUri": "string",
  "scope": "string",
  "state": "string",
  "nonce": "string",
  "isAcknowledged": true,
  "username": "string"
}
```

### LoginRequest

```json
{
  "username": "string",
  "password": "string",
  "clientId": "string",
  "redirectUri": "string",
  "scope": "string",
  "state": "string",
  "nonce": "string"
}
```

### Authorize Query Parameters

`GET /idp/v1/Authentication/Authorize`

| Param | Type | Required |
|-------|------|----------|
| response_type | string | yes |
| client_id | string | yes |
| state | string | yes |
| redirect_uri | string | yes |
| scope | string | no |
| nonce | string | no |

### GenerateUserCodeRequest

```json
{
  "clientId": "string",
  "codeTtlInMinute": 0,
  "note": "string"
}
```

### GetUserCodesByUserIdResponse (swagger typo — do not correct)

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "code": "string",
  "userId": "string",
  "clientId": "string",
  "codeTtlInMinute": 0,
  "expiryDate": "2024-01-01T00:00:00Z",
  "note": "string"
}
```

### GetLoginOptionsResponse

```json
{
  "loginOptions": [
    {
      "type": "Email",
      "providers": []
    },
    {
      "type": "SocialLogin",
      "providers": ["Google", "Microsoft", "LinkedIn", "GitHub"]
    },
    {
      "type": "SSO",
      "providers": []
    }
  ],
  "isSuccess": true,
  "errors": {}
}
```

### SaveOIDCClientRequest

```json
{
  "redirectUri": "string",
  "scope": "string",
  "audience": "string",
  "isAutoRedirect": true,
  "itemId": "string",
  "projectKey": "string",
  "clientLogoUrl": "string",
  "clientDisplayName": "string",
  "clientBrandColor": "string"
}
```

### OIDCClientCredential

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "clientSecret": "string",
  "redirectUri": "string",
  "scope": "string",
  "audience": "string",
  "isAutoRedirect": true,
  "clientLogoUrl": "string",
  "clientDisplayName": "string",
  "clientBrandColor": "string"
}
```

### SaveOIDCClientResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string"
}
```

### GetOIDCClientResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "oIDCClientCredential": { ...OIDCClientCredential }
}
```

### GetOIDCClientsResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "oIDCClientCredentials": [ ...OIDCClientCredential ]
}
```

### DeleteOIDCClientRequest

```json
{
  "projectKey": "string",
  "itemId": "string"
}
```

### SaveClientCredentialRequest

```json
{
  "name": "string",
  "roles": ["string"],
  "projectKey": "string"
}
```

### ClientCredential

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "name": "string",
  "clientSecret": "string",
  "roles": ["string"],
  "isActive": true,
  "audiences": ["string"]
}
```

### DeleteClientCredentialRequest

```json
{
  "itemId": "string",
  "projectKey": "string"
}
```

### SaveSsoCredentialRequest

```json
{
  "provider": "string",
  "audience": "string",
  "clientId": "string",
  "clientSecret": "string",
  "redirectUrl": "string",
  "wellKnownUrl": "string",
  "initialRoles": ["string"],
  "initialPermissions": ["string"],
  "projectKey": "string",
  "isDisabled": false,
  "itemId": "string",
  "ssoType": 0,
  "teamId": "string",
  "keyId": "string",
  "privateKey": "string"
}
```

### SocialLoginCredential

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "provider": "string",
  "audience": "string",
  "clientId": "string",
  "clientSecret": "string",
  "authorizationUrl": "string",
  "tokenUrl": "string",
  "getProfileUrl": "string",
  "redirectUrl": "string",
  "wellKnownUrl": "string",
  "getEmailUrl": "string",
  "scope": "string",
  "initialRoles": ["string"],
  "initialPermissions": ["string"],
  "isDisabled": false,
  "sendAsResponse": false,
  "ssoType": 0,
  "teamId": "string",
  "keyId": "string",
  "privateKey": "string",
  "appleAudience": "string"
}
```

### GetSsoCredentialResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "provider": "string",
  "audience": "string",
  "clientId": "string",
  "clientSecret": "string",
  "authorizationUrl": "string",
  "tokenUrl": "string",
  "getProfileUrl": "string",
  "redirectUrl": "string",
  "wellKnownUrl": "string",
  "scope": "string",
  "userRoles": [ ...GetUserRole ],
  "userPermissions": [ ...GetUserPermission ],
  "isDisabled": false,
  "sendAsResponse": false
}
```

### DeleteSsoCredentialRequest

```json
{
  "itemId": "string",
  "projectKey": "string"
}
```

### UpdateSsoCredentialStatusRequest

```json
{
  "itemId": "string",
  "isEnabled": true,
  "projectKey": "string"
}
```

### SaveSsoCredentialResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string"
}
```

### GetSocialLogInEndPointRequest

```json
{
  "provider": "string",
  "audience": "string",
  "nextUrl": "string",
  "sendAsResponse": false
}
```

---

## Users

### CreateUserRequest

```json
{
  "language": "string",
  "tags": ["string"],
  "email": "string",
  "userName": "string",
  "phoneNumber": "string",
  "password": "string",
  "salutation": "string",
  "firstName": "string",
  "lastName": "string",
  "mailPurpose": "string",
  "userPassType": 0,
  "userCreationType": 0,
  "varifiedType": 0,
  "platform": "string",
  "profileImageUrl": "string",
  "profileImageId": "string",
  "userMfaType": 0,
  "mfaEnabled": false,
  "allowedLogInType": [0],
  "OrganizationMembership": [ ...OrganizationMembership ],
  "projectKey": "string",
  "organizationId": "string"
}
```

### UpdateUserRequest

```json
{
  "itemId": "string",
  "salutation": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "tags": ["string"],
  "profileImageUrl": "string",
  "profileImageId": "string",
  "userMfaType": 0,
  "mfaEnabled": false,
  "roles": ["string"],
  "permissions": ["string"],
  "projectKey": "string",
  "OrganizationMembership": [ ...OrganizationMembership ]
}
```

### GetUser (embedded in responses)

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "language": "string",
  "salutation": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "userName": "string",
  "phoneNumber": "string",
  "OrganizationMembership": [ ...OrganizationMembership ],
  "active": true,
  "isVarified": false,
  "profileImageUrl": "string",
  "mfaEnabled": false,
  "isMfaVerified": false,
  "userMfaType": 0,
  "userCreationType": 0,
  "department": "string",
  "employeeId": "string",
  "lastLoggedInTime": "2024-01-01T00:00:00Z",
  "lastLoggedInDeviceInfo": "string",
  "logInCount": 0
}
```

### GetUserResponse

```json
{
  "data": { ...GetUser },
  "errors": {}
}
```

### GetUsersRequest

```json
{
  "page": 1,
  "pageSize": 20,
  "sort": { "property": "string", "isDescending": false },
  "filter": {
    "email": "string",
    "name": "string",
    "userIds": ["string"],
    "status": { "active": true, "inactive": false },
    "mfa": { "enabled": true, "disabled": false },
    "joinedOn": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-01T00:00:00Z",
    "organizationId": "string"
  },
  "projectKey": "string"
}
```

### GetUsersResponse

```json
{
  "data": [ ...GetUser ],
  "errors": {},
  "totalCount": 100
}
```

### User (full user model used in timeline currentData)

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "salutation": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "userName": "string",
  "phoneNumber": "string",
  "OrganizationMembership": [ ...OrganizationMembership ],
  "active": true,
  "isVarified": false,
  "varifiedType": 0,
  "profileImageUrl": "string",
  "profileImageId": "string",
  "platform": "string",
  "userCreationType": 0,
  "userPassType": 0,
  "password": "string",
  "passwordSetTime": "2024-01-01T00:00:00Z",
  "userMfaType": 0,
  "mfaEnabled": false,
  "firstLoggedInTime": "2024-01-01T00:00:00Z",
  "lastLoggedInTime": "2024-01-01T00:00:00Z",
  "lastLoggedInDeviceInfo": "string",
  "logInCount": 0,
  "allowedLogInType": [0],
  "isDefault": false,
  "mailPurpose": "string",
  "isMfaVerified": false,
  "externalUserId": "string",
  "department": "string",
  "employeeId": "string",
  "lastLoggedInOrgId": "string"
}
```

### GetAccounts (accounts list item)

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "language": "string",
  "salutation": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "userName": "string",
  "phoneNumber": "string",
  "OrganizationMembership": [ ...OrganizationMembership ],
  "active": true,
  "isVarified": false,
  "profileImageUrl": "string",
  "mfaEnabled": false,
  "isMfaVerified": false,
  "userMfaType": 0,
  "userCreationType": 0,
  "department": "string",
  "employeeId": "string"
}
```

### GetAccountsRequest

```json
{
  "page": 1,
  "pageSize": 20,
  "sort": { "property": "string", "isDescending": false },
  "filter": { ...GetUsersFilter }
}
```

### GetAccountsResponse

```json
{
  "data": [ ...GetAccounts ],
  "errors": {},
  "totalCount": 100
}
```

### GetAccountResponse

```json
{
  "data": { ...GetUser },
  "errors": {},
  "permissions": [ ...GetUserPermission ]
}
```

### ActivateUserRequest

```json
{
  "code": "string",
  "password": "string",
  "captchaCode": "string",
  "mailPurpose": "string",
  "preventPostEvent": false,
  "projectKey": "string",
  "firstName": "string",
  "lastName": "string"
}
```

### DeactivateUserRequest

```json
{
  "userId": "string",
  "projectKey": "string"
}
```

### ChangePasswordRequest

```json
{
  "newPassword": "string",
  "oldPassword": "string",
  "projectKey": "string"
}
```

### RecoveryUserRequest

```json
{
  "email": "string",
  "captchaCode": "string",
  "mailPurpose": "string",
  "projectKey": "string"
}
```

### ResetPasswordRequest

```json
{
  "code": "string",
  "password": "string",
  "captchaCode": "string",
  "logoutFromAllDevices": false,
  "projectKey": "string"
}
```

### ResendActivationRequest

```json
{
  "userId": "string",
  "mailPurpose": "string",
  "projectKey": "string"
}
```

### ValidateActivationCodeRequest

```json
{
  "activationCode": "string",
  "projectKey": "string"
}
```

### GetUserRole

```json
{
  "itemId": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "count": 0
}
```

### GetUserRolesResponse

```json
{
  "data": [ ...GetUserRole ],
  "errors": {},
  "totalCount": 100
}
```

### GetUserPermission

```json
{
  "itemId": "string",
  "name": "string",
  "type": 0,
  "description": "string",
  "resource": "string"
}
```

### GetUserPermissionsResponse

```json
{
  "data": [ ...GetUserPermission ],
  "errors": {},
  "totalCount": 100
}
```

### GetAccountRolesResponse

```json
{
  "data": [ ...GetUserRole ],
  "errors": {},
  "totalCount": 100
}
```

### GetAccountPermissionsResponse

```json
{
  "data": [ ...GetUserPermission ],
  "errors": {},
  "totalCount": 100
}
```

### UserTimeline

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "currentData": { ...User },
  "event": "string"
}
```

### GetUserTimeLineFilter

```json
{
  "event": "string"
}
```

### GetUserTimeLineRequest (body, not query params)

```json
{
  "page": 1,
  "pageSize": 20,
  "sort": { "property": "string", "isDescending": false },
  "filter": { "event": "string" }
}
```

---

## Roles

### CreateRoleRequest

```json
{
  "name": "string",
  "description": "string",
  "slug": "string",
  "projectKey": "string"
}
```

### UpdateRoleRequest

```json
{
  "itemId": "string",
  "name": "string",
  "description": "string",
  "projectKey": "string"
}
```

### Role

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "name": "string",
  "slug": "string",
  "description": "string",
  "count": 0
}
```

### GetRoleResponse

```json
{
  "data": { ...Role },
  "errors": {}
}
```

### GetRolesRequest

```json
{
  "page": 1,
  "pageSize": 20,
  "sort": { "property": "string", "isDescending": false },
  "filter": {
    "search": "string",
    "slugs": ["string"]
  },
  "projectKey": "string"
}
```

### GetRolesResponse

```json
{
  "data": [ ...Role ],
  "errors": {},
  "totalCount": 100
}
```

### SetRolesRequest

```json
{
  "addPermissions": ["string"],
  "removePermissions": ["string"],
  "slug": "string",
  "projectKey": "string"
}
```

---

## Permissions

### CreatePermissionRequest

```json
{
  "name": "string",
  "type": 0,
  "description": "string",
  "resource": "string",
  "resourceGroup": "string",
  "tags": ["string"],
  "dependentPermissions": ["string"],
  "isBuiltIn": false,
  "permissionSeverity": 0,
  "projectKey": "string"
}
```

### UpdatePermissionRequest

```json
{
  "name": "string",
  "type": 0,
  "description": "string",
  "resource": "string",
  "resourceGroup": "string",
  "tags": ["string"],
  "dependentPermissions": ["string"],
  "isBuiltIn": false,
  "permissionSeverity": 0,
  "itemId": "string",
  "isArchived": false,
  "projectKey": "string"
}
```

### Permission

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "name": "string",
  "type": 0,
  "description": "string",
  "resource": "string",
  "resourceGroup": "string",
  "isBuiltIn": false,
  "isArchived": false,
  "permissionSeverity": 0,
  "dependentPermissions": ["string"],
  "roles": ["string"]
}
```

### GetPermissionResponse

```json
{
  "data": { ...Permission },
  "errors": {}
}
```

### GetPermissionFilter

```json
{
  "search": "string",
  "type": 0,
  "permissionSeverity": 0,
  "isBuiltIn": "string",
  "tags": ["string"],
  "resources": ["string"],
  "isArchived": false,
  "resourceGroup": "string"
}
```

### GetPermissionsRequest

```json
{
  "page": 1,
  "pageSize": 20,
  "sort": { "property": "string", "isDescending": false },
  "filter": { ...GetPermissionFilter },
  "roles": ["string"],
  "projectKey": "string"
}
```

### GetPermissionsResponse

```json
{
  "data": [ ...Permission ],
  "errors": {},
  "totalCount": 100
}
```

### GetResourceGroupResponse

```json
{
  "resourceGroup": "string",
  "count": 0
}
```

### SaveRolesAndPermissionsRequest

```json
{
  "userId": "string",
  "OrganizationMembership": [ ...OrganizationMembership ],
  "projectKey": "string"
}
```

### PermissionGroupBySeverityResponse

```json
{
  "severityLevel": "string",
  "count": 0
}
```

---

## Organizations

### Organization

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "name": "string",
  "isEnable": true
}
```

### SaveOrganizationRequest

```json
{
  "projectKey": "string",
  "name": "string",
  "itemId": "string",
  "isEnable": true
}
```

### GetOrganizationResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "organization": { ...Organization }
}
```

### GetOrganizationsResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "organizations": [ ...Organization ],
  "totalCount": 100
}
```

### OrganizationConfig

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "allowCreationFromCloud": false,
  "allowCreationFromConstruct": false,
  "isMultiOrgEnabled": false,
  "roles": ["string"]
}
```

### SaveOrganizationConfigRequest

```json
{
  "itemId": "string",
  "allowCreationFromCloud": false,
  "allowCreationFromConstruct": false,
  "roles": ["string"],
  "isMultiOrgEnabled": false,
  "projectKey": "string"
}
```

### SignUpSetting

```json
{
  "itemId": "string",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastUpdatedDate": "2024-01-01T00:00:00Z",
  "createdBy": "string",
  "language": "string",
  "lastUpdatedBy": "string",
  "organizationIds": ["string"],
  "tags": ["string"],
  "isEmailPasswordSignUpEnabled": true,
  "isSSoSignUpEnabled": false
}
```

### SaveSignUpSettingRequest

```json
{
  "isEmailPasswordSignUpEnabled": true,
  "isSSoSignUpEnabled": false,
  "projectKey": "string",
  "itemId": "string"
}
```

### SaveSignUpSettingResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string"
}
```

---

## Sessions & History

### GetSessionsResponse (swagger uses query params for pagination)

`GET /idp/v1/Iam/GetSessions?ProjectKey=...&Page=1&PageSize=20&Sort.Property=...&Sort.IsDescending=false&Filter.UserId=...`

```json
{
  "data": [ {} ],
  "errors": {},
  "totalCount": 100
}
```

### GetHistorysResponse (swagger typo — preserve it)

`GET /idp/v1/Iam/GetHistories?ProjectKey=...&Page=1&PageSize=20&Sort.Property=...&Sort.IsDescending=false&Filter.UserId=...`

```json
{
  "data": [ {} ],
  "errors": {},
  "totalCount": 100
}
```

---

## MFA

### OtpGenerationRequest

```json
{
  "userId": "string",
  "projectKey": "string",
  "mfaType": 1,
  "sendPhoneNumberAsEmailDomain": "string"
}
```

### OtpGenerationResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "mfaId": "string"
}
```

### VerifyOtpRequest

```json
{
  "verificationCode": "string",
  "mfaId": "string",
  "authType": 1,
  "projectKey": "string",
  "isFromTokenCall": false
}
```

### OtpVerificationResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "isValid": true,
  "userId": "string"
}
```

### ResendOtpRequest

```json
{
  "mfaId": "string",
  "sendPhoneNumberAsEmailDomain": "string"
}
```

### DisableUserMfaRequest

```json
{
  "userId": "string",
  "projectKey": "string"
}
```

### SetUpUserTotpResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "qrImageUrl": "string",
  "qrCode": "string"
}
```

---

## Captcha

### CreateCaptchaRequest

```json
{
  "configurationName": "string"
}
```

### CreateCaptchaRequestResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string",
  "id": "string",
  "captcha": "string"
}
```

### SubmitCaptchaRequest

```json
{
  "id": "string",
  "value": "string"
}
```

### SubmitCaptchaRequestResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string",
  "verificationCode": "string"
}
```

### VerifyCaptchaRequestResponse

```json
{
  "isSuccess": true,
  "errors": {},
  "itemId": "string",
  "verified": true,
  "hostName": "string"
}
```

### GetCaptchaSettingRequest (query params)

`GET /idp/v1/Captcha/Verify?VerificationCode=...&ConfigurationName=...`

---

## Status and MFA Enums

### Status

```json
{
  "active": true,
  "inactive": false
}
```

### MFA

```json
{
  "enabled": true,
  "disabled": false
}
```
