# React Native Reference — Identity & Access

Implementation guide for building authentication with the blocks-idp skill on React Native (Expo or bare).

---

## Environment Configuration

```typescript
// src/config/env.ts
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.seliseblocks.com',
  xBlocksKey: process.env.EXPO_PUBLIC_X_BLOCKS_KEY || '',
  projectKey: process.env.EXPO_PUBLIC_PROJECT_KEY || '',
  oidcClientId: process.env.EXPO_PUBLIC_OIDC_CLIENT_ID || '',
  redirectUri: process.env.EXPO_PUBLIC_REDIRECT_URI || 'myapp://auth/callback',
};
```

For bare React Native, use `.env` files with react-native-dotenv or similar tooling.

---

## Secure Token Storage

Use `expo-secure-store` for secure token storage. Provide `AsyncStorage` fallback.

```typescript
// src/services/tokenStorage.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (SecureStore.isAvailable) {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (SecureStore.isAvailable) {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      if (SecureStore.isAvailable) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      if (SecureStore.isAvailable) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  },
};
```

---

## Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { authApi } from '../services/authApi';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      setState({
        isAuthenticated: !!accessToken,
        isLoading: false,
        accessToken,
        refreshToken,
      });
    } catch {
      setState({ isAuthenticated: false, isLoading: false, accessToken: null, refreshToken: null });
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.getToken(username, password);

    if ('access_token' in response) {
      await tokenStorage.setTokens(response.access_token, response.refresh_token);
      setState({
        isAuthenticated: true,
        isLoading: false,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
    } else if (response.enable_mfa) {
      return { mfaRequired: true, ...response };
    }
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    const storedRefresh = await tokenStorage.getRefreshToken();
    if (!storedRefresh) {
      await logout();
      return false;
    }

    try {
      const response = await authApi.refreshToken(storedRefresh);
      await tokenStorage.setTokens(response.access_token, response.refresh_token);
      setState((prev) => ({
        ...prev,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      }));
      return true;
    } catch {
      await logout();
      return false;
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## Auth API Service

```typescript
// src/services/authApi.ts
import { env } from '../config/env';

const BASE_URL = env.apiBaseUrl;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string | null;
}

interface MfaResponse {
  enable_mfa: true;
  mfaType: 'email' | 'authenticator';
  mfaId: string;
  message: string;
}

type AuthResponse = TokenResponse | MfaResponse;

async function formEncode(data: Record<string, string>): Promise<string> {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export const authApi = {
  async getToken(username: string, password: string): Promise<AuthResponse> {
    const body = await formEncode({
      grant_type: 'password',
      username,
      password,
    });

    const response = await fetch(`${BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': env.xBlocksKey,
      },
      body,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('INVALID_CREDENTIALS');
      }
      throw new Error('AUTH_ERROR');
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = await formEncode({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(`${BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': env.xBlocksKey,
      },
      body,
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      throw new Error('REFRESH_ERROR');
    }

    return response.json();
  },

  async verifyMfa(mfaId: string, mfaType: string, code: string): Promise<TokenResponse> {
    const authType = mfaType === 'authenticator' ? '2' : '1';
    const body = await formEncode({
      grant_type: 'mfa_code',
      mfa_id: mfaId,
      mfa_type: authType,
      otp: code,
    });

    const response = await fetch(`${BASE_URL}/idp/v1/Authentication/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-blocks-key': env.xBlocksKey,
      },
      body,
    });

    if (!response.ok) {
      throw new Error('MFA_VERIFICATION_FAILED');
    }

    return response.json();
  },

  async logout(refreshToken: string): Promise<void> {
    await fetch(`${BASE_URL}/idp/v1/Authentication/Logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-blocks-key': env.xBlocksKey,
      },
      body: JSON.stringify({ refreshToken }),
    });
  },

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/idp/v1/Authentication/GetUserInfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-blocks-key': env.xBlocksKey,
      },
    });

    return response.json();
  },
};
```

---

## Fetch Interceptor for 401 Handling

Handles 401 by refreshing the token and retrying the original request. Uses a promise queue to prevent race conditions.

```typescript
// src/services/apiClient.ts
import { tokenStorage } from './tokenStorage';
import { authApi } from './authApi';
import { env } from '../config/env';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

async function getAccessToken(): Promise<string | null> {
  return tokenStorage.getAccessToken();
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<Response> {
  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    'x-blocks-key': env.xBlocksKey,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && retry && !url.includes('/Authentication/Token')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshed = await authApi.refresh();
        if (refreshed) {
          const newToken = (await tokenStorage.getAccessToken()) || '';
          onTokenRefreshed(newToken);
          isRefreshing = false;
          return authenticatedFetch(url, options, false);
        }
      } catch {
        isRefreshing = false;
        await tokenStorage.clearTokens();
        // Trigger re-render by re-throwing
        throw new Error('SESSION_EXPIRED');
      }
    } else {
      // Wait for refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token: string) => {
          try {
            const headers = { ...(options.headers as Record<string, string>) };
            headers['Authorization'] = `Bearer ${token}`;
            const retryResponse = await fetch(url, { ...options, headers });
            resolve(retryResponse);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  return response;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await authenticatedFetch(`${env.apiBaseUrl}${path}`);
    return response.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await authenticatedFetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await authenticatedFetch(`${env.apiBaseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  async delete<T>(path: string): Promise<T> {
    const response = await authenticatedFetch(`${env.apiBaseUrl}${path}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
```

---

## Biometric Authentication

### Using expo-local-authentication (Expo)

```typescript
// src/services/biometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) return false;
      return await this.authenticate('Sign in with biometrics');
    } catch {
      return false;
    }
  },
};
```

### Using react-native-biometrics (bare React Native)

```typescript
// src/services/biometricService.ts
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  },

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage: reason });
    return success;
  },
};
```

---

## Deep Linking for OIDC Callback

Configure in `app.json` (Expo):

```json
{
  "expo": {
    "scheme": "myapp",
    "android": {
      "package": "com.yourapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "myapp", "host": "auth", "pathPrefix": "/callback" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourapp",
      "associatedDomains": ["applinks:yourapp.com"]
    },
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID for authentication"
        }
      ]
    ]
  }
}
```

For bare React Native, configure native files directly.

---

## Auth Gate Pattern

Wrap the app root with an `AuthGate` that handles navigation based on auth state.

```typescript
// src/components/AuthGate.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, fallback }) => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
```

---

## Login Screen

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { env } from '../config/env';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!username.trim()) {
      newErrors.username = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(username)) {
      newErrors.username = 'Enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await login(username.trim(), password);
      // Navigation is handled by AuthGate/AuthContext
    } catch (error: any) {
      setLoading(false);
      if (error.message === 'INVALID_CREDENTIALS') {
        setErrors({ general: 'Invalid email or password' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    }
  };

  const handleOidcLogin = () => {
    const state = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.oidcClientId,
      redirect_uri: env.redirectUri,
      scope: 'openid profile email',
      state,
    });
    const authUrl = `${env.apiBaseUrl}/idp/v1/Authentication/Authorize?${params.toString()}`;
    // Use Linking.openURL or WebBrowser from expo-web-browser to open
    console.log('OIDC URL:', authUrl);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Sign In</Text>

        {errors.general && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            editable={!loading}
          />
          {errors.username && <Text style={styles.fieldError}>{errors.username}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            textContentType="password"
            editable={!loading}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.ssoButton} onPress={handleOidcLogin}>
          <Text style={styles.ssoButtonText}>Sign in with SSO</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  form: { paddingHorizontal: 24, maxWidth: 400, alignSelf: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#991b1b', textAlign: 'center' },
  fieldError: { color: '#991b1b', fontSize: 12, marginTop: 4 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
  inputError: { borderColor: '#ef4444' },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 12, color: '#6b7280' },
  ssoButton: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  ssoButtonText: { color: '#1f2937', fontSize: 16, fontWeight: '500' },
});
```

---

## MFA Verification Screen

```typescript
// src/screens/VerifyMfaScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/authApi';
import { tokenStorage } from '../services/tokenStorage';

export const VerifyMfaScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { mfaId, mfaType } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticator = mfaType === 'authenticator';
  const codeLength = isAuthenticator ? 6 : 5;

  const handleVerify = async () => {
    if (code.length < codeLength) {
      setError(`Please enter the full ${codeLength}-digit code`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.verifyMfa(mfaId, mfaType, code.trim());
      await tokenStorage.setTokens(response.access_token, response.refresh_token);
      // Auth state update is handled by AuthContext
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Account</Text>
      <Text style={styles.subtitle}>
        {isAuthenticator
          ? 'Enter the 6-digit code from your authenticator app'
          : 'Enter the 5-digit code sent to your email'}
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, codeLength))}
        keyboardType="number-pad"
        maxLength={codeLength}
        textAlign="center"
        fontSize={24}
        letterSpacing={8}
        autoFocus
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#991b1b', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 16, marginBottom: 24 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

---

## OIDC Callback Handler

Handle the deep link callback to exchange the authorization code for tokens.

```typescript
// src/navigation/LinkingConfiguration.ts
import * as Linking from 'expo-linking';
import { authApi } from '../services/authApi';
import { tokenStorage } from '../services/tokenStorage';
import { env } from '../config/env';

export async function handleOidcCallback(url: string): Promise<void> {
  const parsedUrl = Linking.parse(url);
  const params = parsedUrl.queryParams || {};

  const code = params['code'] as string | undefined;
  const state = params['state'] as string | undefined;
  const error = params['error'] as string | undefined;

  if (error || !code) {
    throw new Error('OIDC_AUTH_FAILED');
  }

  const body = [
    `grant_type=authorization_code`,
    `code=${encodeURIComponent(code)}`,
    `redirect_uri=${encodeURIComponent(env.redirectUri)}`,
    `client_id=${encodeURIComponent(env.oidcClientId)}`,
  ].join('&');

  const response = await fetch(`${env.apiBaseUrl}/idp/v1/Authentication/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-blocks-key': env.xBlocksKey,
    },
    body,
  });

  if (!response.ok) {
    throw new Error('TOKEN_EXCHANGE_FAILED');
  }

  const data = await response.json();

  if (data.access_token) {
    await tokenStorage.setTokens(data.access_token, data.refresh_token);
  }
}
```

Add listener in your root navigation or `App.tsx`:

```typescript
import * as Linking from 'expo-linking';
import { handleOidcCallback } from './navigation/LinkingConfiguration';

useEffect(() => {
  const subscription = Linking.addEventListener('url', async (event) => {
    try {
      await handleOidcCallback(event.url);
      // Auth state will update via AuthContext
    } catch (e) {
      // Navigate to login on error
    }
  });

  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then(async (url) => {
    if (url) {
      await handleOidcCallback(url);
    }
  });

  return () => subscription.remove();
}, []);
```

---

## Token Refresh Race Condition Handling

The `authenticatedFetch` function uses a queue pattern. When multiple requests hit 401 simultaneously:

1. First 401 triggers `authApi.refresh()`
2. Subsequent 401s subscribe to the refresh promise via `refreshSubscribers`
3. When refresh succeeds, all queued requests are retried with the new token
4. If refresh fails, all queued requests receive the error and the user is logged out

```typescript
// Simplified race condition handler
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

async function handle401(url: string, options: RequestInit) {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const refreshed = await authApi.refresh();
      const newToken = refreshed.access_token;
      // Notify all waiting requests
      refreshSubscribers.forEach((cb) => cb(newToken));
      refreshSubscribers = [];
      // Retry the original request
      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      });
    } catch {
      // Fail all waiting requests
      refreshSubscribers.forEach((_, i) => refreshSubscribers.splice(i, 1));
      await logout();
      throw new Error('SESSION_EXPIRED');
    } finally {
      isRefreshing = false;
    }
  } else {
    // Queue this request until refresh completes
    return new Promise((resolve, reject) => {
      refreshSubscribers.push((token: string) => {
        fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${token}` },
        }).then(resolve).catch(reject);
      });
    });
  }
}
```

---

## Key Implementation Notes

### Token Endpoint — Form-Encoded Only

`POST /idp/v1/Authentication/Token` accepts `application/x-www-form-urlencoded` only. JSON body returns 400.

```typescript
// WRONG
fetch(url, { method: 'POST', body: JSON.stringify({ grant_type: 'password', ... }) });

// CORRECT
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=password&username=...&password=...',
});
```

### Response Field Names

- Check `isSuccess` (not `success`) on all API responses
- User/org operations use `itemId` (not `id`)
- User profile fields use `language` (not `languageName`)

### Token Response Shapes

```typescript
// No MFA
{
  access_token: "eyJhbGci...",
  token_type: "Bearer",
  expires_in: 8000,
  refresh_token: "538b8ede...",
  id_token: null,
}

// MFA required
{
  enable_mfa: true,
  mfaType: "email" | "authenticator",
  mfaId: string,
  message: string,
}
```

### MFA Type Mapping

| mfaType from response | mfa_type param |
|-----------------------|---------------|
| email | 1 |
| authenticator | 2 |

### SecureStorage Fallback

Always provide an `AsyncStorage` fallback for `SecureStore` since it may not be available on all devices or in Expo Go.

### Biometric Fallback

Always provide a password fallback when biometric authentication fails, as biometrics can fail for reasons beyond user denial (hardware issues, biometric not enrolled, etc.).

---

## Reference

- Token flow: `actions/get-token.md`
- Refresh flow: `actions/refresh-token.md`
- MFA verification: `actions/verify-otp.md`
- User info: `actions/get-user-info.md`
- OIDC authorize params: `contracts.md` — Authorize Query Parameters section
