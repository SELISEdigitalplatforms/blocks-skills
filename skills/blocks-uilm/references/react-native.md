# React Native Reference

React Native (Expo) integration with the Blocks UILM API. Uses React Query for data fetching and React Native's built-in state management patterns.

For **web React** (Next.js / Vite), see `flows/client-i18n-setup.md` instead. React Native has no browser DOM, so `window.__i18nKeyMode` and `postMessage` don't apply. For i18next in RN, consider `i18next-react-native-async-storage` for offline caching.

## Directory Structure

```
src/
├── lib/
│   ├── language.types.ts         # Language, Translation interfaces
│   ├── language.service.ts      # API calls: getUilmFile, getLanguages, getModules
│   └── i18n.ts                # i18next init (without browser APIs)
├── context/
│   └── language-context.tsx     # LanguageContext + useLanguage hook
├── hooks/
│   └── use-localization.ts     # React Query hooks for API calls
└── App.tsx
```

## Types Layer

Match exact field names from `contracts.md`:

```typescript
// src/lib/language.types.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

export interface Language {
  itemId: string;
  languageName: string;
  languageCode: string;
  isDefault: boolean;
  projectKey: string;
}

export type ModuleTranslations = Record<string, string>;

export interface Translation {
  languageCode: string;
  value: string;
}
```

> [!IMPORTANT]
> Use exact field names: `itemId`, `languageName`, `languageCode`, `moduleName` (for modules), `moduleId` (for keys), `keyName`. Use `resources[]` not `translations[]`. See `contracts.md`.

## Services Layer

```
Create: src/lib/language.service.ts
Key patterns:
  - Base URL: process.env.EXPO_PUBLIC_BLOCKS_API_URL
  - Headers: x-blocks-key: {projectKey}
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Record<string, string> directly — NOT wrapped
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns Language[] array directly
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns array with { itemId, moduleName } directly
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

> [!IMPORTANT]
> The UILM browser extension reads `localStorage['projectKey']` to enable key-mode on `localhost`. For **Expo Web**, store the project key in localStorage on init. For **native mobile**, the extension does not apply — use AsyncStorage for offline caching instead.

React Native doesn't have a browser context equivalent for the web's LanguageProvider. Create a simple context:

```
Create: src/context/language-context.tsx
Key patterns:
  - LanguageContext: { language, setLanguage, languages, isLoading, isHydrated }
  - useQuery for getLanguages — staleTime: 5 minutes
  - useQuery for getUilmFile with [module, selectedLanguage] queryKey
  - On init: find the isDefault language, auto-load common module translations — users should see translated text immediately
  - isHydrated state prevents flash of untranslated content
  - Offline cache: store translations in AsyncStorage, load on mount
```

### Offline Caching Pattern

Since React Native apps may work offline, cache translations locally:

```
Create: src/lib/translation-cache.ts
Key patterns:
  - AsyncStorage.getItem('translations') to load cached translations on mount
  - AsyncStorage.setItem('translations') after fetching new translations
  - On mount: check AsyncStorage first, then fetch from API if stale
```

## React Query Hooks

```
Create: src/hooks/use-localization.ts
Key patterns:
  - useGetLanguages(): useQuery for getLanguages
  - useGetUilmFile(language, moduleName): useQuery for getUilmFile
  - staleTime: 5 * 60 * 1000
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

## App Integration

```typescript
// App.tsx
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/language-context';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <StatusBar style="auto" />
        {/* rest of app */}
      </LanguageProvider>
    </QueryClientProvider>
  );
}
```

## Using Translations

```typescript
// src/screens/HomeScreen.tsx
import { useLanguage } from '@/context/language-context';

export function HomeScreen() {
  const { t } = useLanguage();
  // t() returns the translation value, falling back to the key
  return <Text>{t('HERO_TITLE', 'home')}</Text>;
}
```

## Environment Variables (Expo)

```env
# .env
EXPO_PUBLIC_BLOCKS_API_URL=https://api.blocks.example.com
EXPO_PUBLIC_BLOCKS_PROJECT_KEY=your_project_key
```

## Package Dependencies

```bash
npx expo install @tanstack/react-query @react-native-async-storage/async-storage
npm install i18next react-i18next
```

## TODO Checklist

- [ ] Add `@tanstack/react-query` and `AsyncStorage` to dependencies
- [ ] Create `src/lib/language.service.ts` with UILM API calls
- [ ] Create `src/context/language-context.tsx` for app-wide locale state
- [ ] Implement offline caching with `AsyncStorage`
- [ ] Create `.env` with `EXPO_PUBLIC_BLOCKS_API_URL` and `EXPO_PUBLIC_BLOCKS_PROJECT_KEY`
- [ ] Wrap root in `QueryClientProvider` and `LanguageProvider`
- [ ] Test translations load correctly on app launch
