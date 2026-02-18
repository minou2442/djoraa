import 'package:dio/dio.dart';
import '../services/logger_service.dart';
import '../di/service_locator.dart';

class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;
  final StackTrace? stackTrace;

  AppException({
    required this.message,
    this.code,
    this.originalError,
    this.stackTrace,
  });

  @override
  String toString() => 'AppException: $message';
}

class NetworkException extends AppException {
  NetworkException({
    required String message,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
    message: message,
    code: 'NETWORK_ERROR',
    originalError: originalError,
    stackTrace: stackTrace,
  );
}

class ServerException extends AppException {
  final int? statusCode;

  ServerException({
    required String message,
    this.statusCode,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
    message: message,
    code: 'SERVER_ERROR',
    originalError: originalError,
    stackTrace: stackTrace,
  );
}

class ValidationException extends AppException {
  ValidationException({
    required String message,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
    message: message,
    code: 'VALIDATION_ERROR',
    originalError: originalError,
    stackTrace: stackTrace,
  );
}

class AuthException extends AppException {
  AuthException({
    required String message,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
    message: message,
    code: 'AUTH_ERROR',
    originalError: originalError,
    stackTrace: stackTrace,
  );
}

class ErrorHandler {
  static AppException handle(dynamic error, [StackTrace? stackTrace]) {
    final logger = getIt<LoggerService>();

    if (error is DioException) {
      logger.logError('DioException: ${error.message}', error, stackTrace);

      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout ||
          error.type == DioExceptionType.connectionError) {
        return NetworkException(
          message: 'Connection failed. Please check your internet connection.',
          originalError: error,
          stackTrace: stackTrace,
        );
      }

      if (error.response != null) {
        final statusCode = error.response!.statusCode;
        final message = error.response!.data?['message'] ?? error.message;

        if (statusCode == 401 || statusCode == 403) {
          return AuthException(
            message: message ?? 'Authentication failed',
            originalError: error,
            stackTrace: stackTrace,
          );
        }

        if (statusCode == 422 || statusCode == 400) {
          return ValidationException(
            message: message ?? 'Invalid data provided',
            originalError: error,
            stackTrace: stackTrace,
          );
        }

        return ServerException(
          message: message ?? 'Server error occurred',
          statusCode: statusCode,
          originalError: error,
          stackTrace: stackTrace,
        );
      }

      return NetworkException(
        message: error.message ?? 'Network error occurred',
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    if (error is AppException) {
      logger.logError(error.message, error.originalError, stackTrace);
      return error;
    }

    logger.logError('Unknown error', error, stackTrace);

    return AppException(
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      originalError: error,
      stackTrace: stackTrace,
    );
  }

  static String getErrorMessage(AppException exception) {
    switch (exception.code) {
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      case 'AUTH_ERROR':
        return 'Authentication failed. Please login again.';
      case 'VALIDATION_ERROR':
        return 'Invalid data provided.';
      default:
        return exception.message;
    }
  }
}
