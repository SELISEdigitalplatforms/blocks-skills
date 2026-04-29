# Action: check-email-available

## Purpose

Check if an email address is available (not already registered).

---

## Authentication

Not required. This action is public.

---

## Endpoint

```
GET $API_BASE_URL/idp/v1/Iam/IsEmailAvaiable
```

> **Note:** The endpoint path uses `Avaiable` (missing `l`) — this matches the backend API spelling exactly. Do not correct it.

---

## curl

```bash
curl --location "$API_BASE_URL/idp/v1/Iam/IsEmailAvaiable?email=user@example.com" \
  --header "x-blocks-key: $X_BLOCKS_KEY"
```

---

## Query Parameters

| Param | Type | Required |
|-------|------|----------|
| email | string | yes |

---

## On Success (200)

Returns boolean — `true` if available, `false` if already taken.

---

## On Failure

* 400 — invalid email format
