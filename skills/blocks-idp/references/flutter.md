# Flutter 3+ Reference — Identity & Access

Implementation guide for building authentication with the blocks-idp skill on Flutter 3+ using Dio.

---

## Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
  local_auth: ^2.1.8
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  go_router: ^13.0.0
```

---

## Environment Configuration

```dart
// lib/config/env_config.dart
class EnvConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.seliseblocks.com',
  );
  static const String xBlocksKey = String.fromEnvironment(
    'X_BLOCKS_KEY',
    defaultValue: '',
  );
  static const String projectKey = String.fromEnvironment(
    'PROJECT_KEY',
    defaultValue: '',
  );
  static const String oidcClientId = String.fromEnvironment(
    'OIDC_CLIENT_ID',
    defaultValue: '',
  );
  static const String redirectUri = String.fromEnvironment(
    'REDIRECT_URI',
    defaultValue: 'myapp://auth/callback',
  );
}
```

Build with: `flutter run --dart-define=X_BLOCKS_KEY=your-key --dart-define=PROJECT_KEY=your-project`

---

## Secure Token Storage

Use `flutter_secure_storage` for tokens. Never store tokens in plain SharedPreferences.

```dart
// lib/services/secure_storage_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
        );

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }
}
```

---

## Auth State Model

```dart
// lib/blocs/auth/auth_state.dart
import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final String accessToken;
  final String refreshToken;

  const Authenticated({required this.accessToken, required this.refreshToken});

  @override
  List<Object?> get props => [accessToken, refreshToken];
}

class MfaRequired extends AuthState {
  final String mfaId;
  final String mfaType;

  const MfaRequired({required this.mfaId, required this.mfaType});

  @override
  List<Object?> get props => [mfaId, mfaType];
}

class Unauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}
```

---

## Auth BLoC

```dart
// lib/blocs/auth/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../config/env_config.dart';
import '../../services/secure_storage_service.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthBloc({required Dio dio, required SecureStorageService storage})
      : _dio = dio,
        _storage = storage,
        super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<VerifyMfaRequested>(_onVerifyMfaRequested);
    on<RefreshTokenRequested>(_onRefreshTokenRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
  }

  Future<void> _onCheckAuthStatus(CheckAuthStatus event, Emitter<AuthState> emit) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      final refreshToken = await _storage.getRefreshToken();
      emit(Authenticated(accessToken: token, refreshToken: refreshToken ?? ''));
    } else {
      emit(Unauthenticated());
    }
  }

  Future<void> _onLoginRequested(LoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());

    try {
      final formData = FormData.fromMap({
        'grant_type': 'password',
        'username': event.username,
        'password': event.password,
      });

      final response = await _dio.post(
        '${EnvConfig.apiBaseUrl}/idp/v1/Authentication/Token',
        data: formData,
        options: Options(headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-blocks-key': EnvConfig.xBlocksKey,
        }),
      );

      if (response.data['access_token'] != null) {
        final accessToken = response.data['access_token'] as String;
        final refreshToken = response.data['refresh_token'] as String;
        await _storage.setTokens(accessToken: accessToken, refreshToken: refreshToken);
        emit(Authenticated(accessToken: accessToken, refreshToken: refreshToken));
      } else if (response.data['enable_mfa'] == true) {
        emit(MfaRequired(
          mfaId: response.data['mfaId'] as String,
          mfaType: response.data['mfaType'] as String,
        ));
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        emit(const AuthError('Invalid email or password'));
      } else {
        emit(const AuthError('Something went wrong. Please try again.'));
      }
    } catch (e) {
      emit(const AuthError('Something went wrong. Please try again.'));
    }
  }

  Future<void> _onVerifyMfaRequested(VerifyMfaRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());

    try {
      final authType = event.mfaType == 'authenticator' ? 2 : 1;
      final formData = FormData.fromMap({
        'grant_type': 'mfa_code',
        'mfa_id': event.mfaId,
        'mfa_type': authType,
        'otp': event.code,
      });

      final response = await _dio.post(
        '${EnvConfig.apiBaseUrl}/idp/v1/Authentication/Token',
        data: formData,
        options: Options(headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-blocks-key': EnvConfig.xBlocksKey,
        }),
      );

      final accessToken = response.data['access_token'] as String;
      final refreshToken = response.data['refresh_token'] as String;
      await _storage.setTokens(accessToken: accessToken, refreshToken: refreshToken);
      emit(Authenticated(accessToken: accessToken, refreshToken: refreshToken));
    } on DioException catch (e) {
      emit(const AuthError('Invalid verification code'));
    }
  }

  Future<void> _onRefreshTokenRequested(RefreshTokenRequested event, Emitter<AuthState> emit) async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        emit(Unauthenticated());
        return;
      }

      final formData = FormData.fromMap({
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
      });

      final response = await _dio.post(
        '${EnvConfig.apiBaseUrl}/idp/v1/Authentication/Token',
        data: formData,
        options: Options(headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-blocks-key': EnvConfig.xBlocksKey,
        }),
      );

      final accessToken = response.data['access_token'] as String;
      final newRefreshToken = response.data['refresh_token'] as String;
      await _storage.setTokens(accessToken: accessToken, refreshToken: newRefreshToken);
      emit(Authenticated(accessToken: accessToken, refreshToken: newRefreshToken));
    } catch (e) {
      await _storage.clearTokens();
      emit(Unauthenticated());
    }
  }

  Future<void> _onLogoutRequested(LogoutRequested event, Emitter<AuthState> emit) async {
    await _storage.clearTokens();
    emit(Unauthenticated());
  }
}
```

---

## Auth Events

```dart
// lib/blocs/auth/auth_event.dart
abstract class AuthEvent {}

