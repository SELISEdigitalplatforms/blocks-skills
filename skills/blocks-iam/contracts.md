# blocks-iam — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/iam/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py iam`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface AccountInfo {
  userId?: string | null;
  tenantId?: string | null;
  displayName?: string | null;
  loginAt?: string;
}

export interface ActivateUserRequest {
  code?: string | null;
  password?: string | null;
  captchaCode?: string | null;
  mailPurpose?: string | null;
  preventPostEvent?: boolean;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AddAccountRequest {
  userId?: string | null;
  tenantId?: string | null;
  displayName?: string | null;
}

export interface AddAccountResponse {
  success?: boolean;
}

export interface Address {
  name?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  isPrimary?: boolean;
}

export interface AdminResetMfaRequest {
  userId?: string | null;
  reason?: string | null;
}

export interface AssignableRole {
  slug: string | null;
  name: string | null;
}

export interface BaseMutationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface BaseResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
}

export interface BaseSortRequest {
  property?: string | null;
  isDescending?: boolean;
}

export interface ChangePasswordRequest {
  newPassword?: string | null;
  oldPassword?: string | null;
}

export interface ClientCredential {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  clientSecret?: string | null;
  roles?: string[];
  permissionsByOrg?: Record<string, string[]>;
  isActive?: boolean;
  audiences?: string[];
}

export interface ConsumeBackupCodeRequest {
  userId?: string | null;
  code?: string | null;
}

export interface CreateOrganizationRequest {
  name: string | null;
  description?: string | null;
  defaultRoleForMembers?: string[];
  defaultPermissionsForMembers?: string[];
  email?: string | null;
  phoneNumber?: string | null;
  websiteUrl?: string | null;
  addresses?: Address[];
  attributes?: Record<string, unknown>;
  createdFrom?: CreatedFrom;
}

export interface CreatePermissionRequest {
  name?: string | null;
  type?: ResourceType;
  description?: string | null;
  resource?: string | null;
  resourceGroup?: string | null;
  tags?: string[];
  dependentPermissions?: string[];
  isBuiltIn?: boolean;
  permissionSeverity?: PermissionSeverity;
  propagateToOtherOrg?: boolean;
}

export interface CreateRoleRequest {
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  parentRoleSlug?: string | null;
  propagateToOtherOrg?: boolean;
  canCreateOwn?: boolean;
}

export interface CreateUserRequest {
  userId?: string | null;
  language?: string | null;
  tags?: string[];
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  password?: string | null;
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mailPurpose?: string | null;
  userPassType?: UserPassType;
  userCreationType?: UserCreationType;
  verifiedType?: UserVerifiedType;
  platform?: string | null;
  profileImageUrl?: string | null;
  profileImageId?: string | null;
  userMfaType?: UserMfaType;
  mfaEnabled?: boolean;
  allowedLogInType?: UserLogInType[];
  roles?: string[];
  permissions?: string[];
  organizationId?: string | null;
  attributes?: Record<string, unknown>;
}

export type CreatedFrom = 1 | 2 | 3;  // int enum — member names not published in swagger

export interface DeactivateUserRequest {
  userId?: string | null;
}

export interface DeleteClientCredentialRequest {
  itemId?: string | null;
}

export interface DiscoveryMetadata {
  issuer?: string | null;
  authorization_endpoint?: string | null;
  token_endpoint?: string | null;
  userinfo_endpoint?: string | null;
  revocation_endpoint?: string | null;
  introspection_endpoint?: string | null;
  jwks_uri?: string | null;
  response_types_supported?: string[];
  grant_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  code_challenge_methods_supported?: string[];
  scopes_supported?: string[];
}

export interface EmbeddedLoginRequest {
  client_id?: string | null;
  username?: string | null;
  password?: string | null;
  captcha_code?: string | null;
  mfa_id?: string | null;
  mfa_code?: string | null;
  mfa_type?: UserMfaType;
}

export interface ExternalIdentity {
  provider?: string | null;
  providerUserId?: string | null;
  issuer?: string | null;
  linkedAtUtc?: string;
}

