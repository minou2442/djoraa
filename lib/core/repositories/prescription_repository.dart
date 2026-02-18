import 'package:dio/dio.dart';
import '../models/prescription_model.dart';
import '../services/api_service.dart';

class PrescriptionRepository {
  final ApiService _apiService;

  PrescriptionRepository(this._apiService);

  Future<List<PrescriptionModel>> getPrescriptions({
    required String userId,
    String? status,
    String? role,
  }) async {
    try {
      final response = await _apiService.get(
        '/prescriptions',
        queryParameters: {
          'userId': userId,
          if (status != null) 'status': status,
          if (role != null) 'role': role,
        },
      );
      
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => PrescriptionModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<PrescriptionModel> getPrescriptionDetail(String prescriptionId) async {
    try {
      final response = await _apiService.get('/prescriptions/$prescriptionId');
      return PrescriptionModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<PrescriptionModel> createPrescription({
    required String patientId,
    required String doctorId,
    required List<Map<String, dynamic>> medications,
    String? notes,
  }) async {
    try {
      final response = await _apiService.post(
        '/prescriptions',
        data: {
          'patientId': patientId,
          'doctorId': doctorId,
          'medications': medications,
          'notes': notes,
          'status': 'issued',
          'issuedDate': DateTime.now().toIso8601String(),
        },
      );
      return PrescriptionModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<PrescriptionModel> updatePrescription(
    String prescriptionId, {
    String? status,
    String? notes,
  }) async {
    try {
      final response = await _apiService.put(
        '/prescriptions/$prescriptionId',
        data: {
          if (status != null) 'status': status,
          if (notes != null) 'notes': notes,
        },
      );
      return PrescriptionModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> dispensePrescription(String prescriptionId) async {
    try {
      await _apiService.patch(
        '/prescriptions/$prescriptionId/dispense',
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      return error.response?.data['message'] ?? 'Failed to process prescription';
    }
    return error.message ?? 'Network error';
  }
}
