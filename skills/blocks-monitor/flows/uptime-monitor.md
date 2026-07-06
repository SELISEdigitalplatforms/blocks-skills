# Create and manage an uptime monitor

Use to have the platform actively probe a URL on an interval and record incidents, response times,
and downtime — with email alerts. This is the *active* checker; for passive heartbeats your own job
pings, use `flows/heartbeat-health-check.md`.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup); the target URL must be reachable from
the public internet. All Monitor endpoints have **no response schema documented in swagger** —
inspect live responses. Query params on this controller are camelCase (`monitorId`, `projectKey`,
`itemId`) — and note the exact spelling `monitorSourcetype` on GetMonitorList.

Base URL: `https://api.seliseblocks.com/monitor/v4`

## Steps

1. `POST /Monitor/SaveMonitor` — create the monitor. See
   [endpoints.md#monitor](../endpoints.md#monitor) (`SaveMonitorConfigurationRequest` in
   contracts.md). Minimal HTTP-probe body:

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",       // projectKey = your Blocks Key (x-blocks-key value)
     "name": "checkout-api",
     "url": "https://myapp.example.com/healthz",
     "monitorType": "<type>",
     "protocolType": "<protocol>",
     "httpMethodType": "GET",
     "authorizationType": null,
     "intervalInSeconds": 60,
     "timeoutInSeconds": 10,
     "isActive": true,
     "monitorSourceType": "<source-type>",
     "expectedContent": null,
     "customHttpHeaders": null,
     "customPayload": null,
     "successHttpResponseCodes": ["200"],
     "regions": [],
     "emails": ["ops@example.com"]
   }
   ```

   - `successHttpResponseCodes` is a **`string[]`** (`["200", "204"]`), not numbers.
   - The valid string values for `monitorType`, `protocolType`, `monitorSourceType`, and `regions`
     are not enumerated in swagger — create one monitor in OS portal first and read the values
     back via step 2, or verify live.
   - `customHttpHeaders` / `customPayload` are single strings (likely serialized JSON) — verify the
     expected encoding live.
   - `repoId`/`repoName` or `externalServiceId`/`externalServiceName` link the monitor to a Blocks
     repo or an external service instead of a raw URL. For external services, check first with
     `GET /Monitor/IsExternalServiceConfigured?externalServiceId=<id>`.
   - Response undocumented — if it doesn't return the new id, get it from step 2.

2. `GET /Monitor/GetMonitorList?projectKey=<X_BLOCKS_KEY>&pageNumber=1&pageSize=20` — list
   monitors (optionally add `monitorSourcetype=<source-type>`). Find your monitor and keep its id
   — this is the `monitorId`/`itemId` every other call needs.

   Related: `GET /Monitor/GetMonitorListByRepoId?projectKey=<X_BLOCKS_KEY>&repoId=<id>` when
   you linked the monitor to a repo.

3. Inspect status and history (all camelCase query params; all responses undocumented):
   - `GET /Monitor/GetMonitorById?monitorId=<id>` — the stored configuration.
   - `GET /Monitor/GetMonitorDetails?monitorId=<id>` — current status / incident details.
   - `GET /Monitor/GetIncidentList?monitorId=<id>&pageNumber=1&pageSize=20` — paginated
     outage incidents.
   - `GET /Monitor/GetMonitorResponseTime?monitorId=<id>&startDate=<iso>&endDate=<iso>` —
     response-time log for a date range (dates optional).
   - `GET /Monitor/GetMonitorDownTime?monitorId=<id>&startDate=<iso>&endDate=<iso>` —
     downtime windows for a date range.

4. `POST /Monitor/UpdateMonitor` — same body as SaveMonitor **plus `itemId`** (the monitor id
   from step 2). Send the full configuration, not a patch — partial-update behavior is not
   documented, so include every field you care about. Set `isActive: false` to pause probing
   without deleting.

5. `DELETE /Monitor/DeleteMonitor?itemId=<id>` — remove the monitor and stop probing.

Error paths: `401` → refresh per blocks-setup. Monitor never produces data → confirm `isActive` is
true (step 3, GetMonitorById), the URL is publicly reachable, and `successHttpResponseCodes`
actually contains the code your endpoint returns.

## Verify

- Immediately after step 1: the monitor appears in `GetMonitorList` with your name and
  `isActive: true`.
- After at least one `intervalInSeconds` has elapsed: `GetMonitorResponseTime` returns entries for
  the current window.
- Force a failure (point the monitor at a URL returning 500, or take the target down) and confirm
  an incident appears in `GetIncidentList` after the interval — and an email arrives at the
  addresses in `emails`.
