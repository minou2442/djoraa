import 'package:flutter/material.dart';
import 'color_scheme.dart';

class AppTextTheme {
  // Light Theme Text Theme
  static TextTheme get lightTextTheme {
    return TextTheme(
      // Display styles (Large headings)
      displayLarge: TextStyle(
        fontSize: 57,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.12,
        letterSpacing: -0.25,
      ),
      displayMedium: TextStyle(
        fontSize: 45,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.16,
      ),
      displaySmall: TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.22,
      ),
      
      // Headline styles (Section headings)
      headlineLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.25,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.29,
      ),
      headlineSmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.33,
      ),
      
      // Title styles
      titleLarge: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.27,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.5,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.43,
        letterSpacing: 0.1,
      ),
      
      // Body styles
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.43,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onSurfaceVariant,
        height: 1.33,
        letterSpacing: 0.4,
      ),
      
      // Label styles
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.43,
        letterSpacing: 0.1,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.33,
        letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        fontFamily: 'Poppins',
        color: AppColorScheme.lightColorScheme.onBackground,
        height: 1.45,
        letterSpacing: 0.5,
      ),
    );
  }

  // Dark Theme Text Theme
  static TextTheme get darkTextTheme {
    return TextTheme(
      // Display styles
      displayLarge: TextStyle(
        fontSize: 57,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.12,
        letterSpacing: -0.25,
      ),
      displayMedium: TextStyle(
        fontSize: 45,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.16,
      ),
      displaySmall: TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.22,
      ),
      
      // Headline styles
      headlineLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.25,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.29,
      ),
      headlineSmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.33,
      ),
      
      // Title styles
      titleLarge: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.27,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.5,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        fontFamily: 'Cairo',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.43,
        letterSpacing: 0.1,
      ),
      
      // Body styles
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.43,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onSurfaceVariant,
        height: 1.33,
        letterSpacing: 0.4,
      ),
      
      // Label styles
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.43,
        letterSpacing: 0.1,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.33,
        letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        fontFamily: 'Poppins',
        color: AppColorScheme.darkColorScheme.onBackground,
        height: 1.45,
        letterSpacing: 0.5,
      ),
    );
  }
}
