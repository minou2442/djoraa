# Djoraa Healthcare App - Implementation Guide

## Project Overview

Djoraa is a comprehensive Flutter-based healthcare management system with role-based access for patients, doctors, dentists, pharmacies, laboratories, radiology departments, clinic admins, and super admins.

## Architecture

The application follows a **clean architecture pattern** with proper separation of concerns:

```
lib/
├── config/           # App configuration
│   ├── app_config.dart
│   └── routes/
│       └── app_router.dart
├── core/             # Core functionalities
│   ├── auth/         # Authentication system
│   ├── di/           # Dependency injection (service locator)
│   ├── models/       # Core data models
│   ├── services/     # HTTP, storage, logger services
│   ├── theme/        # Design system & theming
│   ├── localization/ # Multi-language support (AR, FR, EN)
│   └── utils/        # Error handling & utilities
├── modules/          # Feature modules
│   ├── auth/         # Authentication screens
│   ├── dashboard/    # Role-based dashboards
│   ├── generated_role_pages/ # All role-specific screens
│   └── splash/       # Splash screen
└── main.dart         # App entry point
```

## Technology Stack

### State Management
- **Riverpod**: Modern state management with providers
- Provider pattern for dependency injection
- Reactive data binding

### HTTP & API
- **Dio**: Robust HTTP client with interceptors
- Automatic token injection
- Error handling & retry logic

### Local Storage
- **Shared Preferences**: Simple key-value storage
- **Hive**: Encrypted local database (optional)

### UI & Design
- **Material 3**: Latest Material Design specifications
- **Flutter SVG**: Vector graphics support
- **Cached Network Image**: Image caching

### Localization
- **Intl**: Internationalization support
- **Arabic (AR)** as primary language
- **French (FR)** and **English (EN)** support
- RTL support for Arabic

### Logging
- **Logger**: Comprehensive logging system

## Color Scheme (Purple Theme)

**Primary**: `#7C3AED` (Vibrant Purple)
**Dark Primary**: `#5B21B6`
**Light Primary**: `#A78BFA`
**Secondary**: `#14B8A6` (Teal)
**Tertiary**: `#FB923C` (Amber)

## Project Structure

### 1. Authentication (`lib/core/auth/`)
- **Models**: `UserModel`, `AuthResponse`
- **Provider**: `authStateProvider` (Riverpod)
- **Features**:
  - Email/Password Login
  - User Registration
  - Token Management (Access & Refresh)
  - Session Persistence
  - Automatic Token Injection in API Calls

### 2. Services (`lib/core/services/`)

#### ApiService
```dart
// GET, POST, PUT, DELETE with generic typing
final response = await apiService.get<UserModel>(
  '/users/profile',
  fromJson: (json) => UserModel.fromJson(json),
);
```

#### StorageService
```dart
// Auth tokens
await storageService.saveAuthToken(token);
final token = storageService.getAuthToken();

// User data
await storageService.saveUserData(userData);
final userData = storageService.getUserData();
```

#### LoggerService
```dart
// Logging at different levels
loggerService.logInfo('User logged in');
loggerService.logError('Error occurred', error, stackTrace);
loggerService.logApiCall(
  method: 'POST',
  endpoint: '/auth/login',
  statusCode: 200,
);
```

### 3. Data Models

- **UserModel**: User information with role
- **Appointment**: Appointment with status
- **Prescription**: Medications with instructions
- **LabTest**: Laboratory test requests
- **ApiResponse<T>**: Generic API response wrapper

### 4. Routing (`lib/config/routes/`)

Role-based routing:
- `/auth` - Authentication
- `/splash` - Splash screen
- `/patient/home` - Patient dashboard
- `/doctor/home` - Doctor dashboard
- `/lab/home` - Laboratory dashboard
- `/radiology/home` - Radiology dashboard
- `/pharmacy/home` - Pharmacy dashboard
- `/admin/home` - Clinic admin dashboard
- `/super-admin/home` - Super admin dashboard

### 5. Localization

Available strings in 3 languages (AR, FR, EN):
- Authentication strings
- Common actions (save, delete, edit, cancel)
- Status messages
- Error messages
- Role-specific terms

Access in widgets:
```dart
final locale = AppLocalizations.of(context);
Text(locale?.login ?? 'Login');
```

### 6. Theme System

Comprehensive theming with:
- Light and dark themes
- Consistent spacing
- Typography scales
- Color schemes
- Component styling

