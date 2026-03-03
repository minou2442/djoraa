const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Medical Reports
router.get('/medical/disease-frequency', reportsController.getDiseaseFrequency);
router.get('/medical/lab-volume', reportsController.getLabVolume);
router.get('/medical/radiology-volume', reportsController.getRadiologyVolume);
router.get('/medical/demographics', reportsController.getPatientDemographics);
router.get('/medical/appointments', reportsController.getAppointmentStats);

// Financial Reports
router.get('/financial/daily-revenue', reportsController.getDailyRevenue);
router.get('/financial/monthly-revenue', reportsController.getMonthlyRevenue);
router.get('/financial/doctor-productivity', reportsController.getDoctorProductivity);
router.get('/financial/insurance-claims', reportsController.getInsuranceClaimsReport);
router.get('/financial/revenue-by-service', reportsController.getRevenueByService);
router.get('/financial/outstanding', reportsController.getOutstandingInvoices);
router.get('/financial/expenses', reportsController.getExpenseSummary);

// Export
router.get('/export/patients', reportsController.exportPatients);
router.get('/export/invoices', reportsController.exportInvoices);
router.get('/export/payments', reportsController.exportPayments);
router.get('/export/pdf', reportsController.exportPDF);

// Dashboard
router.get('/dashboard', reportsController.getDashboardSummary);

module.exports = router;
