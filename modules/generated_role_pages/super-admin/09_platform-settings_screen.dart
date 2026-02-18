import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class SuperAdminPlatformSettingsScreen extends StatelessWidget {
  const SuperAdminPlatformSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[8];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
