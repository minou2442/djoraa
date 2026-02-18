import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class DoctorProfileScreen extends StatelessWidget {
  const DoctorProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[8];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
