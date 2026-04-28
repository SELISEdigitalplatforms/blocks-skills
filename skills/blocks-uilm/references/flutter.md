# Flutter Reference

Flutter integration with the Blocks UILM API. Uses `http` package for API calls and Riverpod for state management.

For **React** (Next.js / Vite) i18n patterns, see `flows/client-i18n-setup.md` instead. Flutter uses Riverpod + `http` package instead of React Query + context.

## Directory Structure

```
lib/
├── services/
│   └── localization_service.dart     # API calls to UILM
├── models/
│   └── localization_types.dart      # Types matching contracts.md
├── providers/
│   └── localization_providers.dart  # Riverpod providers
└── widgets/
    └── locale_switcher.dart        # Language switcher
```

## Types Layer

Match exact field names from `contracts.md`:

```dart
// lib/models/localization_types.dart
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

class Language {
  final String itemId;
  final String languageName;
  final String languageCode;
  final bool isDefault;
  final String projectKey;

  Language({
    required this.itemId,
    required this.languageName,
    required this.languageCode,
    required this.isDefault,
    required this.projectKey,
  });

  factory Language.fromJson(Map<String, dynamic> json) {
    return Language(
      itemId: json['itemId'] as String,
      languageName: json['languageName'] as String,
      languageCode: json['languageCode'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
      projectKey: json['projectKey'] as String,
    );
  }
}
```

> [!IMPORTANT]
> Use exact field names: `itemId`, `languageName`, `languageCode`, `moduleName` (for modules), `moduleId` (for keys), `keyName`. Use `resources[]` not `translations[]`. See `contracts.md`.

## Services Layer

Create `localization_service.dart` using the `http` package:

```
Create: lib/services/localization_service.dart
Key patterns:
  - Headers: x-blocks-key: {projectKey}
  - getLanguages: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns List<Language> directly (not wrapped)
  - getModules: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns list with { itemId, moduleName }
  - getUilmFile: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns flat Map<String, String> directly — NOT wrapped in data or translations
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

For `getUilmFile`, use URL query parameters with capitalized keys: `Language`, `ModuleName`, `ProjectKey`.

## Environment Config

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String apiUrl = 'https://api.seliseblocks.com';
  static const String apiKey = 'your_api_key';
  static const String projectKey = 'your_project_key';
}
```

> [!IMPORTANT]
> For **Flutter Web**, store the `projectKey` in `localStorage['projectKey']` on app init to enable the UILM browser extension on `localhost`. For mobile platforms, use `SharedPreferences` — the extension only works on web.

## Riverpod Providers

```
Create: lib/providers/localization_providers.dart
Key patterns:
  - localizationServiceProvider: Provider((ref) => LocalizationService(...))
  - currentLanguageProvider: StateProvider<String>('en')
  - availableLanguagesProvider: FutureProvider<List<Language>>
  - On init: resolve availableLanguages, find isDefault language, auto-load common module translations
  - translationsProvider: FutureProvider.family<Map<String, String>, (String, String)>
    → fetches getUilmFile(language, moduleName)
  - isHydratedProvider: Provider<bool> — true after initial load
  - isRTL: ['ar', 'he', 'fa', 'ur'].any((l) => code.startsWith(l))
```

## Locale Switcher Widget

```
Create: lib/widgets/locale_switcher.dart
Key patterns:
  - ConsumerWidget using availableLanguagesProvider
  - DropdownButton/ListTile to select language
  - On selection: update currentLanguageProvider
  - Show CircularProgressIndicator until isHydrated
```

## Using Translations

```dart
// In a ConsumerWidget or Consumer
final translations = ref.watch(translationsProvider((language, moduleName)));
final t = (String key) => translations.whenOrNull(
  data: (map) => map[key] ?? key,
  orElse: () => key,
);
```

## Dual-Module Loading

Flutter routes can follow the same dual-module pattern:

```
Pattern:
  Route /          → Modules: ["common", "home"]
  Route /about    → Modules: ["common", "about"]
  Route /auth    → Modules: ["common", "auth"]
```

For each route, fetch `common` + route-specific `getUilmFile` and merge the maps.

## pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  flutter_riverpod: ^2.4.0
```

## TODO Checklist

- [ ] Add `http` and `flutter_riverpod` to `pubspec.yaml`
- [ ] Create `lib/models/localization_types.dart` with exact field names
- [ ] Create `lib/services/localization_service.dart` with `x-blocks-key` header
- [ ] Create `lib/providers/localization_providers.dart` with Riverpod
- [ ] Implement dual-module loading per route
- [ ] Create `LocaleSwitcher` widget
- [ ] Set up `ApiConfig` with credentials
- [ ] Test with UILM browser extension key-mode toggle
