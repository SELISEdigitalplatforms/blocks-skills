# Blazor .NET CI/CD Deployment

## Overview

Blazor WebAssembly and Blazor Server projects can integrate with SELISE Blocks CloudBuild for automated builds and deployments.

## Deployment Flow

1. **Connect repo** — Use `setup-repository-flow` to connect the GitHub repo
2. **Configure settings** — Use `update-repo-settings` for hosting config
3. **Create webhook** — Use `create-github-webhook` for push-triggered builds
4. **Monitor** — Use `get-build` with polling

## .NET Service

```csharp
// Services/CloudbuildService.cs
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace MyApp.Services;

public class CloudbuildService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly string _projectKey;

    public CloudbuildService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config["BlocksApiUrl"] + "/cloudbuild/v1";
        _projectKey = config["ProjectKey"] ?? throw new InvalidOperationException("ProjectKey not configured");
    }

    private HttpRequestMessage AuthenticatedRequest(HttpMethod method, string url)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("x-blocks-key", _projectKey);
        request.Headers.Add("Content-Type", "application/json");
        return request;
    }

    public async Task<BuildTriggerResponse> TriggerBuildAsync(RepoBuildRequest request)
    {
        request.ProjectKey = _projectKey;
        var httpRequest = AuthenticatedRequest(HttpMethod.Post, $"{_baseUrl}/Build/run-build");
        httpRequest.Content = JsonContent.Create(request);
        var response = await _http.SendAsync(httpRequest);
        return await response.Content.ReadFromJsonAsync<BuildTriggerResponse>() ?? new BuildTriggerResponse();
    }

    public async Task<BuildDetailResponse> GetBuildAsync(string buildId)
    {
        var url = $"{_baseUrl}/Build?buildId={buildId}&ProjectKey={_projectKey}";
        var request = AuthenticatedRequest(HttpMethod.Get, url);
        var response = await _http.SendAsync(request);
        return await response.Content.ReadFromJsonAsync<BuildDetailResponse>() ?? new BuildDetailResponse();
    }

    public async Task<ReposResponse> GetReposAsync()
    {
        var url = $"{_baseUrl}/Build/repos?ProjectKey={_projectKey}";
        var request = AuthenticatedRequest(HttpMethod.Get, url);
        var response = await _http.SendAsync(request);
        return await response.Content.ReadFromJsonAsync<ReposResponse>() ?? new ReposResponse();
    }

    public async Task UpdateRepoSettingsAsync(RepoUpdateRequest request)
    {
        request.ProjectKey = _projectKey;
        var httpRequest = AuthenticatedRequest(HttpMethod.Post, $"{_baseUrl}/Build/repo-settings-update");
        httpRequest.Content = JsonContent.Create(request);
        await _http.SendAsync(httpRequest);
    }

    public async Task<HostingConfigResponse> GetHostingConfigAsync()
    {
        var request = AuthenticatedRequest(HttpMethod.Get, $"{_baseUrl}/VcsRepository/HostingConfiguration");
        var response = await _http.SendAsync(request);
        return await response.Content.ReadFromJsonAsync<HostingConfigResponse>() ?? new HostingConfigResponse();
    }
}

// DTOs
public class RepoBuildRequest
{
    [JsonPropertyName("repoId")] public string RepoId { get; set; } = "";
    [JsonPropertyName("projectKey")] public string ProjectKey { get; set; } = "";
    [JsonPropertyName("hostingProviderId")] public string? HostingProviderId { get; set; }
    [JsonPropertyName("regionId")] public string? RegionId { get; set; }
    [JsonPropertyName("machineConfigId")] public string? MachineConfigId { get; set; }
}

public class RepoUpdateRequest : RepoBuildRequest
{
    [JsonPropertyName("deploymentType")] public string? DeploymentType { get; set; }
    [JsonPropertyName("customDomain")] public string? CustomDomain { get; set; }
}

public class BuildTriggerResponse
{
    [JsonPropertyName("buildId")] public string? BuildId { get; set; }
    [JsonPropertyName("isSuccess")] public bool IsSuccess { get; set; }
    [JsonPropertyName("errors")] public Dictionary<string, string> Errors { get; set; } = new();
}

public class BuildDetailResponse
{
    [JsonPropertyName("isSuccess")] public bool IsSuccess { get; set; }
    [JsonPropertyName("data")] public BuildData? Data { get; set; }
}

public class BuildData
{
    [JsonPropertyName("build")] public Build? Build { get; set; }
}

public class Build
{
    [JsonPropertyName("buildId")] public string? BuildId { get; set; }
    [JsonPropertyName("branch")] public string? Branch { get; set; }
    [JsonPropertyName("status")] public string? Status { get; set; }
    [JsonPropertyName("commitHash")] public string? CommitHash { get; set; }
}

public class ReposResponse
{
    [JsonPropertyName("isSuccess")] public bool IsSuccess { get; set; }
    [JsonPropertyName("data")] public ReposData? Data { get; set; }
}

public class ReposData
{
    [JsonPropertyName("repos")] public List<Repo> Repos { get; set; } = new();
}

public class Repo
{
    [JsonPropertyName("repoId")] public string? RepoId { get; set; }
    [JsonPropertyName("repoUrl")] public string? RepoUrl { get; set; }
}

public class HostingConfigResponse
{
    [JsonPropertyName("isSuccess")] public bool IsSuccess { get; set; }
    [JsonPropertyName("data")] public HostingData? Data { get; set; }
}

public class HostingData
{
    [JsonPropertyName("hostingProviders")] public List<HostingProvider> HostingProviders { get; set; } = new();
}

public class HostingProvider
{
    [JsonPropertyName("id")] public string? Id { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("region")] public List<Region> Regions { get; set; } = new();
}

public class Region
{
    [JsonPropertyName("id")] public string? Id { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("machineSpecs")] public List<MachineSpec> MachineSpecs { get; set; } = new();
}

public class MachineSpec
{
    [JsonPropertyName("id")] public string? Id { get; set; }
    [JsonPropertyName("cpu")] public string? Cpu { get; set; }
    [JsonPropertyName("ram")] public string? Ram { get; set; }
}
```

