# blocks-monitor — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/monitor/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py monitor`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface AcknowledgeRequest {
  clientId?: string | null;
  redirectUri?: string | null;
  scope?: string | null;
  state?: string | null;
  nonce?: string | null;
  isAcknowledged?: boolean;
  username?: string | null;
}

export interface ActivateUserRequest {
  code?: string | null;
  password?: string | null;
  captchaCode?: string | null;
  mailPurpose?: string | null;
  preventPostEvent?: boolean;
  projectKey?: string | null;
  firstName?: string | null;
  lastName?: string | null;
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
  projectKey?: string | null;
}

export interface ClientCredential {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  name?: string | null;
  clientSecret?: string | null;
  roles?: string[];
  isActive?: boolean;
  audiences?: string[];
}

export interface ConfigureDomainRequest {
  projectKey?: string | null;
  cookieDomain?: string | null;
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
  projectKey?: string | null;
}

export interface CreateRoleRequest {
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  projectKey?: string | null;
}

export interface CreateUserRequest {
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
  varifiedType?: UserVarifiedType;
  platform?: string | null;
  profileImageUrl?: string | null;
  profileImageId?: string | null;
  userMfaType?: UserMfaType;
  mfaEnabled?: boolean;
  allowedLogInType?: UserLogInType[];
  memberships?: OrganizationMembership[];
  projectKey?: string | null;
  organizationId?: string | null;
}

export interface DeactivateUserRequest {
  userId?: string | null;
  projectKey?: string | null;
}

export interface DeleteClientCredentialRequest {
  itemId?: string | null;
  projectKey?: string | null;
}

export interface DeleteOIDCClientRequest {
  projectKey?: string | null;
  itemId?: string | null;
}

export interface DeleteSsoCredentialRequest {
  itemId?: string | null;
  projectKey?: string | null;
}

export interface GenerateUserCodeRequest {
  clientId?: string | null;
  codeTtlInMinute?: number;
  note?: string | null;
}

