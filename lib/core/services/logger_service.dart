import 'package:logger/logger.dart';
import '../../config/app_config.dart';

class LoggerService {
  late final Logger _logger;

  LoggerService() {
    _logger = Logger(
      printer: PrettyPrinter(
        methodCount: 2,
        errorMethodCount: 8,
        lineLength: 120,
        colors: true,
        printEmojis: true,
        dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
      ),
      level: AppConfig.enableDebugLogging ? Level.verbose : Level.info,
    );
  }

  void logVerbose(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.v(message, error: error, stackTrace: stackTrace);
  }

  void logDebug(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.d(message, error: error, stackTrace: stackTrace);
  }

  void logInfo(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.i(message, error: error, stackTrace: stackTrace);
  }

  void logWarning(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.w(message, error: error, stackTrace: stackTrace);
  }

  void logError(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }

  void logWtf(String message, [dynamic error, StackTrace? stackTrace]) {
    _logger.wtf(message, error: error, stackTrace: stackTrace);
  }

  void logApiCall({
    required String method,
    required String endpoint,
    dynamic requestData,
    dynamic responseData,
    int? statusCode,
  }) {
    _logger.i(
      'API Call: $method $endpoint',
      error: 'Status: $statusCode',
    );
    if (AppConfig.enableDebugLogging) {
      if (requestData != null) {
        _logger.d('Request: $requestData');
      }
      if (responseData != null) {
        _logger.d('Response: $responseData');
      }
    }
  }

  void logException({
    required String title,
    required dynamic exception,
    required StackTrace stackTrace,
  }) {
    _logger.e(
      title,
      error: exception,
      stackTrace: stackTrace,
    );
  }
}
