import 'package:dio/dio.dart';
import '../models/appointment_model.dart';
import '../services/api_service.dart';

class AppointmentRepository {
  final ApiService _apiService;

  AppointmentRepository(this._apiService);

  Future<List<AppointmentModel>> getAppointments({
    required String userId,
    String? status,
    String? role,
  }) async {
    try {
      final response = await _apiService.get(
        '/appointments',
        queryParameters: {
          'userId': userId,
          if (status != null) 'status': status,
          if (role != null) 'role': role,
        },
      );
      
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => AppointmentModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AppointmentModel> getAppointmentDetail(String appointmentId) async {
    try {
      final response = await _apiService.get('/appointments/$appointmentId');
      return AppointmentModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AppointmentModel> bookAppointment({
    required String doctorId,
    required String patientId,
    required DateTime scheduledTime,
    String? reason,
  }) async {
    try {
      final response = await _apiService.post(
        '/appointments',
        data: {
          'doctorId': doctorId,
          'patientId': patientId,
          'scheduledTime': scheduledTime.toIso8601String(),
          'reason': reason,
          'status': 'scheduled',
        },
      );
      return AppointmentModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AppointmentModel> updateAppointment(
    String appointmentId, {
    String? status,
    DateTime? scheduledTime,
    String? notes,
  }) async {
    try {
      final response = await _apiService.put(
        '/appointments/$appointmentId',
        data: {
          if (status != null) 'status': status,
          if (scheduledTime != null) 'scheduledTime': scheduledTime.toIso8601String(),
          if (notes != null) 'notes': notes,
        },
      );
      return AppointmentModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> cancelAppointment(String appointmentId) async {
    try {
      await _apiService.delete('/appointments/$appointmentId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      return error.response?.data['message'] ?? 'Failed to process appointment';
    }
    return error.message ?? 'Network error';
  }
}
