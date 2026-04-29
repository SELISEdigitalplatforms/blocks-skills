# Blazor .NET 7+ — Identity & Access Reference

Implements authentication and authorization for Blazor Server and Blazor WebAssembly apps using SELISE Blocks IDP v1 API.

Assumes `.NET 7+` with either `MudBlazor` (default) or `Tailwind CSS` as the UI layer. Read `core/app-scaffold-blazor.md` or `core/app-scaffold-blazor-tailwind.md` for the shared project scaffold.

---

## Module Structure

```
Modules/Auth/
├── Components/
│   ├── SigninEmail.razor
│   ├── SigninSso.razor
│   ├── SigninOidc.razor
│   ├── SignupForm.razor
│   ├── SetPasswordForm.razor
│   ├── ForgotPasswordForm.razor
│   ├── ResetPasswordForm.razor
│   ├── OtpInput.razor
│   ├── PasswordStrength.razor
│   └── CaptchaWidget.razor
├── Pages/
│   ├── SigninPage.razor
│   ├── SignupPage.razor
│   ├── ActivatePage.razor
│   ├── VerifyMfaPage.razor
│   ├── ForgotPasswordPage.razor
│   ├── ResetPasswordPage.razor
│   ├── SentEmailPage.razor
│   ├── SuccessPage.razor
│   ├── ActivateFailedPage.razor
│   └── OidcCallbackPage.razor
├── Services/
│   └── AuthService.cs
└── Models/
    ├── AuthModels.cs
    └── AuthErrorMap.cs
```

---

## AppSettings

```csharp
public class AppSettings
{
    public string ApiBaseUrl { get; set; } = string.Empty;
    public string XBlocksKey { get; set; } = string.Empty;
    public string OidcClientId { get; set; } = string.Empty;
    public string OidcRedirectUri { get; set; } = string.Empty;
    public string ProjectSlug { get; set; } = string.Empty;
    public string? CaptchaSiteKey { get; set; }
    public string CaptchaType { get; set; } = "reCaptcha";
}
```

Environment config (`.env` or `appsettings.json`):

```json
{
  "ApiBaseUrl": "https://api.blocks.cloud",
  "XBlocksKey": "your-project-key",
  "OidcClientId": "your-client-id",
  "OidcRedirectUri": "https://yourapp.com/oidc",
  "ProjectSlug": "your-project-slug",
  "CaptchaSiteKey": "optional-captcha-key",
  "CaptchaType": "reCaptcha"
}
```

---

## AuthState Service

Stores tokens via `Blazored.LocalStorage` and publishes auth state changes via `OnAuthStateChanged`. Used by `CustomAuthStateProvider` for Blazor Server/WASM.

```csharp
// State/AuthState.cs
using System.Text.Json;
using Blazored.LocalStorage;

public class AuthState
{
    private readonly ILocalStorageService _local;
    private const string AccessTokenKey = "auth.access_token";
    private const string RefreshTokenKey = "auth.refresh_token";
    private const string UserKey = "auth.user";

    public bool IsAuthenticated => !string.IsNullOrEmpty(AccessToken);
    public string AccessToken { get; private set; } = string.Empty;
    public string RefreshToken { get; private set; } = string.Empty;
    public UserInfo? User { get; private set; }

    public event Action? OnAuthStateChanged;

    public AuthState(ILocalStorageService local) => _local = local;

    public async Task InitializeAsync()
    {
        AccessToken = await _local.GetItemAsStringAsync(AccessTokenKey) ?? string.Empty;
        RefreshToken = await _local.GetItemAsStringAsync(RefreshTokenKey) ?? string.Empty;
        var userJson = await _local.GetItemAsStringAsync(UserKey);
        User = string.IsNullOrEmpty(userJson) ? null : JsonSerializer.Deserialize<UserInfo>(userJson);
    }

    public async Task LoginAsync(string accessToken, string refreshToken, UserInfo? user = null)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        User = user;
        await _local.SetItemAsStringAsync(AccessTokenKey, accessToken);
        await _local.SetItemAsStringAsync(RefreshTokenKey, refreshToken);
        if (user is not null)
            await _local.SetItemAsStringAsync(UserKey, JsonSerializer.Serialize(user));
        OnAuthStateChanged?.Invoke();
    }

    public async Task SetAccessTokenAsync(string accessToken)
    {
        AccessToken = accessToken;
        await _local.SetItemAsStringAsync(AccessTokenKey, accessToken);
        OnAuthStateChanged?.Invoke();
    }

    public async Task SetRefreshTokenAsync(string refreshToken)
    {
        RefreshToken = refreshToken;
        await _local.SetItemAsStringAsync(RefreshTokenKey, refreshToken);
    }

    public async Task SetUserAsync(UserInfo user)
    {
        User = user;
        await _local.SetItemAsStringAsync(UserKey, JsonSerializer.Serialize(user));
        OnAuthStateChanged?.Invoke();
    }

    public async Task LogoutAsync()
    {
        AccessToken = string.Empty;
        RefreshToken = string.Empty;
        User = null;
        await _local.RemoveItemAsync(AccessTokenKey);
        await _local.RemoveItemAsync(RefreshTokenKey);
        await _local.RemoveItemAsync(UserKey);
        OnAuthStateChanged?.Invoke();
    }
}
```

Register in `Program.cs`:

```csharp
builder.Services.AddScoped<AuthState>();
```

---

## CustomAuthStateProvider

For Blazor Server/WASM, override `GetAuthenticationStateAsync` using `AuthState`:

```csharp
// State/CustomAuthStateProvider.cs
using System.Security.Claims;

public class CustomAuthStateProvider : AuthenticationStateProvider
{
    private readonly AuthState _authState;

    public CustomAuthStateProvider(AuthState authState)
    {
        _authState = authState;
        _authState.OnAuthStateChanged += RaiseAuthStateChanged;
    }

    public override Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        if (!_authState.IsAuthenticated)
            return Task.FromResult(new AuthenticationState(new ClaimsPrincipal()));

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, _authState.User?.Email ?? ""),
            new Claim(ClaimTypes.NameIdentifier, _authState.User?.UserId ?? ""),
            new Claim("access_token", _authState.AccessToken),
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        return Task.FromResult(new AuthenticationState(new ClaimsPrincipal(identity)));
    }

    private void RaiseAuthStateChanged() => NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
}
```

Register in `Program.cs`:

```csharp
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<AuthState>();
builder.Services.AddAuthorizationCore();
```

Add to `App.razor`:

```razor
<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)">
                <NotAuthorized>
                    <RedirectToLogin />
                </NotAuthorized>
            </AuthorizeRouteView>
        </Found>
    </Router>
</CascadingAuthenticationState>
```

---

## TokenDelegatingHandler

Automatically attaches the `Authorization` header and refreshes tokens on 401. Wire into the named `HttpClient`:

```csharp
// Services/TokenDelegatingHandler.cs
public class TokenDelegatingHandler : DelegatingHandler
{
    private readonly AuthState _authState;
    private readonly IAuthService _authService;

    public TokenDelegatingHandler(AuthState authState, IAuthService authService)
    {
        _authState = authState;
        _authService = authService;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(_authState.AccessToken))
        {
            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authState.AccessToken);
        }

        var response = await base.SendAsync(request, cancellationToken);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            var refreshed = await TryRefreshTokenAsync();
            if (refreshed)
            {
                request.Headers.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authState.AccessToken);
                return await base.SendAsync(request, cancellationToken);
            }
            await _authState.LogoutAsync();
        }

        return response;
    }

    private async Task<bool> TryRefreshTokenAsync()
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(_authState.RefreshToken);
            if (result.IsSuccess && result.AccessToken is not null)
            {
                await _authState.SetAccessTokenAsync(result.AccessToken);
                await _authState.SetRefreshTokenAsync(result.RefreshToken);
                return true;
            }
        }
        catch { }
        return false;
    }
}
```

