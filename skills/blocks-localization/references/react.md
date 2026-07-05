# React integration — blocks-localization

Target stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand (matches `blocks-construct-react`). This guide wires the localization service into that stack: a typed fetch slice, query/mutation hooks for the highest-value endpoints, and a translation-editor sketch.

Auth/token lifecycle (login, refresh, 401 retry) is owned by **blocks-setup** / **blocks-iam** — this file assumes a Zustand auth store exposing `accessToken` already exists.

## Environment

```bash
# .env — client-safe values only (never put credentials in VITE_ vars)
VITE_BLOCKS_API_URL=https://api.seliseblocks.com
VITE_X_BLOCKS_KEY=<public x-blocks-key for this app>
```

Note: projectKey = your Blocks Key — every `projectKey` / `ProjectKey` param below reuses `VITE_X_BLOCKS_KEY`; no separate project env var exists.

## API client slice

`src/features/localization/api.ts` — one fetch wrapper, every call goes through it.

```ts
import { useAuthStore } from '@/stores/auth'; // from blocks-setup integration
import type {
  ApiResponse,
  BaseMutationResponse,
  GetGlossariesResponse,
  GetKeysQueryResponse,
  GetKeysRequest,
  Key,
  Language,
  BlocksLanguageModule,
  SuggestLanguageRequest,
  TranslateBlocksLanguageKeysRequest,
} from './contracts'; // types copied from blocks-localization/contracts.md

const BASE = `${import.meta.env.VITE_BLOCKS_API_URL}/localization/v4`;
// projectKey = your Blocks Key: the same value serves as the x-blocks-key header and every projectKey/ProjectKey param
export const X_BLOCKS_KEY = import.meta.env.VITE_X_BLOCKS_KEY as string;

async function locFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const { query, ...rest } = init;
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v)); // NB: param names are PascalCase — pass them exactly
  }
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'x-blocks-key': X_BLOCKS_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
  });
  if (res.status === 401) {
    // delegate to the shared refresh-and-retry helper from blocks-setup
    throw Object.assign(new Error('unauthorized'), { status: 401 });
  }
  if (!res.ok) throw new Error(`localization ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Throws if a Save-style ApiResponse reports failure, so mutations reject properly. */
function assertOk(r: ApiResponse): ApiResponse {
  if (r.success === false) {
    const detail = r.validationErrors?.map((v) => `${v.propertyName}: ${v.errorMessage}`).join('; ');
    throw new Error(r.errorMessage ?? detail ?? 'localization save failed');
  }
  return r;
}

export const localizationApi = {
  // Languages
  getLanguages: () =>
    locFetch<Language[]>('/Language/Gets', { query: { ProjectKey: X_BLOCKS_KEY } }),
  saveLanguage: (body: Language) =>
    locFetch<ApiResponse>('/Language/Save', {
      method: 'POST',
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }).then(assertOk),

  // Modules
  getModules: () =>
    locFetch<BlocksLanguageModule[]>('/Module/Gets', { query: { ProjectKey: X_BLOCKS_KEY } }),

  // Keys
  getKeys: (filter: GetKeysRequest) =>
    locFetch<GetKeysQueryResponse>('/Key/Gets', {
      method: 'POST',
      body: JSON.stringify({ ...filter, projectKey: X_BLOCKS_KEY }),
    }),
  saveKey: (key: Key) =>
    locFetch<ApiResponse>('/Key/Save', {
      method: 'POST',
      body: JSON.stringify({ ...key, projectKey: X_BLOCKS_KEY }),
    }).then(assertOk),
  saveKeys: (keys: Key[]) =>
    locFetch<ApiResponse>('/Key/SaveKeys', {
      method: 'POST',
      // NB: bare JSON array body
      body: JSON.stringify(keys.map((k) => ({ ...k, projectKey: X_BLOCKS_KEY }))),
    }).then(assertOk),
  translateKeys: (body: Omit<TranslateBlocksLanguageKeysRequest, 'projectKey'>) =>
    // async queue — resolves when enqueued, not when translated; response shape undocumented
    locFetch<unknown>('/Key/TranslateKeys', {
      method: 'POST',
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  // Glossary + AI assistant
  getGlossaries: (page = 1, pageSize = 50) =>
    locFetch<GetGlossariesResponse>('/Glossary/Gets', {
      query: { ProjectKey: X_BLOCKS_KEY, PageNumber: page, PageSize: pageSize },
    }),
  getTranslationSuggestion: (body: Omit<SuggestLanguageRequest, 'projectKey'>) =>
    // response shape not documented in swagger — inspect live once, then refine this type
    locFetch<unknown>('/Assistant/GetTranslationSuggestion', {
      method: 'POST',
      body: JSON.stringify({ ...body, projectKey: X_BLOCKS_KEY }),
    }),

  // Runtime language file (call GenerateUilmFile after content changes — see the language-files flow)
  getUilmFile: (language: string, moduleName: string) =>
    // swagger documents this only as "a JSON UILM file" — verify the live shape, then narrow the type
    locFetch<unknown>('/Key/GetUilmFile', {
      query: { Language: language, ModuleName: moduleName, ProjectKey: X_BLOCKS_KEY },
    }),
  tagGlossaryToModule: (moduleId: string, glossaryIds: string[]) =>
    locFetch<BaseMutationResponse>('/Module/TagGlossary', {
      method: 'POST',
      body: JSON.stringify({ moduleId, glossaryIds, projectKey: X_BLOCKS_KEY }),
    }),
};
```

## TanStack Query hooks

`src/features/localization/hooks.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localizationApi } from './api';
import type { GetKeysRequest, Key } from './contracts';

const qk = {
  languages: ['loc', 'languages'] as const,
  modules: ['loc', 'modules'] as const,
  keys: (filter: GetKeysRequest) => ['loc', 'keys', filter] as const,
  glossaries: ['loc', 'glossaries'] as const,
  uilmFile: (lang: string, mod: string) => ['loc', 'uilm', mod, lang] as const,
};

export const useLanguages = () =>
  useQuery({ queryKey: qk.languages, queryFn: localizationApi.getLanguages, staleTime: 5 * 60_000 });

export const useModules = () =>
  useQuery({ queryKey: qk.modules, queryFn: localizationApi.getModules, staleTime: 5 * 60_000 });

export const useKeys = (filter: GetKeysRequest) =>
  useQuery({ queryKey: qk.keys(filter), queryFn: () => localizationApi.getKeys(filter) });

export const useGlossaries = () =>
  useQuery({ queryKey: qk.glossaries, queryFn: () => localizationApi.getGlossaries() });

export const useUilmFile = (language: string, moduleName: string) =>
  useQuery({
    queryKey: qk.uilmFile(language, moduleName),
    queryFn: () => localizationApi.getUilmFile(language, moduleName),
    staleTime: 10 * 60_000,
  });

export function useSaveKeys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keys: Key[]) => localizationApi.saveKeys(keys),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loc', 'keys'] }),
  });
}

