class AppConfig {
  static const String appName = 'Djoraa Healthcare';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000/api'; // Adjust based on your backend
  static const Duration apiTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;
  
  // Feature Flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableDebugLogging = true;
  
  // Localization
  static const String defaultLocale = 'ar'; // Arabic as default
  static const List<String> supportedLocales = ['ar', 'fr', 'en'];
  
  // Security
  static const int sessionTimeoutMinutes = 15;
  static const int maxLoginAttempts = 5;
  static const int loginLockoutMinutes = 15;
}