class CheckAuthStatus extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String username;
  final String password;

  LoginRequested({required this.username, required this.password});
}

class VerifyMfaRequested extends AuthEvent {
  final String mfaId;
  final String mfaType;
  final String code;

  VerifyMfaRequested({required this.mfaId, required this.mfaType, required this.code});
}

class RefreshTokenRequested extends AuthEvent {}

class LogoutRequested extends AuthEvent {}
```

---

## Dio Interceptor — Auth Headers and 401 Refresh

```dart
// lib/services/dio_auth_interceptor.dart
import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import 'secure_storage_service.dart';

class DioAuthInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  final AuthBloc _authBloc;

  DioAuthInterceptor({
    required Dio dio,
    required SecureStorageService storage,
    required AuthBloc authBloc,
  })  : _dio = dio,
        _storage = storage,
        _authBloc = authBloc;

  bool _isRefreshing = false;
  final List<_QueuedRequest> _pendingRequests = [];

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.path.contains('/Authentication/Token')) {
      return handler.next(options);
    }

    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    options.headers['x-blocks-key'] = 'your-x-blocks-key';

    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 &&
        !err.requestOptions.path.contains('/Authentication/Token')) {
      try {
        final response = await _handle401Error(err.requestOptions);
        return handler.resolve(response);
      } catch (e) {
        _authBloc.add(LogoutRequested());
        return handler.next(err);
      }
    }
    return handler.next(err);
  }

  Future<Response<dynamic>> _handle401Error(RequestOptions requestOptions) async {
    if (_isRefreshing) {
      final completer = _QueuedRequest(requestOptions);
      _pendingRequests.add(completer);
      return completer.future;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        _authBloc.add(LogoutRequested());
        throw DioException(requestOptions: requestOptions);
      }

      final formData = FormData.fromMap({
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
      });

      final response = await _dio.post(
        '${requestOptions.baseUrl}/idp/v1/Authentication/Token',
        data: formData,
        options: Options(headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-blocks-key': 'your-x-blocks-key',
        }),
      );

      final newAccessToken = response.data['access_token'] as String;
      final newRefreshToken = response.data['refresh_token'] as String;
      await _storage.setTokens(accessToken: newAccessToken, refreshToken: newRefreshToken);

      _processQueuedRequests(newAccessToken);
      _isRefreshing = false;

      return await _retry(requestOptions, newAccessToken);
    } catch (e) {
      _isRefreshing = false;
      _failQueuedRequests(e);
      await _storage.clearTokens();
      _authBloc.add(LogoutRequested());
      throw DioException(requestOptions: requestOptions);
    }
  }

  Future<Response<dynamic>> _retry(RequestOptions options, String token) async {
    options.headers['Authorization'] = 'Bearer $token';
    return _dio.fetch(options);
  }

  void _processQueuedRequests(String token) {
    for (final queued in _pendingRequests) {
      queued.resolve(_retry(queued.requestOptions, token));
    }
    _pendingRequests.clear();
  }

  void _failQueuedRequests(Object error) {
    for (final queued in _pendingRequests) {
      queued.reject(error);
    }
    _pendingRequests.clear();
  }
}

