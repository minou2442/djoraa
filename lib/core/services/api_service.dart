import 'package:dio/dio.dart';
import '../models/api_response.dart';
import 'logger_service.dart';
import '../di/service_locator.dart';

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.get(
        endpoint,
        queryParameters: queryParameters,
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      getIt<LoggerService>().logError('GET Error', e.error, e.stackTrace);
      return ApiResponse<T>.error(
        message: e.message ?? 'Unknown error occurred',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      getIt<LoggerService>().logError('GET Error', e, StackTrace.current);
      return ApiResponse<T>.error(message: 'Unknown error occurred');
    }
  }

  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.post(
        endpoint,
        data: data,
        queryParameters: queryParameters,
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      getIt<LoggerService>().logError('POST Error', e.error, e.stackTrace);
      return ApiResponse<T>.error(
        message: e.message ?? 'Unknown error occurred',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      getIt<LoggerService>().logError('POST Error', e, StackTrace.current);
      return ApiResponse<T>.error(message: 'Unknown error occurred');
    }
  }

  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.put(
        endpoint,
        data: data,
        queryParameters: queryParameters,
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      getIt<LoggerService>().logError('PUT Error', e.error, e.stackTrace);
      return ApiResponse<T>.error(
        message: e.message ?? 'Unknown error occurred',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      getIt<LoggerService>().logError('PUT Error', e, StackTrace.current);
      return ApiResponse<T>.error(message: 'Unknown error occurred');
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.delete(
        endpoint,
        queryParameters: queryParameters,
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      getIt<LoggerService>().logError('DELETE Error', e.error, e.stackTrace);
      return ApiResponse<T>.error(
        message: e.message ?? 'Unknown error occurred',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      getIt<LoggerService>().logError('DELETE Error', e, StackTrace.current);
      return ApiResponse<T>.error(message: 'Unknown error occurred');
    }
  }

  ApiResponse<T> _handleResponse<T>(
    Response response,
    T Function(dynamic)? fromJson,
  ) {
    if (response.statusCode != null &&
        response.statusCode! >= 200 &&
        response.statusCode! < 300) {
      try {
        final data = response.data;
        if (fromJson != null && data != null) {
          return ApiResponse<T>.success(data: fromJson(data));
        }
        return ApiResponse<T>.success();
      } catch (e) {
        getIt<LoggerService>().logError('Parse Error', e, StackTrace.current);
        return ApiResponse<T>.error(message: 'Failed to parse response');
      }
    } else {
      final statusCode = response.statusCode ?? 500;
      final message = response.data?['message'] ?? 'Server error';
      return ApiResponse<T>.error(
        message: message,
        statusCode: statusCode,
      );
    }
  }
}
