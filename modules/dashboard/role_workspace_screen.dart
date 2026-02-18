import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/core/theme/design_tokens.dart";

class RoleWorkspaceScreen extends StatelessWidget {
  const RoleWorkspaceScreen({
    super.key,
    required this.role,
  });

  final DjoraaRole role;

  @override
  Widget build(BuildContext context) {
    final profile = DjoraaRoleCatalog.of(role);
    final pageSpecs = DjoraaRoleCatalog.pageSpecsForRole(role);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text("${role.label} Workspace"),
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
                      backgroundColor: Colors.white.withOpacity(0.22),
                      child: Icon(role.icon, color: Colors.white),
                    ),
                    const SizedBox(width: DjoraaSpacing.md),
                    Expanded(
                      child: Text(
                        role.label,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: DjoraaSpacing.sm),
                Text(
                  role.arabicLabel,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.92),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: DjoraaSpacing.sm),
                Text(
                  "${profile.totalPages} pages in this role experience",
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                const SizedBox(height: DjoraaSpacing.xs),
                Text(
                  RoleAccessMatrix.isolationRule(role),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                const SizedBox(height: DjoraaSpacing.md),
                FilledButton.icon(
                  onPressed: pageSpecs.isEmpty
                      ? null
                      : () => Navigator.pushNamed(context, pageSpecs.first.routePath),
                  icon: const Icon(Icons.rocket_launch_rounded),
                  label: const Text("Open first skeleton"),
                ),
              ],
            ),
          ),
          const SizedBox(height: DjoraaSpacing.lg),
          _SectionTitle(title: "Page map"),
          ...pageSpecs.map(
            (DjoraaRolePageSpec pageSpec) => Card(
              child: ListTile(
                leading: Icon(role.icon, color: DjoraaColors.accent),
                title: Text(pageSpec.title),
                subtitle: Text(
                  "${pageSpec.routePath}\n"
                  "${pageSpec.module.label} - "
                  "${RoleAccessMatrix.scopeLabel(role, pageSpec.module)}",
                  style: theme.textTheme.bodySmall,
                ),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => Navigator.pushNamed(context, pageSpec.routePath),
              ),
            ),
          ),
          if (profile.canSee.isNotEmpty) ...<Widget>[
            const SizedBox(height: DjoraaSpacing.md),
            _SectionTitle(title: "Can see"),
            ...profile.canSee.map(
              (String item) => _CapabilityTile(
                label: item,
                color: context.statusColors.success,
                icon: Icons.visibility_rounded,
              ),
            ),
          ],
          if (profile.canCreate.isNotEmpty) ...<Widget>[
            const SizedBox(height: DjoraaSpacing.md),
            _SectionTitle(title: "Can create"),
            ...profile.canCreate.map(
              (String item) => _CapabilityTile(
                label: item,
                color: context.statusColors.info,
                icon: Icons.add_circle_outline_rounded,
              ),
            ),
          ],
          if (profile.restrictions.isNotEmpty) ...<Widget>[
            const SizedBox(height: DjoraaSpacing.md),
            _SectionTitle(title: "Restricted"),
            ...profile.restrictions.map(
              (String item) => _CapabilityTile(
                label: item,
                color: context.statusColors.danger,
                icon: Icons.block_rounded,
              ),
            ),
          ],
          const SizedBox(height: DjoraaSpacing.xl),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
  });

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

class _CapabilityTile extends StatelessWidget {
  const _CapabilityTile({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.12),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(label),
      ),
    );
  }
}

