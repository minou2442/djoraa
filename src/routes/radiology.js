const express = require('express');
const router = express.Router();
const radiologyController = require('../controllers/radiologyController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');

// Configure multer for radiology image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../storage/radiology'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'radiology-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for images
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/dicom', 'application/octet-stream'];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for radiology'));
    }
  }
});

// All radiology routes require authentication
router.use(verifyToken);

/**
 * EXAM MANAGEMENT
 */

/**
 * POST /api/radiology/exams
 * Create new radiology exam
 */
router.post(
  '/exams',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist'),
  radiologyController.createExam
);

/**
 * GET /api/radiology/exams
 * Get all exams with filters
 */
router.get(
  '/exams',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist', 'technician'),
  radiologyController.getExams
);

/**
 * GET /api/radiology/exams/:examId
 * Get specific exam with images
 */
router.get(
  '/exams/:examId',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist', 'technician'),
  radiologyController.getExam
);

/**
 * PUT /api/radiology/exams/:examId/status
 * Update exam status
 */
router.put(
  '/exams/:examId/status',
  requireRole('superadmin', 'clinic_admin', 'radiologist', 'technician'),
  radiologyController.updateStatus
);

/**
 * PUT /api/radiology/exams/:examId/report
 * Submit radiology report
 */
router.put(
  '/exams/:examId/report',
  requireRole('superadmin', 'radiologist'),
  radiologyController.submitReport
);

/**
 * POST /api/radiology/exams/:examId/cancel
 * Cancel exam
 */
router.post(
  '/exams/:examId/cancel',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist'),
  radiologyController.cancelExam
);

/**
 * IMAGE MANAGEMENT
 */

/**
 * POST /api/radiology/exams/:examId/images
 * Upload radiology image
 */
router.post(
  '/exams/:examId/images',
  requireRole('superadmin', 'radiologist', 'technician'),
  upload.single('image'),
  radiologyController.uploadImage
);

/**
 * DELETE /api/radiology/exams/:examId/images/:imageId
 * Delete radiology image
 */
router.delete(
  '/exams/:examId/images/:imageId',
  requireRole('superadmin', 'radiologist', 'technician'),
  radiologyController.deleteImage
);

/**
 * PATIENT EXAMS
 */

/**
 * GET /api/radiology/patients/:patientId/exams
 * Get patient's radiology exams
 */
router.get(
  '/patients/:patientId/exams',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist', 'technician'),
  radiologyController.getPatientExams
);

/**
 * STATISTICS
 */

/**
 * GET /api/radiology/stats
 * Get radiology statistics
 */
router.get(
  '/stats',
  requireRole('superadmin', 'clinic_admin'),
  radiologyController.getStats
);

/**
 * PDF GENERATION
 */

/**
 * GET /api/radiology/exams/:examId/pdf
 * Generate PDF report
 */
router.get(
  '/exams/:examId/pdf',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'radiologist'),
  radiologyController.generatePDF
);

module.exports = router;
