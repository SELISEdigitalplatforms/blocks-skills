# Inspect traces for a request

Use when a request failed or is slow and you need the distributed trace: find candidate traces in a
time window, open one trace's spans, correlate with logs, and pull service/operation analytics.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup). All four Trace endpoints have **no
response schema documented in swagger** — inspect live responses before building on their shape.

Base URL: `https://api.seliseblocks.com/monitor/v4`

## Steps

1. `POST /api/Trace/GetTraces` — search for traces. See [endpoints.md#trace](../endpoints.md#trace).
   Body (`GetTracesRequest` in contracts.md):

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",       // projectKey = your Blocks Key (x-blocks-key value)
     "page": 0,
     "pageSize": 20,
     "sort": { "property": "<field>", "isDescending": true },
     "filter": {
       "startDate": "2026-07-05T10:00:00Z",
       "endDate": "2026-07-05T11:00:00Z",
       "services": ["<serviceName>"],
       "excepts": [],
       "statusCodes": [500]
     },
     "search": "/api/orders"
   }
   ```

   - `filter.statusCodes` is `number[]` — filter to `[500]` (or `[499, 500, 502, ...]`) to surface
     failures.
   - `filter.excepts` is `string[]`; its exact semantics (likely service exclusion) are not
     documented — verify live.
   - Keep from the response: the trace id of the request you care about (field name must be
     confirmed from the live response — no schema in swagger).

2. `GET /api/Trace/GetTrace?TraceId=<id>&ProjectKey=<X_BLOCKS_KEY>` — fetch the full trace.
   `TraceId` is **required** and PascalCase in the query string. Expect span-level detail
   (services, operations, timings) — response shape not documented in swagger; inspect it live.

3. Correlate with logs: run `POST /api/Log/GetLogsByDate` with `filter.traceId` set to the same id
   (and `filter.spanId` for a single span) to see the log lines emitted during that request. Full
   procedure: `flows/query-logs-and-live-tail.md`.

4. Zoom out — service-level analytics. `POST /api/Trace/GetServiceAnalytics` (contracts.md:
   `GetHttpStatusAnalyticsRequest`):

   ```json
   {
     "startTime": "2026-07-05T00:00:00Z",   // REQUIRED
     "endTime": "2026-07-05T12:00:00Z",     // REQUIRED
     "serviceName": null,                    // optional — omit/null for all services
     "projectKey": "<X_BLOCKS_KEY>"
   }
   ```

   The contracts name suggests HTTP-status-oriented aggregates; response undocumented — verify
   live. Calling it without `serviceName` is also a practical way to discover the service names
   that logs/traces are recorded under.

5. Zoom in — per-operation analytics. `POST /api/Trace/GetOperationalAnalytics` (contracts.md:
   `GetApiAnalyticsRequest`):

   ```json
   {
     "startTime": "2026-07-05T00:00:00Z",   // REQUIRED
     "endTime": "2026-07-05T12:00:00Z",     // REQUIRED
     "serviceName": "<service>",            // REQUIRED
     "operationName": "<operation>",        // optional — narrow to one endpoint/operation
     "projectKey": "<X_BLOCKS_KEY>"
   }
   ```

Error paths: `401` → refresh per blocks-setup. Empty results usually mean the time window or
`services` filter is wrong (times are ISO-8601 date-times; keep them UTC).

## Verify

- Step 1 returns at least one trace inside the window; the id you keep, fed to step 2, returns a
  populated trace rather than an empty envelope.
- Step 3 returns log entries whose trace id matches — confirming the log↔trace join works for
  your project.
