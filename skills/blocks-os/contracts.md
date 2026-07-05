# blocks-os — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/os/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py os`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface AddAssetRequest {
  tenantGroupId?: string | null;
  resource?: Resource;
}

export interface ApiEndpointConfigFilter {
  resourceGroup?: string | null;
  method?: string | null;
  controller?: string | null;
}

export interface ApplicationContext {
  environment?: string | null;
  domain?: string | null;
  cookieDomain?: string | null;
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

export interface BlocksManagedService {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  tenantId?: string | null;
  description?: string | null;
  serviceId?: string | null;
  metadata?: Record<string, unknown>;
  serviceBusConnectionString?: string | null;
  serviceType?: string | null;
}

export interface BulkUpdateApiEndpointConfigRequest {
  itemIds?: string[];
  isCaptchaRequired?: boolean;
  isMfaRequired?: boolean;
  disableAll?: boolean;
}

export interface CaptchaConfiguration {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  captchaKey?: string | null;
  captchaSecret?: string | null;
  provider?: string | null;
  captchaGenerator?: string | null;
  isEnable?: boolean;
}

export type CloudConfigurationUserMfaType = 0 | 1 | 2;  // int enum — member names not published in swagger

export interface ConfirmInvitationRequest {
  code?: string | null;
}

export interface CreateCaptchaRequest {
  configurationName: string | null;
}

export interface CreateCaptchaRequestResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
  id?: string | null;
  captcha?: string | null;
}

export interface CreateProjectRequest {
  name?: string | null;
  isAcceptBlocksTerms?: boolean;
  isUseBlocksExclusively?: boolean;
  isProduction?: boolean;
  tenantGroupId?: string | null;
  resources?: Resource[];
  applicationContexts?: ApplicationContext[];
}

export interface CreateProjectResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  tenantGroupId?: string | null;
}

export interface DataCleanupRequest {
  projectKey?: string | null;
}

export interface DeleteSecretRequest {
  itemId?: string | null;
  projectKey?: string | null;
}

export interface DisableProjectRequest {
  projectKey?: string | null;
}

export interface DisableUserMfaRequest {
  userId?: string | null;
  projectKey?: string | null;
}

export interface EnviromentDetails {
  tenantId?: string | null;
  roles?: string[];
}

export interface GetAllServiceFilter {
  serviceId?: string | null;
  serviceName?: string | null;
}

export interface GetAllServiceRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: GetAllServiceFilter;
  projectKey?: string | null;
}

export interface GetAllServiceResponse {
  data?: BlocksManagedService[];
  errors?: Record<string, string>;
  totalCount?: number;
}

export interface GetApiEndpointConfigsRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: ApiEndpointConfigFilter;
}

export interface GetAssetResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  assets?: TenantAsset;
  totalCount?: number;
}

export interface GetCaptchaConfigurationsResponse {
  configurations?: CaptchaConfiguration[];
}

export interface GetMfaConfigurationResponse {
  enableMfa?: boolean;
  userMfaType?: CloudConfigurationUserMfaType[];
  mfaTemplate?: MfaTemplate;
}

export interface GetNotificationConfigurationsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  totalCount?: number;
  configurations?: NotificationConfiguration[];
}

export interface GetPeoples {
  peopleDetails?: PeopleDetails;
  sharedEnviroments?: SharedEnviroment[];
}

export interface GetPeoplesRequest {
  page?: number;
  pageSize?: number;
  sort?: BaseSortRequest;
  filter?: string | null;
  projectGroupId?: string | null;
  environmentIds?: string[];
  isInvitationConfirmed?: boolean | null;
}

export interface GetPeoplesResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  isOwner?: boolean;
  peoples?: GetPeoples[];
  totalCount?: number;
  peoplesTotalCount?: number;
}

export interface GetProjectResponse {
  data?: GetProjectResponseData;
  errors?: Record<string, string>;
}

