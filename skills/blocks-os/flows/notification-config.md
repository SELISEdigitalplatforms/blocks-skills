# Configure project notifications

Create, list, update, and delete a project's notification configurations — the named settings that control how the platform delivers notifications (channel, receiver type, persistence).

Honest scope note: the os/v4 swagger exposes **configuration CRUD only**. There is no "send notification" or "subscribe" endpoint on this controller — delivery and subscription happen platform-side according to these configurations. For real-time client notification plumbing (Notifier) and outbound mail, see the **blocks-utilities** skill.

Preconditions: `x-blocks-key` + bearer token; `projectKey` (projectKey = your Blocks Key — the same value as `x-blocks-key`).

## Steps

1. **`POST /Notification/Save`** — create a configuration ([endpoints.md#notification](../endpoints.md#notification)). Body:
   - `name` — the configuration's identifier for humans and for later lookups.
   - `channelToNotify` — `0 | 1` (int enum, member names not in swagger).
   - `notificationType` — `0 | 1 | 2 | 3` (int enum, unverified meanings — observe existing configurations in step 2 to infer your project's values).
   - `notifyMethod` — a string naming the delivery method.
   - `enablePersistence` — whether notifications are stored.
   - `projectKey`, and `isUpdateRequest: false` for a create.
   Response is `BaseResponse` — no `itemId` is returned; find it via step 2.
2. **`GET /Notification/Gets?ProjectKey=<key>&Page=0&PageSize=20`** — list configurations (optionally `Sort.Property`, `Sort.IsDescending`, `Filter`). Response: `{ configurations: NotificationConfiguration[], totalCount, isSuccess, errors }`. Grab the `itemId` of the configuration you just saved.
3. **`GET /Notification/Get?ItemId=<id>&ProjectKey=<key>`** — read one configuration in full.
4. **Update: `POST /Notification/Save` with `isUpdateRequest: true`** — resend the full body with changed fields. There is no separate Update endpoint; `isUpdateRequest` is the switch.
5. **`DELETE /Notification/Delete?ItemId=<id>&ProjectKey=<key>`** — remove a configuration. Note this is a real `DELETE` verb with **query parameters** (unlike Secrets, which deletes via POST body).

Error paths: `isSuccess: false` → inspect `errors`; 401 → refresh token (blocks-setup). Query params are PascalCase (`ItemId`, `ProjectKey`, `Sort.Property`) — camelCasing them silently returns unfiltered/empty results.

## Verify

- `GET /Notification/Gets?ProjectKey=<key>` shows the configuration with the expected `name`, `channelToNotify`, `notificationType`, and `enablePersistence`; `totalCount` incremented after create and decremented after delete.
- `GET /Notification/Get?ItemId=<id>&ProjectKey=<key>` reflects updated fields after an `isUpdateRequest: true` save.
