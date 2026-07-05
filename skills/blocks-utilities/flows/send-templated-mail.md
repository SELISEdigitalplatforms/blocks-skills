# Send templated transactional mail

Use for sending transactional email (welcome mails, password-reset style notices, receipts) and managing the EmailTemplate documents behind them. Requires `x-blocks-key` + Bearer token, and a mail configuration set up for the project (SMTP/provider settings are configured in the OS portal — not exposed in this service's v4 swagger).

Endpoint reference: [endpoints.md#mail](../endpoints.md#mail), [endpoints.md#template](../endpoints.md#template).

**Ownership split — read this first:**
- Mail **sending** (`/Mail/Send`, `/Mail/SendToAny`) and mailbox reads (`/Mail/GetMailBoxMail(s)`) are canonical **here** in blocks-utilities.
- Mail-**template** CRUD at `/Mail/Save|Get|Gets|Delete|Duplicate` is canonical in the **blocks-logic** skill — those routes are not in this service's swagger.
- The `/Template/*` controller **here** is a separate EmailTemplate store (`name`, `templateSubject`, `templateBody`, `jsonContent`, `mailConfigurationId`, `language`).

## Manage templates (`/Template/*`)

1. `POST /Template/Save` — create or update. Key fields: `name`, `templateSubject`, `templateBody` (HTML), `jsonContent` (editor state, if you use a visual builder), `language`, `mailConfigurationId`, `projectKey` (projectKey = your Blocks Key, the same value as `X_BLOCKS_KEY`). Omit `itemId` to create; pass an existing `itemId` to update. Response shape not documented in swagger — inspect the live response (expect a BaseResponse-style envelope; grab the created id from it or re-query).
2. `GET /Template/Gets?ProjectKey=$X_BLOCKS_KEY&PageNumber=0&PageSize=20` — list; supports `SearchKey`, `SortProperty` + `IsDescending`, and filters `MailConfigurationId`, `Language`. Response: `{ totalCount, templates: EmailTemplate[] }`.
3. `GET /Template/Get?ItemId=<id>&ProjectKey=$X_BLOCKS_KEY` — full template incl. `templateBody`.
4. `POST /Template/Clone` — duplicate a template (e.g. per language): `itemId` (source), new `name`, `language`, `templateSubject`, `mailConfigurationId`, `projectKey`. Response not documented in swagger.
5. `DELETE /Template/Delete?ItemId=<id>&ProjectKey=$X_BLOCKS_KEY` — remove. Response not documented in swagger.

Placeholders: templates are filled at send time from `subjectDataContext`/`bodyDataContext` string maps. The placeholder syntax inside `templateBody` is not documented in swagger — check an existing template in your project for the expected token format.

## Send mail

`POST /Mail/Send` — the standard transactional send:

- `to` / `cc` / `bcc` / `replyTo`: arrays of addresses.
- `purpose`: selects which configured template/mail-purpose to send. The resolution of `purpose` → template is not documented in swagger; it matches the mail purpose configured for your project's mail configuration — verify against your project setup.
- `language`: picks the language variant of the template.
- `subjectDataContext` / `bodyDataContext`: `{ [placeholder]: value }` string maps merged into the template.
- `attachments`: `string[]` — likely file references (Storage file IDs from blocks-os), but the expected value format is not documented in swagger; verify with a test send.
- `sendPhoneNumberAsEmail`, `projectKey`.

`POST /Mail/SendToAny` — identical shape plus `isTestMail`. The naming suggests `Send` targets known/registered recipients while `SendToAny` allows arbitrary external addresses, but swagger does not document the distinction — verify against your project. Use `isTestMail: true` for smoke tests.

Both send endpoints have **no response schema in swagger** — inspect the live response; at minimum expect the usual `isSuccess`/`errors` envelope, but do not rely on that shape untested.

## Verify

- `GET /Mail/GetMailBoxMails?ProjectKey=$X_BLOCKS_KEY&PageNumber=0&PageSize=10` — the project mailbox/outbox; filter by `Status`, `SearchText`, `SendDateRange.StartDate`/`EndDate`, `IsInbound`. Response shape not documented in swagger — inspect live. Your sent message should appear here.
- `GET /Mail/GetMailBoxMail?ProjectKey=$X_BLOCKS_KEY&MessageId=<id>` — single message detail (shape undocumented — inspect live).
- Check the recipient inbox for a test send (`SendToAny` with `isTestMail: true`) and confirm placeholders were replaced — unreplaced tokens mean the key in `bodyDataContext` doesn't match the template's placeholder name.
- Template edits: `GET /Template/Get` after `Save` to confirm `templateBody`/`lastUpdatedDate` changed.
