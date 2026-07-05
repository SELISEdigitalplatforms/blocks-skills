---
name: blocks-utilities
description: "Use this skill for any task involving the SELISE Blocks utilities service — magic links (short URLs, one-click action links, link-based login), PDF generation (HTML to PDF, template-engine PDFs, bulk PDF jobs, merge, stamp text/images, fix corrupted PDFs), transactional email sending (Mail/Send, SendToAny, mailbox reads), email template management (Template CRUD), sequence numbers for document numbering (invoice numbers, order numbers), IP geolocation, and in-app notifications (Notifier). Trigger when the user mentions magic link, short link, deep link, PDF export, invoice PDF, merge PDFs, watermark/stamp PDF, send email, transactional mail, email template, sequence/auto-increment number, geolocate IP, or notifications on SELISE Blocks. Note: the upstream swagger for this service is mislabeled 'Blocks IDP API' — it is the utilities service, not identity."
---

# Blocks Utilities

The utilities service (`https://api.seliseblocks.com/utilities/v4`) is the SELISE Blocks utility belt: magic links, PDF generation and manipulation, transactional mail sending, email templates, sequence numbers, IP geolocation, and offline notifications. Reach for it whenever an app needs a cross-cutting capability that isn't identity, data, or business logic.

> **Naming quirk:** the upstream swagger document for this service carries the title "Blocks IDP API". That title is wrong upstream — this is the **utilities** service. Application authentication lives in `blocks-iam`; do not look for login endpoints here.

## Prerequisites

- Environment + tokens: see the **blocks-setup** skill (`BLOCKS_API_URL`, `X_BLOCKS_KEY`, `BLOCKS_USERNAME`/`BLOCKS_PASSWORD`, obtaining/refreshing a Bearer token).
- Every request needs `x-blocks-key: <X_BLOCKS_KEY>`; authenticated operations also need `Authorization: Bearer <access_token>`. `MagicLink/Invoke/{linkId}` is designed to be hit publicly by link recipients.
- PDF flows reference files by **file ID** — HTML sources and output PDFs live in Storage, which is owned by the **blocks-os** skill. Upload inputs there first.

## What's where

