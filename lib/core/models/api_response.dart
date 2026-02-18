class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });

  factory ApiResponse.success({T? data, String? message}) {
    return ApiResponse(
      success: true,
      data: data,
      message: message,
      statusCode: 200,
    );
  }

  factory ApiResponse.error({
    required String message,
    int? statusCode,
  }) {
    return ApiResponse(
      success: false,
      data: null,
      message: message,
      statusCode: statusCode ?? 500,
    );
  }

  @override
  String toString() =>
      'ApiResponse(success: $success, data: $data, message: $message, statusCode: $statusCode)';
}
