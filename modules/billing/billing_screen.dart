import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class BillingScreen extends StatelessWidget {
  const BillingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AuthSessionController.instance;
    final user = session.user;
    final role = user?.role;
    final access = role == null
        ? ModuleAccess.none
        : RoleAccessMatrix.accessFor(role, DjoraaModule.billing);

    return Scaffold(
      appBar: AppBar(title: const Text("Billing")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text("Current balance"),
              subtitle: Text(
                role == null
                    ? "No session"
                    : "Scope: ${access.scope.label}",
              ),
              trailing: const Text("12,400 DZD"),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Invoice INV-2026-01"),
              subtitle: Text("Consultation + Lab tests"),
              trailing: Text("9,200 DZD"),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text("Invoice INV-2026-02"),
              subtitle: Text("Pharmacy dispensing"),
              trailing: Text("3,200 DZD"),
            ),
          ),
          const SizedBox(height: 12),
          if (access.canView && !access.canManage)
            FilledButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Payment flow placeholder.")),
                );
              },
              icon: const Icon(Icons.payment_rounded),
              label: const Text("Pay bill"),
            ),
          if (access.canManage) ...[
            FilledButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Add billing entry placeholder.")),
                );
              },
              icon: const Icon(Icons.add_circle_outline_rounded),
              label: const Text("Add billing entry"),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Edit billing placeholder.")),
                );
              },
              icon: const Icon(Icons.edit_note_rounded),
              label: const Text("Edit billing"),
            ),
          ],
        ],
      ),
    );
  }
}
