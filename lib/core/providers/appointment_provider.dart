import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/appointment_model.dart';
import '../repositories/appointment_repository.dart';
import '../services/api_service.dart';

final appointmentRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AppointmentRepository(apiService);
});

final appointmentsProvider = FutureProvider.family<
    List<AppointmentModel>,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.getAppointments(
    userId: params['userId'],
    status: params['status'],
    role: params['role'],
  );
});

final appointmentDetailProvider = FutureProvider.family<
    AppointmentModel,
    String
>((ref, appointmentId) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.getAppointmentDetail(appointmentId);
});

final bookAppointmentProvider = FutureProvider.family<
    AppointmentModel,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.bookAppointment(
    doctorId: params['doctorId'],
    patientId: params['patientId'],
    scheduledTime: params['scheduledTime'],
    reason: params['reason'],
  );
});

final updateAppointmentProvider = FutureProvider.family<
    AppointmentModel,
    Map<String, dynamic>
>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.updateAppointment(
    params['appointmentId'],
    status: params['status'],
    scheduledTime: params['scheduledTime'],
    notes: params['notes'],
  );
});

final cancelAppointmentProvider = FutureProvider.family<
    void,
    String
>((ref, appointmentId) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.cancelAppointment(appointmentId);
});

final apiServiceProvider = Provider((ref) {
  return ApiService.instance;
});
