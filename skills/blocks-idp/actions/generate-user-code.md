# Action: generate-user-code

## Purpose

Generate a new user code that can be used to obtain an access token via get-token.

---

## Endpoint

```
POST $API_BASE_URL/idp/v1/Authentication/GenerateUserCode
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Authentication/GenerateUserCode" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "clientId": "'$BLOCKS_OIDC_CLIENT_ID'",
    "codeTtlInMinute": 60,
    "note": "string"
  }'
```

---

## Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| clientId | string | yes | Fixed — $BLOCKS_OIDC_CLIENT_ID |
| codeTtlInMinute | integer | yes | How long the code is valid |
| note | string | no | Optional label for the code |

---

## On Success (200)

Returns `BaseResponse` with generated user code.

---

## On Failure

* 401 — run refresh-token then retry
