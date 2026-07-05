# Inventory and delete mock data

Use when checking which collections contain seeded sample records, or cleaning them out before go-live ("remove the demo data", "reset the sample records"). Preconditions: Bearer token and your Blocks Key (**`projectKey` = your Blocks Key**, the `X_BLOCKS_KEY` value).

**Generation is not exposed in v4.** There is no mock-data *creation* endpoint in the v4 swagger — generate sample data in the OS portal (Data section) or insert real records through the runtime gateway. The API's job here is inventory and deletion.

## Steps

1. `GET /api/data-manage/mock-data` — inventory mock data for the current tenant ([endpoints.md#datamanage](../endpoints.md#datamanage)).
   Response `data.items[]` gives `{ collectionName, schemaName, count }` per collection that holds mock records. `GET /api/mock-data/mock-data` is a duplicate route with the identical response ([endpoints.md#mockdata](../endpoints.md#mockdata)) — either works.

2. Confirm scope with the user. Deletion is per-schema and irreversible; list the `schemaName`s and counts you're about to wipe.

3. `DELETE /api/mock-data` — delete mock data for the selected schemas.
   ```json
   {
     "projectKey": "$X_BLOCKS_KEY",
     "schemaNames": ["Product", "Order"]
   }
   ```
   Response envelope carries `ActionResponse`; `data.totalImpactedData` reports how many records were removed.
   - Quirk: `POST /api/data-manage/mock-data` takes the same body and **also deletes** (its swagger description says "Deletes mock data from the database" despite the POST verb). Prefer the explicit `DELETE /api/mock-data`; don't mistake the POST for a generator.
   - This targets records the platform tracks as mock data. It is not a general bulk-delete for real records — for that, use the runtime gateway's delete mutations (gateway URL unverified in v4 — see SKILL.md).

Error paths: 401 → refresh via blocks-setup. 400 `ProblemDetails` → check `schemaNames` spelling against `GET /api/schemas?ProjectKey=…`.

## Verify

- Re-run `GET /api/data-manage/mock-data` — the deleted schemas should disappear from `items` (or show `count: 0`).
- Sanity-check that real data is untouched: query the affected collections through the runtime gateway or check counts in the OS portal.
