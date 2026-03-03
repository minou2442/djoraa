const express = require('express');
const router = express.Router();
const labController = require('../controllers/laboratoryController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');

// Configure multer for machine results
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../storage/lab-results'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lab-result-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/octet-stream'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// All lab routes require authentication
router.use(verifyToken);

/**
 * TEST TYPES
 */

// Create test type (admin only)
router.post(
  '/test-types',
  requireRole('superadmin', 'clinic_admin'),
  labController.createTestType
);

// Get test types
router.get(
  '/test-types',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getTestTypes
);

/**
 * REQUESTS
 */

// Create lab request
router.post(
  '/requests',
  requireRole('superadmin', 'clinic_admin', 'doctor'),
  labController.createRequest
);

// Get lab requests
router.get(
  '/requests',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getRequests
);

// Get specific request
router.get(
  '/requests/:requestId',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getRequest
);

// Get patient requests
router.get(
  '/patients/:patientId/requests',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getPatientRequests
);

/**
 * SAMPLES
 */

// Register sample
router.post(
  '/requests/:requestId/samples',
  requireRole('superadmin', 'lab_technician'),
  labController.registerSample
);

// Get samples
router.get(
  '/requests/:requestId/samples',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getSamples
);

/**
 * RESULTS
 */

// Add result
router.post(
  '/samples/:sampleId/results',
  requireRole('superadmin', 'lab_technician'),
  labController.addResult
);

// Get results
router.get(
  '/samples/:sampleId/results',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician'),
  labController.getResults
);

// Validate result
router.post(
  '/results/:resultId/validate',
  requireRole('superadmin', 'lab_technician', 'lab_supervisor'),
  labController.validateResult
);

/**
 * VALIDATION
 */

// Validate request (supervisor approval)
router.post(
  '/requests/:requestId/validate',
  requireRole('superadmin', 'lab_supervisor'),
  labController.validateRequest
);

// Reject request
router.post(
  '/requests/:requestId/reject',
  requireRole('superadmin', 'lab_supervisor'),
  labController.rejectRequest
);

/**
 * STATISTICS
 */

// Get statistics
router.get(
  '/stats',
  requireRole('superadmin', 'clinic_admin'),
  labController.getStats
);

/**
 * PDF GENERATION
 */

// Generate PDF report
router.get(
  '/requests/:requestId/pdf',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'lab_technician', 'lab_supervisor'),
  labController.generatePDF
);

module.exports = router;
