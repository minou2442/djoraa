import "package:djoraa_mobile/core/roles/access_matrix.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";

class ModuleActionRouter {
  ModuleActionRouter._();

  static String homeForRole(DjoraaRole role) {
    switch (role) {
      case DjoraaRole.patient:
        return "/patient/home";
      case DjoraaRole.doctor:
      case DjoraaRole.dentist:
        return "/doctor/home";
      case DjoraaRole.laboratory:
        return "/lab/home";
      case DjoraaRole.radiology:
        return "/radiology/home";
      case DjoraaRole.pharmacy:
        return "/pharmacy/home";
      case DjoraaRole.clinicAdmin:
      case DjoraaRole.superAdmin:
        return "/admin/home";
    }
  }

  static String defaultModuleRoute({
    required DjoraaRole role,
    required DjoraaModule module,
  }) {
    switch (module) {
      case DjoraaModule.authentication:
        return "/settings";
      case DjoraaModule.dashboard:
        return homeForRole(role);
      case DjoraaModule.profile:
        return "/profile";
      case DjoraaModule.appointments:
        switch (role) {
          case DjoraaRole.patient:
            return "/patient/appointments";
          case DjoraaRole.doctor:
          case DjoraaRole.dentist:
            return "/doctor/appointments";
          default:
            return homeForRole(role);
        }
      case DjoraaModule.patientFile:
        switch (role) {
          case DjoraaRole.patient:
            return "/patient/medical-file";
          case DjoraaRole.doctor:
          case DjoraaRole.dentist:
            return "/doctor/patients";
          case DjoraaRole.radiology:
            return "/radiology/orders";
          default:
            return homeForRole(role);
        }
      case DjoraaModule.prescriptions:
        switch (role) {
          case DjoraaRole.patient:
            return "/patient/prescriptions";
          case DjoraaRole.doctor:
          case DjoraaRole.dentist:
            return "/doctor/create-prescription";
          case DjoraaRole.pharmacy:
            return "/pharmacy/prescriptions";
          default:
            return homeForRole(role);
        }
      case DjoraaModule.labTests:
        switch (role) {
          case DjoraaRole.patient:
            return "/patient/lab-results";
          case DjoraaRole.doctor:
          case DjoraaRole.dentist:
            return "/doctor/lab-orders";
          case DjoraaRole.laboratory:
            return "/lab/test-requests";
          default:
            return homeForRole(role);
        }
      case DjoraaModule.medications:
        switch (role) {
          case DjoraaRole.patient:
            return "/patient/prescriptions";
          case DjoraaRole.doctor:
          case DjoraaRole.dentist:
            return "/doctor/create-prescription";
          case DjoraaRole.pharmacy:
            return "/pharmacy/prescriptions";
          default:
            return homeForRole(role);
        }
      case DjoraaModule.billing:
        if (role == DjoraaRole.clinicAdmin || role == DjoraaRole.superAdmin) {
          return "/admin/analytics";
        }
        return homeForRole(role);
      case DjoraaModule.notifications:
        return "/notifications";
      case DjoraaModule.analytics:
        return "/admin/analytics";
      case DjoraaModule.userManagement:
        return "/admin/users";
    }
  }

  static String routeForAction({
    required DjoraaRole role,
    required DjoraaModule module,
    required DjoraaPermissionAction action,
  }) {
    switch (module) {
      case DjoraaModule.appointments:
        if (action == DjoraaPermissionAction.add && role == DjoraaRole.patient) {
          return "/patient/book-appointment";
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.prescriptions:
        if (action == DjoraaPermissionAction.dispense) {
          return "/pharmacy/prescriptions";
        }
        if (action == DjoraaPermissionAction.prescribe) {
          return "/doctor/create-prescription";
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.labTests:
        if (action == DjoraaPermissionAction.request) {
          if (role == DjoraaRole.patient) {
            return "/patient/book-appointment";
          }
          if (role == DjoraaRole.doctor || role == DjoraaRole.dentist) {
            return "/doctor/lab-orders";
          }
        }
        if (action == DjoraaPermissionAction.edit ||
            action == DjoraaPermissionAction.manage) {
          if (role == DjoraaRole.laboratory) {
            return "/lab/test-requests";
          }
          if (role == DjoraaRole.clinicAdmin || role == DjoraaRole.superAdmin) {
            return "/admin/analytics";
          }
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.medications:
        if (action == DjoraaPermissionAction.dispense) {
          return "/pharmacy/prescriptions";
        }
        if (action == DjoraaPermissionAction.prescribe) {
          return "/doctor/create-prescription";
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.patientFile:
        if (action == DjoraaPermissionAction.manage &&
            (role == DjoraaRole.clinicAdmin || role == DjoraaRole.superAdmin)) {
          return "/admin/users";
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.billing:
        if (action == DjoraaPermissionAction.add ||
            action == DjoraaPermissionAction.edit ||
            action == DjoraaPermissionAction.manage) {
          return "/admin/analytics";
        }
        return defaultModuleRoute(role: role, module: module);

      case DjoraaModule.notifications:
        if (action == DjoraaPermissionAction.manage) {
          return "/notification-settings";
        }
        return "/notifications";

      case DjoraaModule.analytics:
      case DjoraaModule.userManagement:
      case DjoraaModule.profile:
      case DjoraaModule.authentication:
      case DjoraaModule.dashboard:
        return defaultModuleRoute(role: role, module: module);
    }
  }

  static String billingPaymentRoute(DjoraaRole role) {
    if (role == DjoraaRole.patient) {
      return "/upload/document/payment-proof";
    }
    return defaultModuleRoute(role: role, module: DjoraaModule.billing);
  }
}
