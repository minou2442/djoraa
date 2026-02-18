import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AuthSessionController.instance;
    final user = session.user;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text("No authenticated user.")),
      );
    }

    final profileAccess = RoleAccessMatrix.accessFor(
      user.role,
      DjoraaModule.profile,
    );

    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Role"),
              subtitle: Text("${user.role.label} (${user.role.arabicLabel})"),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("Identifier"),
              subtitle: Text(user.identifier),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("Email"),
              subtitle: Text(user.email ?? "Not provided"),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("Phone"),
              subtitle: Text(user.phone ?? "Not provided"),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("Profile Scope"),
              subtitle: Text(profileAccess.scope.label),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("Data isolation rule"),
              subtitle: Text(RoleAccessMatrix.isolationRule(user.role)),
            ),
          ),
          Card(
            child: ListTile(
              title: const Text("JWT-style scopes"),
              subtitle: Text(user.permissions.take(6).join(", ")),
            ),
          ),
          const SizedBox(height: 8),
          if (profileAccess.canEdit)
            FilledButton.icon(
              onPressed: () => _openEditDialog(context, user),
              icon: const Icon(Icons.edit_rounded),
              label: const Text("Edit profile"),
            ),
        ],
      ),
    );
  }

  void _openEditDialog(BuildContext context, AuthUserProfile user) {
    final emailController = TextEditingController(text: user.email ?? "");
    final phoneController = TextEditingController(text: user.phone ?? "");

    showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Edit profile"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: "Email"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: "Phone"),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Profile edit saved locally (API update pending)."),
                  ),
                );
              },
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }
}
