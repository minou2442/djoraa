import 'user_model.dart';

class AuthResponse {
  final String accessToken;
  final String? refreshToken;
  final UserModel user;
  final String? expiresIn;

  AuthResponse({
    required this.accessToken,
    this.refreshToken,
    required this.user,
    this.expiresIn,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String?,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      expiresIn: json['expires_in'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'user': user.toJson(),
      'expires_in': expiresIn,
    };
  }

  @override
  String toString() =>
      'AuthResponse(accessToken: $accessToken, user: ${user.fullName})';
}
