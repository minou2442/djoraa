import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/theme/design_tokens.dart";
import "package:djoraa_mobile/modules/appointments/appointments_screen.dart";
import "package:djoraa_mobile/modules/patient_file/patient_file_screen.dart";
import "package:djoraa_mobile/modules/prescriptions/prescriptions_screen.dart";
import "package:djoraa_mobile/modules/profile/profile_screen.dart";
import "package:djoraa_mobile/routes/app_routes.dart";

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({super.key});

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> {
  int _selectedIndex = 0;

  static const List<String> _titles = <String>[
    "Home",
    "Appointments",
    "Prescriptions",
    "Records",
    "Profile",
  ];

  static const List<NavigationDestination> _destinations =
      <NavigationDestination>[
        NavigationDestination(
          selectedIcon: Icon(Icons.home_rounded),
          icon: Icon(Icons.home_outlined),
          label: "Home",
        ),
        NavigationDestination(
          selectedIcon: Icon(Icons.calendar_month_rounded),
          icon: Icon(Icons.calendar_month_outlined),
          label: "Appointments",
        ),
        NavigationDestination(
          selectedIcon: Icon(Icons.description_rounded),
          icon: Icon(Icons.description_outlined),
          label: "Prescriptions",
        ),
        NavigationDestination(
          selectedIcon: Icon(Icons.folder_shared_rounded),
          icon: Icon(Icons.folder_copy_outlined),
          label: "Records",
        ),
        NavigationDestination(
          selectedIcon: Icon(Icons.person_rounded),
          icon: Icon(Icons.person_outline_rounded),
          label: "Profile",
        ),
      ];

  List<Widget> get _pages => const <Widget>[
        _PatientHomeTab(),
        AppointmentsScreen(),
        PrescriptionsScreen(),
        PatientFileScreen(),
        ProfileScreen(),
      ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        actions: <Widget>[
          IconButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: "Notifications",
          ),
          IconButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
            icon: const Icon(Icons.tune_rounded),
            tooltip: "Settings",
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, AppRoutes.appointments),
        icon: const Icon(Icons.add_rounded),
        label: const Text("Book Now"),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        destinations: _destinations,
        onDestinationSelected: (int index) {
          setState(() => _selectedIndex = index);
        },
      ),
    );
  }
}

class _PatientHomeTab extends StatelessWidget {
  const _PatientHomeTab();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = context.statusColors;
    final user = AuthSessionController.instance.user;

