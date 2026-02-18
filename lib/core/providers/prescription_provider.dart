import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/prescription_model.dart';
import '../repositories/prescription_repository.dart';
import '../services/api_service.dart';

final prescriptionRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PrescriptionRepository(apiService);
});

final prescriptionsProvider = FutureProvider.family<
    List<PrescriptionModel>,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(prescriptionRepositoryProvider);
  return repository.getPrescriptions(
    userId: params['userId'],
    status: params['status'],
    role: params['role'],
  );
});

final prescriptionDetailProvider = FutureProvider.family<
    PrescriptionModel,
    String
>((ref, prescriptionId) async {
  final repository = ref.watch(prescriptionRepositoryProvider);
  return repository.getPrescriptionDetail(prescriptionId);
});

final createPrescriptionProvider = FutureProvider.family<
    PrescriptionModel,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(prescriptionRepositoryProvider);
  return repository.createPrescription(
    patientId: params['patientId'],
    doctorId: params['doctorId'],
    medications: params['medications'],
    notes: params['notes'],
  );
});

final updatePrescriptionProvider = FutureProvider.family<
    PrescriptionModel,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(prescriptionRepositoryProvider);
  return repository.updatePrescription(
    params['prescriptionId'],
    status: params['status'],
    notes: params['notes'],
  );
});

final dispensePrescriptionProvider = FutureProvider.family<
    void,
    String
>((ref, prescriptionId) async {
  final repository = ref.watch(prescriptionRepositoryProvider);
  return repository.dispensePrescription(prescriptionId);
});

final apiServiceProvider = Provider((ref) {
  return ApiService.instance;
});
