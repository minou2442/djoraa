enum AppointmentStatus { scheduled, completed, cancelled, noshow }

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final DateTime appointmentDate;
  final DateTime createdAt;
  final AppointmentStatus status;
  final String? notes;
  final String? location;
  final String? duration; // in minutes
  final String? doctorName;
  final String? patientName;
  final String? patientPhone;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.appointmentDate,
    required this.createdAt,
    required this.status,
    this.notes,
    this.location,
    this.duration,
    this.doctorName,
    this.patientName,
    this.patientPhone,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      patientId: json['patient_id'] as String,
      doctorId: json['doctor_id'] as String,
      appointmentDate: DateTime.parse(json['appointment_date'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      status: _parseStatus(json['status'] as String?),
      notes: json['notes'] as String?,
      location: json['location'] as String?,
      duration: json['duration'] as String?,
      doctorName: json['doctor_name'] as String?,
      patientName: json['patient_name'] as String?,
      patientPhone: json['patient_phone'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patient_id': patientId,
        'doctor_id': doctorId,
        'appointment_date': appointmentDate.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
        'status': status.name,
        'notes': notes,
        'location': location,
        'duration': duration,
      };

  bool get isUpcoming => appointmentDate.isAfter(DateTime.now());

  bool get isPast => appointmentDate.isBefore(DateTime.now());
}

AppointmentStatus _parseStatus(String? status) {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return AppointmentStatus.scheduled;
    case 'completed':
      return AppointmentStatus.completed;
    case 'cancelled':
      return AppointmentStatus.cancelled;
    case 'noshow':
      return AppointmentStatus.noshow;
    default:
      return AppointmentStatus.scheduled;
  }
}
