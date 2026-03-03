const express = require('express');
const router = express.Router();
const printingController = require('../controllers/printingController');
const { requireRole } = require('../middleware/roles');

// Get available templates
router.get('/templates', printingController.getTemplates);

// Print patient list
router.get('/patients', requireRole('admin', 'doctor', 'receptionist'), printingController.printPatientList);

// Print full medical file
router.get('/medical-file/:patientId', requireRole('admin', 'doctor'), printingController.printMedicalFile);

// Print consultation report
router.get('/consultation/:visitId', requireRole('admin', 'doctor'), printingController.printConsultation);

// Print prescription (Ordonnance)
router.get('/prescription/:visitId', requireRole('admin', 'doctor', 'pharmacist'), printingController.printPrescription);

// Print radiology report
router.get('/radiology/:radiologyId', requireRole('admin', 'doctor', 'radiologist'), printingController.printRadiologyReport);

// Print laboratory report
router.get('/laboratory/:labId', requireRole('admin', 'doctor', 'lab_technician'), printingController.printLabReport);

// Print invoice
router.get('/invoice/:invoiceId', requireRole('admin', 'accountant', 'receptionist'), printingController.printInvoice);

// Print receipt
router.get('/receipt/:paymentId', requireRole('admin', 'accountant', 'receptionist'), printingController.printReceipt);

// Print statistical report
router.get('/statistical', requireRole('admin', 'manager'), printingController.printStatisticalReport);

// Get QR verification data
router.get('/qr/:docType/:docId', printingController.getQRData);

module.exports = router;
