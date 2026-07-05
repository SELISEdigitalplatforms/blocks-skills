# blocks-utilities — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/utilities/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py utilities`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface BaseResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
}

export interface CloneTemplateRequest {
  itemId?: string | null;
  mailConfigurationId?: string | null;
  language?: string | null;
  name?: string | null;
  templateSubject?: string | null;
  projectKey?: string | null;
}

export interface Coordinate {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  pageNumber?: number;
}

export interface CreateFromHtmlCommand {
  htmlFileId?: string | null;
  footerHtmlFileId?: string | null;
  headerHtmlFileId?: string | null;
  directoryId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  footerHeight?: number;
  headerHeight?: number;
  firstPageHeaderFileId?: string | null;
  firstPageFooterFileId?: string | null;
  isPageNumberEnabled?: boolean;
  isTotalPageCountEnabled?: boolean;
  useFormatting?: boolean;
  engine?: number;
  profile?: string | null;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasFirstPageHeader?: boolean;
  hasFirstPageFooter?: boolean;
  openInBrowser?: boolean;
  pageNumberText?: string | null;
}

export interface CreateFromHtmlUsingTECommand {
  htmlFileId?: string | null;
  footerHtmlFileId?: string | null;
  headerHtmlFileId?: string | null;
  directoryId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  footerHeight?: number;
  headerHeight?: number;
  firstPageHeaderFileId?: string | null;
  firstPageFooterFileId?: string | null;
  isPageNumberEnabled?: boolean;
  isTotalPageCountEnabled?: boolean;
  useFormatting?: boolean;
  engine?: number;
  profile?: string | null;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasFirstPageHeader?: boolean;
  hasFirstPageFooter?: boolean;
  openInBrowser?: boolean;
  pageNumberText?: string | null;
  templateFileId?: string | null;
  filteredSqlQueryDatas?: GetFilteredSqlQueryData[];
  metaDataList?: PdfMetaData[];
}

export interface CreateFromHtmlUsingTEForBulkCommand {
  htmlFileId?: string | null;
  footerHtmlFileId?: string | null;
  headerHtmlFileId?: string | null;
  directoryId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  footerHeight?: number;
  headerHeight?: number;
  firstPageHeaderFileId?: string | null;
  firstPageFooterFileId?: string | null;
  isPageNumberEnabled?: boolean;
  isTotalPageCountEnabled?: boolean;
  useFormatting?: boolean;
  engine?: number;
  profile?: string | null;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasFirstPageHeader?: boolean;
  hasFirstPageFooter?: boolean;
  openInBrowser?: boolean;
  pageNumberText?: string | null;
  templateFileId?: string | null;
  filteredSqlQueryDatas?: GetFilteredSqlQueryData[];
  metaDataList?: PdfMetaData[];
  fileNameExtension?: string | null;
}

export interface CreateMagicLinkRequest {
  type?: MagicLinkType;
  name?: string | null;
  uri?: string | null;
  uriOnForbidden?: string | null;
  requestMethod?: string | null;
  requestPayload?: string | null;
  requestHeaders?: string | null;
  requestEncodedQueryString?: string | null;
  redirectUrl?: string | null;
  usageLimit?: number;
  expiryLifeSpan?: number;
  requestByUserId?: string | null;
  userCanLogin?: boolean;
  clientCredential?: string | null;
  linkBasedActionConfigId?: string | null;
  persistent?: boolean;
  projectKey?: string | null;
}

export interface CreateMagicLinkResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  linkId?: string | null;
  shortUri?: string | null;
  type?: string | null;
  errorMessage?: string | null;
}

export interface CreateMagicLinksRequest {
  requests?: CreateMagicLinkRequest[];
  projectKey?: string | null;
}

export interface CreateMagicLinksResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  links?: MagicLinkResult[];
  totalSuccessCount?: number;
  errorMessage?: string | null;
}

export interface CreatePdfsFromHtmlRequest {
  projectKey?: string | null;
  messageCoRelationId?: string | null;
  eventReferenceData?: Record<string, string>;
  createFromHtmlCommands?: CreateFromHtmlCommand[];
  engine?: number | null;
}

export interface CreatePdfsFromHtmlResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  messageCoRelationId?: string | null;
  message?: string | null;
}

export interface CreatePdfsFromHtmlUsingTEBulkRequest {
  projectKey?: string | null;
  messageCoRelationId?: string | null;
  eventReferenceData?: Record<string, string>;
  createFromHtmlCommands?: CreateFromHtmlUsingTEForBulkCommand[];
  raiseEventOnProcessEnding?: boolean;
  notifyOnProcessEnding?: boolean;
  engine?: number | null;
}