## Implemented Features

### ✅ Complete
1. **Core Architecture**
   - Service Locator (DI)
   - Riverpod providers
   - Error handling framework

2. **Authentication**
   - Login screen with email/password
   - Registration screen
   - Token management
   - Session persistence
   - Auto-redirect on auth state change

3. **UI/UX**
   - Modern purple theme with animations
   - Smooth transitions & effects
   - Responsive layouts
   - Material 3 components

4. **Localization**
   - Arabic (RTL support)
   - French
   - English
   - Dynamic language switching

5. **Dashboards**
   - Patient dashboard with quick actions
   - Doctor dashboard with patient queue
   - Placeholder dashboards for other roles

### 🚧 In Progress
1. **Patient Features**
   - Appointments booking & management
   - Prescription viewing
   - Medical file access
   - Lab results

2. **Doctor Features**
   - Patient management
   - Prescription writing
   - Lab order requests
   - Dental chart (for dentists)

3. **Administrative Features**
   - User management
   - Analytics & reports
   - Inventory management

### 📋 To Do
1. **Image & File Management**
   - Profile picture upload
   - Medical document uploads
   - Lab result attachments

2. **Real-time Features**
   - Appointment notifications
   - Chat/messaging
   - Real-time status updates

3. **Advanced Features**
   - Video consultations
   - Appointment reminders
   - Health analytics dashboard
   - Insurance management

## Backend Integration

### API Endpoints Required

```
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

GET    /users/profile
PUT    /users/profile

GET    /appointments
POST   /appointments
GET    /appointments/:id
PUT    /appointments/:id
DELETE /appointments/:id

GET    /prescriptions
POST   /prescriptions
GET    /prescriptions/:id
PUT    /prescriptions/:id

GET    /lab-tests
POST   /lab-tests
GET    /lab-tests/:id
PUT    /lab-tests/:id

GET    /doctors
GET    /patients (for doctors)
GET    /pharmacies
GET    /laboratories
GET    /radiology-centers
```

### Response Format

All APIs should return:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message"
}

// Error response
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

### Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer {access_token}
```

## Environment Configuration

Update `lib/config/app_config.dart`:
```dart
static const String baseUrl = 'http://your-api-url/api';
static const Duration apiTimeout = Duration(seconds: 30);
static const bool enableDebugLogging = true;
```

## Error Handling

The app includes comprehensive error handling:
- Network errors (timeout, connection failed)
- Server errors (5xx responses)
- Validation errors (4xx responses)
- Authentication errors (401, 403)
- Custom exceptions for business logic

```dart
try {
  final response = await apiService.get('/endpoint');
  if (response.success) {
    // Handle success
  } else {
    // Handle error
  }
} on NetworkException catch (e) {
  // Network error
} on ServerException catch (e) {
  // Server error
} on AppException catch (e) {
  // Other errors
}
```

## Testing

Create tests in `test/` directory:
```dart
test('login should update auth state', () {
  // test implementation
});
```

Run tests:
```bash
flutter test
```

## Building & Deployment

### Development Build
```bash
flutter run
```

### Release Build
```bash
# iOS
flutter build ios --release

# Android
flutter build apk --release
flutter build appbundle --release
```

## Performance Tips

1. **Images**: Use `cached_network_image` for network images
2. **Lists**: Use `ListView.builder` for large lists
3. **State**: Use Riverpod for efficient state management
4. **Navigation**: Use GoRouter for declarative routing
5. **Logging**: Disable debug logging in production

## Security Considerations

1. **Token Storage**: Tokens stored in SharedPreferences (consider Keystore for production)
2. **SSL Pinning**: Add certificate pinning for API calls
3. **Input Validation**: Validate all user inputs
4. **Authorization**: Implement proper role-based access control
5. **Data Encryption**: Encrypt sensitive data in storage

## Next Steps

1. Implement remaining screen designs
2. Connect all screens to API endpoints
3. Add comprehensive error handling UI
4. Implement real-time features (WebSocket/Firebase)
5. Add offline capabilities with Hive
6. Implement image upload/download
7. Add analytics tracking
8. Set up crash reporting
9. Create comprehensive test suite
10. Prepare for app store release

## Support & Documentation

- Flutter: https://flutter.dev
- Riverpod: https://riverpod.dev
- Dio: https://pub.dev/packages/dio
- GoRouter: https://pub.dev/packages/go_router

## License

All rights reserved © Djoraa Healthcare
