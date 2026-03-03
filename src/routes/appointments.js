const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All appointment routes require authentication
router.use(verifyToken);

/**
 * DOCTOR SCHEDULES
 */

// Create schedule
router.post(
  '/schedules',
  requireRole('superadmin', 'clinic_admin'),
  appointmentController.createSchedule
);

// Get doctor schedules
router.get(
  '/schedules/:doctorId',
  appointmentController.getSchedules
);

// Get available slots
router.get(
  '/slots/:doctorId',
  appointmentController.getAvailableSlots
);

/**
 * APPOINTMENTS
 */

// Create appointment
router.post(
  '/',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.createAppointment
);

// Get appointments
router.get(
  '/',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.getAppointments
);

// Get specific appointment
router.get(
  '/:appointmentId',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.getAppointment
);

// Update appointment status
router.put(
  '/:appointmentId/status',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.updateStatus
);

// Get today's appointments for doctor
router.get(
  '/today/:doctorId',
  appointmentController.getTodayForDoctor
);

/**
 * WAITING LIST
 */

// Get waiting list
router.get(
  '/waiting-list',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.getWaitingList
);

// Add to waiting list
router.post(
  '/waiting-list',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.addToWaitingList
);

/**
 * APPOINTMENT TYPES
 */

// Get appointment types
router.get(
  '/types',
  appointmentController.getAppointmentTypes
);

// Create appointment type
router.post(
  '/types',
  requireRole('superadmin', 'clinic_admin'),
  appointmentController.createAppointmentType
);

/**
 * CALENDAR VIEW
 */

// Get calendar view
router.get(
  '/calendar',
  requireRole('superadmin', 'clinic_admin', 'doctor', 'receptionist'),
  appointmentController.getCalendar
);

module.exports = router;
