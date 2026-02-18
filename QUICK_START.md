# Djoraa Healthcare - Quick Start Guide

## Prerequisites

- Flutter SDK (>=3.10.0)
- Dart SDK (>=3.0.0)
- Android Studio / Xcode for mobile development

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd djoraa_mobile
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Configure API Endpoint

Edit `lib/config/app_config.dart`:
```dart
static const String baseUrl = 'http://your-api-url/api';
```

### 4. Run the App

**Development Mode**:
```bash
flutter run
```

**Release Mode**:
```bash
flutter run --release
```

## Project Structure Overview

- `lib/main.dart` - App entry point
- `lib/config/` - Configuration and routing
- `lib/core/` - Core business logic
  - `auth/` - Authentication system
  - `services/` - HTTP, storage, logging
  - `theme/` - Design system
  - `localization/` - Multi-language support
- `lib/modules/` - Feature screens

## Key Files to Understand

1. **Authentication** → `lib/core/auth/auth_provider.dart`
2. **API Calls** → `lib/core/services/api_service.dart`
3. **Routing** → `lib/config/routes/app_router.dart`
4. **Theme** → `lib/core/theme/app_theme.dart`
5. **Languages** → `lib/core/localization/`

## Development Workflow

### Adding a New Feature Screen

1. Create screen in `lib/modules/[feature_name]/`
2. Add route in `lib/config/routes/app_router.dart`
3. Create Riverpod provider if state management needed
4. Use AppLocalizations for strings

Example:
```dart
import 'package:flutter/material.dart';
import '../../core/localization/app_localization.dart';

class MyFeatureScreen extends StatelessWidget {
  const MyFeatureScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(locale?.home ?? 'Home')),
      body: // Your content here
    );
  }
}
```

### Making API Calls

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';
import '../../core/di/service_locator.dart';

final fetchDataProvider = FutureProvider((ref) async {
  final apiService = getIt<ApiService>();
  final response = await apiService.get(
    '/endpoint',
    fromJson: (json) => MyModel.fromJson(json),
  );
  
  if (response.success) {
    return response.data;
  } else {
    throw Exception(response.message);
  }
});
```

### Accessing Current User

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_provider.dart';

// In a ConsumerWidget or ConsumerStatefulWidget
final user = ref.watch(currentUserProvider);
```

### Using Localization

```dart
final locale = AppLocalizations.of(context);

// Option 1: Using helper properties
Text(locale?.login ?? 'Login');

// Option 2: Using translate method
Text(locale?.translate('login') ?? 'Login');
```

## Common Tasks

### Change Default Language

Edit `lib/main.dart`:
```dart
const DjoraaApp(
  initialLocale: Locale('ar', ''), // Arabic (default)
  // Or: Locale('fr', ''), // French
  // Or: Locale('en', ''), // English
)
```

### Add New Translation

1. Add key-value pair to `localization_ar.dart`, `localization_en.dart`, `localization_fr.dart`
2. Add helper property in `AppLocalizations` class (optional)
3. Use in widget

### Customize Colors

Edit `lib/core/theme/color_scheme.dart`:
```dart
static const Color _purplePrimary = Color(0xFF7C3AED);
```

### Add Loading State

```dart
class MyScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myDataProvider);
    
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(child: Text('Error: $error')),
      data: (data) => ListView(...),
    );
  }
}
```

## Testing

Run all tests:
```bash
flutter test
```

Run specific test file:
```bash
flutter test test/models/user_model_test.dart
```

## Troubleshooting

### "Service Locator not initialized"
Make sure `setupServiceLocator()` is called in `main()` before `runApp()`

### "API returns 401"
Check that bearer token is being sent. Verify in `ApiService` interceptor.

### "Localization not working"
Ensure `AppLocalizations` is wrapped in `Localizations.of<AppLocalizations>`

### "GoRouter navigation not working"
Check route paths match exactly. Use `context.go()` or `context.push()`

## Building for Release

### iOS
```bash
flutter build ios --release
# Or build for specific device
flutter build ios --release --no-codesign
```

### Android
```bash
# APK
flutter build apk --release

# App Bundle (recommended for Play Store)
flutter build appbundle --release
```

### macOS
```bash
flutter build macos --release
```

### Web
```bash
flutter build web --release
```

## Performance Tips

1. Use `ListView.builder` instead of `ListView` for large lists
2. Cache images with `cached_network_image`
3. Avoid rebuilds with `const` constructors
4. Use `Riverpod` for efficient state management
5. Profile with `flutter run --profile`

## Security Checklist

- [ ] Update `baseUrl` to production API
- [ ] Enable SSL pinning for API calls
- [ ] Change debug logging to false in production
- [ ] Implement proper error messages (no stack traces)
- [ ] Test authentication flows thoroughly
- [ ] Validate all user inputs
- [ ] Use HTTPS only
- [ ] Implement proper session timeout

## Useful Commands

```bash
# Clean build
flutter clean

# Get packages
flutter pub get

# Upgrade packages
flutter pub upgrade

# Code generation (if using Freezed, etc)
dart run build_runner build

# Format code
dart format lib/

# Analyze code
flutter analyze

# Check for security issues
dart pub audit

# Generate app icons
flutter pub run flutter_launcher_icons:main
```

## Useful Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [Dio HTTP Client](https://github.com/flutterchina/dio)
- [Material Design](https://material.io/design)
- [Go Router](https://pub.dev/packages/go_router)

## Getting Help

1. Check the **IMPLEMENTATION_GUIDE.md** for detailed architecture
2. Look at existing screens for patterns
3. Review error messages and logs
4. Check Flutter and package documentation
5. Search GitHub issues for similar problems

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add: My new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

## Deployment Checklist

- [ ] Update version in `pubspec.yaml`
- [ ] Update `appVersion` in `app_config.dart`
- [ ] Test all user flows
- [ ] Update API endpoint URLs
- [ ] Enable analytics
- [ ] Test on real devices
- [ ] Update app description/icon
- [ ] Prepare release notes
- [ ] Submit to app stores

---

**Happy Coding!** 🚀

For more detailed information, refer to **IMPLEMENTATION_GUIDE.md** and **PROJECT_STATUS.md**.
