import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/models/user_model.dart';
import '../repositories/patient_repository.dart';
import '../services/api_service.dart';

final patientRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PatientRepository(apiService);
});

final patientProfileProvider = FutureProvider.family<
    UserModel,
    String
>((ref, patientId) async {
  final repository = ref.watch(patientRepositoryProvider);
  return repository.getPatientProfile(patientId);
});

final patientMedicalFileProvider = FutureProvider.family<
    Map<String, dynamic>,
    String
>((ref, patientId) async {
  final repository = ref.watch(patientRepositoryProvider);
  return repository.getPatientMedicalFile(patientId);
});

final updatePatientProfileProvider = FutureProvider.family<
    UserModel,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(patientRepositoryProvider);
  return repository.updatePatientProfile(
    patientId: params['patientId'],
    phoneNumber: params['phoneNumber'],
    address: params['address'],
    emergencyContact: params['emergencyContact'],
    medicalHistory: params['medicalHistory'],
  );
});

final searchDoctorsProvider = FutureProvider.family<
    List<UserModel>,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(patientRepositoryProvider);
  return repository.searchDoctors(
    specialization: params['specialization'],
    location: params['location'],
    minRating: params['minRating'],
  );
});

final apiServiceProvider = Provider((ref) {
  return ApiService.instance;
});
