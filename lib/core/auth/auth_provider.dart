import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'models/user_model.dart';
import 'models/auth_response.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../di/service_locator.dart';
import '../services/logger_service.dart';

// Auth State
class AuthState {
  final bool isLoading;
  final UserModel? user;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.isLoading = false,
    this.user,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    bool? isLoading,
    UserModel? user,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error ?? this.error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// Auth State Notifier
class AuthStateNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService = getIt<ApiService>();
  final StorageService _storageService = getIt<StorageService>();
  final LoggerService _loggerService = getIt<LoggerService>();

  AuthStateNotifier() : super(const AuthState()) {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    try {
      final token = _storageService.getAuthToken();
      if (token != null) {
        final userData = _storageService.getUserData();
        if (userData != null) {
          final user = UserModel.fromJson(userData);
          state = state.copyWith(
            user: user,
            isAuthenticated: true,
          );
          _loggerService.logInfo('User restored from storage');
        }
      }
    } catch (e) {
      _loggerService.logError('Auth initialization error', e);
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);

      final response = await _apiService.post<AuthResponse>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
        fromJson: (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
      );

      if (response.success && response.data != null) {
        await _storageService.saveAuthToken(response.data!.accessToken);
        if (response.data!.refreshToken != null) {
          await _storageService.saveRefreshToken(response.data!.refreshToken!);
        }
        await _storageService.saveUserData(response.data!.user.toJson());

        state = state.copyWith(
          user: response.data!.user,
          isAuthenticated: true,
          isLoading: false,
        );

        _loggerService.logInfo('User logged in: ${response.data!.user.email}');
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      _loggerService.logError('Login error', e);
      state = state.copyWith(
        isLoading: false,
        error: 'An error occurred during login',
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);

      final response = await _apiService.post<AuthResponse>(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'first_name': firstName,
          'last_name': lastName,
          'phone_number': phoneNumber,
        },
        fromJson: (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
      );

      if (response.success && response.data != null) {
        await _storageService.saveAuthToken(response.data!.accessToken);
        if (response.data!.refreshToken != null) {
          await _storageService.saveRefreshToken(response.data!.refreshToken!);
        }
        await _storageService.saveUserData(response.data!.user.toJson());

        state = state.copyWith(
          user: response.data!.user,
          isAuthenticated: true,
          isLoading: false,
        );

        _loggerService.logInfo('User registered: ${response.data!.user.email}');
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Registration failed',
        );
        return false;
      }
    } catch (e) {
      _loggerService.logError('Registration error', e);
      state = state.copyWith(
        isLoading: false,
        error: 'An error occurred during registration',
      );
      return false;
    }
  }

  Future<bool> logout() async {
    try {
      state = state.copyWith(isLoading: true);

      // Call logout endpoint if available
      try {
        await _apiService.post('/auth/logout');
      } catch (e) {
        _loggerService.logWarning('Logout API call failed', e);
      }

      await _storageService.clearAuthTokens();
      await _storageService.clearUserData();

      state = const AuthState();
      _loggerService.logInfo('User logged out');
      return true;
    } catch (e) {
      _loggerService.logError('Logout error', e);
      return false;
    }
  }

  Future<bool> refreshToken() async {
    try {
      final refreshToken = _storageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _apiService.post<AuthResponse>(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
        fromJson: (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
      );

      if (response.success && response.data != null) {
        await _storageService.saveAuthToken(response.data!.accessToken);
        if (response.data!.refreshToken != null) {
          await _storageService.saveRefreshToken(response.data!.refreshToken!);
        }

        _loggerService.logInfo('Token refreshed');
        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (e) {
      _loggerService.logError('Token refresh error', e);
      await logout();
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Riverpod Providers
final authStateProvider =
    StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier();
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).isAuthenticated;
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authStateProvider).user;
});

final authErrorProvider = Provider<String?>((ref) {
  return ref.watch(authStateProvider).error;
});

final isAuthLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).isLoading;
});
