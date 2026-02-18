import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class PharmacyPrescriptionsQueueScreen extends StatelessWidget {
  const PharmacyPrescriptionsQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[1];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
