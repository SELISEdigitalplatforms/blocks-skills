# Angular 16+ Reference — Identity & Access

Implementation guide for building authentication with the blocks-idp skill on Angular 16+.

---

## Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.seliseblocks.com',
  xBlocksKey: 'your-x-blocks-key',
  projectKey: 'your-project-key',
  oidcClientId: 'your-oidc-client-id',
  redirectUri: 'https://yourapp.com/auth/callback',
};
```

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.seliseblocks.com',
  xBlocksKey: 'your-prod-x-blocks-key',
  projectKey: 'your-project-key',
  oidcClientId: 'your-oidc-client-id',
  redirectUri: 'https://yourapp.com/auth/callback',
};
```

---

## Token Storage Service

Angular interceptors add the Bearer token automatically. Store tokens in memory or `sessionStorage` — do NOT use `localStorage` for access tokens.

```typescript
// src/app/auth/services/token-storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey); // refresh persists across tabs
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}
```

---

## Auth Service

Use `BehaviorSubject` for reactive auth state. Expose an `isAuthenticated$` observable for components and guards.

```typescript
// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpUrlEncodingCodec } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string | null;
}

export interface MfaResponse {
  enable_mfa: true;
  mfaType: 'email' | 'authenticator';
  mfaId: string;
  message: string;
}

export type AuthResponse = TokenResponse | MfaResponse;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(!!this.tokenStorage.getAccessToken());
  isAuthenticated$ = this.authStateSubject.asObservable();

  private baseUrl = environment.apiBaseUrl;
  private blocksKey = environment.xBlocksKey;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) {}

  login(username: string, password: string): Observable<AuthResponse> {
    const body = new HttpUrlEncodingCodec().encodeToken('grant_type') + '=' + 'password' +
      '&' + new HttpUrlEncodingCodec().encodeToken('username') + '=' + encodeURIComponent(username) +
      '&' + new HttpUrlEncodingCodec().encodeToken('password') + '=' + encodeURIComponent(password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': this.blocksKey,
    });

    return this.http.post<AuthResponse>(`${this.baseUrl}/idp/v1/Authentication/Token`, body, { headers }).pipe(
      map((response) => {
        if ('access_token' in response) {
          this.tokenStorage.setTokens(response.access_token, response.refresh_token);
          this.authStateSubject.next(true);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    const body =
      'grant_type=refresh_token' +
      '&' + new HttpUrlEncodingCodec().encodeToken('refresh_token') + '=' + encodeURIComponent(refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': this.blocksKey,
    });

    return this.http.post<TokenResponse>(`${this.baseUrl}/idp/v1/Authentication/Token`, body, { headers }).pipe(
      map((response) => {
        this.tokenStorage.setTokens(response.access_token, response.refresh_token);
        return response;
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  verifyMfa(mfaId: string, mfaType: number, verificationCode: string): Observable<TokenResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    const body =
      'grant_type=mfa_code' +
      '&' + new HttpUrlEncodingCodec().encodeToken('mfa_id') + '=' + encodeURIComponent(mfaId) +
      '&' + new HttpUrlEncodingCodec().encodeToken('mfa_type') + '=' + mfaType +
      '&' + new HttpUrlEncodingCodec().encodeToken('otp') + '=' + encodeURIComponent(verificationCode);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': this.blocksKey,
    });

    return this.http.post<TokenResponse>(`${this.baseUrl}/idp/v1/Authentication/Token`, body, { headers }).pipe(
      map((response) => {
        this.tokenStorage.setTokens(response.access_token, response.refresh_token);
        this.authStateSubject.next(true);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this.authStateSubject.next(false);
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/idp/v1/Authentication/GetUserInfo`);
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
```

---

## HTTP Interceptor — Auth Headers and 401 Refresh

The interceptor attaches the Bearer token to every request and handles 401 by refreshing the token then retrying.

```typescript
// src/app/auth/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: Observable<any>;

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService
  ) {
    this.refreshTokenSubject = new Observable();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenStorage.getAccessToken();

    if (token && !req.url.includes('/Authentication/Token')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'x-blocks-key': environment.xBlocksKey,
        },
      });
    } else if (!req.headers.has('x-blocks-key')) {
      req = req.clone({
        setHeaders: {
          'x-blocks-key': environment.xBlocksKey,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/Authentication/Token')) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      const refreshToken = this.tokenStorage.getRefreshToken();

      if (!refreshToken) {
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => new Error('No refresh token'));
      }

      return this.authService.refreshToken().pipe(
        switchMap((tokenResponse) => {
          this.isRefreshing = false;
          return next.handle(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
                'x-blocks-key': environment.xBlocksKey,
              },
            })
          );
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }
    return throwError(() => new Error('Token refresh in progress'));
  }
}
```

Register in `app.config.ts`:

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

---

## Route Guards

### Functional Guard (Angular 15+)

```typescript
// src/app/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    })
  );
};
```

### Usage in Routes

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard],
  },
  {
    path: 'verify-mfa',
    loadComponent: () => import('./auth/pages/verify-mfa/verify-mfa.component').then(m => m.VerifyMfaComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/pages/oidc-callback/oidc-callback.component').then(m => m.OidcCallbackComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
```

