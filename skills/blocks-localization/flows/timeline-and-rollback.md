# Audit localization changes and roll back mistakes

Use this to answer "who changed this translation and when?", to review what a bulk operation (SaveKeys, DeleteKeys, TranslateKeys) actually touched, and to revert a key to a previous state. Every key write is journaled with `previousData`/`currentData` snapshots; bulk calls share one `operationId`.

Preconditions: `x-blocks-key` + Bearer token; `projectKey`.

## Steps

1. **Project-wide overview:** `GET /Key/GetLocalizationTimeline?ProjectKey=<projectKey>&PageSize=20&PageNumber=1` ([endpoints.md#key](../endpoints.md#key)) — the timeline grouped by operation. Each entry carries `operationId`, `logFrom` (source of the change), `userName`/`userId`, `createDate`, `affectedKeysCount`, and a sample `previousData`/`currentData` pair.
   Useful filters: `UserId`, `LogFrom` / `LogFromValues` / `ExcludeLogFromValues` (e.g. to separate manual edits from machine translation — the exact `logFrom` string values aren't documented in swagger; read them off your own timeline first), `CreateDateRange.StartDate`/`EndDate`, `SortProperty` + `IsDescending`.

2. **Drill into one operation:** `GET /Key/GetTimelineByOperationId?OperationId=<operationId>&ProjectKey=<projectKey>&PageSize=50&PageNumber=1` — every key touched by that bulk save/delete/translate, each with full `previousData` → `currentData` diff material.

3. **History of one key:** `GET /Key/GetTimeline?EntityId=<keyItemId>&ProjectKey=<projectKey>&PageSize=20&PageNumber=1` — `EntityId` is the key's `itemId`. Returns `{ totalCount, timelines }`; each `KeyTimeline` entry has its own `itemId`, the `previousData`/`currentData` snapshots, `userName`, `operationId`, and `rollbackFrom` (set when an entry was itself produced by a rollback). Also filterable by `UserId` and `CreateDateRange`.

4. **Roll back:** `POST /Key/RollBack` — "reverts keys to a previous state":
   ```json
   { "itemId": "<id>", "projectKey": "<projectKey>" }
   ```
   Caution: swagger does not state whether `itemId` here is the **key's** `itemId` or the **timeline entry's** `itemId`. The presence of `rollbackFrom` on timeline entries suggests the timeline-entry id (i.e., "revert to the state captured by this entry"). Test on a throwaway key first: call RollBack with a timeline entry's `itemId` from step 3, then re-read the key. Response shape not documented in swagger.

Error paths: `401` → refresh token per blocks-setup. Empty timeline → wrong `ProjectKey`, or you're filtering too hard (drop `LogFrom`/date filters and retry).

## Verify

- After a rollback: `GET /Key/Get?ItemId=<keyItemId>&ProjectKey=<projectKey>` — `resources`/`keyName` match the intended previous state.
- `GET /Key/GetTimeline?EntityId=<keyItemId>&…` — a new top entry whose `rollbackFrom` is populated and whose `currentData` equals the restored state.
- If the rolled-back key feeds a live app, regenerate and re-fetch the language file ([language-files-and-webhook](language-files-and-webhook.md)).