Register in `Program.cs`:

```csharp
builder.Services.AddHttpClient("BlocksApi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "");
    client.DefaultRequestHeaders.Add("x-blocks-key", builder.Configuration["XBlocksKey"]);
})
.AddHttpMessageHandler<TokenDelegatingHandler>();
```

Inject with `IHttpClientFactory`:

```csharp
var http = _httpFactory.CreateClient("BlocksApi");
```

---

## AuthService

`AuthService.cs` wraps all IDP v1 API calls. Components never call `HttpClient` directly.

```csharp
// Modules/Auth/Services/AuthService.cs
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

public interface IAuthService
{
    Task<SigninResponse> SigninAsync(SigninPayload payload);
    Task<SigninResponse> SigninWithMfaAsync(MfaSigninPayload payload);
    Task<SigninResponse> SigninWithAuthorizationCodeAsync(AuthorizationCodePayload payload);
    Task<BaseResponse> SignupAsync(SignupPayload payload);
    Task<ValidateActivationCodeResponse> ValidateActivationCodeAsync(ValidateActivationCodePayload payload);
    Task<BaseResponse> ActivateAsync(ActivateUserPayload payload);
    Task<BaseResponse> ForgotPasswordAsync(ForgotPasswordPayload payload);
    Task<BaseResponse> ResetPasswordAsync(ResetPasswordPayload payload);
    Task<LoginOptionsResponse> GetLoginOptionsAsync();
    Task<BaseResponse> ResendOtpAsync(ResendOtpPayload payload);
    Task LogoutAsync(LogoutPayload payload);
    Task<LogoutAllResponse> LogoutAllAsync(string refreshToken);
    Task<UserInfoResponse> GetUserInfoAsync();
    Task<SessionsResponse> GetSessionsAsync(int page = 1, int pageSize = 10);
    Task<UserInfoResponse> GetCurrentUserAsync();
    Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken);
}

public class AuthService : IAuthService
{
    private readonly HttpClient _http;
    private readonly AppSettings _settings;

    public AuthService(HttpClient http, AppSettings settings)
    {
        _http = http;
        _settings = settings;
    }

    public async Task<SigninResponse> SigninAsync(SigninPayload payload)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["username"] = payload.Username,
            ["password"] = payload.Password,
        });
        var response = await _http.PostAsync("/idp/v1/Authentication/Token", content);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return SigninResponse.Parse(json);
    }

    public async Task<SigninResponse> SigninWithMfaAsync(MfaSigninPayload payload)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "mfa_code",
            ["client_id"] = _settings.OidcClientId,
            ["mfa_id"] = payload.MfaId,
            ["mfa_type"] = payload.MfaType,
            ["otp"] = payload.Otp,
        });
        var response = await _http.PostAsync("/idp/v1/Authentication/Token", content);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return SigninResponse.Parse(json);
    }

    public async Task<SigninResponse> SigninWithAuthorizationCodeAsync(AuthorizationCodePayload payload)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = _settings.OidcClientId,
            ["code"] = payload.Code,
            ["redirect_uri"] = _settings.OidcRedirectUri,
        });
        var response = await _http.PostAsync("/idp/v1/Authentication/Token", content);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return SigninResponse.Parse(json);
    }

    public async Task<BaseResponse> SignupAsync(SignupPayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/User/Create", payload);
        return await response.Content.ReadFromJsonAsync<BaseResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<ValidateActivationCodeResponse> ValidateActivationCodeAsync(
        ValidateActivationCodePayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/User/ValidateActivationCode", payload);
        return await response.Content.ReadFromJsonAsync<ValidateActivationCodeResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<BaseResponse> ActivateAsync(ActivateUserPayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/User/Activate", payload);
        return await response.Content.ReadFromJsonAsync<BaseResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<BaseResponse> ForgotPasswordAsync(ForgotPasswordPayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/User/ForgotPassword", payload);
        return await response.Content.ReadFromJsonAsync<BaseResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<BaseResponse> ResetPasswordAsync(ResetPasswordPayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/User/ResetPassword", payload);
        return await response.Content.ReadFromJsonAsync<BaseResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<SigninResponse> VerifyMfaAsync(MfaSigninPayload payload)
        => await SigninWithMfaAsync(payload);

    public async Task<LoginOptionsResponse> GetLoginOptionsAsync()
    {
        var response = await _http.PostAsJsonAsync(
            "/idp/v1/Authentication/GetLoginOptions",
            new { projectKey = _settings.ProjectSlug });
        return await response.Content.ReadFromJsonAsync<LoginOptionsResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<BaseResponse> ResendOtpAsync(ResendOtpPayload payload)
    {
        var response = await _http.PostAsJsonAsync("/idp/v1/Mfa/ResendOtp", payload);
        return await response.Content.ReadFromJsonAsync<BaseResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task LogoutAsync(LogoutPayload payload)
    {
        await _http.PostAsJsonAsync("/idp/v1/Authentication/Logout", payload);
    }

    public async Task<LogoutAllResponse> LogoutAllAsync(string refreshToken)
    {
        var response = await _http.PostAsJsonAsync(
            "/idp/v1/Authentication/LogoutAll",
            new { refreshToken });
        return await response.Content.ReadFromJsonAsync<LogoutAllResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<UserInfoResponse> GetUserInfoAsync()
    {
        var response = await _http.GetAsync("/idp/v1/Authentication/GetUserInfo");
        return await response.Content.ReadFromJsonAsync<UserInfoResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<SessionsResponse> GetSessionsAsync(int page = 1, int pageSize = 10)
    {
        var response = await _http.GetAsync(
            $"/idp/v1/Iam/GetSessions?Page={page}&PageSize={pageSize}");
        return await response.Content.ReadFromJsonAsync<SessionsResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<UserInfoResponse> GetCurrentUserAsync()
    {
        var response = await _http.GetAsync("/idp/v1/Account/GetAccount");
        return await response.Content.ReadFromJsonAsync<UserInfoResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["client_id"] = _settings.OidcClientId,
        });
        var response = await _http.PostAsync("/idp/v1/Authentication/Token", content);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<RefreshTokenResponse>()
            ?? throw new InvalidOperationException("Invalid response");
    }
}
```

Register in `Program.cs`:

```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
```

---

## C# Models

