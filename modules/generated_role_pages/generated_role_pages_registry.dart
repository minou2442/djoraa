import "package:flutter/material.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/01_facility-dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/02_staff-management_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/03_appointment-oversight_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/04_billing-management_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/05_reports-analytics_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/06_inventory_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/07_settings_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/clinic-admin/08_facility-profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/01_dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/02_appointments-queue_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/03_patient-file-viewer_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/04_dental-chart-viewer_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/05_tooth-condition-mapping_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/06_dental-imaging-upload_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/07_write-prescription_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/08_request-lab-tests_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/09_notifications_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/dentist/10_profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/01_dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/02_appointments-queue_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/03_patient-file-viewer_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/04_write-prescription_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/05_request-lab-tests_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/06_reports-history_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/07_billing-overview_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/08_notifications_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/doctor/09_profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/01_lab-dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/02_test-requests-queue_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/03_upload-results_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/04_equipment-logs_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/05_reports-archive_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/laboratory/06_profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/01_dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/02_my-appointments_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/03_book-appointment_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/04_my-prescriptions_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/05_medications_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/06_lab-results_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/07_patient-file_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/08_billing-payments_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/09_notifications_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/patient/10_profile-settings_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/01_pharmacy-dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/02_prescriptions-queue_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/03_dispense-medications_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/04_inventory_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/05_sales-billing_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/pharmacy/06_profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/01_radiology-dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/02_imaging-requests-queue_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/03_upload-imaging_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/04_edit-reports_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/05_image-archive_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/radiology/06_profile_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/01_global-dashboard_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/02_user-management_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/03_facility-management_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/04_financial-analytics_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/05_system-logs_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/06_ai-monitoring_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/07_security-center_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/08_api-usage_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/09_platform-settings_screen.dart";
import "package:djoraa_mobile/modules/generated_role_pages/super-admin/10_profile_screen.dart";

Map<String, WidgetBuilder> buildGeneratedRolePageRoutes() {
  return <String, WidgetBuilder>{
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[0].routePath: (_) => const PatientDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[1].routePath: (_) => const PatientMyAppointmentsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[2].routePath: (_) => const PatientBookAppointmentScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[3].routePath: (_) => const PatientMyPrescriptionsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[4].routePath: (_) => const PatientMedicationsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[5].routePath: (_) => const PatientLabResultsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[6].routePath: (_) => const PatientPatientFileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[7].routePath: (_) => const PatientBillingPaymentsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[8].routePath: (_) => const PatientNotificationsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.patient)[9].routePath: (_) => const PatientProfileSettingsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[0].routePath: (_) => const DoctorDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[1].routePath: (_) => const DoctorAppointmentsQueueScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[2].routePath: (_) => const DoctorPatientFileViewerScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[3].routePath: (_) => const DoctorWritePrescriptionScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[4].routePath: (_) => const DoctorRequestLabTestsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[5].routePath: (_) => const DoctorReportsHistoryScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[6].routePath: (_) => const DoctorBillingOverviewScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[7].routePath: (_) => const DoctorNotificationsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.doctor)[8].routePath: (_) => const DoctorProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[0].routePath: (_) => const DentistDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[1].routePath: (_) => const DentistAppointmentsQueueScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[2].routePath: (_) => const DentistPatientFileViewerScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[3].routePath: (_) => const DentistDentalChartViewerScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[4].routePath: (_) => const DentistToothConditionMappingScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[5].routePath: (_) => const DentistDentalImagingUploadScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[6].routePath: (_) => const DentistWritePrescriptionScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[7].routePath: (_) => const DentistRequestLabTestsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[8].routePath: (_) => const DentistNotificationsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.dentist)[9].routePath: (_) => const DentistProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[0].routePath: (_) => const LaboratoryLabDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[1].routePath: (_) => const LaboratoryTestRequestsQueueScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[2].routePath: (_) => const LaboratoryUploadResultsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[3].routePath: (_) => const LaboratoryEquipmentLogsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[4].routePath: (_) => const LaboratoryReportsArchiveScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.laboratory)[5].routePath: (_) => const LaboratoryProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[0].routePath: (_) => const RadiologyRadiologyDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[1].routePath: (_) => const RadiologyImagingRequestsQueueScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[2].routePath: (_) => const RadiologyUploadImagingScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[3].routePath: (_) => const RadiologyEditReportsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[4].routePath: (_) => const RadiologyImageArchiveScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.radiology)[5].routePath: (_) => const RadiologyProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[0].routePath: (_) => const PharmacyPharmacyDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[1].routePath: (_) => const PharmacyPrescriptionsQueueScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[2].routePath: (_) => const PharmacyDispenseMedicationsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[3].routePath: (_) => const PharmacyInventoryScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[4].routePath: (_) => const PharmacySalesBillingScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.pharmacy)[5].routePath: (_) => const PharmacyProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[0].routePath: (_) => const ClinicAdminFacilityDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[1].routePath: (_) => const ClinicAdminStaffManagementScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[2].routePath: (_) => const ClinicAdminAppointmentOversightScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[3].routePath: (_) => const ClinicAdminBillingManagementScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[4].routePath: (_) => const ClinicAdminReportsAnalyticsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[5].routePath: (_) => const ClinicAdminInventoryScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[6].routePath: (_) => const ClinicAdminSettingsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.clinicAdmin)[7].routePath: (_) => const ClinicAdminFacilityProfileScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[0].routePath: (_) => const SuperAdminGlobalDashboardScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[1].routePath: (_) => const SuperAdminUserManagementScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[2].routePath: (_) => const SuperAdminFacilityManagementScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[3].routePath: (_) => const SuperAdminFinancialAnalyticsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[4].routePath: (_) => const SuperAdminSystemLogsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[5].routePath: (_) => const SuperAdminAiMonitoringScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[6].routePath: (_) => const SuperAdminSecurityCenterScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[7].routePath: (_) => const SuperAdminApiUsageScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[8].routePath: (_) => const SuperAdminPlatformSettingsScreen(),
    DjoraaRoleCatalog.pageSpecsForRole(DjoraaRole.superAdmin)[9].routePath: (_) => const SuperAdminProfileScreen(),
  };
}
