const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireClinicAccess } = require('../middleware/rbacMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/patient-documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// All patient routes require authentication and clinic access
router.use(verifyToken, requireClinicAccess);

// ============ PATIENT CRUD ENDPOINTS ============

/**
 * POST /api/patients
 * Create a new patient
 */
router.post(
  '/',
  requirePermission('create_patient'),
  patientController.createPatient
);

/**
 * GET /api/patients/search
 * Search patients with advanced filters
 */
router.get(
  '/search',
  requirePermission('read_patient'),
  patientController.searchPatients
);

/**
 * GET /api/patients
 * Get all patients (paginated)
 */
router.get(
  '/',
  requirePermission('read_patient'),
  patientController.getPatients
);

/**
 * GET /api/patients/:patientId
 * Get specific patient with all related data
 */
router.get(
  '/:patientId',
  requirePermission('read_patient'),
  patientController.getPatient
);

/**
 * PUT /api/patients/:patientId
 * Update patient
 */
router.put(
  '/:patientId',
  requirePermission('update_patient'),
  patientController.updatePatient
);

/**
 * DELETE /api/patients/:patientId
 * Archive patient (soft delete)
 */
router.delete(
  '/:patientId',
  requirePermission('delete_patient'),
  patientController.archivePatient
);

// ============ INSURANCE ENDPOINTS ============

/**
 * POST /api/patients/:patientId/insurance
 * Add insurance to patient
 */
router.post(
  '/:patientId/insurance',
  requirePermission('update_patient'),
  patientController.addInsurance
);

/**
 * GET /api/patients/:patientId/insurance
 * Get patient insurance records
 */
router.get(
  '/:patientId/insurance',
  requirePermission('read_patient'),
  patientController.getInsurance
);

/**
 * PUT /api/patients/:patientId/insurance/:insuranceId
 * Update insurance record
 */
router.put(
  '/:patientId/insurance/:insuranceId',
  requirePermission('update_patient'),
  patientController.updateInsurance
);

// ============ ALLERGY ENDPOINTS ============

/**
 * POST /api/patients/:patientId/allergies
 * Add allergy to patient
 */
router.post(
  '/:patientId/allergies',
  requirePermission('update_patient'),
  patientController.addAllergy
);

/**
 * GET /api/patients/:patientId/allergies
 * Get patient allergies
 */
router.get(
  '/:patientId/allergies',
  requirePermission('read_patient'),
  patientController.getAllergies
);

/**
 * PUT /api/patients/:patientId/allergies/:allergyId
 * Update allergy
 */
router.put(
  '/:patientId/allergies/:allergyId',
  requirePermission('update_patient'),
  patientController.updateAllergy
);

/**
 * DELETE /api/patients/:patientId/allergies/:allergyId
 * Delete allergy
 */
router.delete(
  '/:patientId/allergies/:allergyId',
  requirePermission('update_patient'),
  patientController.deleteAllergy
);

// ============ DISEASE ENDPOINTS ============

/**
 * POST /api/patients/:patientId/diseases
 * Add chronic disease to patient
 */
router.post(
  '/:patientId/diseases',
  requirePermission('update_patient'),
  patientController.addDisease
);

/**
 * GET /api/patients/:patientId/diseases
 * Get patient diseases
 */
router.get(
  '/:patientId/diseases',
  requirePermission('read_patient'),
  patientController.getDiseases
);

/**
 * PUT /api/patients/:patientId/diseases/:diseaseId
 * Update disease
 */
router.put(
  '/:patientId/diseases/:diseaseId',
  requirePermission('update_patient'),
  patientController.updateDisease
);

/**
 * DELETE /api/patients/:patientId/diseases/:diseaseId
 * Delete disease
 */
router.delete(
  '/:patientId/diseases/:diseaseId',
  requirePermission('update_patient'),
  patientController.deleteDisease
);

// ============ EMERGENCY CONTACT ENDPOINTS ============

/**
 * POST /api/patients/:patientId/emergency-contacts
 * Add emergency contact to patient
 */
router.post(
  '/:patientId/emergency-contacts',
  requirePermission('update_patient'),
  patientController.addEmergencyContact
);

/**
 * GET /api/patients/:patientId/emergency-contacts
 * Get patient emergency contacts
 */
router.get(
  '/:patientId/emergency-contacts',
  requirePermission('read_patient'),
  patientController.getEmergencyContacts
);

/**
 * PUT /api/patients/:patientId/emergency-contacts/:contactId
 * Update emergency contact
 */
router.put(
  '/:patientId/emergency-contacts/:contactId',
  requirePermission('update_patient'),
  patientController.updateEmergencyContact
);

/**
 * DELETE /api/patients/:patientId/emergency-contacts/:contactId
 * Delete emergency contact
 */
router.delete(
  '/:patientId/emergency-contacts/:contactId',
  requirePermission('update_patient'),
  patientController.deleteEmergencyContact
);

// ============ DOCUMENT ENDPOINTS ============

// ============ EMR ENDPOINTS ============

// --- Prescriptions ---
router.post(
  '/:patientId/prescriptions',
  requirePermission('prescribe_medication'),
  patientController.addPrescription
);
router.get(
  '/:patientId/prescriptions',
  requirePermission('read_patient'),
  patientController.getPrescriptions
);
router.put(
  '/:patientId/prescriptions/:id',
  requirePermission('prescribe_medication'),
  patientController.updatePrescription
);
router.delete(
  '/:patientId/prescriptions/:id',
  requirePermission('prescribe_medication'),
  patientController.deactivatePrescription
);

// --- Laboratory Requests ---
router.post(
  '/:patientId/lab-requests',
  requirePermission('request_lab'),
  patientController.addLabRequest
);
router.get(
  '/:patientId/lab-requests',
  requirePermission('read_patient'),
  patientController.getLabRequests
);
router.put(
  '/:patientId/lab-requests/:id/status',
  requirePermission('enter_lab_results'),
  patientController.updateLabStatus
);
router.put(
  '/:patientId/lab-requests/:id/results',
  requirePermission('enter_lab_results'),
  patientController.addLabResults
);

// --- Radiology Requests ---
router.post(
  '/:patientId/rad-requests',
  requirePermission('request_radiology'),
  patientController.addRadiologyRequest
);
router.get(
  '/:patientId/rad-requests',
  requirePermission('read_patient'),
  patientController.getRadiologyRequests
);
router.put(
  '/:patientId/rad-requests/:id/status',
  requirePermission('write_radiology_report'),
  patientController.updateRadiologyStatus
);
router.put(
  '/:patientId/rad-requests/:id/report',
  requirePermission('write_radiology_report'),
  patientController.addRadiologyReport
);

// --- Surgeries ---
router.post(
  '/:patientId/surgeries',
  requirePermission('write_diagnosis'),
  patientController.addSurgery
);
router.get(
  '/:patientId/surgeries',
  requirePermission('read_patient'),
  patientController.getSurgeries
);

// --- Vitals ---
router.post(
  '/:patientId/vitals',
  requirePermission('record_vital_signs'),
  patientController.recordVitals
);
router.get(
  '/:patientId/vitals',
  requirePermission('read_patient'),
  patientController.getVitals
);

// --- Clinical Notes ---
router.post(
  '/:patientId/clinical-notes',
  requirePermission('write_diagnosis'),
  patientController.addClinicalNote
);
router.get(
  '/:patientId/clinical-notes',
  requirePermission('read_patient'),
  patientController.getClinicalNotes
);

// --- Signatures ---
router.post(
  '/:patientId/signatures',
  requirePermission('sign_report'),
  patientController.addSignature
);
router.get(
  '/:patientId/signatures',
  requirePermission('read_patient'),
  patientController.getSignatures
);

// ============ DOCUMENT ENDPOINTS ============

/**
 * POST /api/patients/:patientId/documents
 * Upload patient document
 */
router.post(
  '/:patientId/documents',
  requirePermission('update_patient'),
  upload.single('document'),
  patientController.uploadDocument
);

/**
 * GET /api/patients/:patientId/documents
 * Get patient documents
 */
router.get(
  '/:patientId/documents',
  requirePermission('read_patient'),
  patientController.getDocuments
);

/**
 * DELETE /api/patients/:patientId/documents/:documentId
 * Delete patient document
 */
router.delete(
  '/:patientId/documents/:documentId',
  requirePermission('update_patient'),
  patientController.deleteDocument
);

module.exports = router;