```csharp
// Modules/Auth/Models/AuthModels.cs
using System.Text.Json.Serialization;

public class BaseResponse
{
    [JsonPropertyName("isSuccess")]
    public bool IsSuccess { get; set; }

    [JsonPropertyName("errors")]
    public Dictionary<string, string> Errors { get; set; } = new();
}

public record SigninPayload(string Username, string Password);

public record MfaSigninPayload(string MfaId, string MfaType, string Otp);

public record AuthorizationCodePayload(string Code);

public record SignupPayload(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("projectKey")] string ProjectKey,
    [property: JsonPropertyName("mailPurpose")] string MailPurpose = "activation"
);

public record ValidateActivationCodePayload(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("projectKey")] string ProjectKey
);

public record ActivateUserPayload(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("password")] string Password,
    [property: JsonPropertyName("projectKey")] string ProjectKey,
    [property: JsonPropertyName("captchaCode")] string? CaptchaCode = null,
    [property: JsonPropertyName("mailPurpose")] string? MailPurpose = null,
    [property: JsonPropertyName("preventPostEvent")] bool PreventPostEvent = false
);

public record ForgotPasswordPayload(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("projectKey")] string ProjectKey,
    [property: JsonPropertyName("captchaCode")] string? CaptchaCode = null
);

public record ResetPasswordPayload(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("password")] string Password,
    [property: JsonPropertyName("projectKey")] string ProjectKey
);

public record ResendOtpPayload(
    [property: JsonPropertyName("mfaId")] string MfaId,
    [property: JsonPropertyName("projectKey")] string ProjectKey
);

public record LogoutPayload([property: JsonPropertyName("refreshToken")] string RefreshToken);

public class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("id_token")]
    public string? IdToken { get; set; }
}

public class RefreshTokenResponse
{
    [JsonPropertyName("isSuccess")]
    public bool IsSuccess { get; set; }

    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class MfaResponse
{
    [JsonPropertyName("enable_mfa")]
    public bool EnableMfa { get; set; }

    [JsonPropertyName("mfaType")]
    public string MfaType { get; set; } = string.Empty;

    [JsonPropertyName("mfaId")]
    public string MfaId { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public class SigninResponse
{
    public bool IsMfa { get; private set; }
    public TokenResponse? Token { get; private set; }
    public MfaResponse? Mfa { get; private set; }

    public static SigninResponse Parse(JsonElement json)
    {
        if (json.TryGetProperty("enable_mfa", out var mfaProp) && mfaProp.GetBoolean())
        {
            return new SigninResponse
            {
                IsMfa = true,
                Mfa = JsonSerializer.Deserialize<MfaResponse>(json.GetRawText())
            };
        }
        return new SigninResponse
        {
            IsMfa = false,
            Token = JsonSerializer.Deserialize<TokenResponse>(json.GetRawText())
        };
    }
}

public class ValidateActivationCodeResponse : BaseResponse
{
    [JsonPropertyName("isValid")]
    public bool IsValid { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

public class LoginOptionsResponse : BaseResponse
{
    [JsonPropertyName("loginOptions")]
    public List<LoginOption> LoginOptions { get; set; } = new();
}

public class LoginOption
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("providers")]
    public List<string> Providers { get; set; } = new();
}

public class UserInfoResponse : BaseResponse
{
    [JsonPropertyName("data")]
    public UserInfo? Data { get; set; }
}

public class UserInfo
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("mfaEnabled")]
    public bool MfaEnabled { get; set; }

    [JsonPropertyName("userMfaType")]
    public string? UserMfaType { get; set; }

    [JsonPropertyName("allowedLogInType")]
    public List<string> AllowedLogInType { get; set; } = new();

    [JsonPropertyName("roles")]
    public List<string> Roles { get; set; } = new();

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("organizations")]
    public List<UserOrganization> Organizations { get; set; } = new();
}

public class UserOrganization
{
    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }
}

public class SessionsResponse : BaseResponse
{
    [JsonPropertyName("data")]
    public List<SessionInfo> Data { get; set; } = new();

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }
}

public class SessionInfo
{
    [JsonPropertyName("sessionId")]
    public string SessionId { get; set; } = string.Empty;

    [JsonPropertyName("device")]
    public string Device { get; set; } = string.Empty;

    [JsonPropertyName("ipAddress")]
    public string IpAddress { get; set; } = string.Empty;

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("lastAccessDate")]
    public DateTime LastAccessDate { get; set; }

    [JsonPropertyName("isCurrentSession")]
    public bool IsCurrentSession { get; set; }
}

public class LogoutAllResponse : BaseResponse
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }
}
```

---

## AuthErrorMap

```csharp
// Modules/Auth/Models/AuthErrorMap.cs
public static class AuthErrorMap
{
    private static readonly Dictionary<string, string> ErrorKeys = new()
    {
        ["INVALID_CREDENTIALS"] = "auth.error.invalidCredentials",
        ["EMAIL_PASSWORD_NOT_VALID"] = "auth.error.invalidCredentials",
        ["invalid_request"] = "auth.error.genericError",
        ["ACCOUNT_LOCKED"] = "auth.error.accountLocked",
        ["ACCOUNT_NOT_ACTIVATED"] = "auth.error.accountNotActivated",
        ["INVALID_ACTIVATION_CODE"] = "auth.error.invalidActivationCode",
        ["ACTIVATION_CODE_EXPIRED"] = "auth.error.activationCodeExpired",
        ["INVALID_RESET_CODE"] = "auth.error.invalidResetCode",
        ["RESET_CODE_EXPIRED"] = "auth.error.resetCodeExpired",
        ["EMAIL_NOT_FOUND"] = "auth.error.emailNotFound",
        ["INVALID_OTP"] = "auth.error.invalidOtp",
        ["OTP_EXPIRED"] = "auth.error.otpExpired",
    };

    public static string GetMessage(string errorCode, ILocalizationService localizer)
    {
        var key = ErrorKeys.GetValueOrDefault(errorCode, "auth.error.genericError");
        return localizer[key];
    }

    public static string GetMessage(Dictionary<string, string> errors, ILocalizationService localizer)
    {
        if (errors.Count == 0) return localizer["auth.error.genericError"];
        var firstError = errors.Values.First();
        return ErrorKeys.TryGetValue(firstError, out var mapped)
            ? localizer[mapped]
            : firstError;
    }
}
```

---

## ProtectedRoute Component

Redirects unauthenticated users to login:

```razor
@* Components/Shared/ProtectedRoute.razor *@
@inject AuthState AuthState
@inject NavigationManager Navigation
@implements IDisposable

@if (_isAuthorized)
{
    @ChildContent
}
else if (_isLoading)
{
    <MudProgressLinear Indeterminate="true" Color="Color.Primary" />
}
else
{
    Navigation.NavigateTo("/login", forceLoad: false);
}

@code {
    [Parameter] public RenderFragment? ChildContent { get; set; }
    private bool _isAuthorized;
    private bool _isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        _authState.OnAuthStateChanged += OnAuthStateChanged;
        await UpdateAuthState();
    }

    private async Task UpdateAuthState()
    {
        _isAuthorized = _authState.IsAuthenticated;
        _isLoading = false;
        StateHasChanged();
    }

    private async Task OnAuthStateChanged() => await UpdateAuthState();

    public void Dispose() => _authState.OnAuthStateChanged -= OnAuthStateChanged;
}
```

Usage:

```razor
<ProtectedRoute>
    <DashboardPage />
</ProtectedRoute>
```

---

## SigninPage

### MudBlazor Variant

