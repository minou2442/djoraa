import 'package:dio/dio.dart';
import '../auth/models/user_model.dart';
import '../services/api_service.dart';

class PatientRepository {
  final ApiService _apiService;

  PatientRepository(this._apiService);

  Future<UserModel> getPatientProfile(String patientId) async {
    try {
      final response = await _apiService.get('/patients/$patientId');
      return UserModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getPatientMedicalFile(String patientId) async {
    try {
      final response = await _apiService.get('/patients/$patientId/medical-file');
      return response.data['data'] ?? {};
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserModel> updatePatientProfile({
    required String patientId,
    String? phoneNumber,
    String? address,
    String? emergencyContact,
    Map<String, dynamic>? medicalHistory,
  }) async {
    try {
      final response = await _apiService.put(
        '/patients/$patientId',
        data: {
          if (phoneNumber != null) 'phoneNumber': phoneNumber,
          if (address != null) 'address': address,
          if (emergencyContact != null) 'emergencyContact': emergencyContact,
          if (medicalHistory != null) 'medicalHistory': medicalHistory,
        },
      );
      return UserModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<UserModel>> searchDoctors({
    String? specialization,
    String? location,
    double? minRating,
  }) async {
    try {
      final response = await _apiService.get(
        '/doctors',
        queryParameters: {
          if (specialization != null) 'specialization': specialization,
          if (location != null) 'location': location,
          if (minRating != null) 'minRating': minRating,
        },
      );
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => UserModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      return error.response?.data['message'] ?? 'Failed to process patient data';
    }
    return error.message ?? 'Network error';
  }
}
