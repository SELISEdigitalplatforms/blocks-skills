# Manage mail (SMTP) configurations

Use when creating, inspecting, duplicating, or deleting a project's mail server
configurations — the SMTP settings (host, port, SSL, sender identity, credentials) that
mail sending uses. CRUD for these is canonical here
([endpoints.md#mail](../endpoints.md#mail)); actually **sending** mail
(`/Mail/Send`) and mail templates (`/Template/*`) belong to the
`blocks-utilities` skill.

Preconditions: token + `x-blocks-key` (`blocks-setup`); SMTP credentials for the mail
provider you're configuring. `ProjectKey` in these endpoints = your Blocks Key (the
same value as `$X_BLOCKS_KEY`).

## Steps

1. `GET /Mail/Gets?ProjectKey=$X_BLOCKS_KEY` — list existing configurations first.
   Returns `MailServerConfiguration[]` — note this list shape is richer than the single
   `Get` shape: it includes `itemId`, `name`, `smtpClient` (int enum `0|1|2`, names
   unverified), `isDefault`, `useDefaultCredentials`, audit fields.

2. `POST /Mail/Save` — create or update a configuration.
   Body (`MailConfiguration`): `configurationName`, `host`, `port`, `enableSSL`,
   `senderName`, `senderAddress`, `senderUserName`, `accountPassword`, `projectKey`,
   `isInbound`, `provider` (int enum `0|1`, member names not published in swagger —
   verify which value means SMTP vs. any other provider on your project).
   Include `configurationId` to update an existing configuration; omit it when creating
   (create-vs-update dispatch on this field is the apparent design but is not documented
   in swagger — verify live). Response 200 has no documented schema — inspect the live
   response.

3. `GET /Mail/Get?ConfigurationName=<name>&ProjectKey=$X_BLOCKS_KEY` — read one
   configuration back. Note the asymmetry: `Get` selects by **ConfigurationName**, while
   `Delete`/`Duplicate` use **ConfigurationId**. Keep `configurationId` from this
   response for later steps. `accountPassword` appears in the schema — treat responses
   as sensitive and never log them.

4. Optional — `POST /Mail/Duplicate` with `{ configurationId, projectKey }` to clone
   a configuration (e.g., copy prod settings, then `Save` the copy with a different
   sender). Response shape not documented in swagger.

5. `DELETE /Mail/Delete?ConfigurationId=<id>&ProjectKey=$X_BLOCKS_KEY` — remove a
   configuration. Response shape not documented in swagger.

6. To use a configuration, send mail via `blocks-utilities`
   (`POST /Mail/Send` on the utilities service) referencing this configuration per
   that skill's docs.

Error paths:
- `401` → refresh the Bearer token (`blocks-setup`).
- Sent mail fails after `Save` → re-check `host`/`port`/`enableSSL` and credentials with
  `Get`; wrong `provider`/`smtpClient` enum values are a likely culprit since their
  meanings are unverified — test with a known-good SMTP account.
- Deleting the configuration referenced by active senders will break sending — list with
  `Gets` and check `isDefault` before deleting.

## Verify

- `GET /Mail/Gets?ProjectKey=$X_BLOCKS_KEY` includes the new/updated configuration with the
  expected `host`/`senderAddress` (and no longer includes deleted ones).
- End-to-end: send a test message via `blocks-utilities` `/Mail/Send` using this
  configuration and confirm delivery.