export function useTranslateKeys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyIds: string[]) =>
      localizationApi.translateKeys({
        keyIds,
        messageCoRelationId: crypto.randomUUID(),
        defaultLanguage: 'en', // the project default language's code
      }),
    // translation is queued server-side: refetch keys after a delay rather than immediately
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ['loc', 'keys'] }), 15_000),
  });
}

export const useTranslationSuggestion = () =>
  useMutation({ mutationFn: localizationApi.getTranslationSuggestion });
```

## Component sketch — module translation editor

A realistic admin screen: pick a module, list its keys with per-language inputs, machine-translate the gaps, bulk-save edits.

```tsx
import { useState } from 'react';
import { useKeys, useLanguages, useModules, useSaveKeys, useTranslateKeys } from '../hooks';
import type { Key } from '../contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TranslationEditor({ moduleId }: { moduleId: string }) {
  const { data: languages } = useLanguages();
  const { data, isPending } = useKeys({ moduleIds: [moduleId], pageSize: 50, pageNumber: 1 });
  const saveKeys = useSaveKeys();
  const translate = useTranslateKeys();
  const [drafts, setDrafts] = useState<Record<string, Key>>({});

  if (isPending) return <p className="text-muted-foreground">Loading keys…</p>;

  const setValue = (key: Key, culture: string, value: string) =>
    setDrafts((d) => {
      const base = d[key.itemId!] ?? key;
      const resources = (base.resources ?? []).some((r) => r.culture === culture)
        ? base.resources!.map((r) => (r.culture === culture ? { ...r, value } : r))
        : [...(base.resources ?? []), { culture, value }];
      return { ...d, [key.itemId!]: { ...base, resources } };
    });

  const untranslated = (data?.keys ?? []).filter((k) => k.isPartiallyTranslated).map((k) => k.itemId!);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => saveKeys.mutate(Object.values(drafts))}
          disabled={saveKeys.isPending || Object.keys(drafts).length === 0}
        >
          Save {Object.keys(drafts).length} changed
        </Button>
        <Button
          variant="secondary"
          onClick={() => translate.mutate(untranslated)}
          disabled={translate.isPending || untranslated.length === 0}
        >
          Auto-translate {untranslated.length} incomplete
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Key</th>
            {languages?.map((l) => <th key={l.languageCode} className="text-left">{l.languageName}</th>)}
          </tr>
        </thead>
        <tbody>
          {(data?.keys ?? []).map((key) => (
            <tr key={key.itemId}>
              <td className="font-mono">{key.keyName}</td>
              {languages?.map((l) => (
                <td key={l.languageCode}>
                  <Input
                    defaultValue={key.resources?.find((r) => r.culture === l.languageCode)?.value ?? ''}
                    onChange={(e) => setValue(key, l.languageCode!, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Notes

- **Save responses carry no ids** — after creating keys/languages, invalidate and refetch instead of patching the cache from the response.
- **Runtime translations:** to drive the app's own UI strings, fetch per-module files with `useUilmFile(language, moduleName)` and feed the result into your i18n layer. Regenerate server-side (`POST /Key/GenerateUilmFile`) after content changes — see [flows/language-files-and-webhook.md](../flows/language-files-and-webhook.md); the file shape is undocumented in swagger, so verify once before typing it.
- **401 handling:** the thrown `{ status: 401 }` should be caught by the shared refresh-and-retry layer from **blocks-setup**; don't reimplement token refresh per feature.
- **Undocumented responses** (`TranslateKeys`, `GetTranslationSuggestion`, `GetUilmFile`) are typed `unknown` on purpose — inspect the live payload, then narrow the types locally.
