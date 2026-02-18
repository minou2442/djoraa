import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class LabResultsScreen extends StatelessWidget {
  const LabResultsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.labTests);

    return Scaffold(
      appBar: AppBar(title: const Text("Lab Results")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("CBC"),
              subtitle: Text("Completed - 12 Feb 2026 - ${access.scope.label}"),
              trailing: const Icon(Icons.picture_as_pdf_outlined),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Lipid Profile"),
              subtitle: Text("Processing"),
            ),
          ),
          if (access.canRequest) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => _showAction(context, "Request lab test"),
              icon: const Icon(Icons.playlist_add_rounded),
              label: const Text("Request test"),
            ),
          ],
          if (access.canEdit || access.canManage) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _showAction(context, "Upload/update result"),
              icon: const Icon(Icons.upload_file_rounded),
              label: const Text("Upload / update result"),
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

