# Action: change-security

## Purpose

Configures the security/access level for a schema. Controls whether data is open, authenticated-only, or policy-driven.

---

## Endpoint

```
POST $API_BASE_URL/uds/v1/data-access/security/change
```

---

## curl

```bash
curl --location "$API_BASE_URL/uds/v1/data-access/security/change" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "projectKey": "$X_BLOCKS_KEY",
    "schemaId": "$SCHEMA_ID",
    "operation": 0,
    "policyType": 0,
    "fieldNames": [],
    "accessLevel": 2
  }'
```

---

## Request Body / Query Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| projectKey | string | yes | Use $X_BLOCKS_KEY, NOT $PROJECT_SLUG |
| schemaId | string | yes | Schema ID from define-schema response |
| operation | integer | no | PolicyOperation: 0=Read, 1=Create, 2=Update, 3=Delete, 4=All |
| policyType | integer | no | PolicyType: 0=RoleBased, 1=ClaimBased |
| fieldNames | array | no | Apply to specific fields only (empty = all) |
| accessLevel | integer | yes | SchemaAccessLevel: 0=Public, 1=User, 2=Custom |

---

## On Success (200)

```json
{
  "isSuccess": true,
  "message": "Security changed successfully",
  "httpStatusCode": 200,
  "data": {
    "acknowledged": true,
    "itemId": null,
    "totalImpactedData": 0,
    "message": "string"
  },
  "errors": []
}
```

---

## On Failure

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Schema not found or invalid accessLevel | Verify schemaId exists and accessLevel is valid |
| 401 | Invalid token | Check ACCESS_TOKEN is valid and not expired |
| 403 | Missing cloudadmin role | Ensure user has cloudadmin permissions |

---

## Next Steps

If accessLevel is 2 (Custom), call create-access-policy immediately. Without policies, all access is denied.
