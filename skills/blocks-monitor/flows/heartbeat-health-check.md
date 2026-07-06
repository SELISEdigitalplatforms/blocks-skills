# Set up a heartbeat health check and ping it

Use for cron jobs, workers, and services that can't be probed from outside: you register a health
configuration with an expected interval and grace period, then the job itself calls the ping URL on
schedule. Field names (`intervalInSeconds`, `gracePeriodInSeconds`, `emails`) strongly suggest
healthchecks.io-style dead-man's-switch semantics — a missed ping past the grace period triggers an
alert — but the swagger documents no behavior, so **verify the alerting semantics live** before
relying on it. For active URL probing by the platform, use `flows/uptime-monitor.md` instead.

Preconditions: `x-blocks-key` + Bearer token (blocks-setup). All four Health endpoints have **no
response schema documented in swagger**.

Base URL: `https://api.seliseblocks.com/monitor/v4`

## Steps

1. `POST /Health/SaveHealth` — create the health configuration. See
   [endpoints.md#health](../endpoints.md#health) (`SaveHealthConfigurationRequest` in
   contracts.md):

   ```json
   {
     "projectKey": "<X_BLOCKS_KEY>",       // projectKey = your Blocks Key (x-blocks-key value)
     "name": "nightly-export-job",
     "repoId": null,
     "repoName": null,
     "externalServiceId": null,
     "isActive": true,
     "intervalInSeconds": 86400,
     "gracePeriodInSeconds": 3600,
     "monitorSourceType": "<source-type>",
     "emails": ["ops@example.com"]
   }
   ```

   - There is no `url` field — the platform does not probe you; you ping it (step 2).
   - `repoId`/`repoName` or `externalServiceId` optionally tie the check to a Blocks repo or
     external service.
   - Valid `monitorSourceType` strings are not enumerated in swagger — create one in OS portal
     first and read the value back, or verify live.
   - Response undocumented — inspect it for the new `itemId`. If it isn't returned, swagger
     exposes no dedicated Health list endpoint; check whether the config shows up in
     `GET /Monitor/GetMonitorList` (health configs share the `monitorSourceType` field, so
     they may be listed there — unverified), or read the id from OS portal.

2. Wire the heartbeat: have the job call `GET /Health/Ping/{itemId}` at the end of each
   successful run (at least once per `intervalInSeconds`). `itemId` is a required **path**
   parameter. Include the `x-blocks-key` header. Example cron step:

   ```bash
   curl -fsS -H "x-blocks-key: $X_BLOCKS_KEY" \
     "https://api.seliseblocks.com/monitor/v4/Health/Ping/$HEALTH_ITEM_ID"
   ```

   Ping only after the work succeeds — pinging unconditionally defeats the purpose of a
   dead-man's switch.

3. `POST /Health/UpdateHealth` — same body as SaveHealth **plus `itemId`**, to change the
   interval, grace period, alert emails, or to pause with `isActive: false`. Send the full
   configuration; partial-update behavior is undocumented.

4. `DELETE /Health/DeleteHealth?itemId=<id>` — remove the check (camelCase query param).

Error paths: `401` → refresh per blocks-setup. Ping returns 404 → wrong `itemId` or the config was
deleted. No alert after a deliberately missed ping → re-check `isActive`, `emails`, and treat the
grace-period semantics as unverified (see the note at the top).

## Verify

- `GET /Health/Ping/{itemId}` returns HTTP 200 when called manually with your `x-blocks-key`.
- Let one full `intervalInSeconds + gracePeriodInSeconds` pass **without** pinging and confirm an
  alert email arrives at the configured addresses — this validates the dead-man's-switch
  interpretation for your project.
