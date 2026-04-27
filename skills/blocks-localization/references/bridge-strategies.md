# Bridge Strategies

Bridge adapters for migrating legacy i18n systems to the Blocks Localization Microservice.

## Overview

When a project already has an i18n setup, the skill should not simply overwrite it. Instead, it generates a bridge adapter that:
1. Intercepts translation lookups from the legacy system
2. Routes them to the Blocks Localization Microservice
3. Falls back to local files if the microservice is unavailable

This allows a gradual migration — the app keeps working with its existing API while translations are progressively moved to the microservice.

## Strategy Selection

| Existing Tool | Bridge Approach |
|---|---|
| i18next (React/Node.js) | Custom i18next backend plugin using `getUilmFile` per module |
| ARB files (Flutter) | Scripted conversion via `getUilmFile` → ARB |
| RESX files (.NET) | Scripted conversion via `getUilmFile` → RESX XML |
| ngx-translate (Angular) | HTTP loader replacement using `getUilmFile` |
| gettext (.po files) | Conversion script via `getUilmFile` → PO |

---

## i18next Bridge (React, Next.js, Node.js)

### Custom Backend Plugin

Create a custom i18next backend that fetches from the UILM microservice per module. UILM returns flat JSON per module — fetch each module and merge.

```typescript
// src/i18n/blocksBackend.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

interface BlocksBackendOptions {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  namespaces: string[];
  localFallbackPath?: string;
}

export const blocksBackend = {
  type: 'backend' as const,

  async read(language: string, namespace: string, callback: (err: Error | null, data?: Record<string, string>) => void) {
    const options = (this as unknown as { readConfig: () => BlocksBackendOptions }).readConfig?.() ?? {};

    try {
      // UILM API: getUilmFile returns flat { "KEY": "value" } directly — NOT wrapped
      const params = new URLSearchParams({
        Language: language,
        ModuleName: namespace,
        ProjectKey: options.projectId,
      });
      const url = `${options.apiUrl}/uilm/v1/Key/GetUilmFile?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `ApiKey ${options.apiKey}`,
          'X-Project-ID': options.projectId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`UILM fetch failed: ${response.statusText}`);
      }

      // getUilmFile returns flat JSON directly — NOT data.translations
      const translations = await response.json() as Record<string, string>;
      callback(null, translations);
    } catch (error) {
      // Fall back to local files if UILM is unavailable
      const localPath = `${options.localFallbackPath ?? '/locales'}/${language}/${namespace}.json`;
      try {
        const local = await import(/* webpackIgnore: true */ localPath);
        callback(null, local.default ?? local);
      } catch {
        callback(error as Error, undefined);
      }
    }
  },

  createLanguages(languages: string[], _namespace: string, callback: (err: Error | null, data?: string[]) => void) {
    callback(null, languages);
  },
};

// i18n.ts configuration — legacy ngx-translate config being replaced
// After migration, use the Blocks pattern with loadTranslations instead of ns arrays
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { blocksBackend } from './blocksBackend';

i18n
  .use(blocksBackend)
  .use(initReactI18next)
  .init({
    backend: {
      apiUrl: process.env.NEXT_PUBLIC_BLOCKS_API_URL,
      apiKey: process.env.NEXT_PUBLIC_X_BLOCKS_KEY,
      projectId: process.env.NEXT_PUBLIC_X_BLOCKS_KEY,
      namespaces: ['common', 'home', 'auth'],
      localFallbackPath: '/locales',
    },
    ns: ['common', 'home', 'auth', 'errors'],
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

> [!IMPORTANT]
> `getUilmFile` returns flat `{ "KEY": "value" }` directly — NOT wrapped in `{data}` or `{translations: {...}}`.

### Dual-Read Pattern

If some namespaces should prefer local files (partially migrated):

```typescript
// src/i18n/dualBackend.ts
export const dualBackend = {
  type: 'backend' as const,

  async read(language: string, namespace: string, callback: (err: Error | null, data?: Record<string, string>) => void) {
    const migratedNamespaces = ['common', 'auth']; // from UILM

    // 1. Try local file first for non-migrated namespaces
    if (!migratedNamespaces.includes(namespace)) {
      try {
        const local = await import(/* webpackIgnore: true */ `/locales/${language}/${namespace}.json`);
        return callback(null, local.default ?? local);
      } catch { /* fall through */ }
    }

    // 2. Try UILM via getUilmFile
    try {
      const params = new URLSearchParams({
        Language: language,
        ModuleName: namespace,
        ProjectKey: process.env.NEXT_PUBLIC_X_BLOCKS_KEY!,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BLOCKS_API_URL}/uilm/v1/Key/GetUilmFile?${params}`, {
        headers: {
          'Authorization': `ApiKey ${process.env.NEXT_PUBLIC_X_BLOCKS_KEY}`,
          'X-Project-ID': process.env.NEXT_PUBLIC_X_BLOCKS_KEY!,
        },
      });
      const translations = await res.json() as Record<string, string>;
      callback(null, translations);
    } catch (error) {
      callback(error as Error, undefined);
    }
  },
};
```

---

## ARB Bridge (Flutter)

### Conversion Script: getUilmFile → ARB

```dart
// scripts/convert_to_arb.dart
// Converts UILM getUilmFile response to Flutter ARB format
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

import 'dart:convert';
import 'dart:io';

class ArbConverter {
  static Map<String, dynamic> convertFromUilmJson(
    Map<String, String> translations,
    String locale,
  ) {
    final arb = <String, dynamic>{
      '@_locale': locale,
      '@@last_modified': DateTime.now().toIso8601String(),
    };

    for (final entry in translations.entries) {
      arb[entry.key] = entry.value;
      arb['@${entry.key}'] = {
        'description': 'Auto-synced from Blocks Localization Microservice',
      };
    }

    return arb;
  }