export interface CreatePdfsFromHtmlUsingTEBulkResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  messageCoRelationId?: string | null;
  message?: string | null;
}

export interface CreatePdfsFromHtmlUsingTERequest {
  projectKey?: string | null;
  messageCoRelationId?: string | null;
  eventReferenceData?: Record<string, string>;
  createFromHtmlCommands?: CreateFromHtmlUsingTECommand[];
  engine?: number | null;
}

export interface CreatePdfsFromHtmlUsingTEResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  messageCoRelationId?: string | null;
  message?: string | null;
}

export interface EmailTemplate {
  itemId?: string | null;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string | null;
  language?: string | null;
  lastUpdatedBy?: string | null;
  organizationIds?: string[];
  tags?: string[];
  mailConfigurationId?: string | null;
  templateBody?: string | null;
  jsonContent?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  name?: string | null;
  templateSubject?: string | null;
  generatedBy?: string | null;
}

export interface FixPdfCommand {
  originalPdfId?: string | null;
  outputPdfId?: string | null;
}

export interface FixPdfsRequest {
  projectKey?: string | null;
  messageCorrelationId?: string | null;
  pdfInfos?: FixPdfCommand[];
}

export interface FixPdfsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  messageCorrelationId?: string | null;
  message?: string | null;
}

export interface GetAllTemplatesResponse {
  totalCount?: number;
  templates?: EmailTemplate[];
}

export interface GetFilteredSqlQueryData {
  entityName?: string | null;
  filterQuery?: string | null;
  filterParameters?: Record<string, unknown>;
}

export interface GetLinkBasedActionConfigResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  config?: LinkBasedActionConfig;
  errorMessage?: string | null;
}

export interface GetMagicLinkResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  data?: MagicLinkDto;
  errorMessage?: string | null;
}

export interface GetMagicLinksResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  data?: MagicLinkDto[];
  totalCount?: number;
  errorMessage?: string | null;
}

export interface GetNotificationsResponse {
  notifications?: OfflineNotification[];
  unReadNotificationsCount?: number;
  totalNotificationsCount?: number;
}

export interface GetUnreadNotificationsRequestBySubscriptionFilter {
  userId?: string | null;
  subscriptionFilterData?: SubscriptionFilter;
  orderBy?: OfflineNotificationOrder;
}

export interface IpLookup {
  startIp?: string | null;
  lastIp?: string | null;
  startIpNumber?: number;
  lastIpNumber?: number;
  locationCode?: string | null;
  locationCodeAsRegistered?: string | null;
  continentCode?: string | null;
  countryCode?: string | null;
  continentName?: string | null;
  countryName?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number;
  longitude?: number;
  countryFlagSvgUrl?: string | null;
  countryFlagPngUrl?: string | null;
  ispName?: string | null;
}

export interface LinkBasedActionConfig {
  itemId?: string | null;
  contextName?: string | null;
  shortUrlBase?: string | null;
  projectKey?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface LocateIpResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  ipLookups?: IpLookup[];
  errorMessage?: string | null;
}

export interface MagicLinkDto {
  itemId?: string | null;
  type?: string | null;
  name?: string | null;
  uri?: string | null;
  uriOnForbidden?: string | null;
  requestMethod?: string | null;
  requestPayload?: string | null;
  requestHeaders?: string | null;
  requestEncodedQueryString?: string | null;
  redirectUrl?: string | null;
  usageLimit?: number;
  usageCount?: number;
  expiryLifeSpan?: number;
  expiryDate?: string | null;
  isExpired?: boolean;
  expiredReason?: string | null;
  projectKey?: string | null;
  shortUri?: string | null;
  requestByUserId?: string | null;
  userCanLogin?: boolean;
  clientCredential?: string | null;
  linkBasedActionConfigId?: string | null;
  language?: string | null;
  origin?: string | null;
  persistent?: boolean;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  status?: string | null;
}

export interface MagicLinkResult {
  id?: string | null;
  shortUri?: string | null;
  type?: string | null;
  isSuccess?: boolean;
  errorMessage?: string | null;
}

export type MagicLinkType = 0 | 1;  // int enum — member names not published in swagger

export interface MarkNotificationAsReadRequest {
  id: string | null;
}

export interface MergePdfsRequest {
  projectKey?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  messageCoRelationId?: string | null;
  engine?: number | null;
  pdfFilesToBeMerged?: PdfFileToBeMerged[];
  eventReferenceData?: Record<string, string>;
  openInBrowser?: boolean;
  handleCorruptedPdf?: boolean;
}

export interface MergePdfsResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  outputPdfFileId?: string | null;
  message?: string | null;
}

