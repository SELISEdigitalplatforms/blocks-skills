# Add field validation rules

Use when a schema field needs write-time validation — "email must be valid", "SKU must match a pattern". Preconditions: Bearer token, `projectKey`, and the schema's id (`data.items[].id` from `GET /api/schemas`, or `data.itemId` kept from creation).

`ValidationType` is a `0..11` int enum with **no member names in the v4 swagger** (contracts.md: `ValidationType`). Legacy v1 supported only regex validation; v4 clearly has more types but their meanings are unpublished — check the Cloud Portal's field-validation UI to map values before using anything beyond the pattern you can verify. Each rule also carries `value`, `secondaryValue` (untyped — e.g. a second bound for range-style rules), `errorMessage`, and `isActive`.

## Steps

1. Optional — generate the regex with AI: `POST /api/regex/generateregex` ([endpoints.md#regexassistant](../endpoints.md#regexassistant)).
   ```json
   {
     "description": "Swiss phone number with optional +41 country code",
     "exampleText": "+41 79 123 45 67",
     "temperature": 0.2,
     "additionalContext": "Allow spaces between digit groups"
   }
   ```
   **Response 200 has no schema in swagger** — inspect the live response to extract the generated pattern. Always test the pattern locally against sample values before saving it as a rule.

2. `GET /api/data-validations/by-schema-and-field?schemaId=<schemaId>&fieldName=<field>&projectKey=<projectKey>` — check for an existing validation on the field ([endpoints.md#datavalidation](../endpoints.md#datavalidation)).
   - `data` present → keep `data.itemId` and go to step 4 (update).
   - Empty → step 3 (create).

3. `POST /api/data-validations` — create the validation for the field.
   ```json
   {
     "projectKey": "<projectKey>",
     "schemaId": "<schemaId>",
     "fieldName": "phone",
     "validations": [
       {
         "type": 0,
         "value": "^\\+41[ ]?\\d{2}([ ]?\\d{2,3}){3}$",
         "secondaryValue": null,
         "errorMessage": "Not a valid Swiss phone number",
         "isActive": true
       }
     ]
   }
   ```
   Keep `data.itemId` (the validation record id). `type: 0` here is an assumption that the first enum member is the regex rule (legacy behavior) — **unverified in v4**; confirm once via the Cloud Portal or by reading back a validation the portal created.

4. `PUT /api/data-validations` — update: same body as create plus `itemId`. The `validations` array replaces the rule set for that field, so send the complete list, not a delta.

5. `DELETE /api/data-validations?validationId=<itemId>&projectKey=<projectKey>` — remove a validation entirely. (To disable temporarily, prefer `PUT` with `isActive: false`.)

6. `POST /api/schema-configurations/reload` — mandatory; validation changes are staged until reloaded.

Error paths: 401 → refresh via blocks-setup. `GET /api/data-validations/get-by-id?validationId=…` returns 404 `ProblemDetails` for unknown ids.

## Verify

- `GET /api/data-validations/by-schema-id?schemaId=<schemaId>&projectKey=<projectKey>` — all validations for the schema; confirm your field appears with the expected `validations[]` and `isActive: true`.
- `GET /api/data-validations?SchemaId=<schemaId>&PageNo=1&PageSize=20` — paginated listing (also filterable by `FieldName` / `Keyword`).
- Behavior check: a write through the runtime gateway with a violating value should fail with your `errorMessage` (gateway URL unverified in v4 — see SKILL.md).
