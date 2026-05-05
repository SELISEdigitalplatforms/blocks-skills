# Blazor .NET — UDS Data Management

## Overview

This guide covers integrating UDS data management into a Blazor .NET application.

## Setup

Install the HTTP client package:
```bash
dotnet add package System.Net.Http.Json
```

## HttpClient Service

```csharp
// Services/UdsService.cs
using System.Net.Http.Json;
using System.Text.Json;

public class UdsService
{
    private readonly HttpClient _http;
    private readonly string _xBlocksKey;
    private readonly string _baseUrl;

    public UdsService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config["Uds:BaseUrl"] ?? "https://api.example.com";
        _xBlocksKey = config["Uds:XBlocksKey"] ?? throw new Exception("XBlocksKey not configured");
        _http.DefaultRequestHeaders.Add("x-blocks-key", _xBlocksKey);
    }

    public async Task<T> GraphQlQuery<T>(string query, object? variables = null)
    {
        var payload = new { query, variables };
        var response = await _http.PostAsJsonAsync($"{_baseUrl}/uds/v1/{ProjectSlug}/gateway", payload);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        if (json.TryGetProperty("errors", out var errors) && errors.GetArrayLength() > 0)
            throw new Exception(errors[0].GetProperty("message").GetString());
        return json.GetProperty("data").Deserialize<T>()!;
    }

    public async Task<JsonElement> PostAsync(string path, object body)
    {
        var response = await _http.PostAsJsonAsync($"{_baseUrl}{path}", body);
        return await response.Content.ReadFromJsonAsync<JsonElement>() ?? default;
    }

    public async Task<JsonElement> GetAsync(string path)
    {
        return await _http.GetFromJsonAsync<JsonElement>($"{_baseUrl}{path}") ?? default;
    }
}
```

## GraphQL Data Access

```csharp
// Pages/Products.razor
@inject UdsService Uds

<h3>Products</h3>

@if (products != null)
{
    <ul>
        @foreach (var p in products.Items)
        {
            <li>@p.Name - @p.Price</li>
        }
    </ul>
}

@code {
    private ProductList? products;

    protected override async Task OnInitializedAsync()
    {
        // GraphQL query as string
        var query = @"
            query {
                getProducts(page: 1, pageSize: 20) {
                    items { _id name price }
                    totalCount
                }
            }";
        products = await Uds.GraphQlQuery<ProductList>(query);
    }

    public class ProductList
    {
        public List<Product> Items { get; set; } = new();
        public int TotalCount { get; set; }
    }

    public class Product
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
    }
}
```

## Schema Management

```csharp
// Services/UdsService.cs (continued)

public async Task DefineSchema(string collectionName, string schemaName, List<FieldDef> fields)
{
    var body = new
    {
        collectionName,
        schemaName,
        projectKey = _xBlocksKey,  // Use XBlocksKey, NOT projectSlug
        schemaType = 1,  // 1=Entity, 2=Dto
        fields = fields.Select(f => new
        {
            name = f.Name,
            type = f.Type,
            isArray = f.IsArray,
            isPIIData = false,
            isUniqueData = false,
            description = ""
        })
    };
    await PostAsync("/uds/v1/schemas/define", body);
    // Reload after schema change
    await ReloadConfiguration();
}

public async Task ReloadConfiguration()
{
    await _http.PostAsync($"{_baseUrl}/uds/v1/configurations/reload?projectKey={_xBlocksKey}", null);
}
```

## File Upload

```csharp
public async Task<string> UploadToS3(HttpClient http, Stream fileStream, string fileName)
{
    // Step 1: Get pre-signed URL
    var urlRes = await http.PostAsJsonAsync($"{_baseUrl}/uds/v1/Files/GetPreSignedUrlForUpload", new
    {
        name = fileName,
        projectKey = _xBlocksKey
    });
    var urlData = await urlRes.Content.ReadFromJsonAsync<JsonElement>();
    var uploadUrl = urlData.GetProperty("uploadUrl").GetString()!;
    var fileId = urlData.GetProperty("fileId").GetString()!;

    // Step 2: PUT to S3
    using var content = new StreamContent(fileStream);
    content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
    await http.PutAsync(uploadUrl, content);

    return fileId;
}
```

## Access Policies

```csharp
public async Task CreateAccessPolicy(string schemaName, string schemaId, string roleSlug, int operation)
{
    var body = new
    {
        policyName = $"{roleSlug}-{operation}-access",
        policyType = 0,  // RoleBased
        operation = operation,  // 0=Read, 1=Create, 2=Update, 3=Delete, 4=All
        schemaName,
        schemaId,
        projectKey = _xBlocksKey,
        ruleGroup = new
        {
            logicalOperator = 1,  // Or
            rules = new[] {
                new {
                    leftSource = 1,       // Context
                    leftOperand = "role",
                    operator = 0,        // Equals
                    rightSource = 0,     // Static
                    rightOperand = roleSlug,
                    description = $"{roleSlug} role"
                }
            },
            nestedGroups = Array.Empty<object>()
        },
        priority = 1,
        isAllowPolicy = true
    };
    await PostAsync("/uds/v1/data-access/policy/create", body);
}
```

## Key Patterns

- Inject `UdsService` via `@inject` or constructor DI
- Always use `_xBlocksKey` for `projectKey` in REST request bodies
- Use `JsonElement` for flexible JSON parsing, or deserialize to typed classes
- Call `ReloadConfiguration()` after any schema/data-source change
- GraphQL queries are sent as plain strings to the gateway endpoint
- Access policies use integer enums: `operation`, `policyType`, `logicalOperator`