```razor
@* Modules/Auth/Pages/SigninPage.razor — MudBlazor *@
@page "/login"
@layout EmptyLayout
@inject IAuthService AuthService
@inject AuthState AuthState
@inject NavigationManager Navigation
@inject ILocalizationService Localizer
@inject ISnackbar Snackbar
@inject AppSettings AppSettings

<MudContainer MaxWidth="MaxWidth.Small" Class="d-flex align-center" Style="min-height: 100vh;">
    <MudPaper Elevation="3" Class="pa-8 rounded-lg" Style="width: 100%;">
        <MudText Typo="Typo.h4" Align="Align.Center" Class="mb-6">
            @Localizer["auth.login.title"]
        </MudText>

        @if (!string.IsNullOrEmpty(_errorMessage))
        {
            <MudAlert Severity="Severity.Error" Class="mb-4" Dense="true">
                @_errorMessage
            </MudAlert>
        }

        @if (_isLoadingOptions)
        {
            <MudSkeleton SkeletonType="SkeletonType.Rectangle" Height="200px" />
        }
        else
        {
            @if (_loginOptions.Any(o => o.Type == "Email"))
            {
                <SigninEmail OnSignin="HandleSignin" IsLoading="_isLoading" />
            }

            @if (_loginOptions.Any(o => o.Type == "SocialLogin"))
            {
                <MudDivider Class="my-4" />
                <SigninSso Providers="@_loginOptions.First(o => o.Type == "SocialLogin").Providers" />
            }

            @if (_loginOptions.Any(o => o.Type == "SSO"))
            {
                <MudDivider Class="my-4" />
                <SigninOidc />
            }
        }

        <MudLink Href="/signup" Typo="Typo.body2" Class="mt-4 d-block text-center">
            @Localizer["auth.login.noAccount"]
        </MudLink>
    </MudPaper>
</MudContainer>

@code {
    private List<LoginOption> _loginOptions = new();
    private bool _isLoadingOptions = true;
    private bool _isLoading;
    private string? _errorMessage;

    protected override async Task OnInitializedAsync()
    {
        if (AuthState.IsAuthenticated)
        {
            Navigation.NavigateTo("/", forceLoad: false);
            return;
        }
        try
        {
            var response = await AuthService.GetLoginOptionsAsync();
            _loginOptions = response.LoginOptions;
        }
        catch { _errorMessage = Localizer["auth.error.genericError"]; }
        finally { _isLoadingOptions = false; }
    }

    private async Task HandleSignin(SigninPayload payload)
    {
        try
        {
            _isLoading = true;
            _errorMessage = null;
            var result = await AuthService.SigninAsync(payload);
            if (result.IsMfa)
            {
                Navigation.NavigateTo($"/verify-mfa?mfaId={result.Mfa!.MfaId}&mfaType={result.Mfa.MfaType}");
            }
            else
            {
                var user = await AuthService.GetCurrentUserAsync();
                await AuthState.LoginAsync(result.Token!.AccessToken, result.Token.RefreshToken, user.Data);
                Navigation.NavigateTo("/", forceLoad: false);
            }
        }
        catch { _errorMessage = AuthErrorMap.GetMessage("INVALID_CREDENTIALS", Localizer); }
        finally { _isLoading = false; }
    }
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Pages/SigninPage.razor — Tailwind *@
@page "/login"
@layout EmptyLayout
@inject IAuthService AuthService
@inject AuthState AuthState
@inject NavigationManager Navigation
@inject ILocalizationService Localizer
@inject ToastService Toast
@inject AppSettings AppSettings

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 class="mb-6 text-center text-2xl font-bold text-gray-900">
            @Localizer["auth.login.title"]
        </h1>

        @if (!string.IsNullOrEmpty(_errorMessage))
        {
            <ErrorAlert Message="@_errorMessage" Class="mb-4" />
        }

        @if (_isLoadingOptions)
        {
            <div class="flex justify-center py-12">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></span>
            </div>
        }
        else
        {
            @if (_loginOptions.Any(o => o.Type == "Email"))
            {
                <SigninEmail OnSignin="HandleSignin" IsLoading="_isLoading" />
            }

            @if (_loginOptions.Any(o => o.Type == "SocialLogin"))
            {
                <div class="my-4 border-t border-gray-200"></div>
                <SigninSso Providers="@_loginOptions.First(o => o.Type == "SocialLogin").Providers" />
            }

            @if (_loginOptions.Any(o => o.Type == "SSO"))
            {
                <div class="my-4 border-t border-gray-200"></div>
                <SigninOidc />
            }
        }

        <a href="/signup" class="mt-4 block text-center text-sm text-primary hover:underline">
            @Localizer["auth.login.noAccount"]
        </a>
    </div>
</div>

@code {
    private List<LoginOption> _loginOptions = new();
    private bool _isLoadingOptions = true;
    private bool _isLoading;
    private string? _errorMessage;

    protected override async Task OnInitializedAsync()
    {
        if (AuthState.IsAuthenticated)
        {
            Navigation.NavigateTo("/", forceLoad: false);
            return;
        }
        try
        {
            var response = await AuthService.GetLoginOptionsAsync();
            _loginOptions = response.LoginOptions;
        }
        catch { _errorMessage = Localizer["auth.error.genericError"]; }
        finally { _isLoadingOptions = false; }
    }

    private async Task HandleSignin(SigninPayload payload)
    {
        try
        {
            _isLoading = true;
            _errorMessage = null;
            var result = await AuthService.SigninAsync(payload);
            if (result.IsMfa)
            {
                Navigation.NavigateTo($"/verify-mfa?mfaId={result.Mfa!.MfaId}&mfaType={result.Mfa.MfaType}");
            }
            else
            {
                var user = await AuthService.GetCurrentUserAsync();
                await AuthState.LoginAsync(result.Token!.AccessToken, result.Token.RefreshToken, user.Data);
                Navigation.NavigateTo("/", forceLoad: false);
            }
        }
        catch { _errorMessage = AuthErrorMap.GetMessage("INVALID_CREDENTIALS", Localizer); }
        finally { _isLoading = false; }
    }
}
```

---

## SigninEmail Component

### MudBlazor Variant

```razor
@* Modules/Auth/Components/SigninEmail.razor — MudBlazor *@
@inject ILocalizationService Localizer

<MudForm @ref="_form" Model="_model" Validation="_validator.ValidateValue">
    <MudTextField @bind-Value="_model.Email"
                  Label="@Localizer["auth.login.emailLabel"]"
                  For="@(() => _model.Email)"
                  Variant="Variant.Outlined"
                  InputType="InputType.Email"
                  Class="mb-4"
                  Immediate="true" />

    <MudTextField @bind-Value="_model.Password"
                  Label="@Localizer["auth.login.passwordLabel"]"
                  For="@(() => _model.Password)"
                  Variant="Variant.Outlined"
                  InputType="@(_showPassword ? InputType.Text : InputType.Password)"
                  Adornment="Adornment.End"
                  AdornmentIcon="@(_showPassword ? Icons.Material.Filled.Visibility : Icons.Material.Filled.VisibilityOff)"
                  OnAdornmentClick="() => _showPassword = !_showPassword"
                  Class="mb-2" />

    <MudLink Href="/forgot-password" Typo="Typo.body2" Class="d-block text-right mb-4">
        @Localizer["auth.login.forgotPassword"]
    </MudLink>

    <MudButton Color="Color.Primary"
               Variant="Variant.Filled"
               FullWidth="true"
               OnClick="HandleSubmit"
               Disabled="@IsLoading">
        @if (IsLoading)
        {
            <MudProgressCircular Size="Size.Small" Indeterminate="true" Class="mr-2" />
        }
        @Localizer["auth.login.signInButton"]
    </MudButton>
</MudForm>

@code {
    [Parameter] public EventCallback<SigninPayload> OnSignin { get; set; }
    [Parameter] public bool IsLoading { get; set; }

    private MudForm _form = default!;
    private SigninFormModel _model = new();
    private SigninValidator _validator = default!;
    private bool _showPassword;

    [Inject] private ILocalizationService _localizer { get; set; } = default!;

    protected override void OnInitialized()
    {
        _validator = new SigninValidator(_localizer);
    }

    private async Task HandleSubmit()
    {
        await _form.Validate();
        if (_form.IsValid)
        {
            await OnSignin.InvokeAsync(new SigninPayload(_model.Email, _model.Password));
        }
    }

    public class SigninFormModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SigninValidator : AbstractValidator<SigninFormModel>
    {
        public SigninValidator(ILocalizationService localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["validation.email.required"])
                .EmailAddress().WithMessage(localizer["validation.email.invalid"]);
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(localizer["validation.password.required"]);
        }
    }
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Components/SigninEmail.razor — Tailwind *@
@inject ILocalizationService Localizer

<EditForm Model="_model" OnValidSubmit="HandleSubmit" class="space-y-4">
    <FluentValidationValidator Validator="_validator" />

    <div>
        <label class="label">@Localizer["auth.login.emailLabel"]</label>
        <InputText @bind-Value="_model.Email" type="email" class="input" />
        <ValidationMessage For="@(() => _model.Email)" class="text-red-500 text-xs mt-1" />
    </div>

    <div>
        <label class="label">@Localizer["auth.login.passwordLabel"]</label>
        <div class="relative">
            <InputText @bind-Value="_model.Password"
                       type="@(_showPassword ? "text" : "password")"
                       class="input pr-10" />
            <button type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    @onclick="() => _showPassword = !_showPassword">
                @if (_showPassword)
                {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                }
                else
                {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                }
            </button>
        </div>
        <ValidationMessage For="@(() => _model.Password)" class="text-red-500 text-xs mt-1" />
    </div>

    <div class="text-right">
        <a href="/forgot-password" class="text-sm text-primary hover:underline">
            @Localizer["auth.login.forgotPassword"]
        </a>
    </div>

    <button type="submit" class="btn-primary w-full" disabled="@IsLoading">
        @if (IsLoading)
        {
            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
        }
        @Localizer["auth.login.signInButton"]
    </button>
</EditForm>

@code {
    [Parameter] public EventCallback<SigninPayload> OnSignin { get; set; }
    [Parameter] public bool IsLoading { get; set; }

    private SigninFormModel _model = new();
    private SigninValidator _validator = default!;
    private bool _showPassword;

    [Inject] private ILocalizationService _localizer { get; set; } = default!;

    protected override void OnInitialized()
    {
        _validator = new SigninValidator(_localizer);
    }

    private async Task HandleSubmit()
    {
        await OnSignin.InvokeAsync(new SigninPayload(_model.Email, _model.Password));
    }

    public class SigninFormModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SigninValidator : AbstractValidator<SigninFormModel>
    {
        public SigninValidator(ILocalizationService localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["validation.email.required"])
                .EmailAddress().WithMessage(localizer["validation.email.invalid"]);
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(localizer["validation.password.required"]);
        }
    }
}
```

