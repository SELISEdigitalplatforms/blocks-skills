# Action: get-hosting-config

## Purpose

Get available hosting providers, regions, and machine configurations for deployment. Use this to populate dropdowns when configuring repo settings.

---

## Endpoint

```
GET $API_BASE_URL/cloudbuild/v1/VcsRepository/HostingConfiguration
```

---

## curl

```bash
curl --location "$API_BASE_URL/cloudbuild/v1/VcsRepository/HostingConfiguration" \
  --header "x-blocks-key: $PROJECT_SLUG" \
  --header "Content-Type: application/json"
```

---

## On Success (200)

```json
{
  "isSuccess": true,
  "errors": null,
  "message": "string",
  "statusCode": 200,
  "data": {
    "hostingProviders": [
      {
        "id": "string",
        "name": "string",
        "status": "string",
        "region": [
          {
            "id": "string",
            "name": "string",
            "status": "string",
            "machineSpecs": [
              {
                "id": "string",
                "ram": "string",
                "cpu": "string",
                "bandwidth": "string",
                "status": "string"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Use `hostingProvider.id`, `region.id`, and `machineSpecs.id` in `update-repo-settings` or `trigger-build`.

---

## On Failure

| HTTP Status | Cause | Action |
|-------------|-------|--------|
| 401 | Missing or invalid `x-blocks-key` | Verify project key |
| 403 | Account lacks permission | Verify `cloudadmin` role |
