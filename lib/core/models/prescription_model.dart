enum PrescriptionStatus { pending, dispensed, expired, voided }

class Medication {
  final String name;
  final String? dosage;
  final String? frequency;
  final int? duration; // in days
  final String? instructions;

  Medication({
    required this.name,
    this.dosage,
    this.frequency,
    this.duration,
    this.instructions,
  });

  factory Medication.fromJson(Map<String, dynamic> json) {
    return Medication(
      name: json['name'] as String,
      dosage: json['dosage'] as String?,
      frequency: json['frequency'] as String?,
      duration: json['duration'] as int?,
      instructions: json['instructions'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'dosage': dosage,
        'frequency': frequency,
        'duration': duration,
        'instructions': instructions,
      };
}

class Prescription {
  final String id;
  final String patientId;
  final String doctorId;
  final List<Medication> medications;
  final DateTime issuedDate;
  final DateTime expiryDate;
  final PrescriptionStatus status;
  final String? notes;
  final String? doctorName;
  final String? patientName;
  final DateTime? dispensedDate;

  Prescription({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.medications,
    required this.issuedDate,
    required this.expiryDate,
    required this.status,
    this.notes,
    this.doctorName,
    this.patientName,
    this.dispensedDate,
  });

  bool get isExpired => DateTime.now().isAfter(expiryDate);

  bool get isDispensed => status == PrescriptionStatus.dispensed;

  factory Prescription.fromJson(Map<String, dynamic> json) {
    final medicationsList = json['medications'] as List<dynamic>?;
    final medications = medicationsList != null
        ? medicationsList
            .map((e) => Medication.fromJson(e as Map<String, dynamic>))
            .toList()
        : <Medication>[];

    return Prescription(
      id: json['id'] as String,
      patientId: json['patient_id'] as String,
      doctorId: json['doctor_id'] as String,
      medications: medications,
      issuedDate: DateTime.parse(json['issued_date'] as String),
      expiryDate: DateTime.parse(json['expiry_date'] as String),
      status: _parseStatus(json['status'] as String?),
      notes: json['notes'] as String?,
      doctorName: json['doctor_name'] as String?,
      patientName: json['patient_name'] as String?,
      dispensedDate: json['dispensed_date'] != null
          ? DateTime.parse(json['dispensed_date'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patient_id': patientId,
        'doctor_id': doctorId,
        'medications': medications.map((m) => m.toJson()).toList(),
        'issued_date': issuedDate.toIso8601String(),
        'expiry_date': expiryDate.toIso8601String(),
        'status': status.name,
        'notes': notes,
      };
}

PrescriptionStatus _parseStatus(String? status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return PrescriptionStatus.pending;
    case 'dispensed':
      return PrescriptionStatus.dispensed;
    case 'expired':
      return PrescriptionStatus.expired;
    case 'voided':
      return PrescriptionStatus.voided;
    default:
      return PrescriptionStatus.pending;
  }
}
