enum LabTestStatus { pending, completed, cancelled }

class LabTest {
  final String id;
  final String patientId;
  final String doctorId;
  final String testName;
  final String? description;
  final DateTime requestedDate;
  final DateTime? completedDate;
  final LabTestStatus status;
  final String? resultFileUrl;
  final String? notes;
  final String? labName;

  LabTest({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.testName,
    this.description,
    required this.requestedDate,
    this.completedDate,
    required this.status,
    this.resultFileUrl,
    this.notes,
    this.labName,
  });

  bool get isCompleted => status == LabTestStatus.completed;

  bool get isPending => status == LabTestStatus.pending;

  factory LabTest.fromJson(Map<String, dynamic> json) {
    return LabTest(
      id: json['id'] as String,
      patientId: json['patient_id'] as String,
      doctorId: json['doctor_id'] as String,
      testName: json['test_name'] as String,
      description: json['description'] as String?,
      requestedDate: DateTime.parse(json['requested_date'] as String),
      completedDate: json['completed_date'] != null
          ? DateTime.parse(json['completed_date'] as String)
          : null,
      status: _parseStatus(json['status'] as String?),
      resultFileUrl: json['result_file_url'] as String?,
      notes: json['notes'] as String?,
      labName: json['lab_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patient_id': patientId,
        'doctor_id': doctorId,
        'test_name': testName,
        'description': description,
        'requested_date': requestedDate.toIso8601String(),
        'completed_date': completedDate?.toIso8601String(),
        'status': status.name,
        'result_file_url': resultFileUrl,
        'notes': notes,
      };
}

LabTestStatus _parseStatus(String? status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return LabTestStatus.pending;
    case 'completed':
      return LabTestStatus.completed;
    case 'cancelled':
      return LabTestStatus.cancelled;
    default:
      return LabTestStatus.pending;
  }
}
