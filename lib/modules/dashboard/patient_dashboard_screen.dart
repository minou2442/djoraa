import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/localization/app_localization.dart';
import '../../core/theme/color_scheme.dart';
import '../generated_role_pages/patient/01_dashboard_screen.dart';
import '../generated_role_pages/patient/02_my_appointments_screen.dart';
import '../generated_role_pages/patient/04_my_prescriptions_screen.dart';
import '../generated_role_pages/patient/07_patient_file_screen.dart';
import '../generated_role_pages/patient/10_profile_settings_screen.dart';

class PatientDashboardScreen extends ConsumerStatefulWidget {
  const PatientDashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PatientDashboardScreen> createState() =>
      _PatientDashboardScreenState();
}

class _PatientDashboardScreenState
    extends ConsumerState<PatientDashboardScreen>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _fabAnimationController;

  static const List<String> _titles = <String>[
    'Home',
    'Appointments',
    'Prescriptions',
    'Medical File',
    'Profile',
  ];

  static const List<IconData> _icons = [
    Icons.home_rounded,
    Icons.calendar_month_rounded,
    Icons.description_rounded,
    Icons.folder_shared_rounded,
    Icons.person_rounded,
  ];

  @override
  void initState() {
    super.initState();
    _fabAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _fabAnimationController.dispose();
    super.dispose();
  }

  List<Widget> get _pages => const <Widget>[
        PatientHomeTab(),
        MyAppointmentsScreen(),
        MyPrescriptionsScreen(),
        PatientFileScreen(),
        ProfileSettingsScreen(),
      ];

  void _onNavDestinationSelected(int index) {
    setState(() => _selectedIndex = index);
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(authStateProvider.notifier).logout();
              if (mounted) {
                Navigator.pop(context);
                context.go('/auth');
              }
            },
            child: const Text(
              'Logout',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalizations.of(context);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        elevation: 0,
        actions: <Widget>[
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: locale?.notifications,
          ),
          IconButton(
            onPressed: _handleLogout,
            icon: const Icon(Icons.logout_rounded),
            tooltip: locale?.logout,
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {},
              icon: const Icon(Icons.add_rounded),
              label: Text(locale?.bookAppointment ?? 'Book Appointment'),
              backgroundColor: AppColorScheme.lightColorScheme.primary,
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onNavDestinationSelected,
        backgroundColor: Colors.white,
        destinations: List.generate(
          _titles.length,
          (index) => NavigationDestination(
            selectedIcon: Icon(_icons[index]),
            icon: Icon(_icons[index]),
            label: _titles[index],
          ),
        ),
      ),
    );
  }
}

class PatientHomeTab extends StatelessWidget {
  const PatientHomeTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Card
          Container(
            decoration: BoxDecoration(
              gradient: AppColorScheme.Gradients.purpleGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColorScheme.lightColorScheme.primary
                      .withOpacity(0.3),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome Back!',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your health is our priority',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Quick Actions
          Text(
            'Quick Actions',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildQuickActionCard(
                context,
                icon: Icons.calendar_month_rounded,
                title: 'Book Appointment',
                color: Colors.blue,
              ),
              _buildQuickActionCard(
                context,
                icon: Icons.description_rounded,
                title: 'View Prescriptions',
                color: Colors.green,
              ),
              _buildQuickActionCard(
                context,
                icon: Icons.lab_profile,
                title: 'Lab Results',
                color: Colors.orange,
              ),
              _buildQuickActionCard(
                context,
                icon: Icons.folder_shared_rounded,
                title: 'Medical File',
                color: Colors.purple,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Upcoming Appointments
          Text(
            'Upcoming Appointments',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColorScheme.lightColorScheme.primary
                        .withOpacity(0.1),
                    child: Icon(
                      Icons.person,
                      color: AppColorScheme.lightColorScheme.primary,
                    ),
                  ),
                  title: const Text('Dr. Ahmed Hassan'),
                  subtitle: const Text('Tomorrow at 2:00 PM'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
  }) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ],
        ),
      ),
    );
  }
}