---

## OtpInput Component

### MudBlazor Variant

```razor
@* Modules/Auth/Components/OtpInput.razor — MudBlazor *@
@inject ILocalizationService Localizer

<div class="d-flex gap-2 justify-center">
    @for (int i = 0; i < Length; i++)
    {
        var index = i;
        <MudTextField @ref="_inputs[index]"
                      T="string"
                      Value="@_values[index]"
                      ValueChanged="@(v => OnDigitChangedAsync(index, v))"
                      Variant="Variant.Outlined"
                      MaxLength="1"
                      InputType="InputType.Number"
                      Style="width: 48px; text-align: center;"
                      Class="otp-digit"
                      Disabled="@IsDisabled"
                      @onkeydown="@(e => OnKeyDown(e, index))"
                      Placeholder="@Localizer["auth.otp.digitPlaceholder"]" />
    }
</div>

@if (_hasError)
{
    <MudText Typo="Typo.caption" Color="Color.Error" Align="Align.Center" Class="mt-2">
        @Localizer["auth.otp.invalidCode"]
    </MudText>
}

@code {
    [Parameter] public int Length { get; set; } = 6;
    [Parameter] public EventCallback<string> OnComplete { get; set; }
    [Parameter] public bool IsDisabled { get; set; }
    [Parameter] public bool HasError { get => _hasError; set => _hasError = value; }

    private MudTextField<string>[] _inputs = default!;
    private string[] _values = default!;
    private bool _hasError;

    protected override void OnInitialized()
    {
        _inputs = new MudTextField<string>[Length];
        _values = new string[Length];
    }

    private async Task OnDigitChangedAsync(int index, string value)
    {
        if (!string.IsNullOrEmpty(value) && !char.IsDigit(value[0])) return;
        _values[index] = value;
        _hasError = false;
        if (!string.IsNullOrEmpty(value) && index < Length - 1)
            await _inputs[index + 1].FocusAsync();
        var otp = string.Join("", _values);
        if (otp.Length == Length && _values.All(v => !string.IsNullOrEmpty(v)))
            await OnComplete.InvokeAsync(otp);
    }

    private async Task OnKeyDown(KeyboardEventArgs e, int index)
    {
        if (e.Key == "Backspace" && string.IsNullOrEmpty(_values[index]) && index > 0)
        {
            _values[index - 1] = string.Empty;
            await _inputs[index - 1].FocusAsync();
        }
    }

    public void Reset()
    {
        for (int i = 0; i < Length; i++) _values[i] = string.Empty;
        _hasError = false;
        StateHasChanged();
    }
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Components/OtpInput.razor — Tailwind *@
@inject ILocalizationService Localizer
@inject IJSRuntime JS

<div class="flex items-center justify-center gap-2">
    @for (int i = 0; i < Length; i++)
    {
        var index = i;
        <input @ref="_inputRefs[index]"
               type="text"
               inputmode="numeric"
               maxlength="1"
               value="@_values[index]"
               @oninput="@(e => OnDigitChangedAsync(index, e.Value?.ToString()))"
               @onkeydown="@(e => OnKeyDown(e, index))"
               disabled="@IsDisabled"
               placeholder="@Localizer["auth.otp.digitPlaceholder"]"
               class="h-12 w-12 rounded-md border border-gray-300 text-center text-lg font-semibold
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                      disabled:bg-gray-100 disabled:text-gray-400" />
    }
</div>

@if (_hasError)
{
    <p class="mt-2 text-center text-xs text-red-500">
        @Localizer["auth.otp.invalidCode"]
    </p>
}

@code {
    [Parameter] public int Length { get; set; } = 6;
    [Parameter] public EventCallback<string> OnComplete { get; set; }
    [Parameter] public bool IsDisabled { get; set; }
    [Parameter] public bool HasError { get => _hasError; set => _hasError = value; }

    private ElementReference[] _inputRefs = default!;
    private string[] _values = default!;
    private bool _hasError;

    protected override void OnInitialized()
    {
        _inputRefs = new ElementReference[Length];
        _values = new string[Length];
    }

    private async Task OnDigitChangedAsync(int index, string? value)
    {
        if (!string.IsNullOrEmpty(value) && !char.IsDigit(value[0])) return;
        _values[index] = value ?? string.Empty;
        _hasError = false;
        if (!string.IsNullOrEmpty(value) && index < Length - 1)
            await _inputRefs[index + 1].FocusAsync();
        var otp = string.Join("", _values);
        if (otp.Length == Length && _values.All(v => !string.IsNullOrEmpty(v)))
            await OnComplete.InvokeAsync(otp);
    }

    private async Task OnKeyDown(KeyboardEventArgs e, int index)
    {
        if (e.Key == "Backspace" && string.IsNullOrEmpty(_values[index]) && index > 0)
        {
            _values[index - 1] = string.Empty;
            await _inputRefs[index - 1].FocusAsync();
        }
    }

    public void Reset()
    {
        for (int i = 0; i < Length; i++) _values[i] = string.Empty;
        _hasError = false;
        StateHasChanged();
    }
}
```

Rules:
- Email OTP: **5 digits** / TOTP (authenticator app): **6 digits**
- `<OtpInput Length="@(_mfaType == "email" ? 5 : 6)" OnComplete="HandleVerify" />`

---

## VerifyMfaPage

### MudBlazor Variant