---

## Login Component

Uses Angular Reactive Forms for validation.

```typescript
// src/app/auth/pages/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MfaResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <h2>Sign In</h2>

        <div *ngIf="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <div class="form-group">
          <label for="username">Email</label>
          <input id="username" type="email" formControlName="username" />
          <span class="field-error" *ngIf="loginForm.get('username')?.touched && loginForm.get('username')?.invalid">
            Please enter a valid email
          </span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" />
          <span class="field-error" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
            Password is required
          </span>
        </div>

        <button type="submit" [disabled]="loading || loginForm.invalid">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <div class="divider">
          <span>or</span>
        </div>

        <button type="button" class="btn-oidc" (click)="loginWithOidc()">
          Sign in with SSO
        </button>
      </form>
    </div>
  `,
  styles: [`
    .login-container { max-width: 400px; margin: 2rem auto; padding: 2rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.25rem; }
    .form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    .error-alert { padding: 0.75rem; background: #fee2e2; color: #991b1b; border-radius: 4px; margin-bottom: 1rem; }
    .field-error { color: #991b1b; font-size: 0.875rem; }
    button[type="submit"] { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
    .divider { text-align: center; margin: 1rem 0; color: #6b7280; }
    .btn-oidc { width: 100%; padding: 0.75rem; background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
  `],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.loading = false;
        if ('enable_mfa' in response && response.enable_mfa) {
          this.router.navigate(['/verify-mfa'], {
            queryParams: {
              mfaId: response.mfaId,
              mfaType: response.mfaType,
            },
          });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      },
    });
  }

  loginWithOidc(): void {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'your-oidc-client-id',
      redirect_uri: 'https://yourapp.com/auth/callback',
      scope: 'openid profile email',
      state: this.generateState(),
    });
    window.location.href = `${environment.apiBaseUrl}/idp/v1/Authentication/Authorize?${params.toString()}`;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2);
  }
}
```

---

## MFA Verification Component

```typescript
// src/app/auth/pages/verify-mfa/verify-mfa.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-mfa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mfa-container">
      <h2>Verify Your Account</h2>
      <p>{{ message }}</p>

      <form [formGroup]="otpForm" (ngSubmit)="onSubmit()">
        <div *ngIf="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <div class="form-group">
          <label for="code">Enter verification code</label>
          <input
            id="code"
            type="text"
            formControlName="verificationCode"
            maxlength="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            placeholder="Enter code"
          />
        </div>

        <button type="submit" [disabled]="loading || otpForm.invalid">
          {{ loading ? 'Verifying...' : 'Verify' }}
        </button>
      </form>

      <button class="btn-resend" (click)="resendCode()">Resend code</button>
    </div>
  `,
})
export class VerifyMfaComponent implements OnInit {
  otpForm: FormGroup;
  loading = false;
  errorMessage = '';
  message = 'Enter the code sent to your email';
  mfaId = '';
  mfaType = 1;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.otpForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit(): void {
    this.mfaId = this.route.snapshot.queryParamMap.get('mfaId') || '';
    const type = this.route.snapshot.queryParamMap.get('mfaType');
    this.mfaType = type === 'authenticator' ? 2 : 1;
    this.message = type === 'authenticator'
      ? 'Enter the 6-digit code from your authenticator app'
      : 'Enter the 5-digit code sent to your email';
    this.otpForm.get('verificationCode')?.setValidators(Validators.required);
  }

  onSubmit(): void {
    if (this.otpForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.verifyMfa(this.mfaId, this.mfaType, this.otpForm.value.verificationCode).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Invalid verification code';
      },
    });
  }

  resendCode(): void {
    // Call resend-otp action with mfaId
  }
}
```

