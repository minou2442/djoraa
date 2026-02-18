import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class PatientFileScreen extends StatelessWidget {
  const PatientFileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.patientFile);

    return Scaffold(
      appBar: AppBar(title: const Text("Patient File")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Allergies"),
              subtitle: Text("Penicillin, Dust - ${access.scope.label}"),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Chronic Conditions"),
              subtitle: Text("Type 2 Diabetes"),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Recent Visit"),
              subtitle: Text("Dermatology check-up - 12 Feb 2026"),
            ),
          ),
          if (access.canAdd) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => _showAction(context, "Add note"),
              icon: const Icon(Icons.note_add_rounded),
              label: const Text("Add note"),
            ),
          ],
          if (access.canEdit || access.canManage) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Edit file"),
              icon: const Icon(Icons.edit_note_rounded),
              label: const Text("Edit patient file"),
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

