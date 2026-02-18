import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class DentistToothConditionMappingScreen extends StatelessWidget {
  const DentistToothConditionMappingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[4];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