export interface GetProjectResponseData {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  applicationDomain?: string | null;
  isProduction?: boolean;
  tenantId?: string | null;
  tenantGroupId?: string | null;
  isDomainVerified?: boolean;
  cookieDomain?: string | null;
  isCookieEnable?: boolean;
  environment?: string | null;
  isDisabled?: boolean;
  customDomain?: string | null;
  tenantSlug?: string | null;
}

export interface GetSecretsResponse {
  data?: Secret[];
  totalCount?: number;
}

export interface GetSubscriptionsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  subscriptions?: ResourceLimit[];
}

export interface GroupedProjectsDto {
  tenantGroupId?: string | null;
  projects?: Project[];
  isShared?: boolean;
  nonSharedProject?: Project[];
}

export interface InviteRequest {
  invitations?: Record<string, EnviromentDetails[]>;
  groupId: string | null;
}

export interface MfaTemplate {
  templateName?: string | null;
  templateId?: string | null;
}

export interface MigrationOtpGenerationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  verificationId?: string | null;
}

export interface MigrationOtpVerificationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  isValid?: boolean;
}

export interface MigrationRequest {
  projectKey: string | null;
  targetedProjectKey: string | null;
  tenantGroupId: string | null;
  services: ServiceDetails[];
}

export type MigrationServiceNames = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;  // int enum — member names not published in swagger

export interface MigrationVerifyOtpRequest {
  verificationId?: string | null;
  verificationCode?: string | null;
}

export interface NotificationConfiguration {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  channelToNotify?: NotifierTypes;
  notificationType?: NotificationReceiverTypes;
  notifyMethod?: string | null;
  enablePersistence?: boolean;
}

export type NotificationReceiverTypes = 0 | 1 | 2 | 3;  // int enum — member names not published in swagger

export type NotifierTypes = 0 | 1;  // int enum — member names not published in swagger

export interface OtpGenerationRequest {
  userId?: string | null;
  projectKey?: string | null;
  mfaType?: UserMfaType;
  sendPhoneNumberAsEmailDomain?: string | null;
}

export interface OtpGenerationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  mfaId?: string | null;
}

export interface OtpVerificationResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  isValid?: boolean;
  userId?: string | null;
}

export interface PeopleDetails {
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  userId?: string | null;
  allowResendActivation?: boolean;
}

export interface Project {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  applicationDomain?: string | null;
  isProduction?: boolean;
  tenantId?: string | null;
  tenantGroupId?: string | null;
  isDomainVerified?: boolean;
  cookieDomain?: string | null;
  isCookieEnable?: boolean;
  environment?: string | null;
  isDisabled?: boolean;
  customDomain?: string | null;
}

export interface RegisterServiceRequest {
  serviceName?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  projectKey?: string | null;
  serviceType?: string | null;
}

export interface RemoveAccessRequest {
  email?: string | null;
  projectKeys?: string[];
  groupId: string | null;
}

export interface ResendInvitationRequest {
  email?: string | null;
  groupId?: string | null;
}

export interface ResendOtpRequest {
  mfaId?: string | null;
  sendPhoneNumberAsEmailDomain?: string | null;
}

export interface Resource {
  resourceId?: string | null;
  name?: string | null;
  link?: string | null;
}

export interface ResourceLimit {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  resource?: string | null;
  resourceType?: string | null;
  limit?: number;
  usage?: number;
  lifetime?: string;
  isActive?: boolean;
  enableAutoRenew?: boolean;
  tenantId?: string | null;
  type?: string | null;
}

export interface RestoreProjectRequest {
  projectId?: string | null;
}

export interface RestoreProjectResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface SaveCaptchaConfigurationRequest {
  captchaKey?: string | null;
  captchaSecret?: string | null;
  provider?: string | null;
  captchaGenerator?: string | null;
  isEnable?: boolean;
  projectKey?: string | null;
}

export interface SaveMfaConfigurationRequest {
  enableMfa?: boolean;
  userMfaType?: CloudConfigurationUserMfaType[];
  mfaTemplate?: MfaTemplate;
  projectKey?: string | null;
}

