import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/dashboard/role_page_skeleton_screen.dart";

class DentistAppointmentsQueueScreen extends StatelessWidget {
  const DentistAppointmentsQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pageSpec = DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[1];
    return RolePageSkeletonScreen(pageSpec: pageSpec);
  }
}
