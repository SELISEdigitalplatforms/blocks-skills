# Inventory and delete mock data

Use when checking which collections hold seeded sample records, or cleaning them out before go-live ("remove the demo data", "reset the sample records"). Preconditions: an impersonated project token from **[get-into-project.md](get-into-project.md)** — it gives the `hdr` array (`x-blocks-key: $ROOT` + Bearer `$PTOK`) and `$PTENANT` (the project tenant id used as `projectKey`).

**Generation is not exposed in v4.** There is no mock-data *creation* endpoint — generate sample data in the OS portal (Data section) or insert real records through the runtime gateway ([blocks-data-gateway-crud](../../blocks-data-gateway-crud/SKILL.md)). The API's job here is inventory and deletion.

## Steps

1. `GET /data/v4/mock-data` — inventory mock data for the current tenant.
   Response `data.items[]` gives `{ collectionName, schemaName, count }` per collection that holds mock records.
   - Path note: the swagger documents this as `GET /mock-data/mock-data`; the served route is `GET /mock-data`. If one 404s, try the other.

2. Confirm scope with the user. Deletion is per-schema and irreversible — list the `schemaName`s and counts you're about to wipe.

3. `DELETE /data/v4/mock-data` — delete mock data for the selected schemas.
   ```json
   {
     "projectKey": "<project tenant id>",
     "schemaNames": ["Product", "Order"]
   }
   ```
   Response envelope carries `ActionResponse`; `data.totalImpactedData` reports how many records were removed.
   - This targets records the platform tracks as mock data. It is **not** a general bulk-delete for real records — for that, use the gateway's `deleteMany<Schema>` mutation ([blocks-data-gateway-crud](../../blocks-data-gateway-crud/SKILL.md)).

Error paths: 401 → wrong `x-blocks-key` (must be tenant_id) or expired token. 400 `ProblemDetails` → check `schemaNames` spelling against `GET /schemas?ProjectKey=<project tenant id>`.

## Verify

- Re-run `GET /mock-data` (step 1) — the deleted schemas should disappear from `items` (or show `count: 0`).
- Sanity-check that real data is untouched: query the affected collections through the gateway or check counts in the OS portal.