export interface SaveNotificatonConfigurationRequest {
  name?: string | null;
  channelToNotify?: NotifierTypes;
  notificationType?: NotificationReceiverTypes;
  enablePersistence?: boolean;
  notifyMethod?: string | null;
  projectKey?: string | null;
  isUpdateRequest?: boolean;
}

export interface SaveSecretRequest {
  secretKey?: string | null;
  keyValuePairs?: Record<string, string>;
  itemId?: string | null;
  projectKey?: string | null;
}

export interface SaveStorageConfigurationRequest {
  name?: string | null;
  connectionString?: string | null;
  secretKey?: string | null;
  accessKey?: string | null;
  storageStrategy?: string | null;
  cloudStorageRegionEndPoint?: string | null;
  projectKey?: string | null;
  updateRequest?: boolean;
  itemId?: string | null;
  host?: string | null;
  port?: string | null;
  userName?: string | null;
  password?: string | null;
  remoteBasePath?: string | null;
}

export interface SaveThirdPartyJWTClaimsRequest {
  itemId?: string | null;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  userName?: string | null;
  roles?: string | null;
}

export interface SaveThirdPartyJWTClaimsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
}

export interface Secret {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  secretKey?: string | null;
  keyValuePairs?: Record<string, string>;
  keyPairs?: Record<string, unknown>;
}

export interface ServiceDetails {
  shouldOverWriteExistingData?: boolean;
  serviceName: MigrationServiceNames;
}

export interface SetUpUserTotpResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  qrImageUrl?: string | null;
  qrCode?: string | null;
}

export interface SharedEnviroment {
  itemId?: string | null;
  tenantId?: string | null;
  isInvitationSent?: boolean;
  isInvitationConfirmed?: boolean;
  isCreator?: boolean;
  enviroment?: string | null;
}

export interface SignupRequest {
  email?: string | null;
  captchaCode?: string | null;
}

export interface StorageConfiguration {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  name?: string | null;
  connectionString?: string | null;
  secretKey?: string | null;
  accessKey?: string | null;
  storageStrategy?: string | null;
  cloudStorageRegionEndPoint?: string | null;
  host?: string | null;
  port?: string | null;
  userName?: string | null;
  password?: string | null;
  remoteBasePath?: string | null;
  sftpSecretKey?: string | null;
}

export interface SubmitCaptchaRequest {
  id?: string | null;
  value?: string | null;
}

export interface SubmitCaptchaRequestResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
  verificationCode?: string | null;
}

export interface TenantAsset {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  tenantGroupId?: string | null;
  resources?: Resource[];
}

export interface ThirdPartyJWTClaims {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationId?: string | null;
  tags?: string[];
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  userName?: string | null;
  roles?: string | null;
}

export interface TransferOwnershipRequest {
  tenantGroupId?: string | null;
  transferToUserEmail?: string | null;
}

export interface UpdateApiEndpointConfigRequest {
  itemId?: string | null;
  isCaptchaRequired?: boolean;
  isMfaRequired?: boolean;
}

export interface UpdateCaptchaConfigurationStatusRequest {
  itemId?: string | null;
  isEnable?: boolean;
  projectKey?: string | null;
}

export interface UpdateProjectRequest {
  customDomain?: string | null;
  applicationDomain?: string | null;
  projectKey?: string | null;
}

export interface UpdateTenantGroupRequest {
  tenantGroupId?: string | null;
  name?: string | null;
}

export interface UpdateTokenValidationParametersRequest {
  providerName?: string | null;
  publicCertificatePassword?: string | null;
  issuer?: string | null;
  audiences?: string[];
  publicCertificatePath?: string | null;
  jwksUrl?: string | null;
  cookieKey?: string | null;
  projectKey?: string | null;
}

export type UserMfaType = 0 | 1 | 2 | 3 | 4;  // int enum — member names not published in swagger

export interface VerifyCaptchaRequestResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  itemId?: string | null;
  verified?: boolean;
  hostName?: string | null;
}

export interface VerifyOtpRequest {
  verificationCode?: string | null;
  mfaId?: string | null;
  authType?: UserMfaType;
  projectKey?: string | null;
  isFromTokenCall?: boolean;
}

```
