# Sync Protocol

Patterns for synchronizing translations between local files and the Blocks Localization Microservice.

## Overview

The sync protocol supports two directions:
- **Pull**: Fetch translations from UILM and write to local files
- **Push**: Upload local translation files to UILM

Both directions can be used manually, in CI/CD pipelines, or triggered by webhooks.

## Pull Sync (Remote → Local)

Fetch translations from UILM and write them to local files. Use this for:
- Initial setup (populating local files from the microservice)
- CI build (ensuring the build uses up-to-date translations)
- Offline fallback (caching translations locally)

### Pull Script Pattern

```typescript
// scripts/sync-pull.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

interface PullOptions {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  language: string;
  moduleName: string;
  outputPath: string;
  format: 'json' | 'arb' | 'resx';
}

async function pullTranslations(options: PullOptions): Promise<void> {
  // UILM API: getUilmFile returns flat { "KEY": "value" } directly
  const params = new URLSearchParams({
    Language: options.language,
    ModuleName: options.moduleName,
    ProjectKey: options.projectId,
  });

  const response = await fetch(
    `${options.apiUrl}/uilm/v1/Key/GetUilmFile?${params}`,
    {
      headers: {
        'Authorization': `ApiKey ${options.apiKey}`,
        'X-Project-ID': options.projectId,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to pull ${options.language}/${options.moduleName}: ${response.statusText}`);
  }

  // getUilmFile returns flat JSON directly — NOT wrapped in data.translations
  const translations = await response.json() as Record<string, string>;

  await writeFile(options.outputPath, JSON.stringify(translations, null, 2));
  console.log(`Pulled ${options.language}/${options.moduleName} → ${options.outputPath} (${Object.keys(translations).length} keys)`);
}

// Pull all modules for a language
async function pullAllModules(options: Omit<PullOptions, 'moduleName' | 'outputPath'>) {
  const modules = ['common', 'home', 'auth', 'errors'];
  for (const module of modules) {
    await pullTranslations({
      ...options,
      moduleName: module,
      outputPath: `./locales/${options.language}/${module}.json`,
    });
  }
}
```

> [!IMPORTANT]
> `getUilmFile` returns flat `{ "KEY": "value" }` directly — NOT wrapped in `{data}` or `{translations: {...}}`.

### CI/CD Integration (Pull)

```yaml
# .github/workflows/sync-translations.yml
- name: Pull translations from UILM
  run: npx ts-node scripts/sync-pull.ts --language en --module common
  env:
    BLOCKS_API_URL: ${{ secrets.BLOCKS_API_URL }}
    BLOCKS_API_KEY: ${{ secrets.BLOCKS_API_KEY }}
    BLOCKS_PROJECT_KEY: ${{ secrets.BLOCKS_PROJECT_KEY }}
```

## Push Sync (Local → Remote)

Upload local translation files to UILM. Use this for:
- Initial import (uploading existing local files to the microservice)
- Manual edits (pushing local changes made outside the microservice)
- Incomplete translations (uploading partial work for review)

### Push Script Pattern

```typescript
// scripts/sync-push.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

interface PushOptions {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  language: string;
  moduleName: string;
  inputPath: string;
}

async function pushTranslations(options: PushOptions): Promise<void> {
  const translations = JSON.parse(await readFile(options.inputPath, 'utf-8')) as Record<string, string>;

  // UILM API: import-uilm accepts multipart/form-data
  const formData = new FormData();
  formData.append('projectKey', options.projectId);
  formData.append('moduleName', options.moduleName);
  formData.append('languageCode', options.language);
  formData.append('file', new Blob([JSON.stringify(translations)], { type: 'application/json' }), 'translations.json');

  const response = await fetch(`${options.apiUrl}/uilm/v1/Key/ImportUilm`, {
    method: 'POST',
    headers: {
      'Authorization': `ApiKey ${options.apiKey}`,
      'X-Project-ID': options.projectId,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Push failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`Pushed ${Object.keys(translations).length} keys to ${options.language}/${options.moduleName}`);
}

// Push all modules for a language
async function pushAllModules(options: Omit<PushOptions, 'moduleName' | 'inputPath'>) {
  const modules = ['common', 'home', 'auth', 'errors'];
  for (const module of modules) {
    await pushTranslations({
      ...options,
      moduleName: module,
      inputPath: `./locales/${options.language}/${module}.json`,
    });
  }
}
```

> [!IMPORTANT]
> `import-uilm` expects a flat JSON object: `{ "KEY": "value" }` — not nested objects.

### CLI Integration

```typescript
// scripts/blocks-sync-cli.ts
// Usage: npx ts-node scripts/blocks-sync-cli.ts pull --language en --module common
// Usage: npx ts-node scripts/blocks-sync-cli.ts push --language en --module common --input ./locales/en/common.json

interface SyncConfig {
  apiUrl: string;
  apiKey: string;
  projectId: string;
}

// Load from environment or config file
const config: SyncConfig = {
  apiUrl: process.env.BLOCKS_API_URL!,
  apiKey: process.env.BLOCKS_API_KEY!,
  projectId: process.env.BLOCKS_PROJECT_KEY!,
};
```

## Webhook Triggers

The microservice can notify when translations are updated. Configure webhooks via the `save-webhook` action.

### Webhook Handler

```typescript
// scripts/webhook-handler.ts
// Endpoint: POST /api/webhooks/translations-updated
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

interface TranslationWebhookPayload {
  event: 'key.created' | 'key.updated' | 'key.deleted' | 'language.added';
  languageCode?: string;
  moduleName?: string;
  keyName?: string;
  timestamp: string;
}

export async function handleTranslationWebhook(
  payload: TranslationWebhookPayload
): Promise<void> {
  console.log(`Webhook: ${payload.event}`);

  if (payload.event === 'key.updated' && payload.languageCode && payload.moduleName) {
    // Auto-pull the updated module/language
    await pullTranslations({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      projectId: config.projectId,
      language: payload.languageCode,
      moduleName: payload.moduleName,
      outputPath: `./locales/${payload.languageCode}/${payload.moduleName}.json`,
      format: 'json',
    });
  }
}
```

### Webhook Security

- Verify webhook signatures if the microservice supports HMAC signing
- Store the webhook secret in environment variables
- Reject requests from unknown IPs if the microservice provides IP allowlisting

## Conflict Resolution

When syncing, conflicts can arise between local and remote:

| Strategy | Behavior |
|---|---|
| `merge` | Add new keys from source; keep existing target keys unchanged |
| `replace` | Overwrite all keys from source |

Prefer `import-uilm` with merge strategy for ongoing synchronization to avoid losing work done directly on the microservice.

## Cache Invalidation

- Local cache: Use ETag/Last-Modified headers for conditional requests
- React Query: Use `staleTime` and `cacheTime` appropriately
- CI builds: Pull fresh translations on every build (do not cache in CI)

## File Format Conventions

| Framework | Recommended Format | Path Convention |
|---|---|---|
| Next.js / React | JSON | `public/locales/{locale}/{module}.json` |
| Angular | JSON | `src/assets/i18n/{locale}/{module}.json` |
| Flutter | ARB | `lib/l10n/app_{locale}_{module}.arb` |
| Blazor | RESX / JSON | `Resources/Strings.{locale}.{module}.resx` |
| React Native | JSON | `src/i18n/locales/{locale}/{module}.json` |

For conversion between formats, see `references/bridge-strategies.md`.
