# Create and invoke a magic link

Use when you need a shareable short URL that either redirects the recipient (Redirect type) or executes a stored HTTP call when opened (Action type — e.g. "confirm subscription", "approve request", one-click actions from email). Creating/managing links requires `x-blocks-key` + Bearer token; invoking the link is public — the recipient just opens the URL.

Endpoint reference: [endpoints.md#magiclink](../endpoints.md#magiclink).

## Steps

1. *(once per project, optional but recommended)* `POST /api/MagicLink/SaveConfig` — set up the link-based action config: `contextName`, `shortUrlBase` (e.g. `https://short.example.com/`), `projectKey`. Response returns `configId` and `wasCreated`. Keep `configId` if you want to pin links to it via `linkBasedActionConfigId`.
   - Check what exists first with `GET /api/MagicLink/GetConfig?ProjectKey=<key>` — `config` is null when nothing is configured yet.

2. `POST /api/MagicLink/CreateLink` — create the link. Key fields:
   - `type`: `0` = Redirect, `1` = Action (documented in the endpoint description).
   - `uri`: for Redirect, the target URL; for Action, the API endpoint to call on invoke.
   - Redirect-only: `uriOnForbidden` (geo-restricted fallback redirect).
   - Action-only: `requestMethod` (`GET`/`POST`/`PUT`/`DELETE`), `requestPayload` (JSON **string**), `requestHeaders` (JSON **string**), `redirectUrl` (where to send the browser after the action runs).
   - Limits: `usageLimit` (0 = unlimited), `expiryLifeSpan` in **milliseconds** (0 = never expires), `persistent` for permanent links.
   - `projectKey`: always pass your project key.
   - Keep from the response: `linkId` and `shortUri` (the shareable URL). Check `isSuccess`; on failure read `errorMessage`/`errors`.

3. Deliver the link. `shortUri` is what you hand to the recipient (email, QR code, SMS). The underlying invocation endpoint is `GET /api/MagicLink/Invoke/{linkId}` (optionally `?projectKey=...&subscriptionFilterId=...`).

4. Recipient opens the link → `GET /api/MagicLink/Invoke/{linkId}`:
   - Redirect type: validates + tracks usage, returns **302** to `uri`.
   - Action type: queues the stored HTTP call for background processing, returns **302** to `redirectUrl` if set, else **200** with a success message (no schema documented in swagger — inspect the live response before relying on its shape).
   - **404** = link doesn't exist; **410 Gone** = expired or usage limit exceeded. Handle both in whatever page the short URL domain serves.

Bulk variant: `POST /api/MagicLink/CreateLinks` with `requests: CreateMagicLinkRequest[]` and a default `projectKey`. Response gives per-link results (`links[].id`, `links[].shortUri`, `links[].isSuccess`, `links[].errorMessage`) plus `totalSuccessCount` — check each entry, a 200 with `isSuccess: true` at the top can still contain individual failures.

Revoke: `POST /api/MagicLink/RemoveLinks` with `linkIds: string[]` + `projectKey`. Response `removedCount` tells you how many were disabled. Removed links report status `ManuallyDisabled`.

## Verify

- `GET /api/MagicLink/GetLink?ItemId=<linkId>&ProjectKey=<key>` — confirm `data.status` is `Active`, and after an invoke check `data.usageCount` incremented.
- `GET /api/MagicLink/GetLinks?ProjectKey=<key>&PageSize=10&PageNumber=0` — administrative listing; filter with `Type` (`Redirect`/`Action`), `Status` (`Active`, `TimeExpired`, `UsageLimitExceeded`, `ManuallyDisabled`), `SearchText` (matches Name and Uri), `RequestMethod`, or `ExpiryDateRange.StartDate`/`EndDate`.
- Open `shortUri` in a browser: Redirect links should land on `uri`; expired/removed links should return 410.