export interface GenerateUserCodeRequest {
  clientId?: string | null;
  codeTtlInMinute?: number;
  note?: string | null;
}

export interface GetAccountsResponse {
  accounts?: AccountInfo[];
}

export interface GetAssignableRolesResponse {
  hierarchy?: AssignableRole[];
  standalone?: AssignableRole[];
}

export interface GetFeResourceFeatureResponse {
  resource?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface GetHistorysResponse {
  data?: unknown[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetMyOrganizationsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  organizations?: MyOrganizationInfo[];
}

export interface GetOrganizationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  organization?: Organization;
}

export interface GetOrganizationsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  organizations?: Organization[];
  totalCount?: number;
}

export interface GetPermissionFilter {
  search?: string | null;
  type?: ResourceType;
  permissionSeverity?: PermissionSeverity;
  isBuiltIn?: string | null;
  tags?: string[];
  resources?: string[];
  isArchived?: boolean;
  resourceGroup?: string | null;
}

export interface GetPermissionResponse {
  data?: Permission;
  errors?: Record<string, string>;
}

export interface GetPermissionsRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetPermissionFilter;
  roles?: string[];
}

export interface GetPermissionsResponse {
  data?: Permission[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetResourceGroupResponse {
  resourceGroup?: string | null;
  count?: number;
}

export interface GetRoleResponse {
  data?: Role;
  errors?: Record<string, string>;
}

export interface GetRolesFilter {
  search?: string | null;
  slugs?: string[];
}

export interface GetRolesRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetRolesFilter;
}

export interface GetRolesResponse {
  data?: Role[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetSessionResponse {
  sessionId?: string | null;
  accounts?: AccountInfo[];
  createdAt?: string;
  lastActivityAt?: string;
  idleExpiresAt?: string;
  absoluteExpiresAt?: string;
}

export interface GetSessionsResponse {
  data?: unknown[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetUserCodesByUserIdResponse {
  itemId?: string | null;
  createdDate?: string;
  code?: string | null;
  userId?: string | null;
  clientId?: string | null;
  codeTtlInMinute?: number | null;
  expiryDate?: string | null;
  note?: string | null;
}

export interface GetUserResponse {
  data?: Record<string, unknown | null>;
  errors?: Record<string, string>;
}

export interface GetUserTimeLineFilter {
  event?: string | null;
}

export interface GetUserTimeLineRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetUserTimeLineFilter;
}

export interface GetUsersFilter {
  email?: string | null;
  name?: string | null;
  userIds?: string[];
  status?: Status;
  mfa?: MFA;
  joinedOn?: string | null;
  lastLogin?: string | null;
  org_id?: string | null;
}

export interface GetUsersRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetUsersFilter;
}

export interface GetUsersResponse {
  data?: Array<Record<string, unknown>>;
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface IdentityProvider {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  provider: string | null;
  providerType: string | null;
  protocol?: string | null;
  displayName?: string | null;
  isActive?: boolean;
  clientId: string | null;
  clientSecret: string | null;
  issuer?: string | null;
  authorizationUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  jwksUri?: string | null;
  wellKnownUrl?: string | null;
  redirectUris?: string[];
  scope?: string | null;
  responseType?: string | null;
  grantTypes?: string[];
  requirePkce?: boolean;
  tokenEndpointAuthMethod: string | null;
  initialRoles?: string[];
  initialPermissions?: string[];
  icon?: string | null;
  teamId?: string | null;
  keyId?: string | null;
  privateKey?: string | null;
  appleAudience?: string | null;
}

export interface ImpersonateRequest {
  targeted_tenant_id?: string | null;
  organization_id?: string | null;
  refresh_token?: string | null;
  impersonation_id?: string | null;
  impersontingUserId?: string | null;
}

export interface JwkKey {
  kty?: string | null;
  use?: string | null;
  kid?: string | null;
  alg?: string | null;
  n?: string | null;
  e?: string | null;
}

export interface JwksResponse {
  keys?: JwkKey[];
}

export interface LogoutAllRequest {
  useBackchannel?: boolean;
}

export interface LogoutRequest {
  refreshToken?: string | null;
}

export interface MFA {
  enabled?: boolean;
  disabled?: boolean;
}

export interface MfaTemplate {
  templateName?: string | null;
  templateId?: string | null;
}

export interface MyOrganizationInfo {
  itemId?: string | null;
  name?: string | null;
  createdDate?: string;
}

export interface OAuthAuthorizationServerMetadata {
  issuer?: string | null;
  authorization_endpoint?: string | null;
  token_endpoint?: string | null;
  jwks_uri?: string | null;
  revocation_endpoint?: string | null;
  introspection_endpoint?: string | null;
  response_types_supported?: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  code_challenge_methods_supported?: string[];
}

export interface OidcCallbackRequest {
  code?: string | null;
  state?: string | null;
}

export interface OidcLoginRequest {
  username?: string | null;
  password?: string | null;
  client_id?: string | null;
  redirect_uri?: string | null;
  scope?: string | null;
  state?: string | null;
  nonce?: string | null;
  code_challenge?: string | null;
  code_challenge_method?: string | null;
  tenant_id?: string | null;
  provider_client_id?: string | null;
  provider_redirect_uri?: string | null;
  mfa_id?: string | null;
  mfa_code?: string | null;
  captcha_code?: string | null;
}

export interface Organization {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name: string | null;
  description?: string | null;
  parentOrganizationId?: string | null;
  shortCode?: string | null;
  isEnabled?: boolean;
  defaultRoleForMembers?: string[];
  defaultPermissionsForMembers?: string[];
  email?: string | null;
  phoneNumber?: string | null;
  websiteUrl?: string | null;
  addresses?: Address[];
  theme?: Theme;
  logoUrl?: string | null;
  logoId?: string | null;
  industry?: string | null;
  timeZone?: string | null;
  currency?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  locale?: string | null;
  attributes?: Record<string, unknown>;
}

export interface Permission {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  type?: ResourceType;
  description?: string | null;
  resource?: string | null;
  resourceGroup?: string | null;
  isBuiltIn?: boolean;
  isArchived?: boolean;
  permissionSeverity?: PermissionSeverity;
  dependentPermissions?: string[];
  roles?: string[];
}

export interface PermissionGroupBySeverityResponse {
  severityLevel?: string | null;
  count?: number;
}

export type PermissionSeverity = 0 | 1 | 2 | 3 | 4;  // int enum — member names not published in swagger

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export interface RecoveryUserRequest {
  email?: string | null;
  captchaCode?: string | null;
  mailPurpose?: string | null;
}

export interface RefreshRequest {
  refresh_token?: string | null;
  client_id?: string | null;
}

export interface ResendActivationRequest {
  userId?: string | null;
  mailPurpose?: string | null;
}

export interface ResetPasswordRequest {
  code?: string | null;
  password?: string | null;
  captchaCode?: string | null;
  logoutFromAllDevices?: boolean;
}

export type ResourceType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface RevokeSessionRequest {
  reason?: string | null;
}

export interface Role {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  slug?: string | null;
  ancestorRoleSlugs?: string[];
  parentRoleSlug?: string | null;
  canCreateOwn?: boolean;
  description?: string | null;
  count?: number;
  createdFromDefault?: boolean;
}

export interface SaveClientCredentialRequest {
  name?: string | null;
  roles?: string[];
  permissionsByOrg?: Record<string, string[]>;
}

export interface SaveOIDCClientRequest {
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  scope?: string | null;
  allowedScopes?: string[];
  serviceAccessResource?: string | null;
  allowedServiceAccessResources?: string[];
  allowedResponseTypes?: string[];
  requirePkce?: boolean;
  requireConsent?: boolean;
  frontChannelLogoutUri?: string | null;
  backChannelLogoutUri?: string | null;
  isAutoRedirect?: boolean;
  externalDiscoveryEndpoint?: string | null;
  isActive?: boolean;
  loginMode?: string | null;
  clientType?: string | null;
  itemId?: string | null;
  clientLogoUrl?: string | null;
  clientDisplayName?: string | null;
  clientBrandColor?: string | null;
  useTokensCookie?: boolean;
  requireMfa?: boolean;
  allowedMfaMethods?: UserMfaType[];
}

export interface SaveOrganizationConfigRequest {
  allowOrgCreationFromCloud?: boolean;
  allowOrgCreationFromConstruct?: boolean;
  allowOrgCreationFromSignup?: boolean;
  allowOrgCreationFromPortal?: boolean;
  isMultiOrgEnabled?: boolean;
  consentForMultiOrgEnable?: boolean;
}

export interface SaveOrganizationRequest {
  name?: string | null;
  description?: string | null;
  defaultRoleForMembers?: string[];
  defaultPermissionsForMembers?: string[];
  email?: string | null;
  phoneNumber?: string | null;
  websiteUrl?: string | null;
  addresses?: Address[];
  attributes?: Record<string, unknown>;
  theme?: Theme;
  logoUrl?: string | null;
  logoId?: string | null;
  industry?: string | null;
  timeZone?: string | null;
  currency?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  locale?: string | null;
  isEnable?: boolean | null;
}

export interface SaveRolesAndPermissionsRequest {
  userId: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface SaveSignUpSettingRequest {
  isEmailPasswordSignUpEnabled?: boolean;
  isSSoSignUpEnabled?: boolean;
  defaultRolesForNewUserOnSignUp?: string[];
  defaultPermissionsForNewUserOnSignUp?: string[];
}

export interface SaveSignUpSettingResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface SelectAccountRequest {
  userId?: string | null;
}

export interface SelectAccountResponse {
  success?: boolean;
  userId?: string | null;
}

export interface SetPreferredMfaMethodRequest {
  mfaType?: UserMfaType;
}

export interface SetRolesRequest {
  addPermissions?: string[];
  removePermissions?: string[];
  slug?: string | null;
}

export interface SignupUserRequest {
  email?: string | null;
  captchaCode?: string | null;
  mailPurpose?: string | null;
  isSsoSignup?: boolean;
  provider?: string | null;
  externalUserId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  createOrganizationDuringSignup?: boolean;
  organizationName?: string | null;
  organizationDescription?: string | null;
  attributes?: Record<string, unknown>;
}

export interface SocialLoginRequest {
  client_id?: string | null;
  code?: string | null;
  state?: string | null;
  provider?: string | null;
  mfa_id?: string | null;
  mfa_code?: string | null;
  mfa_type?: UserMfaType;
}

export interface Status {
  active?: boolean;
  inactive?: boolean;
}

export interface StopImpersonationRequest {
  refresh_token?: string | null;
  impersonation_id?: string | null;
}

export interface SwitchOrganizationRequest {
  organization_id?: string | null;
}

export interface Theme {
  name?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tertiaryColor?: string | null;
  attributes?: Record<string, unknown>;
}

export interface UpdateAuthenticationConfigurationRequest {
  itemId?: string | null;
  refreshTokenValidForNumberMinutes?: number;
  absoluteRefreshTokenValidForNumberMinutes?: number;
  accessTokenValidForNumberMinutes?: number;
  rememberMeRefreshTokenValidForNumberMinutes?: number;
  getNumberOfWrongAttemptsToLockTheAccount?: number;
  accountLockDurationInMinutes?: number;
  publicCertificatePath?: string | null;
  accountActivationPath?: string | null;
  accountVerificationPath?: string | null;
  recoverAccountPath?: string | null;
  isOidcEnabled?: boolean | null;
  accountActionBaseUrl?: string | null;
  useAccountActionBaseUrlAsDefault?: boolean | null;
  activationUrlLifetimeInMinutes?: number;
  recoverAccountUrlLifetimeInMinutes?: number;
  logoutOnPasswordChange?: boolean | null;
  passwordStrengthCheckerRegex?: string | null;
}

export interface UpdateMfaPolicyRequest {
  enableMfa?: boolean | null;
  userMfaType?: UserMfaType[];
  mfaTemplate?: MfaTemplate;
  requireMfaForAllUsers?: boolean | null;
  mfaRequiredRoles?: string[];
  mfaExemptRoles?: string[];
  allowUserOptOut?: boolean | null;
  allowBackupCodes?: boolean | null;
  backupCodesCount?: number | null;
}

export interface UpdateOrganizationUserRequest {
  userId: string | null;
  roles?: string[];
  permissions?: string[];
  organizationId?: string | null;
}

export interface UpdatePermissionRequest {
  name?: string | null;
  type?: ResourceType;
  description?: string | null;
  resource?: string | null;
  resourceGroup?: string | null;
  tags?: string[];
  dependentPermissions?: string[];
  isBuiltIn?: boolean;
  permissionSeverity?: PermissionSeverity;
  itemId?: string | null;
  isArchived?: boolean;
  propagateToOtherOrg?: boolean;
}

export interface UpdateRoleRequest {
  itemId?: string | null;
  name?: string | null;
  description?: string | null;
  parentRoleSlug?: string | null;
  propagateToOtherOrg?: boolean;
  canCreateOwn?: boolean;
}

export interface UpdateStatusRequest {
  isActive?: boolean;
}

export interface UpdateUserRequest {
  itemId?: string | null;
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  tags?: string[];
  profileImageUrl?: string | null;
  profileImageId?: string | null;
  userMfaType?: UserMfaType;
  mfaEnabled?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface User {
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  roles?: Record<string, string[]>;
  permissions?: Record<string, string[]>;
  active?: boolean;
  isVerified?: boolean;
  verifiedType?: UserVerifiedType;
  profileImageUrl?: string | null;
  profileImageId?: string | null;
  platform?: string | null;
  userCreationType?: UserCreationType;
  provisioningSource?: UserProvisioningSource;
  userPassType?: UserPassType;
  password?: string | null;
  passwordSetTime?: string;
  passwordChangedAtUtc?: string | null;
  lastCredentialRotationAtUtc?: string | null;
  failedLoginCount?: number;
  lastFailedLoginUtc?: string | null;
  failedMfaCount?: number;
  lastFailedMfaUtc?: string | null;
  lockoutUntilUtc?: string | null;
  lockoutCount?: number;
  lastLockoutUtc?: string | null;
  securityStamp?: string | null;
  tokenVersion?: number;
  userMfaType?: UserMfaType;
  mfaEnabled?: boolean;
  mfaMethods?: UserMfaEnrollment[];
  firstLoggedInTime?: string;
  lastLoggedInTime?: string;
  lastUsedOrganizationId?: string | null;
  lastLoggedInDeviceInfo?: string | null;
  logInCount?: number;
  allowedLogInType?: UserLogInType[];
  mailPurpose?: string | null;
  isMfaVerified?: boolean;
  emailVerifiedAtUtc?: string | null;
  phoneVerifiedAtUtc?: string | null;
  termsAcceptedAtUtc?: string | null;
  privacyAcceptedAtUtc?: string | null;
  status?: UserLifecycleStatus;
  statusReason?: string | null;
  deactivatedAtUtc?: string | null;
  deactivatedBy?: string | null;
  externalUserId?: string | null;
  externalIdentities?: ExternalIdentity[];
  organizationIds?: string[];
  attributes?: Record<string, unknown>;
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  tags?: string[];
}

export type UserCreationType = 0 | 1 | 2 | 3 | 4 | 5;  // int enum — member names not published in swagger

export type UserLifecycleStatus = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export type UserLogInType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface UserMfaEnrollment {
  method?: string | null;
  enrolledAtUtc?: string;
  verifiedAtUtc?: string | null;
  active?: boolean;
}

export type UserMfaType = 0 | 1 | 2 | 3 | 4;  // int enum — member names not published in swagger

export type UserPassType = 0 | 1 | 2;  // int enum — member names not published in swagger

export type UserProvisioningSource = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface UserTimeline {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  tags?: string[];
  currentData?: User;
  event?: string | null;
  userId: string | null;
  organizationId: string | null;
}

export type UserVerifiedType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface ValidateActivationCodeRequest {
  activationCode?: string | null;
}

export interface VerifyTotpSetupRequest {
  code?: string | null;
}

```
