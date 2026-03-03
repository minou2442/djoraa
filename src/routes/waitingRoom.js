const express = require('express');
const router = express.Router();
const waitingRoomController = require('../controllers/waitingRoomController');
const { requireRole } = require('../middleware/roles');

// Reception routes
router.get('/queue', waitingRoomController.getActiveQueue);
router.post('/queue', requireRole('receptionist', 'admin'), waitingRoomController.addToQueue);
router.put('/queue/:id/status', requireRole('receptionist', 'doctor', 'admin'), waitingRoomController.updateQueueStatus);
router.put('/queue/:id/reorder', requireRole('receptionist', 'admin'), waitingRoomController.reorderQueue);
router.delete('/queue/:id', requireRole('receptionist', 'admin'), waitingRoomController.removeFromQueue);
router.post('/queue/:id/absent', requireRole('receptionist', 'admin'), waitingRoomController.markAbsent);
router.get('/history', waitingRoomController.getQueueHistory);
router.get('/stats', waitingRoomController.getQueueStats);

// Doctor routes
router.get('/doctor/queue', requireRole('doctor'), waitingRoomController.getDoctorQueue);
router.get('/doctor/next', requireRole('doctor'), waitingRoomController.getNextPatient);
router.post('/doctor/start/:id', requireRole('doctor'), waitingRoomController.startConsultation);
router.post('/doctor/end/:id', requireRole('doctor'), waitingRoomController.endConsultation);
router.post('/doctor/skip/:id', requireRole('doctor'), waitingRoomController.skipPatient);
router.post('/doctor/recall/:id', requireRole('doctor'), waitingRoomController.recallPatient);
router.get('/doctor/stats', requireRole('doctor', 'admin'), waitingRoomController.getDoctorStats);

// Room management
router.get('/rooms', waitingRoomController.getRooms);
router.post('/rooms', requireRole('admin'), waitingRoomController.createRoom);
router.put('/rooms/:id/status', waitingRoomController.updateRoomStatus);

// Statistics
router.get('/waiting-time', waitingRoomController.getWaitingTimeStats);
router.get('/peak-hours', waitingRoomController.getPeakHours);

// Display screen
router.get('/display', waitingRoomController.getDisplayData);

// Payment check
router.get('/payment-check/:patient_id', waitingRoomController.checkPaymentStatus);

module.exports = router;
