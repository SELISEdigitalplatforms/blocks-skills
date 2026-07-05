# Query logs and live-tail a service

Use when debugging a Blocks-hosted service: pull recent log entries, narrow by level or trace, do a
free-text search, or watch new entries arrive in near-real time.

Preconditions: `x-blocks-key` header on every call; `Authorization: Bearer <access_token>`
(see blocks-setup). You need the target `serviceName` — valid values are not published in swagger;
use the service names shown in your project's OS portal observability view (or the names that
appear in trace analytics, see `flows/inspect-traces.md`) and verify live.

Base URL: `https://api.seliseblocks.com/monitor/v4`

## Steps

1. `POST /Log/GetLogsByDate` — primary query endpoint (the only Log endpoint with a documented
   response envelope: `{ data, errors, totalCount }`; the per-entry shape inside `data` is untyped
   in swagger — inspect the live response). See [endpoints.md#log](../endpoints.md#log). Body:

   ```json
   {
     "serviceName": "<service>",            // REQUIRED
     "projectKey": "<X_BLOCKS_KEY>",       // projectKey = your Blocks Key (x-blocks-key value)
     "page": 0,
     "pageSize": 50,
     "sort": { "property": "<field>", "isDescending": true },
     "filter": {
       "startDate": "2026-07-05T00:00:00Z",
       "endDate": "2026-07-05T12:00:00Z",
       "level": "Error",                     // level string values not documented — verify live
       "traceId": null,
       "spanId": null
     },
     "search": "timeout"
   }
   ```

   Keep from the response: `totalCount` (for paging) and whatever timestamp/trace fields the live
   entries expose (you will need the timestamp field for the live tail cursor, and `traceId` for
   correlation).

2. Optional — `POST /Log/GetLogs` — identical request shape (`GetLogsRequest` in contracts.md);
   response has **no schema documented in swagger**. Prefer `GetLogsByDate` unless you observe a
   behavioral difference live.

3. Narrow to one request: re-run step 1 with `filter.traceId` (and optionally `filter.spanId`) set
   to the id you got from a trace or an error log entry. This is the log↔trace join — see
   `flows/inspect-traces.md`.

4. Live tail — poll `GET /Log/Live`:

   ```
   GET /Log/Live?Name=<service>&LastDate=<ISO-8601>&ProjectKey=<X_BLOCKS_KEY>
   ```

   - `Name` is **required**; `LastDate` and `ProjectKey` are optional query params (PascalCase —
     exact casing matters).
   - Response shape not documented in swagger — inspect the live response before relying on it.
   - Polling pattern: first call with `LastDate` = a moment ago (or omit it and see what the live
     response returns); on each subsequent call pass the newest entry timestamp you have seen as
     `LastDate`, so you only receive entries after the cursor. Poll every 3–5 s. This is plain
     HTTP polling — swagger documents no websocket/SSE channel for logs.

Error paths: `401` → refresh the token per blocks-setup. Empty `data` with `isSuccess`-style errors
map: check `errors` in the envelope; a wrong `serviceName` typically yields an empty result rather
than a 404 — verify the name against OS portal.

## Verify

- Step 1 returns `totalCount > 0` and entries whose timestamps fall inside your
  `startDate`/`endDate` window.
- For the live tail: trigger an action in your app (or hit any endpoint of the target service) and
  confirm a new entry appears on the next poll with a timestamp later than your `LastDate` cursor.
