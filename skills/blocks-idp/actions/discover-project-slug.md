# Action: discover-project-slug (DEPRECATED)

## Status

**Deprecated** — `PROJECT_SLUG` is now a required environment variable provided by the user at session start (Cloud Portal → Project settings). Auto-discovery is no longer needed.

## Previous Behavior

This action previously attempted to auto-detect the project slug from the JWT access token or the GetUserInfo endpoint. This is no longer necessary since `PROJECT_SLUG` is collected during Step 2 of session setup.

## Migration

If you encounter references to "auto-discover project slug" or "run discover-project-slug after get-token", these can be safely ignored. The slug is already available in `.env` as `PROJECT_SLUG`.
