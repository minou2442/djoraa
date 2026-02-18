import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class PatientMedicationsScreen extends StatelessWidget {
  const PatientMedicationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[4];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
