const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireRole } = require('../middleware/roles');

// Get dashboard (role-based)
router.get('/', dashboardController.getDashboard);

// Role-specific dashboards
router.get('/admin', requireRole('admin', 'clinic_admin'), dashboardController.getAdminDashboard);
router.get('/doctor', requireRole('doctor'), dashboardController.getDoctorDashboard);
router.get('/reception', requireRole('receptionist'), dashboardController.getReceptionDashboard);
router.get('/lab', requireRole('lab_technician'), dashboardController.getLabDashboard);
router.get('/radiology', requireRole('radiologist'), dashboardController.getRadiologyDashboard);
router.get('/accountant', requireRole('accountant'), dashboardController.getAccountantDashboard);

// Quick actions
router.get('/quick-actions', dashboardController.getQuickActions);

// Pinned shortcuts
router.post('/pinned', dashboardController.savePinnedShortcuts);

// Real-time updates (polling)
router.get('/realtime', dashboardController.getRealtimeUpdates);

module.exports = router;
