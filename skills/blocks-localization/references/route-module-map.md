# Route-Module Map Reference

The localization system uses a **dual-module pattern** where every route loads:

1. **`common` module** — Shared keys (navigation, footer, shared UI) — always loaded
2. **Route-specific module** — Derived from the URL pathname

## Why Dual-Module Loading?

| Alternative | Problem |
|-------------|---------|
| Single "common" module | Becomes bloated; all keys loaded everywhere |
| All modules at once | Too many API calls; most modules unused |
| Route-specific only | Shared keys must be duplicated across modules |

## Implementation

### `route-module-map.ts`

```typescript
// src/lib/route-module-map.ts

export const DEFAULT_MODULE = "common";

export function getRouteModuleName(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] || "home";
}

export function getModulesForRoute(pathname: string, availableModules: string[]): string[] {
  const routeModule = getRouteModuleName(pathname);
  const modulesToLoad: string[] = [DEFAULT_MODULE];

  if (routeModule !== DEFAULT_MODULE && availableModules.includes(routeModule)) {
    modulesToLoad.push(routeModule);
  } else if (!availableModules.includes(routeModule)) {
    if (availableModules.includes("home")) {
      modulesToLoad.push("home");
    }
  }

  return [...new Set(modulesToLoad)];
}
```

## Route → Module Mapping Table

| Route Pathname | Route Module Name | Modules Loaded |
|---------------|------------------|----------------|
| `/` | `home` | `["common", "home"]` |
| `/home` | `home` | `["common", "home"]` |
| `/about` | `about` | `["common", "about"]` |
| `/auth/login` | `auth` | `["common", "auth"]` |
| `/auth/register` | `auth` | `["common", "auth"]` |
| `/dashboard` | `dashboard` | `["common", "dashboard"]` |
| `/unknown-page` | `unknown-page` | `["common", "home"]` (falls back to home) |

## Loading Modules in LanguageProvider

```typescript
// In LanguageProvider
const modules = getModulesForRoute(currentPathname, availableModules);

const { data: translationsData } = useQuery({
  queryKey: ["translations", modules, selectedLanguage],
  queryFn: async () => {
    const results: Record<string, Record<string, string>> = {};
    for (const mod of modules) {
      results[mod] = await getUilmFile(selectedLanguage, mod);
    }
    return results;
  },
  enabled: !!selectedLanguage && isHydrated && availableLanguages.length > 0,
});
```

## `availableModules` Configuration

`availableModules` must be fetched dynamically from `GET /uilm/v1/Module/Gets`. The API returns a flat array with `{ itemId, moduleName }` — map to a string array.

```typescript
// Primary — fetch from API
const { data: moduleData } = useQuery({
  queryKey: ["availableModules"],
  queryFn: getModules,
});
const availableModules = moduleData?.map((m) => m.moduleName) ?? ["common"];
```

Fallback to `["common"]` only if the API is unavailable — this is the minimum set of modules that must always be loaded.

Hardcoding `availableModules = ["common", "home", "about", "auth", "dashboard"]` is **not recommended** — it causes missing modules and 404s when new modules are created in UILM.

## SPA Navigation

For SPAs (Vite, Remix, SvelteKit), `usePathname()` from the router library detects navigation changes. Update `currentPathname` in a `useEffect`:

```typescript
useEffect(() => {
  startTransition(() => {
    if (pathname) setCurrentPathname(pathname);
  });
}, [pathname]);
```

Use `startTransition` to avoid cascading renders warning.