export interface GetAccountPermissionsResponse {
  data?: GetUserPermission[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetAccountResponse {
  data?: GetUser;
  errors?: Record<string, string>;
  permissions?: GetUserPermission[];
}

export interface GetAccountRolesResponse {
  data?: GetUserRole[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetAccounts {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  language?: string | null;
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  memberships?: OrganizationMembership[];
  active?: boolean;
  isVarified?: boolean;
  profileImageUrl?: string | null;
  mfaEnabled?: boolean;
  isMfaVerified?: boolean;
  userMfaType?: UserMfaType;
  userCreationType?: UserCreationType;
  department?: string | null;
  employeeId?: string | null;
}

export interface GetAccountsRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetUsersFilter;
}

export interface GetAccountsResponse {
  data?: GetAccounts[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetApiAnalyticsRequest {
  startTime: string;
  endTime: string;
  serviceName: string | null;
  operationName?: string | null;
  projectKey?: string | null;
}

export interface GetConfigurationResponse {
  data?: IamConfiguration;
  errors?: Record<string, string>;
}

export interface GetHistorysResponse {
  data?: unknown[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetHttpStatusAnalyticsRequest {
  startTime: string;
  endTime: string;
  serviceName?: string | null;
  projectKey?: string | null;
}

export interface GetLogsRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetLogsRequestFilter;
  search?: string | null;
  serviceName: string | null;
  projectKey?: string | null;
}

export interface GetLogsRequestFilter {
  startDate?: string | null;
  endDate?: string | null;
  level?: string | null;
  traceId?: string | null;
  spanId?: string | null;
}

export interface GetLogsResponse {
  data?: unknown[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetOIDCClientResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  oIDCClientCredential?: OIDCClientCredential;
}

export interface GetOIDCClientsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  oIDCClientCredentials?: OIDCClientCredential[];
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
  projectKey?: string | null;
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
  projectKey?: string | null;
}

export interface GetRolesResponse {
  data?: Role[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetSessionsResponse {
  data?: unknown[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetSocialLogInEndPointRequest {
  provider: string | null;
  audience: string | null;
  nextUrl?: string | null;
  sendAsResponse?: boolean;
}

export interface GetSsoCredentialResponse {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  provider: string | null;
  audience: string | null;
  clientId: string | null;
  clientSecret: string | null;
  authorizationUrl: string | null;
  tokenUrl: string | null;
  getProfileUrl: string | null;
  redirectUrl: string | null;
  wellKnownUrl?: string | null;
  scope: string | null;
  userRoles?: GetUserRole[];
  userPermissions?: GetUserPermission[];
  isDisabled?: boolean;
  sendAsResponse?: boolean;
}

export interface GetTracesRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetTracesRequestFilter;
  search?: string | null;
  projectKey?: string | null;
}

export interface GetTracesRequestFilter {
  startDate?: string | null;
  endDate?: string | null;
  services?: string[];
  excepts?: string[];
  statusCodes?: number[];
}

export interface GetUser {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  language?: string | null;
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  memberships?: OrganizationMembership[];
  active?: boolean;
  isVarified?: boolean;
  profileImageUrl?: string | null;
  mfaEnabled?: boolean;
  isMfaVerified?: boolean;
  userMfaType?: UserMfaType;
  userCreationType?: UserCreationType;
  department?: string | null;
  employeeId?: string | null;
  lastLoggedInTime?: string;
  lastLoggedInDeviceInfo?: string | null;
  logInCount?: number;
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

export interface GetUserPermission {
  itemId?: string | null;
  name?: string | null;
  type?: ResourceType;
  description?: string | null;
  resource?: string | null;
}

export interface GetUserPermissionsResponse {
  data?: GetUserPermission[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetUserResponse {
  data?: GetUser;
  errors?: Record<string, string>;
}

export interface GetUserRole {
  itemId?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  count?: number;
}

export interface GetUserRolesResponse {
  data?: GetUserRole[];
  errors?: Record<string, string>;
  totalCount?: number;
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
  organizationId?: string | null;
}

export interface GetUsersRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetUsersFilter;
  projectKey?: string | null;
}

export interface GetUsersResponse {
  data?: GetUser[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface IamConfiguration {
  itemId?: ObjectId;
  accountActivationUrl?: string | null;
  accountVerificationUrl?: string | null;
  recoverAccountUrl?: string | null;
  activationUrlLifetimeInMinutes?: number;
  recoverAccountUrlLifetimeInMinutes?: number;
  logoutOnPasswordChange?: boolean;
  passwordStrengthCheckerRegex?: string | null;
}

export interface LoginRequest {
  username?: string | null;
  password?: string | null;
  clientId?: string | null;
  redirectUri?: string | null;
  scope?: string | null;
  state?: string | null;
  nonce?: string | null;
}

export interface LogoutRequest {
  refreshToken?: string | null;
}

export interface LogsByDateRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: LogsByLastDateRequestFilter;
  search?: string | null;
  serviceName: string | null;
  projectKey?: string | null;
}

export interface LogsByLastDateRequestFilter {
  startDate?: string | null;
  endDate?: string | null;
  level?: string | null;
  traceId?: string | null;
  spanId?: string | null;
}

export interface MFA {
  enabled?: boolean;
  disabled?: boolean;
}

export interface OIDCClientCredential {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  clientSecret?: string | null;
  redirectUri?: string | null;
  scope?: string | null;
  audience?: string | null;
  isAutoRedirect?: boolean;
  clientLogoUrl?: string | null;
  clientDisplayName?: string | null;
  clientBrandColor?: string | null;
}

export interface ObjectId {
  timestamp?: number;
  creationTime?: string;
}

export interface Organization {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  name?: string | null;
  isEnable?: boolean;
}

export interface OrganizationConfig {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  allowCreationFromCloud?: boolean;
  allowCreationFromConstruct?: boolean;
  isMultiOrgEnabled?: boolean;
  roles?: string[];
}

export interface OrganizationMembership {
  organizationId?: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface Permission {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
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

export interface RecoveryUserRequest {
  email?: string | null;
  captchaCode?: string | null;
  mailPurpose?: string | null;
  projectKey?: string | null;
}

export interface ResendActivationRequest {
  userId?: string | null;
  mailPurpose?: string | null;
  projectKey?: string | null;
}

export interface ResetPasswordRequest {
  code?: string | null;
  password?: string | null;
  captchaCode?: string | null;
  logoutFromAllDevices?: boolean;
  projectKey?: string | null;
}

export type ResourceType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface Role {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  count?: number;
}

export type SSOType = 0 | 1;  // int enum — member names not published in swagger

export interface SaveClientCredentialRequest {
  name?: string | null;
  roles?: string[];
  projectKey?: string | null;
}

export interface SaveHealthConfigurationRequest {
  projectKey?: string | null;
  name?: string | null;
  repoId?: string | null;
  repoName?: string | null;
  externalServiceId?: string | null;
  isActive?: boolean;
  intervalInSeconds?: number;
  gracePeriodInSeconds?: number;
  monitorSourceType?: string | null;
  emails?: string[];
}

export interface SaveIamConfigurationRequest {
  accountActivationUrl?: string | null;
  accountVerificationUrl?: string | null;
  recoverAccountUrl?: string | null;
  activationUrlLifetimeInMinutes?: number;
  recoverAccountUrlLifetimeInMinutes?: number;
  logoutOnPasswordChange?: boolean;
  passwordStrengthCheckerRegex?: string | null;
  projectKey?: string | null;
}

export interface SaveMonitorConfigurationRequest {
  projectKey?: string | null;
  repoId?: string | null;
  repoName?: string | null;
  externalServiceId?: string | null;
  externalServiceName?: string | null;
  name?: string | null;
  url?: string | null;
  monitorType?: string | null;
  protocolType?: string | null;
  httpMethodType?: string | null;
  authorizationType?: string | null;
  intervalInSeconds?: number | null;
  timeoutInSeconds?: number | null;
  isActive?: boolean;
  monitorSourceType?: string | null;
  expectedContent?: string | null;
  customHttpHeaders?: string | null;
  customPayload?: string | null;
  successHttpResponseCodes?: string[];
  regions?: string[];
  emails?: string[];
}

export interface SaveOIDCClientRequest {
  redirectUri?: string | null;
  scope?: string | null;
  audience?: string | null;
  isAutoRedirect?: boolean;
  itemId?: string | null;
  projectKey?: string | null;
  clientLogoUrl?: string | null;
  clientDisplayName?: string | null;
  clientBrandColor?: string | null;
}

export interface SaveOIDCClientResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface SaveOrganizationConfigRequest {
  itemId?: string | null;
  allowCreationFromCloud?: boolean;
  allowCreationFromConstruct?: boolean;
  roles?: string[];
  isMultiOrgEnabled?: boolean;
  projectKey?: string | null;
}

export interface SaveOrganizationRequest {
  projectKey?: string | null;
  name?: string | null;
  itemId?: string | null;
  isEnable?: boolean;
}

export interface SaveRolesAndPermissionsRequest {
  userId: string | null;
  memberships?: OrganizationMembership[];
  projectKey?: string | null;
}

export interface SaveSignUpSettingRequest {
  isEmailPasswordSignUpEnabled?: boolean;
  isSSoSignUpEnabled?: boolean;
  projectKey?: string | null;
  itemId?: string | null;
}

export interface SaveSignUpSettingResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface SaveSsoCredentialRequest {
  provider?: string | null;
  audience?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUrl?: string | null;
  wellKnownUrl?: string | null;
  initialRoles?: string[];
  initialPermissions?: string[];
  projectKey?: string | null;
  isDisabled?: boolean;
  itemId?: string | null;
  ssoType?: SSOType;
  teamId?: string | null;
  keyId?: string | null;
  privateKey?: string | null;
}

export interface SaveSsoCredentialResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface SetRolesRequest {
  addPermissions?: string[];
  removePermissions?: string[];
  slug?: string | null;
  projectKey?: string | null;
}

export interface SignUpSetting {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  isEmailPasswordSignUpEnabled?: boolean;
  isSSoSignUpEnabled?: boolean;
}

export interface SocialLoginCredential {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  provider: string | null;
  audience: string | null;
  clientId: string | null;
  clientSecret: string | null;
  authorizationUrl: string | null;
  tokenUrl: string | null;
  getProfileUrl: string | null;
  redirectUrl: string | null;
  wellKnownUrl?: string | null;
  getEmailUrl?: string | null;
  scope: string | null;
  initialRoles?: string[];
  initialPermissions?: string[];
  isDisabled?: boolean;
  sendAsResponse?: boolean;
  ssoType?: SSOType;
  teamId?: string | null;
  keyId?: string | null;
  privateKey?: string | null;
  appleAudience?: string | null;
}

export interface Status {
  active?: boolean;
  inactive?: boolean;
}

export interface UpdateAuthenticationConfigurationRequest {
  itemId?: string | null;
  refreshTokenValidForNumberMinutes?: number;
  getNumberOfWrongAttemptsToLockTheAccount?: number;
  accountLockDurationInMinutes?: number;
  accessTokenValidForNumberMinutes?: number;
  rememberMeRefreshTokenValidForNumberMinutes?: number;
  allowedGrantTypes?: string[];
  projectKey?: string | null;
}

export interface UpdateHealthConfigurationRequest {
  projectKey?: string | null;
  name?: string | null;
  repoId?: string | null;
  repoName?: string | null;
  externalServiceId?: string | null;
  isActive?: boolean;
  intervalInSeconds?: number;
  gracePeriodInSeconds?: number;
  monitorSourceType?: string | null;
  emails?: string[];
  itemId?: string | null;
}

export interface UpdateMonitorConfigurationRequest {
  projectKey?: string | null;
  repoId?: string | null;
  repoName?: string | null;
  externalServiceId?: string | null;
  externalServiceName?: string | null;
  name?: string | null;
  url?: string | null;
  monitorType?: string | null;
  protocolType?: string | null;
  httpMethodType?: string | null;
  authorizationType?: string | null;
  intervalInSeconds?: number | null;
  timeoutInSeconds?: number | null;
  isActive?: boolean;
  monitorSourceType?: string | null;
  expectedContent?: string | null;
  customHttpHeaders?: string | null;
  customPayload?: string | null;
  successHttpResponseCodes?: string[];
  regions?: string[];
  emails?: string[];
  itemId?: string | null;
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
  projectKey?: string | null;
}

export interface UpdateRoleRequest {
  itemId?: string | null;
  name?: string | null;
  description?: string | null;
  projectKey?: string | null;
}

export interface UpdateSsoCredentialStatusRequest {
  itemId?: string | null;
  isEnabled?: boolean;
  projectKey?: string | null;
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
  projectKey?: string | null;
  memberships?: OrganizationMembership[];
}

export interface User {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  memberships?: OrganizationMembership[];
  active?: boolean;
  isVarified?: boolean;
  varifiedType?: UserVarifiedType;
  profileImageUrl?: string | null;
  profileImageId?: string | null;
  platform?: string | null;
  userCreationType?: UserCreationType;
  userPassType?: UserPassType;
  password?: string | null;
  passwordSetTime?: string;
  userMfaType?: UserMfaType;
  mfaEnabled?: boolean;
  firstLoggedInTime?: string;
  lastLoggedInTime?: string;
  lastLoggedInDeviceInfo?: string | null;
  logInCount?: number;
  allowedLogInType?: UserLogInType[];
  isDefault?: boolean;
  mailPurpose?: string | null;
  isMfaVerified?: boolean;
  externalUserId?: string | null;
  department?: string | null;
  employeeId?: string | null;
}

export type UserCreationType = 0 | 1 | 2 | 3 | 4 | 5;  // int enum — member names not published in swagger

export type UserLogInType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export type UserMfaType = 0 | 1 | 2 | 3 | 4;  // int enum — member names not published in swagger

export type UserPassType = 0 | 1 | 2;  // int enum — member names not published in swagger

export interface UserTimeline {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  currentData?: User;
  event?: string | null;
}

export type UserVarifiedType = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export interface ValidateActivationCodeRequest {
  activationCode?: string | null;
  projectKey?: string | null;
}

```