```razor
@* Modules/Auth/Pages/VerifyMfaPage.razor — MudBlazor *@
@page "/verify-mfa"
@layout EmptyLayout
@inject IAuthService AuthService
@inject AuthState AuthState
@inject NavigationManager Navigation
@inject ILocalizationService Localizer

<MudContainer MaxWidth="MaxWidth.ExtraSmall" Class="d-flex align-center" Style="min-height: 100vh;">
    <MudPaper Elevation="3" Class="pa-8 rounded-lg" Style="width: 100%;">
        <MudText Typo="Typo.h5" Align="Align.Center" Class="mb-2">
            @Localizer["auth.mfa.title"]
        </MudText>
        <MudText Typo="Typo.body2" Align="Align.Center" Color="Color.Secondary" Class="mb-6">
            @Localizer["auth.mfa.enterCode"]
        </MudText>

        @if (!string.IsNullOrEmpty(_errorMessage))
        {
            <MudAlert Severity="Severity.Error" Class="mb-4" Dense="true">
                @_errorMessage
            </MudAlert>
        }

        <div class="d-flex justify-center">
            <OtpInput @ref="_otpInput"
                      Length="@(_mfaType == "email" ? 5 : 6)"
                      OnComplete="HandleVerify"
                      IsDisabled="_isLoading" />
        </div>

        @if (_isLoading)
        {
            <MudProgressLinear Indeterminate="true" Color="Color.Primary" Class="mt-4" />
        }

        <MudButton Variant="Variant.Text"
                   Color="Color.Primary"
                   FullWidth="true"
                   Class="mt-4"
                   OnClick="HandleResendOtp"
                   Disabled="_isResending || _mfaType == "authenticator"">
            @Localizer["auth.mfa.resend"]
        </MudButton>
    </MudPaper>
</MudContainer>

@code {
    [SupplyParameterFromQuery] public string? MfaId { get; set; }
    [SupplyParameterFromQuery] public string? MfaType { get; set; }

    private OtpInput _otpInput = default!;
    private string _mfaType = "email";
    private bool _isLoading;
    private bool _isResending;
    private string? _errorMessage;

    [Inject] private AppSettings AppSettings { get; set; } = default!;

    protected override void OnInitialized()
    {
        if (string.IsNullOrEmpty(MfaId)) { Navigation.NavigateTo("/login"); return; }
        _mfaType = MfaType ?? "email";
    }

    private async Task HandleVerify(string otp)
    {
        try
        {
            _isLoading = true;
            _errorMessage = null;
            var result = await AuthService.VerifyMfaAsync(new MfaSigninPayload(MfaId!, _mfaType, otp));
            if (result.Token is not null)
            {
                var user = await AuthService.GetCurrentUserAsync();
                await AuthState.LoginAsync(result.Token.AccessToken, result.Token.RefreshToken, user.Data);
                Navigation.NavigateTo("/", forceLoad: false);
            }
        }
        catch
        {
            _errorMessage = Localizer["auth.error.invalidOtp"];
            _otpInput.Reset();
        }
        finally { _isLoading = false; }
    }

    private async Task HandleResendOtp()
    {
        try { _isResending = true; await AuthService.ResendOtpAsync(new ResendOtpPayload(MfaId!, AppSettings.ProjectSlug)); }
        finally { _isResending = false; }
    }
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Pages/VerifyMfaPage.razor — Tailwind *@
@page "/verify-mfa"
@layout EmptyLayout
@inject IAuthService AuthService
@inject AuthState AuthState
@inject NavigationManager Navigation
@inject ILocalizationService Localizer

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <h1 class="mb-2 text-center text-xl font-bold text-gray-900">
            @Localizer["auth.mfa.title"]
        </h1>
        <p class="mb-6 text-center text-sm text-gray-500">
            @Localizer["auth.mfa.enterCode"]
        </p>

        @if (!string.IsNullOrEmpty(_errorMessage))
        {
            <ErrorAlert Message="@_errorMessage" Class="mb-4" />
        }

        <div class="flex justify-center">
            <OtpInput @ref="_otpInput"
                      Length="@(_mfaType == "email" ? 5 : 6)"
                      OnComplete="HandleVerify"
                      IsDisabled="_isLoading" />
        </div>

        @if (_isLoading)
        {
            <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                <div class="h-1 animate-pulse rounded-full bg-primary" style="width: 100%"></div>
            </div>
        }

        <button class="mt-4 w-full text-center text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
                @onclick="HandleResendOtp"
                disabled="@(_isResending || _mfaType == "authenticator")">
            @Localizer["auth.mfa.resend"]
        </button>
    </div>
</div>

@code {
    [SupplyParameterFromQuery] public string? MfaId { get; set; }
    [SupplyParameterFromQuery] public string? MfaType { get; set; }

    private OtpInput _otpInput = default!;
    private string _mfaType = "email";
    private bool _isLoading;
    private bool _isResending;
    private string? _errorMessage;

    [Inject] private AppSettings AppSettings { get; set; } = default!;

    protected override void OnInitialized()
    {
        if (string.IsNullOrEmpty(MfaId)) { Navigation.NavigateTo("/login"); return; }
        _mfaType = MfaType ?? "email";
    }

    private async Task HandleVerify(string otp)
    {
        try
        {
            _isLoading = true;
            _errorMessage = null;
            var result = await AuthService.VerifyMfaAsync(new MfaSigninPayload(MfaId!, _mfaType, otp));
            if (result.Token is not null)
            {
                var user = await AuthService.GetCurrentUserAsync();
                await AuthState.LoginAsync(result.Token.AccessToken, result.Token.RefreshToken, user.Data);
                Navigation.NavigateTo("/", forceLoad: false);
            }
        }
        catch
        {
            _errorMessage = Localizer["auth.error.invalidOtp"];
            _otpInput.Reset();
        }
        finally { _isLoading = false; }
    }

    private async Task HandleResendOtp()
    {
        try { _isResending = true; await AuthService.ResendOtpAsync(new ResendOtpPayload(MfaId!, AppSettings.ProjectSlug)); }
        finally { _isResending = false; }
    }
}
```

---

## PasswordStrength Component

### MudBlazor Variant