| I need to… | Go to |
|---|---|
| Create a short/redirect or action link | [flows/magic-links.md](flows/magic-links.md), [endpoints.md#magiclink](endpoints.md#magiclink) |
| Let a recipient trigger an API call from a link | [flows/magic-links.md](flows/magic-links.md) (Action type) |
| Turn HTML into a PDF (single, templated, or bulk) | [flows/generate-pdfs.md](flows/generate-pdfs.md), [endpoints.md#pdfgenerator](endpoints.md#pdfgenerator) |
| Merge PDFs, stamp text/images, fix a corrupted PDF | [flows/merge-stamp-pdfs.md](flows/merge-stamp-pdfs.md) |
| Send a transactional email | [flows/send-templated-mail.md](flows/send-templated-mail.md), [endpoints.md#mail](endpoints.md#mail) |
| Create/edit email templates via API | [flows/send-templated-mail.md](flows/send-templated-mail.md), [endpoints.md#template](endpoints.md#template) |
| Mail-template CRUD via `/api/Mail/Save\|Get\|Gets\|Delete\|Duplicate` | **blocks-logic** skill (canonical home for those routes) |
| Get the next invoice/order/document number | [flows/sequence-numbers.md](flows/sequence-numbers.md), [endpoints.md#sequence](endpoints.md#sequence) |
| Geolocate the current visitor or specific IPs | [endpoints.md#geolocation](endpoints.md#geolocation) |
| Push or read in-app notifications | [endpoints.md#notifier](endpoints.md#notifier) |
| Upload HTML/images, download generated PDFs | **blocks-os** skill (Storage) |
| Log in, refresh tokens | **blocks-iam** / **blocks-setup** skills |

## Key concepts

- **Magic link** — a short URL (`shortUri`) that either redirects (`type: 0` Redirect) or executes a stored HTTP call (`type: 1` Action) when invoked. Links track usage (`usageCount` vs `usageLimit`), can expire (`expiryLifeSpan` in milliseconds), and report a computed `status`: `Active`, `TimeExpired`, `UsageLimitExceeded`, or `ManuallyDisabled`.
- **LinkBasedActionConfig** — per-project magic-link configuration (`contextName`, `shortUrlBase`). Save once via `POST /api/MagicLink/SaveConfig` before generating branded short URLs.
- **PDF engine** — numeric selector on PdfGenerator requests. Per the swagger docs: `1` = PuppeteerSharp (default for HTML→PDF, best modern CSS/JS), `2` = PdfSharpCore (free; merge/stamp only — returns null for HTML→PDF), `3` = Aspose, `4` = WkHtmlToPdf (deprecated). Merge and stamp need `2` or `3`; engine `1` returns null there.
- **Template engine PDFs** — `CreatePdfsFromHtmlUsingTemplateEngine*` fill an HTML template (`templateFileId`) with data from `filteredSqlQueryDatas` (entity + filter query) and `metaDataList` key/values before rendering.
- **EmailTemplate** — a stored template document (`name`, `templateSubject`, `templateBody`, `jsonContent`, `language`, `mailConfigurationId`) managed via `/api/Template/*` here.
- **SendMail purpose** — `POST /api/Mail/Send` and `SendToAny` take a `purpose` string plus `subjectDataContext`/`bodyDataContext` placeholder maps. How `purpose` resolves to a configured template is not documented in swagger — it matches the mail purpose configured for your project (OS portal mail settings); verify against your project.
- **Sequence** — a named, monotonically increasing counter identified by a free-form `context` string (e.g. `"invoice"`). `Next` returns decimal, `NextHex` hexadecimal; `Reset` restarts a context at a chosen value.
- **Offline notification** — a stored notification targeted at `userIds`, `roles`, or `subscriptionFilters` (context/actionName/value triples), pushed via `POST /api/Notifier/Notify` and read via `GetNotifications`.

## Flows

| Flow | Use when |
|---|---|
| [flows/magic-links.md](flows/magic-links.md) | Creating, invoking, listing, and revoking redirect or action links |
| [flows/generate-pdfs.md](flows/generate-pdfs.md) | Generating PDFs from raw HTML or a data-driven template, one-off or bulk |
| [flows/merge-stamp-pdfs.md](flows/merge-stamp-pdfs.md) | Combining PDFs, stamping text/images (signatures, watermarks), fixing corrupted files |
| [flows/send-templated-mail.md](flows/send-templated-mail.md) | Managing email templates and sending transactional mail |
| [flows/sequence-numbers.md](flows/sequence-numbers.md) | Gap-tolerant document numbering (invoices, orders, tickets) |

## Conventions & gotchas

- **Headers:** `x-blocks-key` on every call; `Authorization: Bearer <token>` for everything except public link invocation. 401 → refresh via blocks-setup.
- **Envelope:** most responses are `BaseResponse`-shaped (`isSuccess`, `errors`) plus endpoint-specific fields; many add `errorMessage`. Always check `isSuccess` — HTTP 200 does not mean the operation succeeded.
- **`projectKey` everywhere:** nearly every request accepts `projectKey` (query param `ProjectKey` on GETs). projectKey = your Blocks Key — pass the same value as `X_BLOCKS_KEY` explicitly for predictable multi-tenant behavior.
- **Pagination:** MagicLink and Mail lists use `PageNumber` (0-based) + `PageSize`; Notifier uses `Page` + `PageSize`; Template uses `PageNumber` + `PageSize` with `SortProperty`/`IsDescending`. Responses carry `totalCount` (or `totalNotificationsCount`).
- **PDF generation is asynchronous:** `CreatePdfsFromHtml*` return only `messageCoRelationId` + `message` — never the PDF bytes. You supply `outputPdfFileId`; fetch the finished file from Storage (blocks-os) under that ID. The exact completion signal is not documented in swagger — bulk requests expose `raiseEventOnProcessEnding`/`notifyOnProcessEnding`; otherwise poll Storage.
- **Undocumented responses:** `Mail/Send`, `Mail/SendToAny`, `Mail/GetMailBoxMail(s)`, `Template/Save`, `Template/Clone`, `Template/Delete`, and `MagicLink/Invoke` have **no response schema in swagger** — inspect the live response before relying on its shape.
- **Integer enums are unnamed** in swagger (`MagicLinkType 0|1`, `OfflineNotificationOrder 1|2`, stamp `type`). MagicLink's endpoint description does document `0=Redirect, 1=Action` and StampIntoPdf documents `0=Image, 1=Text`; treat the rest as unverified numeric unions from contracts.md.
- **GET with a body:** `GET /api/Notifier/GetUnreadNotificationsBySubscriptionFilter` declares a JSON request body on a GET — many HTTP clients can't send that. Verify behavior against the live API.
- **Verbatim typo:** `NotifyRequest.configuratoinName` is spelled that way in the swagger — send it as-is.
- **Ownership split for mail:** mail *sending* and mailbox reads are canonical here; mail-template CRUD at `/api/Mail/Save|Get|Gets|Delete|Duplicate` is canonical in **blocks-logic**. The `/api/Template/*` controller here is a separate EmailTemplate store.

## Files

- [endpoints.md](endpoints.md) — every endpoint with exact params and shapes (generated from swagger)
- [contracts.md](contracts.md) — TypeScript types (generated)
- [flows/](flows/) — step-by-step multi-endpoint procedures
- [references/react.md](references/react.md) — React 19 integration guide