## Blazor Component

```razor
@inject CloudbuildService Cloudbuild
@inject IConfiguration Configuration

<div class="deploy-panel">
    @if (_loading)
    {
        <p>Triggering build...</p>
    }
    else if (!string.IsNullOrEmpty(_buildId))
    {
        <p>Build ID: @_buildId</p>
        <p>Status: @_status</p>
    }
    else if (!string.IsNullOrEmpty(_error))
    {
        <p class="text-danger">@_error</p>
    }

    <button @onclick="TriggerBuild" disabled="@_loading" class="btn btn-primary">
        Deploy to Cloud
    </button>
</div>

@code {
    private bool _loading;
    private string? _buildId;
    private string? _status;
    private string? _error;
    private Timer? _timer;

    private async Task TriggerBuild()
    {
        _loading = true;
        _error = null;

        var result = await Cloudbuild.TriggerBuildAsync(new RepoBuildRequest
        {
            RepoId = "my-repo-id"
        });

        _loading = false;

        if (result.IsSuccess && !string.IsNullOrEmpty(result.BuildId))
        {
            _buildId = result.BuildId;
            StartPolling(result.BuildId);
        }
        else
        {
            _error = string.Join(", ", result.Errors.Values);
        }
    }

    private void StartPolling(string buildId)
    {
        _timer = new Timer(async _ =>
        {
            var detail = await Cloudbuild.GetBuildAsync(buildId);
            var newStatus = detail.Data?.Build?.Status;

            await InvokeAsync(() =>
            {
                _status = newStatus;
                if (newStatus is "Succeeded" or "Failed" or "Cancelled")
                {
                    _timer?.Dispose();
                }
                StateHasChanged();
            });
        }, null, TimeSpan.Zero, TimeSpan.FromSeconds(10));
    }
}
```

## Program.cs Registration

```csharp
builder.Services.AddHttpClient<CloudbuildService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["BlocksApiUrl"] ?? "");
});

builder.Services.AddSingleton(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new CloudbuildService(
        sp.GetRequiredService<HttpClient>(),
        config
    );
});
```

## appsettings.json

```json
{
  "BlocksApiUrl": "https://api.seliseblocks.com",
  "ProjectKey": "YOUR_PROJECT_KEY"
}
```

## GitHub Actions (Blazor)

```yaml
# .github/workflows/deploy.yml
name: Deploy Blazor App
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'
      - name: Build
        run: dotnet build -c Release
      - name: Publish
        run: dotnet publish -c Release -o ./publish
      - name: Trigger Blocks Build
        run: |
          curl -X POST "${{ vars.BLOCKS_API_URL }}/cloudbuild/v1/Build/run-build" \
            -H "x-blocks-key: ${{ vars.BLOCKS_PROJECT_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"repoId": "${{ vars.BLOCKS_REPO_ID }}", "projectKey": "${{ vars.BLOCKS_PROJECT_KEY }}"}'
```
