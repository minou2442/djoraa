import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_provider.dart';
import '../../modules/auth/auth_screen.dart';
import '../../modules/dashboard/patient_dashboard_screen.dart';
import '../../modules/generated_role_pages/doctor/01_dashboard_screen.dart';
import '../../modules/generated_role_pages/laboratory/01_lab_dashboard_screen.dart';
import '../../modules/generated_role_pages/radiology/01_radiology_dashboard_screen.dart';
import '../../modules/generated_role_pages/pharmacy/01_pharmacy_dashboard_screen.dart';
import '../../modules/generated_role_pages/clinic_admin/01_facility_dashboard_screen.dart';
import '../../modules/generated_role_pages/super_admin/01_global_dashboard_screen.dart';
import '../../modules/splash/splash_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authState.maybeWhen(
        authenticated: (_) => true,
        orElse: () => false,
      );

      final isSplash = state.uri.path == '/splash';
      final isAuth = state.uri.path == '/auth';

      if (isSplash) return null;
      if (!isAuthenticated && !isAuth) {
        return '/auth';
      }
      if (isAuthenticated && isAuth) {
        return '/patient/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      // Patient Routes
      GoRoute(
        path: '/patient/home',
        builder: (context, state) => const PatientDashboardScreen(),
      ),
      // Doctor Routes
      GoRoute(
        path: '/doctor/home',
        builder: (context, state) => const DoctorDashboardScreen(),
      ),
      // Lab Routes
      GoRoute(
        path: '/lab/home',
        builder: (context, state) => const LabDashboardScreen(),
      ),
      // Radiology Routes
      GoRoute(
        path: '/radiology/home',
        builder: (context, state) => const RadiologyDashboardScreen(),
      ),
      // Pharmacy Routes
      GoRoute(
        path: '/pharmacy/home',
        builder: (context, state) => const PharmacyDashboardScreen(),
      ),
      // Admin Routes
      GoRoute(
        path: '/admin/home',
        builder: (context, state) => const ClinicAdminDashboardScreen(),
      ),
      GoRoute(
        path: '/super-admin/home',
        builder: (context, state) => const SuperAdminDashboardScreen(),
      ),
    ],
  );
});