    return ListView(
      padding: const EdgeInsets.all(DjoraaSpacing.lg),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(DjoraaSpacing.lg),
          decoration: BoxDecoration(
            gradient: DjoraaGradients.primaryHeader,
            borderRadius: BorderRadius.circular(DjoraaRadius.lg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                "Health Hub",
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: DjoraaSpacing.xs),
              Text(
                "Welcome, ${user?.identifier ?? "Patient"}. Your medical profile is synced.",
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withOpacity(0.92),
                ),
              ),
              const SizedBox(height: DjoraaSpacing.lg),
              Wrap(
                spacing: DjoraaSpacing.sm,
                runSpacing: DjoraaSpacing.sm,
                children: <Widget>[
                  _PillTag(
                    label: "Next visit: 14 Feb",
                    color: Colors.white.withOpacity(0.18),
                  ),
                  _PillTag(
                    label: "2 reminders",
                    color: Colors.white.withOpacity(0.18),
                  ),
                  _PillTag(
                    label: "1 lab alert",
                    color: Colors.white.withOpacity(0.18),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: DjoraaSpacing.lg),
        _SectionHeading(
          title: "Upcoming appointment",
          actionLabel: "View all",
          onTap: () => Navigator.pushNamed(context, AppRoutes.appointments),
        ),
        Card(
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: DjoraaColors.secondary,
              child: Icon(Icons.medical_services_rounded, color: Colors.white),
            ),
            title: const Text("Dermatology - Dr. Karim"),
            subtitle: const Text("Saturday, 14 Feb 2026 at 09:30"),
            trailing: Chip(
              label: const Text("Confirmed"),
              backgroundColor: status.success.withOpacity(0.14),
              labelStyle: TextStyle(color: status.success),
            ),
          ),
        ),
        _SectionHeading(
          title: "Medication reminders",
          actionLabel: "Tracker",
          onTap: () => Navigator.pushNamed(context, AppRoutes.medications),
        ),
        Card(
          child: Column(
            children: <Widget>[
              ListTile(
                leading: Icon(Icons.alarm_rounded, color: status.warning),
                title: const Text("08:00 - Vitamin D"),
                subtitle: const Text("Taken"),
                trailing: Icon(Icons.check_circle_rounded, color: status.success),
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.alarm_rounded, color: status.warning),
                title: const Text("20:00 - Amoxicillin"),
                subtitle: const Text("Upcoming"),
                trailing: Icon(Icons.schedule_rounded, color: status.warning),
              ),
            ],
          ),
        ),
        _SectionHeading(
          title: "Latest prescription",
          actionLabel: "Open",
          onTap: () => Navigator.pushNamed(context, AppRoutes.prescriptions),
        ),
        Card(
          child: ListTile(
            leading: Icon(Icons.description_rounded, color: status.info),
            title: const Text("Amoxicillin 500mg"),
            subtitle: const Text("Twice daily for 7 days"),
            trailing: Icon(Icons.arrow_forward_ios_rounded, color: status.info),
          ),
        ),
        _SectionHeading(
          title: "Lab result alerts",
          actionLabel: "Results",
          onTap: () => Navigator.pushNamed(context, AppRoutes.labResults),
        ),
        Card(
          child: ListTile(
            leading: Icon(Icons.biotech_rounded, color: status.info),
            title: const Text("CBC report is available"),
            subtitle: const Text("Updated on 12 Feb 2026"),
            trailing: Chip(
              label: const Text("New"),
              backgroundColor: status.info.withOpacity(0.14),
              labelStyle: TextStyle(color: status.info),
            ),
          ),
        ),
        _SectionHeading(
          title: "Billing & payments",
          actionLabel: "Open",
          onTap: () => Navigator.pushNamed(context, AppRoutes.billing),
        ),
        Card(
          child: ListTile(
            leading: Icon(Icons.receipt_long_rounded, color: status.warning),
            title: const Text("Outstanding bill"),
            subtitle: const Text("12,400 DZD due in 4 days"),
            trailing: OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, AppRoutes.billing),
              child: const Text("Pay"),
            ),
          ),
        ),
        _SectionHeading(title: "Health timeline"),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(DjoraaSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const <Widget>[
                _TimelineRow(
                  date: "12 Feb",
                  event: "Dermatology follow-up",
                ),
                SizedBox(height: DjoraaSpacing.md),
                _TimelineRow(
                  date: "03 Feb",
                  event: "CBC sample collected",
                ),
                SizedBox(height: DjoraaSpacing.md),
                _TimelineRow(
                  date: "20 Jan",
                  event: "Prescription updated",
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({
    required this.title,
    this.actionLabel,
    this.onTap,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(
        top: DjoraaSpacing.sm,
        bottom: DjoraaSpacing.sm,
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              title,
              style: theme.textTheme.titleMedium,
            ),
          ),
          if (actionLabel != null && onTap != null)
            TextButton(
              onPressed: onTap,
              child: Text(actionLabel!),
            ),
        ],
      ),
    );
  }
}

class _PillTag extends StatelessWidget {
  const _PillTag({
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: DjoraaSpacing.md,
        vertical: DjoraaSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(DjoraaRadius.pill),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.date,
    required this.event,
  });

  final String date;
  final String event;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Container(
          width: 64,
          padding: const EdgeInsets.symmetric(
            vertical: DjoraaSpacing.xs,
            horizontal: DjoraaSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: DjoraaColors.secondary.withOpacity(0.2),
            borderRadius: BorderRadius.circular(DjoraaRadius.sm),
          ),
          child: Text(
            date,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: DjoraaColors.accent,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
        const SizedBox(width: DjoraaSpacing.md),
        Expanded(
          child: Text(
            event,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
