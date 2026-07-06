# blocks-utilities — API Endpoints

> Generated from `https://api.seliseblocks.com/utilities/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py utilities`.

**Base URL:** `https://api.seliseblocks.com/utilities/v4`

**URL pattern:** every endpoint is `{base}/{endpoint}` — do **not** prefix with `/api/`. e.g. `POST {base}/MagicLink/CreateLink`, `POST {base}/Mail/SendToAny`. The `/api/` from the swagger `basePath` is not part of the URL served by the gateway.

**Authentication** (see `blocks-setup` skill for obtaining tokens):
- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request
- `Authorization: Bearer <access_token>` — required for authenticated operations

**35 endpoints** across 7 controllers.

## Contents

- [Geolocation](#geolocation) (2)
- [MagicLink](#magiclink) (8)
- [Mail](#mail) (4)
- [Notifier](#notifier) (5)
- [PdfGenerator](#pdfgenerator) (8)
- [Sequence](#sequence) (3)
- [Template](#template) (5)

## Geolocation

### `GET /Geolocation/Locate`

Locate IP addresses from the current request context.

Automatically extracts and locates IP addresses from the current HTTP request context.
This is useful for getting geolocation information of the current visitor without
explicitly specifying IP addresses.

The endpoint extracts IP addresses from:
- X-Forwarded-For header (for requests through proxies/load balancers)
- Direct connection remote IP address

Parameters:
- UseCustomProvider: Whether to use custom IP lookup provider

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `UseCustomProvider` | query | boolean | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  ipLookups?: {
    startIp?: string | null
    lastIp?: string | null
    startIpNumber?: number
    lastIpNumber?: number
    locationCode?: string | null
    locationCodeAsRegistered?: string | null
    continentCode?: string | null
    countryCode?: string | null
    continentName?: string | null
    countryName?: string | null
    city?: string | null
    region?: string | null
    latitude?: number
    longitude?: number
    countryFlagSvgUrl?: string | null
    countryFlagPngUrl?: string | null
    ispName?: string | null
  }[]
  errorMessage?: string | null
}
```

### `GET /Geolocation/LocateIp`

Request to get IP addresses location information.

Retrieves geolocation information for the specified IP addresses.
Supports bulk lookup of multiple IP addresses (maximum 10 per request).

Parameters:
- IpAddresses: Collection of IP addresses to locate
- UseCustomProvider: Whether to use custom IP lookup provider

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `IpAddresses` | query | array | no |  |
| `UseCustomProvider` | query | boolean | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  ipLookups?: {
    startIp?: string | null
    lastIp?: string | null
    startIpNumber?: number
    lastIpNumber?: number
    locationCode?: string | null
    locationCodeAsRegistered?: string | null
    continentCode?: string | null
    countryCode?: string | null
    continentName?: string | null
    countryName?: string | null
    city?: string | null
    region?: string | null
    latitude?: number
    longitude?: number
    countryFlagSvgUrl?: string | null
    countryFlagPngUrl?: string | null
    ispName?: string | null
  }[]
  errorMessage?: string | null
}
```

## MagicLink

### `POST /MagicLink/CreateLink`

Creates a single magic link.

Creates a magic link that can be either:
- Redirect type: Simple URL shortening with redirect functionality
- Action type: Maps to an HTTP action that is executed when the link is invoked

Request parameters:
- Type: MagicLinkType.Redirect (0) or MagicLinkType.Action (1)
- Uri: Target URL (redirect URL for Redirect type, API endpoint for Action type)
- Name: Optional friendly name for the link
- UriOnForbidden: Geo-restricted redirect URL (Redirect type only)
- RequestMethod: HTTP method for Action type (GET, POST, PUT, DELETE)
- RequestPayload: JSON string payload for Action type POST/PUT requests
- RequestHeaders: JSON string of headers for Action type
- RedirectUrl: URL to redirect after action is performed (Action type only)
- UsageLimit: Maximum number of times the link can be used (0 = unlimited)
- ExpiryLifeSpan: Link expiration in milliseconds (0 = no expiration)
- Persistent: Whether the link should be permanent
- ProjectKey: Project/tenant key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  type?: 0 | 1 (int enum)
  name?: string | null
  uri?: string | null
  uriOnForbidden?: string | null
  requestMethod?: string | null
  requestPayload?: string | null
  requestHeaders?: string | null
  requestEncodedQueryString?: string | null
  redirectUrl?: string | null
  usageLimit?: number
  expiryLifeSpan?: number
  requestByUserId?: string | null
  userCanLogin?: boolean
  clientCredential?: string | null
  linkBasedActionConfigId?: string | null
  persistent?: boolean
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  linkId?: string | null
  shortUri?: string | null
  type?: string | null
  errorMessage?: string | null
}
```

### `POST /MagicLink/CreateLinks`

Creates multiple magic links in bulk.

Generates multiple magic links in a single request.
Each link can be either Redirect or Action type.

Request parameters:
- Requests: Array of CreateMagicLinkRequest objects
- ProjectKey: Default project key for all links (can be overridden per link)

**Request body** (`application/json`):

```ts
{
  requests?: {
    type?: 0 | 1 (int enum)
    name?: string | null
    uri?: string | null
    uriOnForbidden?: string | null
    requestMethod?: string | null
    requestPayload?: string | null
    requestHeaders?: string | null
    requestEncodedQueryString?: string | null
    redirectUrl?: string | null
    usageLimit?: number
    expiryLifeSpan?: number
    requestByUserId?: string | null
    userCanLogin?: boolean
    clientCredential?: string | null
    linkBasedActionConfigId?: string | null
    persistent?: boolean
    projectKey?: string | null
  }[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  links?: {
    id?: string | null
    shortUri?: string | null
    type?: string | null
    isSuccess?: boolean
    errorMessage?: string | null
  }[]
  totalSuccessCount?: number
  errorMessage?: string | null
}
```

### `GET /MagicLink/GetConfig`

Gets the LinkBasedActionConfig for a project.

Retrieves the configuration for link-based actions for the specified project.
Returns null if no configuration exists.

Parameters:
- ProjectKey: The project/tenant identifier

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  config?: {
    itemId?: string | null
    contextName?: string | null
    shortUrlBase?: string | null
    projectKey?: string | null
    createdAt?: string (date-time)
    updatedAt?: string (date-time) | null
  }
  errorMessage?: string | null
}
```

### `GET /MagicLink/GetLink`

Get a single magic link by ID.

Retrieves a specific magic link by its ID.
The response includes the computed status of the link:
- Active: Link is functional and not expired
- TimeExpired: Link has passed its expiry date
- UsageLimitExceeded: Link usage limit has been reached
- ManuallyDisabled: Link was manually disabled

Parameters:
- ItemId: The unique identifier of the link
- ProjectKey: The project/tenant identifier

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: {
    itemId?: string | null
    type?: string | null
    name?: string | null
    uri?: string | null
    uriOnForbidden?: string | null
    requestMethod?: string | null
    requestPayload?: string | null
    requestHeaders?: string | null
    requestEncodedQueryString?: string | null
    redirectUrl?: string | null
    usageLimit?: number
    usageCount?: number
    expiryLifeSpan?: number
    expiryDate?: string (date-time) | null
    isExpired?: boolean
    expiredReason?: string | null
    projectKey?: string | null
    shortUri?: string | null
    requestByUserId?: string | null
    userCanLogin?: boolean
    clientCredential?: string | null
    linkBasedActionConfigId?: string | null
    language?: string | null
    origin?: string | null
    persistent?: boolean
    createdAt?: string (date-time)
    createdBy?: string | null
    updatedAt?: string (date-time) | null
    status?: string | null
  }
  errorMessage?: string | null
}
```

### `GET /MagicLink/GetLinks`

Get a paginated list of magic links for a project.

Retrieves multiple magic links for administrative purposes, supporting pagination.

Parameters:
- PageSize: Number of items per page (default: 10)
- PageNumber: Page index starting from 0 (default: 0)
- ProjectKey: The project/tenant identifier
- Type: Optional filter by link type (Action or Redirect)
- SearchText: Optional search text (searches Name and Uri)
- Status: Optional filter by status (Active, TimeExpired, UsageLimitExceeded, ManuallyDisabled)
- RequestMethod: Optional filter by RequestMethod (for Action type)
- ExpiryDateRange: Optional filter by expiry date range

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageSize` | query | integer (int32) | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `ProjectKey` | query | string | no |  |
| `Type` | query | string | no |  |
| `SearchText` | query | string | no |  |
| `Status` | query | string | no |  |
| `RequestMethod` | query | string | no |  |
| `ExpiryDateRange.StartDate` | query | string (date-time) | no |  |
| `ExpiryDateRange.EndDate` | query | string (date-time) | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  data?: {
    itemId?: string | null
    type?: string | null
    name?: string | null
    uri?: string | null
    uriOnForbidden?: string | null
    requestMethod?: string | null
    requestPayload?: string | null
    requestHeaders?: string | null
    requestEncodedQueryString?: string | null
    redirectUrl?: string | null
    usageLimit?: number
    usageCount?: number
    expiryLifeSpan?: number
    expiryDate?: string (date-time) | null
    isExpired?: boolean
    expiredReason?: string | null
    projectKey?: string | null
    shortUri?: string | null
    requestByUserId?: string | null
    userCanLogin?: boolean
    clientCredential?: string | null
    linkBasedActionConfigId?: string | null
    language?: string | null
    origin?: string | null
    persistent?: boolean
    createdAt?: string (date-time)
    createdBy?: string | null
    updatedAt?: string (date-time) | null
    status?: string | null
  }[]
  totalCount?: number
  errorMessage?: string | null
}
```

### `GET /MagicLink/Invoke/{linkId}`

Invoke a magic link (public endpoint for direct link access).

This endpoint provides the invocation functionality for both link types:

For Redirect type:
- Validates the link exists and is not expired
- Sends usage tracking event (async)
- Returns HTTP redirect to the target URL

For Action type:
- Validates the link exists and is not expired
- Queues the action for background processing
- Returns redirect to post-action URL if configured, or success response

URL Format: /MagicLink/Invoke/{linkId}

The endpoint will return:
- 302 Redirect for Redirect type
- 302 Redirect to post-action URL for Action type (if configured)
- 200 OK with success message for Action type (if no redirect URL)
- 404 Not Found if the link doesn't exist
- 410 Gone if the link is expired or limit exceeded

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `linkId` | path | string | yes | The link ID from the URL path |
| `projectKey` | query | string | no | Optional project key from query string |
| `subscriptionFilterId` | query | string | no | Optional subscription filter ID for notifications |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /MagicLink/RemoveLinks`

Removes multiple magic links by their IDs.

Disables the specified links, making them no longer accessible.
The links are removed from the cache and marked as disabled in the database.

Request parameters:
- LinkIds: Array of link IDs to remove
- ProjectKey: Project/tenant key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  linkIds?: string[]
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  removedCount?: number
  errorMessage?: string | null
}
```

### `POST /MagicLink/SaveConfig`

Saves (creates or updates) a LinkBasedActionConfig for a project.

This endpoint creates or updates the configuration for link-based actions.
If no configuration exists for the project, a new one is created.
If a configuration already exists, it is updated with the new values.

Request parameters:
- ContextName: Context name for the configuration
- ShortUrlBase: Base URL for generating short URLs (e.g., https://short.example.com/)
- ProjectKey: Project/tenant key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  contextName?: string | null
  shortUrlBase?: string | null
  projectKey?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  configId?: string | null
  wasCreated?: boolean
  config?: {
    itemId?: string | null
    contextName?: string | null
    shortUrlBase?: string | null
    projectKey?: string | null
    createdAt?: string (date-time)
    updatedAt?: string (date-time) | null
  }
  errorMessage?: string | null
}
```

## Mail

### `GET /Mail/GetMailBoxMail`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `MessageId` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Mail/GetMailBoxMails`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ProjectKey` | query | string | no |  |
| `PageNumber` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Status` | query | string | no |  |
| `SearchText` | query | string | no |  |
| `SendDateRange.StartDate` | query | string | no |  |
| `SendDateRange.EndDate` | query | string | no |  |
| `IsInbound` | query | boolean | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Mail/Send`

**Request body** (`application/json`):

```ts
{
  subjectDataContext?: { [key: string]: string }
  to?: string[]
  bcc?: string[]
  cc?: string[]
  purpose?: string | null
  language?: string | null
  replyTo?: string[]
  attachments?: string[]
  bodyDataContext?: { [key: string]: string }
  sendPhoneNumberAsEmail?: boolean
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `POST /Mail/SendToAny`

**Request body** (`application/json`):

```ts
{
  subjectDataContext?: { [key: string]: string }
  to?: string[]
  bcc?: string[]
  cc?: string[]
  purpose?: string | null
  language?: string | null
  replyTo?: string[]
  attachments?: string[]
  bodyDataContext?: { [key: string]: string }
  sendPhoneNumberAsEmail?: boolean
  isTestMail?: boolean | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

## Notifier

### `GET /Notifier/GetNotifications`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `IsUnreadOnly` | query | boolean | no |  |
| `Page` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `Sort.Property` | query | string | no |  |
| `Sort.IsDescending` | query | boolean | no |  |
| `Filter` | query | string | no |  |

**Response 200:**

```ts
{
  notifications?: {
    id?: string | null
    correlationId?: string | null
    payload?: {
      userId?: string | null
      subscriptionFilters?: {
        context?: string | null
        actionName?: string | null
        value?: string | null
      }[]
      notificationType?: string | null
      responseKey?: string | null
      responseValue?: string | null
    }
    denormalizedPayload?: unknown | null
    createdTime?: string (date-time)
    readByUserIds?: string[]
    readByRoles?: string[]
    isRead?: boolean
  }[]
  unReadNotificationsCount?: number
  totalNotificationsCount?: number
}
```

### `GET /Notifier/GetUnreadNotificationsBySubscriptionFilter`

**Request body** (`application/json`):

```ts
{
  userId?: string | null
  subscriptionFilterData?: {
    context?: string | null
    actionName?: string | null
    value?: string | null
  }
  orderBy?: 1 | 2 (int enum)
}
```

**Response 200:**

```ts
{
  id?: string | null
  correlationId?: string | null
  payload?: {
    userId?: string | null
    subscriptionFilters?: {
      context?: string | null
      actionName?: string | null
      value?: string | null
    }[]
    notificationType?: string | null
    responseKey?: string | null
    responseValue?: string | null
  }
  denormalizedPayload?: unknown | null
  createdTime?: string (date-time)
  readByUserIds?: string[]
  readByRoles?: string[]
  isRead?: boolean
}[]
```

### `POST /Notifier/MarkAllNotificationAsRead`

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /Notifier/MarkNotificationAsRead`

**Request body** (`application/json`):

```ts
{
  id: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

### `POST /Notifier/Notify`

**Request body** (`application/json`):

```ts
{
  connectionId?: string | null
  userIds?: string[]
  roles?: string[]
  subscriptionFilters?: {
    context?: string | null
    actionName?: string | null
    value?: string | null
  }[]
  denormalizedPayload?: string | null
  saveDenormalizedPayloadAsAnObject?: boolean
  responseKey?: string | null
  responseValue?: string | null
  contentAvailable?: boolean
  configuratoinName?: string | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
}
```

## PdfGenerator

### `POST /PdfGenerator/CreatePdfsFromHtml`

Export a webpage to PDF

<param name="request"></param> Request parameters:
            
            MessageCoRelationId: Unique identifier for specific request
            EventReferenceData: Set of values stored on data fields related to a specific event
            CreateFromHtmlCommands: Create PDF file from an HTML file
            Engine: PDF engine to use. 1=PuppeteerSharp (default, best for modern CSS/JS), 3=Aspose, 4=WkHtmlToPdf (deprecated). Engine 2 (PdfSharpCore) returns null.
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  messageCoRelationId?: string | null
  eventReferenceData?: { [key: string]: string }
  createFromHtmlCommands?: {
    htmlFileId?: string | null
    footerHtmlFileId?: string | null
    headerHtmlFileId?: string | null
    directoryId?: string | null
    outputPdfFileId?: string | null
    outputPdfFileName?: string | null
    footerHeight?: number
    headerHeight?: number
    firstPageHeaderFileId?: string | null
    firstPageFooterFileId?: string | null
    isPageNumberEnabled?: boolean
    isTotalPageCountEnabled?: boolean
    useFormatting?: boolean
    engine?: number
    profile?: string | null
    hasHeader?: boolean
    hasFooter?: boolean
    hasFirstPageHeader?: boolean
    hasFirstPageFooter?: boolean
    openInBrowser?: boolean
    pageNumberText?: string | null
  }[]
  engine?: number | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  messageCoRelationId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/CreatePdfsFromHtmlUsingTemplateEngine`

Export a webpage to PDF using template engine

<param name="request"></param> Request parameters:
            
            MessageCoRelationId: Unique identifier for specific request
            EventReferenceData: Set of values stored on data fields related to a specific event
            CreateFromHtmlCommands: Create PDF file from an HTML template
            Engine: PDF engine to use. 1=PuppeteerSharp (default, best for modern CSS/JS), 3=Aspose, 4=WkHtmlToPdf (deprecated). Engine 2 (PdfSharpCore) returns null.
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  messageCoRelationId?: string | null
  eventReferenceData?: { [key: string]: string }
  createFromHtmlCommands?: {
    htmlFileId?: string | null
    footerHtmlFileId?: string | null
    headerHtmlFileId?: string | null
    directoryId?: string | null
    outputPdfFileId?: string | null
    outputPdfFileName?: string | null
    footerHeight?: number
    headerHeight?: number
    firstPageHeaderFileId?: string | null
    firstPageFooterFileId?: string | null
    isPageNumberEnabled?: boolean
    isTotalPageCountEnabled?: boolean
    useFormatting?: boolean
    engine?: number
    profile?: string | null
    hasHeader?: boolean
    hasFooter?: boolean
    hasFirstPageHeader?: boolean
    hasFirstPageFooter?: boolean
    openInBrowser?: boolean
    pageNumberText?: string | null
    templateFileId?: string | null
    filteredSqlQueryDatas?: {
      entityName?: string | null
      filterQuery?: string | null
      filterParameters?: object
    }[]
    metaDataList?: {
      key?: string | null
      value?: unknown | null
    }[]
  }[]
  engine?: number | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  messageCoRelationId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/CreatePdfsFromHtmlUsingTemplateEngineBulk`

Export multiple webpages to PDF using template engine in bulk

<param name="request"></param> Bulk request with multiple payloads
            
            MessageCoRelationId: Unique identifier for specific request
            CreateFromHtmlCommands: Create PDF files from HTML templates
            RaiseEventOnProcessEnding: Whether to raise event when processing completes
            NotifyOnProcessEnding: Whether to notify when processing completes
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  messageCoRelationId?: string | null
  eventReferenceData?: { [key: string]: string }
  createFromHtmlCommands?: {
    htmlFileId?: string | null
    footerHtmlFileId?: string | null
    headerHtmlFileId?: string | null
    directoryId?: string | null
    outputPdfFileId?: string | null
    outputPdfFileName?: string | null
    footerHeight?: number
    headerHeight?: number
    firstPageHeaderFileId?: string | null
    firstPageFooterFileId?: string | null
    isPageNumberEnabled?: boolean
    isTotalPageCountEnabled?: boolean
    useFormatting?: boolean
    engine?: number
    profile?: string | null
    hasHeader?: boolean
    hasFooter?: boolean
    hasFirstPageHeader?: boolean
    hasFirstPageFooter?: boolean
    openInBrowser?: boolean
    pageNumberText?: string | null
    templateFileId?: string | null
    filteredSqlQueryDatas?: {
      entityName?: string | null
      filterQuery?: string | null
      filterParameters?: object
    }[]
    metaDataList?: {
      key?: string | null
      value?: unknown | null
    }[]
    fileNameExtension?: string | null
  }[]
  raiseEventOnProcessEnding?: boolean
  notifyOnProcessEnding?: boolean
  engine?: number | null
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  messageCoRelationId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/FixPdfs`

Fixes existing pdf files

<param name="request"></param> Request parameters:
            
            MessageCorrelationId: Unique identifier for specific request
            PdfInfos: Set of values indicating the original pdf files to be fixed and the output file to be generated
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  messageCorrelationId?: string | null
  pdfInfos?: {
    originalPdfId?: string | null
    outputPdfId?: string | null
  }[]
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  messageCorrelationId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/MergePdfs`

Merge multiple PDFs into single PDF file

<param name="request"></param> Request parameters:
            
            OutputPdfFileId: PDF file ID of the new PDF file
            OutputPdfFileName: Name of the new PDF file
            MessageCoRelationId: Unique identifier for specific request
            Engine: PDF engine to use. 2=PdfSharpCore (free), 3=Aspose. Engine 1 (PuppeteerSharp) returns null (no merge support).
            PdfFilesToBeMerged: List of PDF files to be merged
            OpenInBrowser: Download Url directly opens the pdf in the browser instead of downloading
            HandleCorruptedPdf: If the pdf is corrupted it is resaved then further processing is done
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  outputPdfFileId?: string | null
  outputPdfFileName?: string | null
  messageCoRelationId?: string | null
  engine?: number | null
  pdfFilesToBeMerged?: {
    order?: number
    pdfFileId?: string | null
  }[]
  eventReferenceData?: { [key: string]: string }
  openInBrowser?: boolean
  handleCorruptedPdf?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  outputPdfFileId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/StampImageToPdf`

Add an image within PDF file

<param name="request"></param> Request parameters:
            
            PdfFileId: File ID of PDF
            OutputPdfFileId: File ID of the generated PDF after image has been added
            OutputPdfFileName: Name of the updated PDF file
            MessageCoRelationId: Unique identifier for specific request
            Stamps: List of all images added to PDF
            Engine: PDF engine to use. 2=PdfSharpCore (free), 3=Aspose. Engines 1 and 4 return null (no stamp support).
            EventReferenceData: Set of values stored on data fields related to a specific event
            OpenInBrowser: Download Url directly opens the pdf in the browser instead of downloading
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  pdfFileId?: string | null
  outputPdfFileId?: string | null
  outputPdfFileName?: string | null
  messageCoRelationId?: string | null
  stamps?: {
    coordinates?: {
      x?: number
      y?: number
      width?: number
      height?: number
      pageNumber?: number
    }[]
    imageFileId?: string | null
  }[]
  engine?: number | null
  eventReferenceData?: { [key: string]: string }
  openInBrowser?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  outputPdfFileId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/StampIntoPdf`

Add both images and text stamps to PDF file

<param name="request"></param> Request parameters:
            
            PdfFileId: File ID of PDF
            OutputPdfFileId: File ID of the generated PDF
            Stamps: List of stamps (Type: 0=Image, 1=Text)
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  pdfFileId?: string | null
  outputPdfFileId?: string | null
  outputPdfFileName?: string | null
  messageCoRelationId?: string | null
  stamps?: {
    coordinates?: {
      x?: number
      y?: number
      width?: number
      height?: number
      pageNumber?: number
    }[]
    type?: number
    imageFileId?: string | null
    text?: string | null
    fontName?: string | null
  }[]
  engine?: number | null
  eventReferenceData?: { [key: string]: string }
  openInBrowser?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  outputPdfFileId?: string | null
  message?: string | null
}
```

### `POST /PdfGenerator/StampTextToPdf`

Add text stamps to PDF file

<param name="request"></param> Request parameters:
            
            PdfFileId: File ID of PDF
            OutputPdfFileId: File ID of the generated PDF after text has been added
            Stamps: List of all text stamps with coordinates and font information
            ProjectKey: Project key for multi-tenancy

**Request body** (`application/json`):

```ts
{
  projectKey?: string | null
  pdfFileId?: string | null
  outputPdfFileId?: string | null
  outputPdfFileName?: string | null
  messageCoRelationId?: string | null
  stamps?: {
    coordinates?: {
      x?: number
      y?: number
      width?: number
      height?: number
      pageNumber?: number
    }[]
    text?: string | null
    fontName?: string | null
  }[]
  engine?: number | null
  eventReferenceData?: { [key: string]: string }
  openInBrowser?: boolean
}
```

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  outputPdfFileId?: string | null
  message?: string | null
}
```

## Sequence

### `GET /Sequence/Next`

Query request to get the next number in sequence.

<param name="query"></param> List of recipients and additional information:
            
            command. Context: Context for the query request.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Context` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  context?: string | null
  currentNumber?: number
}
```

### `GET /Sequence/NextHex`

Query request to get 63 billion unique sequence of numbers in hexadecimal format

<param name="query"></param> List of recipients and additional information:
            
            command. Context: Context for the query request.

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `Context` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:**

```ts
{
  errors?: { [key: string]: string }
  isSuccess?: boolean
  context?: string | null
  currentNumber?: string | null
}
```

### `POST /Sequence/Reset`

Reset the sequence. Sequence will begin again from a user-specified number.

<param name="request"></param> List of recipients and additional information:
            
            command. Context: Context for the query request.
            
            command. Value: Specify the starting number for sequence once it is reset.

**Request body** (`application/json`):

```ts
{
  context: string | null
  value?: number
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

## Template

### `POST /Template/Clone`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  mailConfigurationId?: string | null
  language?: string | null
  name?: string | null
  templateSubject?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `DELETE /Template/Delete`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `ItemId` | query | string | no |  |
| `ProjectKey` | query | string | no |  |

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.

### `GET /Template/Get`

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
  mailConfigurationId?: string | null
  templateBody?: string | null
  jsonContent?: string | null
  imageId?: string | null
  imageUrl?: string | null
  name?: string | null
  templateSubject?: string | null
  generatedBy?: string | null
}
```

### `GET /Template/Gets`

| Param | In | Type | Required | Description |
|---|---|---|---|---|
| `PageNumber` | query | integer (int32) | no |  |
| `PageSize` | query | integer (int32) | no |  |
| `ProjectKey` | query | string | no |  |
| `SearchKey` | query | string | no |  |
| `SortProperty` | query | string | no |  |
| `IsDescending` | query | boolean | no |  |
| `MailConfigurationId` | query | string | no |  |
| `Language` | query | string | no |  |

**Response 200:**

```ts
{
  totalCount?: number
  templates?: {
    itemId?: string | null
    createdDate?: string (date-time)
    lastUpdatedDate?: string (date-time)
    createdBy?: string | null
    language?: string | null
    lastUpdatedBy?: string | null
    organizationIds?: string[]
    tags?: string[]
    mailConfigurationId?: string | null
    templateBody?: string | null
    jsonContent?: string | null
    imageId?: string | null
    imageUrl?: string | null
    name?: string | null
    templateSubject?: string | null
    generatedBy?: string | null
  }[]
}
```

### `POST /Template/Save`

**Request body** (`application/json`):

```ts
{
  itemId?: string | null
  mailConfigurationId?: string | null
  templateBody?: string | null
  jsonContent?: string | null
  imageId?: string | null
  imageUrl?: string | null
  language?: string | null
  name?: string | null
  templateSubject?: string | null
  projectKey?: string | null
}
```

**Response 200:** OK — no schema documented in swagger; verify the live response before relying on its shape.