class _QueuedRequest {
  final RequestOptions requestOptions;
  late final Completer<Response<dynamic>> completer;

  _QueuedRequest(this.requestOptions) {
    completer = Completer<Response<dynamic>>();
  }

  void resolve(Future<Response<dynamic>> future) {
    future.then(completer.complete, onError: completer.completeError);
  }

  void reject(Object error) {
    completer.completeError(error);
  }
}
```

---

## Biometric Authentication

```dart
// lib/services/biometric_service.dart
import 'package:local_auth/local_auth.dart';
import 'package:flutter/services.dart';

class BiometricService {
  final LocalAuthentication _localAuth = LocalAuthentication();

  Future<bool> isBiometricAvailable() async {
    try {
      final canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
      final canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();
      return canAuthenticate;
    } on PlatformException {
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  Future<bool> authenticate({String reason = 'Authenticate to continue'}) async {
    try {
      return await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException {
      return false;
    }
  }
}
```

Use in login flow when biometric is available and enrolled:

```dart
// In login screen or BLoC
final biometric = BiometricService();
if (await biometric.isBiometricAvailable()) {
  final authenticated = await biometric.authenticate(
    reason: 'Authenticate with biometrics',
  );
  if (authenticated) {
    // Proceed with biometric login via get-token
  }
}
```

---

## Dio Setup

```dart
// lib/services/dio_service.dart
import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/auth/auth_bloc.dart';
import 'secure_storage_service.dart';
import 'dio_auth_interceptor.dart';

class DioService {
  static Dio create({required SecureStorageService storage, required AuthBloc authBloc}) {
    final dio = Dio(BaseOptions(
      baseUrl: 'https://api.seliseblocks.com',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    dio.interceptors.add(DioAuthInterceptor(
      dio: dio,
      storage: storage,
      authBloc: authBloc,
    ));

    return dio;
  }
}
```

---

## Protected Routes with GoRouter

```dart
// lib/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_state.dart';
import '../screens/login_screen.dart';
import '../screens/verify_mfa_screen.dart';
import '../screens/home_screen.dart';
import '../screens/oidc_callback_screen.dart';

class AppRouter {
  final AuthBloc authBloc;

  AppRouter({required this.authBloc});

  late final GoRouter router = GoRouter(
    initialLocation: '/login',
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final isAuthenticated = authState is Authenticated;
      final isOnLogin = state.matchedLocation == '/login';
      final isOnMfa = state.matchedLocation == '/verify-mfa';
      final isOnCallback = state.matchedLocation == '/auth/callback';

      if (!isAuthenticated && !isOnLogin && !isOnMfa && !isOnCallback) {
        return '/login';
      }

      if (isAuthenticated && (isOnLogin || isOnMfa)) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/verify-mfa', builder: (context, state) => const VerifyMfaScreen()),
      GoRoute(path: '/auth/callback', builder: (context, state) => const OidcCallbackScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<AuthState> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
```

---

## Login Screen

```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';
import '../config/env_config.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(LoginRequested(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      ));
    }
  }

  void _loginWithOidc() {
    final state = Uri.encodeComponent('${DateTime.now().millisecondsSinceEpoch}');
    final params = {
      'response_type': 'code',
      'client_id': EnvConfig.oidcClientId,
      'redirect_uri': EnvConfig.redirectUri,
      'scope': 'openid profile email',
      'state': state,
    };
    final uri = Uri.parse('${EnvConfig.apiBaseUrl}/idp/v1/Authentication/Authorize')
        .replace(queryParameters: params);
    // Use url_launcher or go_router to navigate
    debugPrint('OIDC URL: $uri');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
            );
          } else if (state is MfaRequired) {
            context.go('/verify-mfa', extra: {
              'mfaId': state.mfaId,
              'mfaType': state.mfaType,
            });
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Sign In',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _usernameController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Email is required';
                      if (!value.contains('@')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Password is required';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      return ElevatedButton(
                        onPressed: state is AuthLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: state is AuthLoading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Sign In'),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: _loginWithOidc,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Sign in with SSO'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## MFA Verification Screen

```dart
// lib/screens/verify_mfa_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';

class VerifyMfaScreen extends StatefulWidget {
  const VerifyMfaScreen({super.key});

  @override
  State<VerifyMfaScreen> createState() => _VerifyMfaScreenState();
}

class _VerifyMfaScreenState extends State<VerifyMfaScreen> {
  final _codeController = TextEditingController();
  String _mfaId = '';
  String _mfaType = 'email';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (extra != null) {
      _mfaId = extra['mfaId'] ?? '';
      _mfaType = extra['mfaType'] ?? 'email';
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_codeController.text.isEmpty) return;
    context.read<AuthBloc>().add(VerifyMfaRequested(
      mfaId: _mfaId,
      mfaType: _mfaType,
      code: _codeController.text.trim(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isAuthenticator = _mfaType == 'authenticator';
    final codeLength = isAuthenticator ? 6 : 5;

    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
            );
          } else if (state is Authenticated) {
            context.go('/home');
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Verify Your Account',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  isAuthenticator
                      ? 'Enter the 6-digit code from your authenticator app'
                      : 'Enter the 5-digit code sent to your email',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: codeLength,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 24),
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    return ElevatedButton(
                      onPressed: state is AuthLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: state is AuthLoading ? const CircularProgressIndicator() : const Text('Verify'),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## OIDC Deep Linking

Configure app links in `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" android:host="auth" />
</intent-filter>
```

For iOS, add to `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes>
  <array>
    <dict>
      <key>CFBundleURLSchemes</key>
      <array><string>myapp</string></array>
    </dict>
  </array>
</key>
```

OIDC callback screen exchanges the authorization code for tokens:

```dart
// lib/screens/oidc_callback_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/secure_storage_service.dart';

class OidcCallbackScreen extends StatefulWidget {
  const OidcCallbackScreen({super.key});

  @override
  State<OidcCallbackScreen> createState() => _OidcCallbackScreenState();
}

class _OidcCallbackScreenState extends State<OidcCallbackScreen> {
  @override
  void initState() {
    super.initState();
    _handleCallback();
  }

  Future<void> _handleCallback() async {
    final uri = Uri.parse(Uri.base.toString());
    final code = uri.queryParameters['code'];
    final error = uri.queryParameters['error'];

    if (error != null || code == null) {
      context.go('/login');
      return;
    }

    // Exchange code for tokens via POST /idp/v1/Authentication/Token
    // with grant_type=authorization_code
    // Then store tokens and navigate to home
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
```

---

## Key Implementation Notes

### Token Endpoint — Form-Encoded Only

`POST /idp/v1/Authentication/Token` accepts `application/x-www-form-urlencoded` only. Use Dio's `FormData` or `application/x-www-form-urlencoded` string, NOT JSON.

```dart
// WRONG
dio.post(url, data: {'grant_type': 'password', ...});

// CORRECT
dio.post(url, data: formData, options: Options(headers: {'Content-Type': 'application/x-www-form-urlencoded'}));
```

### Response Field Names

- Check `isSuccess` (not `success`) on all API responses
- User/org operations use `itemId` (not `id`)
- User profile fields use `language` (not `languageName`)

### Token Response Shapes

```dart
// No MFA
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 8000,
  "refresh_token": "538b8ede...",
  "id_token": null,
}

// MFA required
{
  "enable_mfa": true,
  "mfaType": "email",       // or "authenticator"
  "mfaId": "abc123",
  "message": "OTP sent to your email",
}
```

### MFA Type Mapping

| mfaType from response | mfa_type param |
|-----------------------|---------------|
| email | 1 |
| authenticator | 2 |

### Dio Interceptor Race Condition

The `_QueuedRequest` pattern prevents race conditions when multiple requests fail with 401 simultaneously. Only one token refresh runs; others wait and are retried with the new token.

---

## Reference

- Token flow: `actions/get-token.md`
- Refresh flow: `actions/refresh-token.md`
- MFA verification: `actions/verify-otp.md`
- User info: `actions/get-user-info.md`
- OIDC authorize params: `contracts.md` — Authorize Query Parameters section
