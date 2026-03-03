const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All clinic routes require authentication
router.use(verifyToken);

/**
 * POST /api/clinics
 * Create a new clinic (superadmin only)
 */
router.post('/', requireRole('superadmin'), clinicController.createClinic);

/**
 * GET /api/clinics
 * List all clinics
 */
router.get('/', requireRole('superadmin', 'clinic_admin'), clinicController.listClinics);

/**
 * GET /api/clinics/:clinicId
 * Get clinic details
 */
router.get('/:clinicId', requireRole('superadmin', 'clinic_admin'), clinicController.getClinic);

/**
 * PUT /api/clinics/:clinicId
 * Update clinic
 */
router.put('/:clinicId', requireRole('superadmin'), clinicController.updateClinic);

/**
 * DELETE /api/clinics/:clinicId
 * Delete clinic (soft delete if has users)
 */
router.delete('/:clinicId', requireRole('superadmin'), clinicController.deleteClinic);

/**
 * GET /api/clinics/:clinicId/stats
 * Get clinic statistics
 */
router.get('/:clinicId/stats', requireRole('superadmin', 'clinic_admin'), clinicController.getClinicStats);

module.exports = router;