```razor
@* Modules/Auth/Components/PasswordStrength.razor — MudBlazor *@
@inject ILocalizationService Localizer

<MudProgressLinear Color="@GetColor()" Value="@_strengthPercent" Class="mt-2" />
<MudText Typo="Typo.caption" Color="@GetColor()">@GetLabel()</MudText>

<MudList T="string" Dense="true" Class="mt-1">
    <MudListItem Icon="@CheckIcon(_hasMinLength)" IconColor="@CheckColor(_hasMinLength)">
        @Localizer["auth.password.minLength"]
    </MudListItem>
    <MudListItem Icon="@CheckIcon(_hasUpper)" IconColor="@CheckColor(_hasUpper)">
        @Localizer["auth.password.uppercase"]
    </MudListItem>
    <MudListItem Icon="@CheckIcon(_hasLower)" IconColor="@CheckColor(_hasLower)">
        @Localizer["auth.password.lowercase"]
    </MudListItem>
    <MudListItem Icon="@CheckIcon(_hasDigit)" IconColor="@CheckColor(_hasDigit)">
        @Localizer["auth.password.digit"]
    </MudListItem>
    <MudListItem Icon="@CheckIcon(_hasSpecial)" IconColor="@CheckColor(_hasSpecial)">
        @Localizer["auth.password.special"]
    </MudListItem>
</MudList>

@code {
    [Parameter] public string Password { get; set; } = string.Empty;
    [Parameter] public EventCallback<bool> IsStrongChanged { get; set; }

    private bool _hasMinLength, _hasUpper, _hasLower, _hasDigit, _hasSpecial;
    private int _strengthPercent;

    protected override async Task OnParametersSetAsync()
    {
        _hasMinLength = Password.Length >= 8;
        _hasUpper = Password.Any(char.IsUpper);
        _hasLower = Password.Any(char.IsLower);
        _hasDigit = Password.Any(char.IsDigit);
        _hasSpecial = Password.Any(c => !char.IsLetterOrDigit(c));
        _strengthPercent = new[] { _hasMinLength, _hasUpper, _hasLower, _hasDigit, _hasSpecial }.Count(b => b) * 20;
        var isStrong = _strengthPercent >= 80;
        await IsStrongChanged.InvokeAsync(isStrong);
    }

    private Color GetColor() => _strengthPercent switch
    {
        >= 100 => Color.Success,
        >= 80 => Color.Info,
        >= 60 => Color.Warning,
        _ => Color.Error
    };

    private string GetLabel() => _strengthPercent switch
    {
        >= 100 => Localizer["auth.password.veryStrong"],
        >= 80 => Localizer["auth.password.strong"],
        >= 60 => Localizer["auth.password.fair"],
        _ => Localizer["auth.password.weak"]
    };

    private string CheckIcon(bool met) => met ? Icons.Material.Filled.Check : Icons.Material.Filled.Close;
    private Color CheckColor(bool met) => met ? Color.Success : Color.Error;
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Components/PasswordStrength.razor — Tailwind *@
@inject ILocalizationService Localizer

<div class="mt-2">
    <div class="h-2 w-full rounded-full bg-gray-200">
        <div class="h-2 rounded-full transition-all duration-300 @GetBarColor()"
             style="width: @(_strengthPercent)%"></div>
    </div>
    <p class="mt-1 text-xs font-medium @GetTextColor()">@GetLabel()</p>
</div>

<ul class="mt-2 space-y-1">
    @foreach (var (label, met) in new[] {
        (Localizer["auth.password.minLength"], _hasMinLength),
        (Localizer["auth.password.uppercase"], _hasUpper),
        (Localizer["auth.password.lowercase"], _hasLower),
        (Localizer["auth.password.digit"], _hasDigit),
        (Localizer["auth.password.special"], _hasSpecial)
    })
    {
        <li class="flex items-center gap-2 text-xs @(met ? "text-green-600" : "text-red-500")">
            @if (met)
            {
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
            }
            else
            {
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            }
            @label
        </li>
    }
</ul>

@code {
    [Parameter] public string Password { get; set; } = string.Empty;
    [Parameter] public EventCallback<bool> IsStrongChanged { get; set; }

    private bool _hasMinLength, _hasUpper, _hasLower, _hasDigit, _hasSpecial;
    private int _strengthPercent;

    protected override async Task OnParametersSetAsync()
    {
        _hasMinLength = Password.Length >= 8;
        _hasUpper = Password.Any(char.IsUpper);
        _hasLower = Password.Any(char.IsLower);
        _hasDigit = Password.Any(char.IsDigit);
        _hasSpecial = Password.Any(c => !char.IsLetterOrDigit(c));
        _strengthPercent = new[] { _hasMinLength, _hasUpper, _hasLower, _hasDigit, _hasSpecial }.Count(b => b) * 20;
        var isStrong = _strengthPercent >= 80;
        await IsStrongChanged.InvokeAsync(isStrong);
    }

    private string GetBarColor() => _strengthPercent switch
    {
        >= 100 => "bg-green-500",
        >= 80 => "bg-blue-500",
        >= 60 => "bg-yellow-500",
        _ => "bg-red-500"
    };

    private string GetTextColor() => _strengthPercent switch
    {
        >= 100 => "text-green-600",
        >= 80 => "text-blue-600",
        >= 60 => "text-yellow-600",
        _ => "text-red-500"
    };

    private string GetLabel() => _strengthPercent switch
    {
        >= 100 => Localizer["auth.password.veryStrong"],
        >= 80 => Localizer["auth.password.strong"],
        >= 60 => Localizer["auth.password.fair"],
        _ => Localizer["auth.password.weak"]
    };
}
```

Strength thresholds: Weak (0-2/5), Fair (3/5), Strong (4/5), Very Strong (5/5). Disable submit until **Strong** (>= 80%).

---

## CaptchaWidget Component

Shared JS interop — same for MudBlazor and Tailwind:

```razor
@* Components/Shared/CaptchaWidget.razor *@
@inject IJSRuntime JS
@inject AppSettings AppSettings

@if (_captchaEnabled)
{
    <div id="captcha-container" class="mt-2 mb-2"></div>
}

@code {
    [Parameter] public EventCallback<string> OnTokenResolved { get; set; }
    [Parameter] public EventCallback OnTokenExpired { get; set; }

    private bool _captchaEnabled;

    protected override void OnInitialized()
    {
        _captchaEnabled = !string.IsNullOrEmpty(AppSettings.CaptchaSiteKey);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && _captchaEnabled)
        {
            await JS.InvokeVoidAsync("captchaInterop.render",
                "captcha-container",
                AppSettings.CaptchaSiteKey,
                AppSettings.CaptchaType,
                DotNetObjectReference.Create(this));
        }
    }

    [JSInvokable]
    public async Task OnCaptchaResolved(string token) => await OnTokenResolved.InvokeAsync(token);

    [JSInvokable]
    public async Task OnCaptchaExpired() => await OnTokenExpired.InvokeAsync();

    public async Task ResetAsync() => await JS.InvokeVoidAsync("captchaInterop.reset", "captcha-container");
}
```

`wwwroot/js/captcha-interop.js`:

```javascript
window.captchaInterop = {
    render: function (elementId, siteKey, captchaType, dotNetRef) {
        if (captchaType === 'reCaptcha') {
            grecaptcha.render(elementId, {
                sitekey: siteKey,
                callback: (token) => dotNetRef.invokeMethodAsync('OnCaptchaResolved', token),
                'expired-callback': () => dotNetRef.invokeMethodAsync('OnCaptchaExpired')
            });
        } else if (captchaType === 'hCaptcha') {
            hcaptcha.render(elementId, {
                sitekey: siteKey,
                callback: (token) => dotNetRef.invokeMethodAsync('OnCaptchaResolved', token),
                'expired-callback': () => dotNetRef.invokeMethodAsync('OnCaptchaExpired')
            });
        }
    },
    reset: function (elementId) {
        var el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
    }
};
```

---

## OIDC / Social Login

Build the authorization URL and redirect. Social login uses the same flow with provider-specific endpoints.

```csharp
// Modules/Auth/Services/OidcService.cs
public class OidcService
{
    private readonly AppSettings _settings;

    public OidcService(AppSettings settings) => _settings = settings;

    public string BuildAuthorizeUrl(string? state = null, string? nonce = null)
    {
        var baseUrl = _settings.ApiBaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/idp/v1/Authentication/Authorize" +
            $"?X-Blocks-Key={Uri.EscapeDataString(_settings.XBlocksKey)}" +
            $"&client_id={Uri.EscapeDataString(_settings.OidcClientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(_settings.OidcRedirectUri)}" +
            $"&response_type=code" +
            $"&scope=openid";
        if (!string.IsNullOrEmpty(state)) url += $"&state={Uri.EscapeDataString(state)}";
        if (!string.IsNullOrEmpty(nonce)) url += $"&nonce={Uri.EscapeDataString(nonce)}";
        return url;
    }
}
```

Redirect component:

```razor
@inject OidcService OidcService
@inject NavigationManager Navigation

@code {
    protected override void OnInitialized()
    {
        var url = OidcService.BuildAuthorizeUrl(state: Guid.NewGuid().ToString());
        Navigation.NavigateTo(url, forceLoad: true);
    }
}
```

OIDC callback page exchanges the code for tokens:

