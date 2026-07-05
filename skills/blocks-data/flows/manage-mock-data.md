# Inventory and delete mock data

Use when checking which collections contain seeded sample records, or cleaning them out before go-live ("remove the demo data", "reset the sample records"). Preconditions: Bearer token and your Blocks Key (**`projectKey` = your Blocks Key**, the `X_BLOCKS_KEY` value).

**Generation is not exposed in v4.** There is no mock-data *creation* endpoint in the v4 swagger — generate sample data in the OS portal (Data section) or insert real records through the runtime gateway. The API's job here is inventory and deletion.

## Steps

1. `GET /mock-data` — inventory mock data for the current tenant ([endpoints.md#mockdata](../endpoints.md#mockdata)).
   Response `data.items[]` gives `{ collectionName, schemaName, count }` per collection that holds mock records.
   - Path note: swagger currently documents this as `GET /mock-data/mock-data`; the platform team says `GET /mock-data`. If one 404s, try the other.

2. Confirm scope with the user. Deletion is per-schema and irreversible; list the `schemaName`s and counts you're about to wipe.

3. `DELETE /mock-data` — delete mock data for the selected schemas.
   ```json
   {
     "projectKey": "$X_BLOCKS_KEY",
     "schemaNames": ["Product", "Order"]
   }
   ```
   Response envelope carries `ActionResponse`; `data.totalImpactedData` reports how many records were removed.
   - This targets records the platform tracks as mock data. It is not a general bulk-delete for real records — for that, use the runtime gateway's delete mutations (gateway URL unverified in v4 — see SKILL.md).

Error paths: 401 → refresh via blocks-setup. 400 `ProblemDetails` → check `schemaNames` spelling against `GET /schemas?ProjectKey=…`.

## Verify

- Re-run `GET /mock-data` (step 1) — the deleted schemas should disappear from `items` (or show `count: 0`).
- Sanity-check that real data is untouched: query the affected collections through the runtime gateway or check counts in the OS portal.