export interface NotifyRequest {
  connectionId?: string | null;
  userIds?: string[];
  roles?: string[];
  subscriptionFilters?: SubscriptionFilter[];
  denormalizedPayload?: string | null;
  saveDenormalizedPayloadAsAnObject?: boolean;
  responseKey?: string | null;
  responseValue?: string | null;
  contentAvailable?: boolean;
  configuratoinName?: string | null;
}

export interface OfflineNotification {
  id?: string | null;
  correlationId?: string | null;
  payload?: PayloadData;
  denormalizedPayload?: unknown | null;
  createdTime?: string;
  readByUserIds?: string[];
  readByRoles?: string[];
  isRead?: boolean;
}

export type OfflineNotificationOrder = 1 | 2;  // int enum — member names not published in swagger

export interface PayloadData {
  userId?: string | null;
  subscriptionFilters?: SubscriptionFilter[];
  notificationType?: string | null;
  responseKey?: string | null;
  responseValue?: string | null;
}

export interface PdfFileToBeMerged {
  order?: number;
  pdfFileId?: string | null;
}

export interface PdfMetaData {
  key?: string | null;
  value?: unknown | null;
}

export interface RemoveMagicLinksRequest {
  linkIds?: string[];
  projectKey?: string | null;
}

export interface RemoveMagicLinksResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  removedCount?: number;
  errorMessage?: string | null;
}

export interface ResetSequenceNumberRequest {
  context: string | null;
  value?: number;
  projectKey?: string | null;
}

export interface SaveLinkBasedActionConfigRequest {
  contextName?: string | null;
  shortUrlBase?: string | null;
  projectKey?: string | null;
}

export interface SaveLinkBasedActionConfigResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  configId?: string | null;
  wasCreated?: boolean;
  config?: LinkBasedActionConfig;
  errorMessage?: string | null;
}

export interface SendMail {
  subjectDataContext?: Record<string, string>;
  to?: string[];
  bcc?: string[];
  cc?: string[];
  purpose?: string | null;
  language?: string | null;
  replyTo?: string[];
  attachments?: string[];
  bodyDataContext?: Record<string, string>;
  sendPhoneNumberAsEmail?: boolean;
  projectKey?: string | null;
}

export interface SendMailToAny {
  subjectDataContext?: Record<string, string>;
  to?: string[];
  bcc?: string[];
  cc?: string[];
  purpose?: string | null;
  language?: string | null;
  replyTo?: string[];
  attachments?: string[];
  bodyDataContext?: Record<string, string>;
  sendPhoneNumberAsEmail?: boolean;
  isTestMail?: boolean | null;
  projectKey?: string | null;
}

export interface SequenceNumberHexQueryResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  context?: string | null;
  currentNumber?: string | null;
}

export interface SequenceNumberQueryResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  context?: string | null;
  currentNumber?: number;
}

export interface Stamp {
  coordinates?: Coordinate[];
  imageFileId?: string | null;
}

export interface StampImageToPdfRequest {
  projectKey?: string | null;
  pdfFileId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  messageCoRelationId?: string | null;
  stamps?: Stamp[];
  engine?: number | null;
  eventReferenceData?: Record<string, string>;
  openInBrowser?: boolean;
}

export interface StampImageToPdfResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  outputPdfFileId?: string | null;
  message?: string | null;
}

export interface StampInfo {
  coordinates?: Coordinate[];
  type?: number;
  imageFileId?: string | null;
  text?: string | null;
  fontName?: string | null;
}

export interface StampIntoPdfRequest {
  projectKey?: string | null;
  pdfFileId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  messageCoRelationId?: string | null;
  stamps?: StampInfo[];
  engine?: number | null;
  eventReferenceData?: Record<string, string>;
  openInBrowser?: boolean;
}

export interface StampIntoPdfResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  outputPdfFileId?: string | null;
  message?: string | null;
}

export interface StampText {
  coordinates?: Coordinate[];
  text?: string | null;
  fontName?: string | null;
}

export interface StampTextToPdfRequest {
  projectKey?: string | null;
  pdfFileId?: string | null;
  outputPdfFileId?: string | null;
  outputPdfFileName?: string | null;
  messageCoRelationId?: string | null;
  stamps?: StampText[];
  engine?: number | null;
  eventReferenceData?: Record<string, string>;
  openInBrowser?: boolean;
}

export interface StampTextToPdfResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  outputPdfFileId?: string | null;
  message?: string | null;
}

export interface SubscriptionFilter {
  context?: string | null;
  actionName?: string | null;
  value?: string | null;
}

export interface Template {
  itemId?: string | null;
  mailConfigurationId?: string | null;
  templateBody?: string | null;
  jsonContent?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  language?: string | null;
  name?: string | null;
  templateSubject?: string | null;
  projectKey?: string | null;
}

```
