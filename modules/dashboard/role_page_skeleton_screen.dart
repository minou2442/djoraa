import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/core/theme/design_tokens.dart";

class RolePageSkeletonScreen extends StatelessWidget {
  const RolePageSkeletonScreen({
    super.key,
    required this.pageSpec,
  });

  final DjoraaRolePageSpec pageSpec;

  static const List<String> _coreComponents = <String>[
    "Appointment Calendar",
    "Medical Timeline",
    "Prescription Card",
    "QR Prescription Viewer",
    "Lab Result Charts",
    "Medication Tracker",
    "Notification Drawer",
  ];

  @override
  Widget build(BuildContext context) {
    final user = AuthSessionController.instance.user;
    final profile = DjoraaRoleCatalog.of(pageSpec.role);
    final rolePages = DjoraaRoleCatalog.pageSpecsForRole(pageSpec.role);
    final theme = Theme.of(context);
    final statusColors = context.statusColors;
    final access = RoleAccessMatrix.accessFor(pageSpec.role, pageSpec.module);

    final bool hasPrevious = pageSpec.index > 0;
    final bool hasNext = pageSpec.index < rolePages.length - 1;
    final DjoraaRolePageSpec? previousPage =
        hasPrevious ? rolePages[pageSpec.index - 1] : null;
    final DjoraaRolePageSpec? nextPage =
        hasNext ? rolePages[pageSpec.index + 1] : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(pageSpec.title),
        actions: <Widget>[
          IconButton(
            tooltip: "Role page map",
            onPressed: () => Navigator.pushNamed(
              context,
              DjoraaRoleCatalog.workspaceRoute(pageSpec.role),
            ),
            icon: const Icon(Icons.list_alt_rounded),
          ),
        ],
      ),
      body: ListView(
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
                Row(
                  children: <Widget>[
                    CircleAvatar(
                      backgroundColor: Colors.white.withOpacity(0.24),
                      child: Icon(pageSpec.role.icon, color: Colors.white),
                    ),
                    const SizedBox(width: DjoraaSpacing.md),
                    Expanded(
                      child: Text(
                        "${pageSpec.role.label} skeleton",
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: DjoraaSpacing.sm),
                Text(
                  "Page ${pageSpec.index + 1} of ${profile.pages.length}",
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.92),
                  ),
                ),
                const SizedBox(height: DjoraaSpacing.xs),
                Text(
                  "${pageSpec.routePath} - ${pageSpec.module.label}",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white.withOpacity(0.82),
                  ),
                ),
                const SizedBox(height: DjoraaSpacing.xs),
                Text(
                  "Data scope: ${access.scope.label}",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white.withOpacity(0.82),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: DjoraaSpacing.lg),
          _SectionHeading(title: "Primary content slots"),
          const _SkeletonBlock(
            title: "Header stats",
            subtitle: "KPIs, counters, and role highlights",
          ),
          const _SkeletonBlock(
            title: "Main workflow card",
            subtitle: "Primary role action and status overview",
          ),
          const _SkeletonBlock(
            title: "Secondary data list",
            subtitle: "Recent records, alerts, and timeline entries",
          ),
          const SizedBox(height: DjoraaSpacing.md),
          _SectionHeading(title: "Reusable core components"),
          Wrap(
            spacing: DjoraaSpacing.sm,
            runSpacing: DjoraaSpacing.sm,
            children: _coreComponents
                .map((String component) => Chip(label: Text(component)))
                .toList(growable: false),
          ),
          const SizedBox(height: DjoraaSpacing.md),
          _SectionHeading(title: "Access actions"),
          Wrap(
            spacing: DjoraaSpacing.sm,
            runSpacing: DjoraaSpacing.sm,
            children: [
              _ActionChip(label: "view", enabled: access.canView),
              _ActionChip(label: "add", enabled: access.canAdd),
              _ActionChip(label: "edit", enabled: access.canEdit),
              _ActionChip(label: "manage", enabled: access.canManage),
              _ActionChip(label: "request", enabled: access.canRequest),
              _ActionChip(label: "prescribe", enabled: access.canPrescribe),
              _ActionChip(label: "dispense", enabled: access.canDispense),
            ],
          ),
          const SizedBox(height: DjoraaSpacing.md),
          if (access.canAdd ||
              access.canEdit ||
              access.canManage ||
              access.canRequest ||
              access.canPrescribe ||
              access.canDispense)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(DjoraaSpacing.lg),
                child: Wrap(
                  spacing: DjoraaSpacing.sm,
                  runSpacing: DjoraaSpacing.sm,
                  children: [
                    if (access.canAdd)
                      FilledButton.icon(
                        onPressed: () => _actionToast(
                          context,
                          RoleAccessMatrix.addActionLabel(pageSpec.module),
                        ),
                        icon: const Icon(Icons.add_rounded),
                        label: Text(RoleAccessMatrix.addActionLabel(pageSpec.module)),
                      ),
                    if (access.canEdit)
                      OutlinedButton.icon(
                        onPressed: () => _actionToast(
                          context,
                          RoleAccessMatrix.editActionLabel(pageSpec.module),
                        ),
                        icon: const Icon(Icons.edit_rounded),
                        label: Text(RoleAccessMatrix.editActionLabel(pageSpec.module)),
                      ),
                    if (access.canRequest)
                      OutlinedButton.icon(
                        onPressed: () => _actionToast(context, "Request action"),
                        icon: const Icon(Icons.playlist_add_rounded),
                        label: const Text("Request"),
                      ),
                    if (access.canPrescribe)
                      OutlinedButton.icon(
                        onPressed: () => _actionToast(context, "Prescribe action"),
                        icon: const Icon(Icons.description_rounded),
                        label: const Text("Prescribe"),
                      ),
                    if (access.canDispense)
                      OutlinedButton.icon(
                        onPressed: () => _actionToast(context, "Dispense action"),
                        icon: const Icon(Icons.local_pharmacy_rounded),
                        label: const Text("Dispense"),
                      ),
                    if (access.canManage)
                      OutlinedButton.icon(
                        onPressed: () => _actionToast(context, "Manage action"),
                        icon: const Icon(Icons.settings_suggest_rounded),
                        label: const Text("Manage"),
                      ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: DjoraaSpacing.md),
          _SectionHeading(title: "Role capabilities"),
          if (profile.canSee.isNotEmpty)
            ...profile.canSee.map(
              (String item) => _CapabilityRow(
                title: item,
                icon: Icons.visibility_rounded,
                color: statusColors.success,
              ),
            ),
          if (profile.canCreate.isNotEmpty)
            ...profile.canCreate.map(
              (String item) => _CapabilityRow(
                title: item,
                icon: Icons.add_circle_outline_rounded,
                color: statusColors.info,
              ),
            ),
          if (profile.restrictions.isNotEmpty)
            ...profile.restrictions.map(
              (String item) => _CapabilityRow(
                title: item,
                icon: Icons.block_rounded,
                color: statusColors.danger,
              ),
            ),
          const SizedBox(height: DjoraaSpacing.md),
          Card(
            child: ListTile(
              leading: const Icon(Icons.shield_rounded),
              title: const Text("JWT scope preview"),
              subtitle: Text(
                user == null
                    ? "No active session"
                    : user.permissions.take(8).join(", "),
              ),
            ),
          ),
          const SizedBox(height: DjoraaSpacing.lg),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(DjoraaSpacing.lg),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: previousPage == null
                          ? null
                          : () => Navigator.pushReplacementNamed(
                                context,
                                previousPage.routePath,
                              ),
                      icon: const Icon(Icons.arrow_back_rounded),
                      label: const Text("Previous"),
                    ),
                  ),
                  const SizedBox(width: DjoraaSpacing.md),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: nextPage == null
                          ? null
                          : () => Navigator.pushReplacementNamed(
                                context,
                                nextPage.routePath,
                              ),
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text("Next"),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _actionToast(BuildContext context, String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("$action placeholder.")),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DjoraaSpacing.sm),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium,
      ),
    );
  }
}

class _SkeletonBlock extends StatelessWidget {
  const _SkeletonBlock({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: DjoraaColors.secondary,
          child: Icon(Icons.layers_rounded, color: Colors.white),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.drag_indicator_rounded),
      ),
    );
  }
}

class _CapabilityRow extends StatelessWidget {
  const _CapabilityRow({
    required this.title,
    required this.icon,
    required this.color,
  });

  final String title;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.14),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.enabled,
  });

  final String label;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      backgroundColor: enabled
          ? DjoraaColors.secondary.withOpacity(0.22)
          : DjoraaColors.border,
      labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: enabled ? DjoraaColors.accent : DjoraaColors.textMuted,
          ),
    );
  }
}
