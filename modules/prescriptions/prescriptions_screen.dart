import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class PrescriptionsScreen extends StatelessWidget {
  const PrescriptionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.prescriptions);

    return Scaffold(
      appBar: AppBar(title: const Text("Prescriptions")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Amoxicillin 500mg"),
              subtitle: Text("Twice daily for 7 days - ${access.scope.label}"),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Ibuprofen 400mg"),
              subtitle: Text("After meals, if needed"),
            ),
          ),
          if (access.canAdd || access.canPrescribe) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => _showAction(context, "Add prescription"),
              icon: const Icon(Icons.add_box_rounded),
              label: Text(
                access.canPrescribe ? "Create prescription" : "Add prescription",
              ),
            ),
          ],
          if (access.canEdit || access.canManage) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Edit prescription"),
              icon: const Icon(Icons.edit_note_rounded),
              label: const Text("Edit prescription"),
            ),
          ],
          if (access.canDispense) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Dispense medication"),
              icon: const Icon(Icons.medication_rounded),
              label: const Text("Dispense from prescription"),
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

