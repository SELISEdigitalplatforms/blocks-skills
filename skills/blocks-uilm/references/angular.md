# Angular Reference

Angular integration with the Blocks UILM API. Uses Angular `HttpClient` for API calls and Angular's reactive patterns (signals, RxJS) for state management.

For the **React** (Next.js / Vite) i18n pattern, see `flows/client-i18n-setup.md` instead. Angular uses `HttpClient` + signals instead of React Query + context.

## Directory Structure

```
src/app/
├── services/
│   └── localization.service.ts   # API calls to UILM
├── models/
│   └── localization.types.ts     # Interfaces matching contracts.md
├── state/
│   └── translation.store.ts      # Signal-based reactive state
└── components/
    └── locale-selector/          # Language switcher
```

## Types Layer

Match exact field names from `contracts.md`:

```typescript
// src/app/models/localization.types.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

export interface Language {
  itemId: string;
  languageName: string;
  languageCode: string;
  isDefault: boolean;
  projectKey: string;
}

export interface Translation {
  languageCode: string;
  value: string;
}

export interface TranslationKey {
  keyId: string;
  keyName: string;
  moduleName: string;
  translations: Translation[];
}
```

> [!IMPORTANT]
> Use exact field names: `itemId`, `languageName`, `languageCode`, `moduleName` (for modules), `moduleId` (for keys), `keyName`. Use `resources[]` not `translations[]`. See `contracts.md`.

## Services Layer

Create `localization.service.ts` using Angular's `HttpClient`:

```
Create: src/app/services/localization.service.ts
Key patterns:
  - Inject HttpClient via inject(HttpClient) or constructor
  - Headers: x-blocks-key: {projectKey}
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns Language[] array directly
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns array with { itemId, moduleName } directly
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Record<string, string> directly — NOT wrapped
  - getKeys: POST /uilm/v1/Key/Gets with {projectKey, moduleIds[], pageNumber, pageSize}
  - saveKey: POST /uilm/v1/Key/Save with {keyName, moduleId, projectKey, resources[]}
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

### Environment Config

```typescript
// environment.ts
export const environment = {
  blocksApiUrl: 'https://api.example.com',
  blocksApiKey: 'your_api_key',
  blocksProjectKey: 'your_project_key',
};
```

> [!IMPORTANT]
> The `projectKey` value must be stored in `localStorage['projectKey']` on app init. This enables the UILM browser extension to inject key-mode on `localhost`. In Angular, set this in the root component's `ngOnInit` or an APP_INITIALIZER:
> ```ts
> localStorage.setItem('projectKey', environment.blocksProjectKey);
> ```

## Angular Integration

### app.config.ts

```
Ensure provideHttpClient() is in providers:
  import { provideHttpClient } from '@angular/common/http';
  providers: [provideHttpClient()]
```

## Translation Store (Signal-based)

Angular 17+ supports signals. Create a reactive translation store:

```
Create: src/app/state/translation.store.ts
Key patterns:
  - currentLanguage signal: signal<Language | null>(null)
  - translations signal: signal<Record<string, string>>({})
  - availableLanguages signal: signal<Language[]>([])
  - loadTranslations(lang, module): fetch getUilmFile, store in translations signal
  - setLanguage(lang): update currentLanguage, reload translations
  - On init: fetch getLanguages(), find the isDefault language, call loadTranslations(default, "common") automatically — users should see translated text immediately
  - t(key): translations()[key] ?? key  ← return key as fallback
  - isHydrated: true after initial load
```

For RTL languages: `isRTL = ['ar', 'he', 'fa', 'ur'].some(l => code.startsWith(l))`

## Locale Selector Component

```
Create: src/app/components/locale-selector/locale-selector.component.ts
Key patterns:
  - Inject TranslationStore or call LocalizationService directly
  - Display availableLanguages as dropdown options
  - On selection: call setLanguage()
  - Show loading/placeholder until translations are loaded
```

## Key-Mode Debugging

For browser extension key-mode support, the `t()` function should check `window.__i18nKeyMode` and return the key instead of the value. See `references/key-mode-debugging.md` for the pattern — apply the same logic in the `t()` function of the translation store.

## Dual-Module Loading

Angular routes can follow the same dual-module pattern. Create a route-to-module map service:

```
Pattern:
  Route /          → Modules: ["common", "home"]
  Route /about    → Modules: ["common", "about"]
  Route /auth    → Modules: ["common", "auth"]
```

For each route, load `common` + route-specific translations and merge them.

## TODO Checklist

- [ ] Add `provideHttpClient()` to `app.config.ts`
- [ ] Create `src/app/models/localization.types.ts` with exact field names
- [ ] Create `src/app/services/localization.service.ts` with `x-blocks-key` header
- [ ] Create `src/app/state/translation.store.ts` with signal-based `t()` function
- [ ] Implement dual-module loading per route
- [ ] Create `LocaleSelectorComponent`
- [ ] Set up environment config with `blocksApiUrl`, `blocksApiKey`, `blocksProjectKey`
- [ ] Test key-mode toggle with UILM browser extension
