# Blazor .NET Reference

Blazor Server and Blazor WebAssembly integration with the Blocks UILM API.

For **React** (Next.js / Vite), see `flows/client-i18n-setup.md` instead.

## Directory Structure

```
BlazorApp/
├── Services/
│   └── LocalizationService.cs    # UILM API calls
├── Models/
│   └── LocalizationModels.cs      # Interfaces matching contracts.md
├── Components/
│   ├── LanguageSelector.razor
│   └── Translation.razor          # t() component
└── Program.cs
```

## Types Layer

Match exact field names from `contracts.md`:

```csharp
// Models/LocalizationModels.cs
// TODO: REPLACE_WITH_ACTUAL_API_TYPES

public class Language
{
    public string ItemId { get; set; } = "";
    public string LanguageName { get; set; } = "";
    public string LanguageCode { get; set; } = "";
    public bool IsDefault { get; set; }
    public string ProjectKey { get; set; } = "";
}

public class Translation
{
    public string LanguageCode { get; set; } = "";
    public string Value { get; set; } = "";
}

public class TranslationKey
{
    public string KeyId { get; set; } = "";
    public string KeyName { get; set; } = "";
    public string ModuleName { get; set; } = "";
    public string ProjectKey { get; set; } = "";
    public List<Resource> Resources { get; set; } = new();
}
```

> [!IMPORTANT]
> Use exact field names: `ItemId`, `LanguageName`, `LanguageCode`, `ModuleName` (for modules), `ModuleId` (for keys), `KeyName`. Use `Resources[]` not `Translations[]`. See `contracts.md`.

## Services Layer

```
Create: Services/LocalizationService.cs
Key patterns:
  - Inject HttpClient via IHttpClientFactory or HttpClient DI
  - Headers: x-blocks-key: {projectKey}
  - GetLanguagesAsync: GET /uilm/v1/Language/Gets?ProjectKey={key}
    → Returns List<Language> directly
  - GetModulesAsync: GET /uilm/v1/Module/Gets?ProjectKey={key}
    → Returns list with { ItemId, ModuleName }
  - GetUilmFileAsync: GET /uilm/v1/Key/GetUilmFile?Language={lang}&ModuleName={module}&ProjectKey={key}
    → Returns Dictionary<string, string> directly — NOT wrapped
  // TODO: REPLACE_WITH_ACTUAL_API_TYPES
```

### Auth Headers

Blazor Server has access to server-side HttpClient. For Blazor WebAssembly, use the `Authorization` header via `HttpClient`:

```csharp
request.Headers.Add("x-blocks-key", _projectKey);
```

## App-Wide Locale State

Blazor doesn't have a React context equivalent. Use a cascading service:

```
Pattern:
  - Register LocalizationService as Scoped in DI
  - Use [CascadingParameter] or inject directly in components
  - On init: fetch getLanguages(), find isDefault language, auto-load common module translations
  - For Blazor WebAssembly: use localStorage/JS interop for locale persistence and extension support
```

## Locale Selector Component

```
Create: Components/LocaleSelector.razor
Key patterns:
  - Inject LocalizationService
  - OnInitializedAsync: load available languages
  - On selection: update current locale (store in localStorage for WASM)
  - Show dropdown with language names
```

## Translation Component

```
Create: Components/Translation.razor
Key patterns:
  - [Parameter] Key: the translation key
  - [Parameter] Module: the module name (default: "common")
  - [CascadingParameter] CurrentLocale
  - Fetch getUilmFile for the module on mount
  - Display translation value, fallback to key
```

## Program.cs (Blazor Server)

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("Localization", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Localise:ApiUrl"] ?? "");
});

builder.Services.AddScoped<LocalizationService>(sp =>
{
    var httpClient = sp.GetRequiredService<IHttpClientFactory>()
        .CreateClient("Localization");
    var apiKey = builder.Configuration["Localise:ApiKey"] ?? "";
    var projectKey = builder.Configuration["Localise:ProjectKey"] ?? "";
    return new LocalizationService(httpClient, apiKey, projectKey);
});

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();
app.MapRazorComponents<App>().AddInteractiveServerComponents();
app.Run();
```

## appsettings.json

```json
{
  "Localise": {
    "ApiUrl": "https://api.example.com",
    "ApiKey": "your_api_key",
    "ProjectKey": "your_project_key"
  }
}
```

> [!IMPORTANT]
> For **Blazor WebAssembly**, store the `projectKey` in `localStorage['projectKey']` on init to enable the UILM browser extension on `localhost`. Blazor Server can rely on the server-side config. For WASM, use JS interop to set localStorage:
> ```csharp
> await JSRuntime.InvokeVoidAsync("localStorage.setItem", "projectKey", _projectKey);
> ```

## TODO Checklist

- [ ] Add `Microsoft.Extensions.Http` package for `IHttpClientFactory`
- [ ] Create `Models/LocalizationModels.cs` with exact field names
- [ ] Create `Services/LocalizationService.cs` with `x-blocks-key` header
- [ ] Register services in `Program.cs` with `AddHttpClient` and scoped DI
- [ ] Add credentials to `appsettings.json`
- [ ] Create `LocaleSelector` and `Translation` components
- [ ] For Blazor WASM: persist locale in `localStorage` via `IJSRuntime`