---

## OIDC Callback Component

```typescript
// src/app/auth/pages/oidc-callback/oidc-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-oidc-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="callback-container"><p>Completing sign in...</p></div>`,
})
export class OidcCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      this.router.navigate(['/login']);
      return;
    }

    if (!code) {
      this.router.navigate(['/login']);
      return;
    }

    const body =
      'grant_type=authorization_code' +
      '&code=' + encodeURIComponent(code) +
      '&redirect_uri=' + encodeURIComponent(environment.redirectUri) +
      '&client_id=' + encodeURIComponent(environment.oidcClientId);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': environment.xBlocksKey,
    });

    this.http.post<any>(`${environment.apiBaseUrl}/idp/v1/Authentication/Token`, body, { headers }).subscribe({
      next: (response) => {
        if (response.access_token) {
          this.authService['tokenStorage'].setTokens(response.access_token, response.refresh_token);
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
```

---

## API Service Pattern

All API calls use the injected `HttpClient` with the auth interceptor automatically attaching headers and handling 401 refresh.

```typescript
// src/app/auth/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/idp/v1/Authentication/GetUserInfo`);
  }

  getAccount(): Observable<any> {
    return this.http.get(`${this.baseUrl}/idp/v1/Account/GetAccount`);
  }

  getAccountRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/idp/v1/Account/GetAccountRoles`);
  }

  getAccountPermissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/idp/v1/Account/GetAccountPermissions`);
  }

  logout(refreshToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/idp/v1/Authentication/Logout`, { refreshToken });
  }

  getSessions(page = 1, pageSize = 20): Observable<any> {
    const params = new URLSearchParams({
      ProjectKey: environment.projectKey,
      Page: String(page),
      PageSize: String(pageSize),
    });
    return this.http.get(`${this.baseUrl}/idp/v1/Iam/GetSessions?${params.toString()}`);
  }

  logoutSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/idp/v1/Iam/Logout`, { sessionId });
  }
}
```

---

## Key Implementation Notes

### Token Endpoint — Form-Encoded Only

The token endpoint `POST /idp/v1/Authentication/Token` accepts `application/x-www-form-urlencoded` only. JSON body will return 400.

### Response Field Names

- Check `isSuccess` (not `success`) on all responses
- User/org operations use `itemId` (not `id`)
- User profile fields use `language` (not `languageName`)

### Token Response Shape

```typescript
// Successful login (no MFA)
{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  id_token: null;
}

// MFA required
{
  enable_mfa: true;
  mfaType: "email" | "authenticator";
  mfaId: string;
  message: string;
}
```

### MFA Type Mapping

| mfaType from response | authType to verify-otp |
|-----------------------|------------------------|
| email | 1 |
| authenticator | 2 |

### Intercepted Requests Skip Token Call

The `AuthInterceptor` must skip the `/Authentication/Token` endpoint to prevent infinite loops during token refresh:

```typescript
if (req.url.includes('/Authentication/Token')) {
  // Skip adding Authorization header for token endpoint
}
```

---

## Reference

- Token flow: `actions/get-token.md`
- Refresh flow: `actions/refresh-token.md`
- MFA verification: `actions/verify-otp.md`
- User info: `actions/get-user-info.md`
- OIDC authorize params: `contracts.md` — Authorize Query Parameters section
