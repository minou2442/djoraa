import 'package:flutter/material.dart';

class AppColorScheme {
  // Primary Purple Color
  static const Color _purplePrimary = Color(0xFF7C3AED); // Vibrant Purple
  static const Color _purpleDark = Color(0xFF5B21B6); // Dark Purple
  static const Color _purpleLight = Color(0xFFA78BFA); // Light Purple

  // Light Theme Color Scheme
  static final ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    // Primary Colors - Purple
    primary: _purplePrimary,
    onPrimary: Colors.white,
    primaryContainer: _purpleLight,
    onPrimaryContainer: _purpleDark,
    
    // Secondary Colors - Teal (complementary)
    secondary: const Color(0xFF14B8A6),
    onSecondary: Colors.white,
    secondaryContainer: const Color(0xFFB2F5EA),
    onSecondaryContainer: const Color(0xFF0D9488),
    
    // Tertiary Colors - Amber (accent)
    tertiary: const Color(0xFFFB923C),
    onTertiary: Colors.white,
    tertiaryContainer: const Color(0xFFFEDEBB),
    onTertiaryContainer: const Color(0xFF92400E),
    
    // Error Colors
    error: const Color(0xFFB3261E),
    onError: Colors.white,
    errorContainer: const Color(0xFFF9DEDC),
    onErrorContainer: const Color(0xFF8C0000),
    
    // Background & Surface
    background: const Color(0xFFFAF9F6),
    onBackground: const Color(0xFF1C1B1F),
    surface: Colors.white,
    onSurface: const Color(0xFF1C1B1F),
    surfaceVariant: const Color(0xFFEFEFEF),
    onSurfaceVariant: const Color(0xFF49454E),
    
    // Outline
    outline: const Color(0xFF79747E),
    outlineVariant: const Color(0xFFCAC7D0),
    
    // Shadow
    shadow: const Color(0xFF000000),
    
    // Scrim
    scrim: const Color(0xFF000000),
  );

  // Dark Theme Color Scheme
  static final ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    // Primary Colors - Purple
    primary: _purpleLight,
    onPrimary: _purpleDark,
    primaryContainer: _purpleDark,
    onPrimaryContainer: _purpleLight,
    
    // Secondary Colors - Teal
    secondary: const Color(0xFF4D9E95),
    onSecondary: const Color(0xFF0F4D47),
    secondaryContainer: const Color(0xFF0F4D47),
    onSecondaryContainer: const Color(0xFFB2F5EA),
    
    // Tertiary Colors - Amber
    tertiary: const Color(0xFFFFB74D),
    onTertiary: const Color(0xFF5D2E0F),
    tertiaryContainer: const Color(0xFF804620),
    onTertiaryContainer: const Color(0xFFFFDCC2),
    
    // Error Colors
    error: const Color(0xFFF2B8B5),
    onError: const Color(0xFF601410),
    errorContainer: const Color(0xFF8C0000),
    onErrorContainer: const Color(0xFFF9DEDC),
    
    // Background & Surface
    background: const Color(0xFF1C1B1F),
    onBackground: const Color(0xFFE6E0E9),
    surface: const Color(0xFF1C1B1F),
    onSurface: const Color(0xFFE6E0E9),
    surfaceVariant: const Color(0xFF49454E),
    onSurfaceVariant: const Color(0xFFCAC7D0),
    
    // Outline
    outline: const Color(0xFF938F96),
    outlineVariant: const Color(0xFF49454E),
    
    // Shadow
    shadow: const Color(0xFF000000),
    
    // Scrim
    scrim: const Color(0xFF000000),
  );

  // Semantic Colors
  static class SemanticColors {
    static const Color success = Color(0xFF10B981);
    static const Color warning = Color(0xFFFCD34D);
    static const Color info = Color(0xFF3B82F6);
    
    static const Color successLight = Color(0xFFD1F4E6);
    static const Color warningLight = Color(0xFFFEF08A);
    static const Color infoLight = Color(0xFFDEE9F5);
  }

  // Gradients
  static class Gradients {
    static const LinearGradient purpleGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        _purplePrimary,
        _purpleDark,
      ],
    );

    static const LinearGradient tealGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFF14B8A6),
        Color(0xFF0D9488),
      ],
    );

    static const LinearGradient mixedGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        _purplePrimary,
        Color(0xFF14B8A6),
      ],
    );
  }
}
