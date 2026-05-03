# Flow: setup-data-source-flow

## Trigger

User wants to connect a database, set up a data source, or configure MongoDB for their project.

> "connect a database"
> "set up a data source"
> "configure MongoDB"
> "add a database connection"
> "my schemas are failing — no data source found"

---

## Pre-flight Questions

Before starting, confirm:

1. Do you have a MongoDB connection string? (e.g. `mongodb+srv://<username>:<password>@cluster.mongodb.net`)
2. What is the database name inside the MongoDB instance?
3. Is there an existing connection? (Call `get-data-source` if unsure)
4. Should the connection be set as active? (default: yes)

---

## Flow Steps

### Step 1 — Check Existing Data Source

```
Action: get-data-source
Input: (no parameters — project identified from auth context)
```

**Branch:**
- If 200 with active connection → ask user: update existing or leave as-is?
  - Update → skip to Step 3
  - Leave as-is → skip to Step 4
- If 404 → no connection registered → continue to Step 2

---

### Step 2 — Add Data Source

```
Action: add-data-source
Input:
  itemId           = "$PROJECT_SLUG-db"
  connectionString = "<mongodb+srv://...>"
  databaseName     = "<database-name>"
  projectKey       = $X_BLOCKS_KEY
```

On success → continue to Step 4.

---

### Step 3 — Update Data Source (only if updating existing)

```
Action: update-data-source
Input:
  itemId           = "<existing itemId from get-data-source>"
  connectionString = "<new or same connection string>"
  databaseName     = "<new or same database name>"
  projectKey       = $X_BLOCKS_KEY
  isActive         = true
```

> **CRITICAL:** Always include `isActive: true`. Omitting it may deactivate the connection.

On success → continue to Step 4.

---

### Step 4 — Reload Configuration

```
Action: reload-configuration
Input: projectKey = $X_BLOCKS_KEY (query param)
```

**Branch:**
- If 200 → data source is connected and active → flow complete
- If 500 → MongoDB connection failed → see error table

---

## Connection String Format Reference

| MongoDB type | Example format |
|--------------|----------------|
| MongoDB Atlas | `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net` |
| Self-hosted | `mongodb://<username>:<password>@host:27017` |
| Local dev | `mongodb://localhost:27017` |

---

## Error Handling

| Step | Error | Cause | Action |
|------|-------|-------|--------|
| Step 1 | 401 | Expired token | Run get-token from blocks-idp |
| Step 2 | 400 duplicate | itemId already exists | Use a unique itemId or go to Step 3 (update) |
| Step 2 | 400 | Invalid connection string format | Verify the MongoDB URI format |
| Step 3 | 400 | itemId not found | Verify itemId from get-data-source |
| Step 3 | isActive not set | Connection deactivated | Include `isActive: true` |
| Step 4 | 500 MongoDB auth failed | Wrong username/password in connection string | Update connectionString |
| Step 4 | 500 MongoDB host unreachable | Wrong hostname or network access | Verify cluster URL and firewall rules |
| Step 4 | 500 Database does not exist | Database name mismatch | Verify database name |
| Any | 401 | Expired token | Run get-token from blocks-idp |
| Any | 403 | Missing cloudadmin role | Add cloudadmin role in Cloud Portal → People |

---

## Security Note

The `connectionString` contains credentials. UDS stores it encrypted. It is never returned in GET responses. Never log or expose the connection string in frontend code.
