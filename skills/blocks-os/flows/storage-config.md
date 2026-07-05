# Register a storage backend for a project

Save, inspect, rotate, and remove the storage *configuration* a project uses — either a cloud object store (connection string / access keys) or an SFTP target.

Honest scope note: the os/v4 swagger exposes **backend configuration only**. File-level operations — presigned upload URLs, file get/download, file delete — are **not exposed in this swagger**. If you need the file API, inspect the network calls of a live Blocks app or OS portal; do not invent routes. This flow covers what is documented: pointing the platform at a storage backend.

Preconditions: `x-blocks-key` + bearer token; `projectKey` (projectKey = your Blocks Key — the same value as `x-blocks-key`; `$X_BLOCKS_KEY` in curl); credentials for the backend you're registering. Treat every field here as a server-side secret — never ship `connectionString`, `secretKey`, `accessKey`, or SFTP passwords to a browser.

## Steps

1. **`POST /api/Storage/Save`** — register the backend ([endpoints.md#storage](../endpoints.md#storage)). Common fields: `name`, `storageStrategy` (string naming the strategy — values not enumerated in swagger; check OS portal), `projectKey`, `updateRequest: false`. Then per backend type:
   - **Cloud**: `connectionString`, `accessKey`, `secretKey`, `cloudStorageRegionEndPoint`.
   - **SFTP**: `host`, `port`, `userName`, `password`, `remoteBasePath`.
   Response is `BaseMutationResponse` — keep `itemId` for updates.
2. **`GET /api/Storage/Get?ProjectKey=<key>&ConfigurationName=<name>`** — read one configuration back. The response includes the stored credential fields (`connectionString`, `secretKey`, `accessKey`, `password`, `sftpSecretKey`) — handle and log it accordingly.
3. **`GET /api/Storage/Gets?ProjectKey=<key>`** — list every configuration for the project. Response is a bare array of `StorageConfiguration` (no envelope).
4. **Rotate credentials: `POST /api/Storage/Save` with `updateRequest: true` and `itemId`** — resend the configuration with new keys. There is no separate Update endpoint; `updateRequest` is the switch (note: this controller calls it `updateRequest`, Notification calls it `isUpdateRequest` — copy per controller).
5. **`POST /api/Storage/Delete?ProjectKey=<key>&ConfigurationName=<name>`** — remove a configuration. Quirk: this is a **POST with query parameters and no body** — do not send JSON.

Error paths: `isSuccess: false` on Save/Delete → read `errors`; 401 → refresh token (blocks-setup). PascalCase query params (`ProjectKey`, `ConfigurationName`) are required verbatim.

## Verify

- `GET /api/Storage/Gets?ProjectKey=<key>` includes the configuration with the expected `name` and `storageStrategy`; it disappears after Delete.
- `GET /api/Storage/Get?ProjectKey=<key>&ConfigurationName=<name>` reflects rotated credentials after an `updateRequest: true` save.
- Functional check: perform a file operation through whatever consumes this configuration (your app's upload feature / OS portal) and confirm the object lands in the configured backend — the file API itself is not part of this swagger.
