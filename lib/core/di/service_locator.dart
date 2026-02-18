import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

import '../../config/app_config.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/logger_service.dart';
import '../auth/auth_session_controller.dart';
import '../repositories/appointment_repository.dart';
import '../repositories/prescription_repository.dart';
import '../repositories/patient_repository.dart';

final getIt = GetIt.instance;

Future<void> setupServiceLocator() async {
  // Initialize Logger
  getIt.registerSingleton<LoggerService>(
    LoggerService(),
  );

  // Initialize Shared Preferences
  final prefs = await SharedPreferences.getInstance();
  getIt.registerSingleton<SharedPreferences>(prefs);

  // Initialize Storage Service
  getIt.registerSingleton<StorageService>(
    StorageService(prefs),
  );

  // Initialize Dio
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.apiTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      sendTimeout: AppConfig.apiTimeout,
      contentType: 'application/json',
      validateStatus: (status) => true,
    ),
  );

  // Add interceptors
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = getIt<StorageService>().getAuthToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        getIt<LoggerService>().logError(
          'Dio Error',
          error.error,
          error.stackTrace,
        );
        return handler.next(error);
      },
    ),
  );

  getIt.registerSingleton<Dio>(dio);

  // Initialize API Service
  getIt.registerSingleton<ApiService>(
    ApiService(dio),
  );

  // Initialize Auth Session
  getIt.registerSingleton<AuthSessionController>(
    AuthSessionController.instance,
  );

  // Initialize Repositories
  getIt.registerSingleton<AppointmentRepository>(
    AppointmentRepository(getIt<ApiService>()),
  );

  getIt.registerSingleton<PrescriptionRepository>(
    PrescriptionRepository(getIt<ApiService>()),
  );

  getIt.registerSingleton<PatientRepository>(
    PatientRepository(getIt<ApiService>()),
  );

  getIt<LoggerService>().logInfo('Service Locator initialized successfully');
}

// Service Locator similar to GetIt
class GetIt {
  static final GetIt _instance = GetIt._internal();
  final Map<Type, dynamic> _services = {};
  final Map<String, dynamic> _namedServices = {};

  factory GetIt() {
    return _instance;
  }

  GetIt._internal();

  static GetIt get instance => _instance;

  void registerSingleton<T>(T service, {String? instanceName}) {
    if (instanceName != null) {
      _namedServices[instanceName] = service;
    } else {
      _services[T] = service;
    }
  }

  T get<T>({String? instanceName}) {
    if (instanceName != null) {
      return _namedServices[instanceName] as T;
    }
    return _services[T] as T;
  }

  void unregister<T>({String? instanceName}) {
    if (instanceName != null) {
      _namedServices.remove(instanceName);
    } else {
      _services.remove(T);
    }
  }

  void reset() {
    _services.clear();
    _namedServices.clear();
  }
}
