# Action: get-sessions

## Purpose

Get all active sessions for the current user.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/GetSessions
```

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/GetSessions" \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Request Body

None.

---

## On Success (200)

Returns list of active session objects with device, IP, and timestamp info.

---

## On Failure

* 401 — run refresh-token then retry
