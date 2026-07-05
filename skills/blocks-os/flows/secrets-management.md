# Store and read project secrets

Keep server-side configuration values (API keys, third-party credentials, feature settings) in named secret bags per project, and read them back at runtime.

Preconditions: `x-blocks-key` + bearer token; `projectKey`. Secrets are for **backend** consumption — never fetch them from browser code or expose them via `VITE_` vars.

## Steps

1. **`POST /api/Secrets/Save`** — create a secret bag ([endpoints.md#secrets](../endpoints.md#secrets)). Body:
   ```json
   {
     "secretKey": "payment-gateway",
     "keyValuePairs": { "apiKey": "sk_...", "webhookSecret": "whsec_..." },
     "projectKey": "<key>"
   }
   ```
   `secretKey` is the bag's name; `keyValuePairs` is a flat string→string map. Response is `BaseResponse` — **no `itemId` is returned**; discover it via step 2.
2. **`GET /api/Secrets/Gets?SecretKey=<name>&PageNumber=0&PageSize=20`** — list/find secrets. Response: `{ data: Secret[], totalCount }`. Each `Secret` carries `itemId`, `secretKey`, `keyValuePairs`. Note the pagination params here are `PageNumber`/`PageSize` (not `Page` like other GET lists).
3. **`GET /api/Secrets/Get?ItemId=<id>&ProjectKey=<key>`** — read one bag by id. Use this at runtime when you already know the `itemId`.
4. **Update: `POST /api/Secrets/Save` with `itemId` set** — resend `secretKey` + the **full** `keyValuePairs` map plus `projectKey`. Treat the map as replace-not-merge unless you observe otherwise on the live API (merge semantics are not documented in swagger).
5. **`POST /api/Secrets/Delete`** — body `{ "itemId": "<id>", "projectKey": "<key>" }`. Quirk: unlike Notification (DELETE + query) and Storage (POST + query), Secrets deletes via **POST with a JSON body**.

Error paths: `isSuccess: false` on Save/Delete → read `errors`; 401 → refresh token (blocks-setup). If `Gets` returns an empty `data` for a bag you just saved, re-check the `SecretKey` query value (PascalCase param, exact name match).

## Verify

- `GET /api/Secrets/Gets?SecretKey=<name>` returns the bag with the expected `keyValuePairs` and a non-null `itemId`.
- After an update, `GET /api/Secrets/Get?ItemId=<id>&ProjectKey=<key>` shows the new values.
- After Delete, `Gets` no longer returns the bag and `totalCount` decrements.
