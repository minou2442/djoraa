import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class PharmacyDispenseMedicationsScreen extends StatelessWidget {
  const PharmacyDispenseMedicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[2];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
