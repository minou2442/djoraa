import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class MedicationsScreen extends StatelessWidget {
  const MedicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.medications);

    return Scaffold(
      appBar: AppBar(title: const Text("Medications")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("08:00 - Vitamin D"),
              subtitle: Text("Taken - ${access.scope.label}"),
              trailing: const Icon(Icons.check_circle, color: Colors.green),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("20:00 - Amoxicillin"),
              subtitle: Text("Upcoming reminder"),
              trailing: Icon(Icons.alarm_outlined),
            ),
          ),
          if (access.canAdd || access.canPrescribe || access.canManage) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => _showAction(context, "Add medication"),
              icon: const Icon(Icons.medication_liquid_rounded),
              label: Text(
                access.canPrescribe ? "Prescribe medication" : "Add medication",
              ),
            ),
          ],
          if (access.canEdit || access.canManage) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Edit medication plan"),
              icon: const Icon(Icons.edit_rounded),
              label: const Text("Edit schedule"),
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

