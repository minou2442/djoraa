import '../../roles/role_catalog.dart';

class UserModel {
  final String id;
  final String email;
  final String? phoneNumber;
  final String firstName;
  final String lastName;
  final DjoraaRole role;
  final String? profileImage;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final bool isActive;
  final bool isEmailVerified;
  final String? facilityId;
  final String? department;

  UserModel({
    required this.id,
    required this.email,
    this.phoneNumber,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.profileImage,
    required this.createdAt,
    this.updatedAt,
    this.isActive = true,
    this.isEmailVerified = false,
    this.facilityId,
    this.department,
  });

  String get fullName => '$firstName $lastName';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      phoneNumber: json['phone_number'] as String?,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      role: _parseRole(json['role'] as String?),
      profileImage: json['profile_image'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
      isEmailVerified: json['is_email_verified'] as bool? ?? false,
      facilityId: json['facility_id'] as String?,
      department: json['department'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone_number': phoneNumber,
      'first_name': firstName,
      'last_name': lastName,
      'role': _roleToString(role),
      'profile_image': profileImage,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'is_active': isActive,
      'is_email_verified': isEmailVerified,
      'facility_id': facilityId,
      'department': department,
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? phoneNumber,
    String? firstName,
    String? lastName,
    DjoraaRole? role,
    String? profileImage,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    bool? isEmailVerified,
    String? facilityId,
    String? department,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      profileImage: profileImage ?? this.profileImage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      facilityId: facilityId ?? this.facilityId,
      department: department ?? this.department,
    );
  }

  @override
  String toString() =>
      'UserModel(id: $id, email: $email, name: $fullName, role: $role)';
}

DjoraaRole _parseRole(String? roleString) {
  if (roleString == null) return DjoraaRole.patient;

  switch (roleString.toLowerCase()) {
    case 'patient':
      return DjoraaRole.patient;
    case 'doctor':
      return DjoraaRole.doctor;
    case 'dentist':
      return DjoraaRole.dentist;
    case 'pharmacy':
      return DjoraaRole.pharmacy;
    case 'laboratory':
      return DjoraaRole.laboratory;
    case 'radiology':
      return DjoraaRole.radiology;
    case 'clinic_admin':
      return DjoraaRole.clinicAdmin;
    case 'super_admin':
      return DjoraaRole.superAdmin;
    default:
      return DjoraaRole.patient;
  }
}

String _roleToString(DjoraaRole role) {
  switch (role) {
    case DjoraaRole.patient:
      return 'patient';
    case DjoraaRole.doctor:
      return 'doctor';
    case DjoraaRole.dentist:
      return 'dentist';
    case DjoraaRole.pharmacy:
      return 'pharmacy';
    case DjoraaRole.laboratory:
      return 'laboratory';
    case DjoraaRole.radiology:
      return 'radiology';
    case DjoraaRole.clinicAdmin:
      return 'clinic_admin';
    case DjoraaRole.superAdmin:
      return 'super_admin';
  }
}