```razor
@page "/oidc"
@layout EmptyLayout
@inject IAuthService AuthService
@inject AuthState AuthState
@inject NavigationManager Navigation

@code {
    protected override async Task OnInitializedAsync()
    {
        var uri = Navigation.ToAbsoluteUri(Navigation.Uri);
        if (QueryHelpers.ParseQuery(uri.Query).TryGetValue("code", out var code))
        {
            var result = await AuthService.SigninWithAuthorizationCodeAsync(new AuthorizationCodePayload(code!));
            if (result.IsMfa)
            {
                Navigation.NavigateTo($"/verify-mfa?mfaId={result.Mfa!.MfaId}&mfaType={result.Mfa.MfaType}");
            }
            else
            {
                var user = await AuthService.GetCurrentUserAsync();
                await AuthState.LoginAsync(result.Token!.AccessToken, result.Token.RefreshToken, user.Data);
                Navigation.NavigateTo("/", forceLoad: true);
            }
        }
        else
        {
            Navigation.NavigateTo("/login", forceLoad: true);
        }
    }
}
```

---

## Session Management

### MudBlazor Variant

```razor
@* Modules/Auth/Pages/SessionsPage.razor *@
@page "/sessions"
@attribute [Authorize]
@inject IAuthService AuthService
@inject AuthState AuthState
@inject ILocalizationService Localizer
@inject ISnackbar Snackbar

<MudContainer MaxWidth="MaxWidth.Medium" Class="mt-4">
    <MudText Typo="Typo.h5" Class="mb-4">@Localizer["auth.sessions.title"]</MudText>

    @if (_isLoading)
    {
        <MudProgressLinear Indeterminate="true" />
    }
    else
    {
        @foreach (var session in _sessions)
        {
            <MudCard Class="mb-2">
                <MudCardContent>
                    <MudText>@session.Device</MudText>
                    <MudText Typo="Typo.body2" Color="Color.Secondary">
                        @session.IpAddress — @session.LastAccessDate.ToString("g")
                    </MudText>
                    @if (session.IsCurrentSession)
                    {
                        <MudChip Color="Color.Success" Size="Size.Small" Class="mt-1">
                            @Localizer["auth.sessions.current"]
                        </MudChip>
                    }
                </MudCardContent>
                @if (!session.IsCurrentSession)
                {
                    <MudCardActions>
                        <MudButton Color="Color.Error" Size="Size.Small"
                                   OnClick="@(() => HandleLogoutSession(session.SessionId))">
                            @Localizer["auth.sessions.revoke"]
                        </MudButton>
                    </MudCardActions>
                }
            </MudCard>
        }
    }
</MudContainer>

@code {
    private List<SessionInfo> _sessions = new();
    private bool _isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        var response = await AuthService.GetSessionsAsync();
        _sessions = response.Data;
        _isLoading = false;
    }

    private async Task HandleLogoutSession(string sessionId)
    {
        // Revoke specific session via API
        Snackbar.Add(Localizer["auth.sessions.revoked"], Severity.Success);
        await OnInitializedAsync();
    }
}
```

### Tailwind Variant

```razor
@* Modules/Auth/Pages/SessionsPage.razor — Tailwind *@
@page "/sessions"
@attribute [Authorize]
@inject IAuthService AuthService
@inject AuthState AuthState
@inject ILocalizationService Localizer

<div class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold text-gray-900">@Localizer["auth.sessions.title"]</h1>

    @if (_isLoading)
    {
        <div class="flex justify-center py-8">
            <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></span>
        </div>
    }
    else
    {
        <div class="space-y-3">
            @foreach (var session in _sessions)
            {
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-gray-900">@session.Device</p>
                            <p class="text-sm text-gray-500">@session.IpAddress — @session.LastAccessDate.ToString("g")</p>
                        </div>
                        @if (session.IsCurrentSession)
                        {
                            <span class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                @Localizer["auth.sessions.current"]
                            </span>
                        }
                        else
                        {
                            <button class="text-sm text-red-600 hover:underline"
                                    @onclick="@(() => HandleLogoutSession(session.SessionId))">
                                @Localizer["auth.sessions.revoke"]
                            </button>
                        }
                    </div>
                </div>
            }
        </div>
    }
</div>

@code {
    private List<SessionInfo> _sessions = new();
    private bool _isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        var response = await AuthService.GetSessionsAsync();
        _sessions = response.Data;
        _isLoading = false;
    }

    private async Task HandleLogoutSession(string sessionId)
    {
        // Revoke specific session via API
        await OnInitializedAsync();
    }
}
```

---

## Organization Membership Display

Display user's organizations in profile/sidebar:

```razor
@* Modules/Auth/Components/OrganizationBadge.razor — MudBlazor *@
@if (Organizations.Any())
{
    <MudChipSet>
        @foreach (var org in Organizations)
        {
            <MudChip Color="@(org.IsDefault ? Color.Primary : Color.Default)"
                     Variant="Variant.Outlined"
                     Size="Size.Small">
                @org.Name
                @if (org.IsDefault)
                {
                    <MudText Typo="Typo.caption" Class="ml-1">(default)</MudText>
                }
            </MudChip>
        }
    </MudChipSet>
}

@code {
    [Parameter] public List<UserOrganization> Organizations { get; set; } = new();
}
```

```razor
@* Modules/Auth/Components/OrganizationBadge.razor — Tailwind *@
@if (Organizations.Any())
{
    <div class="flex flex-wrap gap-2">
        @foreach (var org in Organizations)
        {
            <span class="@(org.IsDefault
                ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                : "rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600")">
                @org.Name
                @if (org.IsDefault)
                {
                    <span class="ml-1 text-primary/70">(default)</span>
                }
            </span>
        }
    </div>
}

@code {
    [Parameter] public List<UserOrganization> Organizations { get; set; } = new();
}
```

---

## Program.cs Setup

### Blazor Server

```csharp
// Program.cs (Blazor Server)
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBlazoredLocalStorage();
builder.Services.AddScoped<AuthState>();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient("BlocksApi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "");
    client.DefaultRequestHeaders.Add("x-blocks-key", builder.Configuration["XBlocksKey"]);
}).AddHttpMessageHandler<TokenDelegatingHandler>();
builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("BlocksApi"));
builder.Services.AddAuthorizationCore();
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddMudServices();

var app = builder.Build();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapBlazorHub();
app.MapFallbackToPage("/_Host");
app.Run();
```

### Blazor WASM (Minimal)

```csharp
// Program.Minimal.cs (Blazor WASM)
var builder = BlazorWebAssemblyHost.CreateDefaultBuilder()
    .ConfigureWebAssemblyWebApp(builder =>
    {
        builder.BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "");
    });

builder.Services.AddBlazoredLocalStorage();
builder.Services.AddScoped<AuthState>();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient("BlocksApi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "");
    client.DefaultRequestHeaders.Add("x-blocks-key", builder.Configuration["XBlocksKey"]);
}).AddHttpMessageHandler<TokenDelegatingHandler>();
builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("BlocksApi"));
builder.Services.AddAuthorizationCore();

await builder.Build().RunAsync();
```

---

## Route Definitions

All auth pages use `EmptyLayout`. Public routes: `/login`, `/signup`, `/activate`, `/activate-failed`, `/success`, `/forgot-password`, `/sent-email`, `/resetpassword`, `/verify-mfa`, `/oidc`.

Protected routes use `[Authorize]` and `MainLayout`.

---

## Rules

- Token endpoint `/idp/v1/Authentication/Token` uses `application/x-www-form-urlencoded`, NOT JSON
- All responses use `isSuccess` (not `success`)
- User identifiers use `itemId` (not `id`)
- User fields use `language` (not `languageName`)
- `mfaType` from token response is `"email"` or `"authenticator"` — these are OAuth strings, NOT the `UserMfaType` enum
- Store tokens via `ILocalStorageService` through `AuthState` — never in component state
- MFA OTP: email = **5 digits**, authenticator = **6 digits**
- Disable submit buttons during loading; show spinner inside the button
- Password strength must be **Strong** (>= 80%) before enabling submit
- Every user-visible string must use `ILocalizationService` — no hardcoded strings