  static Future<void> writeArbFile(
    Map<String, String> translations,
    String locale,
    String outputPath,
  ) async {
    final arb = convertFromUilmJson(translations, locale);
    final file = File(outputPath);
    await file.writeAsString(
      const JsonEncoder.withIndent('  ').convert(arb),
    );
    print('Written ARB file: $outputPath ($translations.length keys)');
  }
}

// Usage:
// dart run scripts/convert_to_arb.dart --module common --locale en --output lib/l10n/app_en.arb
```

---

## RESX Bridge (.NET Blazor)

### Conversion Script: getUilmFile → RESX XML

```csharp
// scripts/ConvertToResx.cs
// Converts UILM getUilmFile response to .NET RESX XML format
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

using System.Text;
using System.Xml.Linq;

namespace Blocks.Localization;

public static class ResxConverter
{
    public static XDocument ConvertFromUilmJson(
        Dictionary<string, string> translations,
        string locale)
    {
        var doc = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement("root",
                new XElement("resheader",
                    new XAttribute("name", "resmimetype"),
                    new XElement("value", "text/microsoft-resx")),
                new XElement("resheader",
                    new XAttribute("name", "version"),
                    new XElement("value", "2.0")),
                new XElement("resheader",
                    new XAttribute("name", "reader"),
                    new XElement("value", "System.Resources.ResXResourceReader")),
                new XElement("resheader",
                    new XAttribute("name", "writer"),
                    new XElement("value", "System.Resources.ResXResourceWriter")),
                new XElement("data",
                    new XAttribute("name", "__Locale"),
                    new XAttribute(XNamespace.Xml + "space", "preserve"),
                    new XElement("value", locale))
            )
        );

        var root = doc.Root!;
        foreach (var kvp in translations)
        {
            root.Add(new XElement("data",
                new XAttribute("name", kvp.Key),
                new XAttribute(XNamespace.Xml + "space", "preserve"),
                new XElement("value", kvp.Value)));
        }

        return doc;
    }

    public static void WriteResxFile(
        Dictionary<string, string> translations,
        string locale,
        string outputPath)
    {
        var doc = ConvertFromUilmJson(translations, locale);
        doc.Save(outputPath);
        Console.WriteLine($"Written RESX file: {outputPath} ({translations.Count} keys)");
    }
}
```

---

## ngx-translate Bridge (Angular)

### HTTP Loader Replacement

Replace the ngx-translate HTTP loader to use `getUilmFile`:

```typescript
// src/app/services/blocks-translate-loader.ts
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export class BlocksTranslateLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private apiUrl: string,
    private apiKey: string,
    private projectId: string,
    private namespaces: string[] = ['common']
  ) {}

  getTranslation(lang: string): Observable<Record<string, string>> {
    // UILM: getUilmFile returns flat { "KEY": "value" } directly — fetch per module
    const requests = this.namespaces.map(ns => {
      const params = new URLSearchParams({
        Language: lang,
        ModuleName: ns,
        ProjectKey: this.projectId,
      });
      return this.http.get<Record<string, string>>(
        `${this.apiUrl}/uilm/v1/Key/GetUilmFile?${params}`,
        {
          headers: {
            'Authorization': `ApiKey ${this.apiKey}`,
            'X-Project-ID': this.projectId,
          },
        }
      ).pipe(
        catchError(() => of({} as Record<string, string>))
      );
    });

    return forkJoin(requests).pipe(
      map(results => {
        const merged: Record<string, string> = {};
        for (const result of results) {
          Object.assign(merged, result);
        }
        return merged;
      })
    );
  }
}
```

Register in `app.config.ts`:

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
  ]
};

// In your TranslateModule.forRoot():
// TranslateModule.forRoot({
//   loader: {
//     provide: TranslateLoader,
//     useFactory: () => new BlocksTranslateLoader(
//       http, 'https://api.blocks.example.com',
//       'YOUR_API_KEY', 'YOUR_PROJECT_KEY',
//       ['common', 'home', 'auth']
//     ),
//   },
// })
```

---

## gettext Bridge (Legacy PO files)

### Conversion Script: getUilmFile → PO

```python
# scripts/convert_to_po.py
# Converts UILM getUilmFile flat JSON response to GNU gettext PO format
# TODO: REPLACE_WITH_ACTUAL_API_TYPES

import json
from datetime import datetime

def convert_to_po(translations: dict, locale: str, output_path: str):
    """
    Converts a flat TranslationMap dict from UILM getUilmFile to PO file format.
    translations: { "KEY_NAME": "translated value", ... }
    """
    lines = [
        '# Translation file generated by Blocks Localization',
        f'# Locale: {locale}',
        f'# Generated: {datetime.now().isoformat()}',
        'msgid ""',
        'msgstr ""',
        '"Content-Type: text/plain; charset=UTF-8\\n"',
        '',
    ]

    for key, value in translations.items():
        lines.append(f'msgid "{key}"')
        lines.append(f'msgstr "{value}"')
        lines.append('')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'Written PO file: {output_path} ({len(translations)} keys)')
```

---

## Migration Checklist

When bridging a legacy project:

1. **Audit first** — identify all existing translation files, keys, and namespaces
2. **Prioritize namespaces** — migrate high-traffic/visible strings first (auth, common, errors)
3. **Use correct UILM API** — `getUilmFile` returns flat `{KEY: value}` per module directly, NOT wrapped
4. **Keep local files as fallback** — do not delete them; they serve as offline fallback
5. **Monitor for key drift** — compare microservice keys with local files periodically
6. **Communicate the migration** — let translators know the source of truth has moved
7. **Deprecate old workflow** — stop encouraging manual edits to local files; direct all edits through the microservice
