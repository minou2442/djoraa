import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class SuperAdminFinancialAnalyticsScreen extends StatelessWidget {
  const SuperAdminFinancialAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[3];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
