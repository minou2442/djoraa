import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.appointments);

    return Scaffold(
      appBar: AppBar(title: const Text("Appointments")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Dermatology - Dr. Karim"),
              subtitle: Text("14 Feb 2026, 09:30 - ${access.scope.label}"),
              trailing: const Chip(label: Text("Confirmed")),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Dentistry - Dr. Amel"),
              subtitle: Text("17 Feb 2026, 11:00"),
              trailing: Chip(label: Text("Scheduled")),
            ),
          ),
          if (access.canAdd) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => _showAction(context, "Add appointment"),
              icon: const Icon(Icons.add_rounded),
              label: const Text("Add appointment"),
            ),
          ],
          if (access.canEdit || access.canManage) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Edit appointment"),
              icon: const Icon(Icons.edit_calendar_rounded),
              label: const Text("Edit / reschedule"),
            ),
          ],
        ],
      ),
    );
  }

  void _showAction(BuildContext context, String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("$action placeholder.")),
    );
  }
}

