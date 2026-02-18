import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final access = user == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(user.role, DjoraaModule.notifications);

    return Scaffold(
      appBar: AppBar(title: const Text("Notifications")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Appointment Reminder"),
              subtitle: Text(
                "You have an appointment tomorrow at 09:30 - ${access.scope.label}",
              ),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Lab Result Ready"),
              subtitle: Text("CBC result is available"),
            ),
          ),
          if (access.canManage) ...[
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Send notification placeholder.")),
                );
              },
              icon: const Icon(Icons.campaign_rounded),
              label: const Text("Send notification"),
            ),
          ],
        ],
      ),
    );
  }
}

