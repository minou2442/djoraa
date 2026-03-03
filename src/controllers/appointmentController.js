const { DoctorScheduleModel, AppointmentModel, AppointmentTypeModel } = require('../models/appointment');

// ========== DOCTOR SCHEDULES ==========

/**
 * Create doctor schedule
 * POST /api/appointments/schedules
 */
async function createSchedule(req, res) {
  try {
    const schedule = await DoctorScheduleModel.create({
      ...req.body,
      clinic_id: req.clinic_id
    });
    res.status(201).json({ schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get doctor schedules
 * GET /api/appointments/schedules/:doctorId
 */
async function getSchedules(req, res) {
  try {
    const { doctorId } = req.params;
    const schedules = await DoctorScheduleModel.getByDoctor(doctorId);
    res.json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get available slots
 * GET /api/appointments/slots/:doctorId
 */
async function getAvailableSlots(req, res) {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const slots = await DoctorScheduleModel.getAvailableSlots(doctorId, date);
    res.json({ slots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== APPOINTMENTS ==========

/**
 * Create appointment
 * POST /api/appointments
 */
async function createAppointment(req, res) {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, appointment_type, duration_minutes, reason, notes } = req.body;
    
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Patient, doctor, date and time are required' });
    }
    
    const appointment = await AppointmentModel.create({
      clinic_id: req.clinic_id,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      appointment_type,
      duration_minutes,
      reason,
      notes,
      booked_by: req.user.id
    });
    
    res.status(201).json({ appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get appointments
 * GET /api/appointments
 */
async function getAppointments(req, res) {
  try {
    const { doctor_id, patient_id, status, date_from, date_to, limit, offset } = req.query;
    
    const appointments = await AppointmentModel.getByClinic(req.clinic_id, {
      doctor_id,
      patient_id,
      status,
      date_from,
      date_to,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    
    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get appointment by ID
 * GET /api/appointments/:appointmentId
 */
async function getAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const appointment = await AppointmentModel.getById(appointmentId);
    
    if (!appointment || appointment.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update appointment status
 * PUT /api/appointments/:appointmentId/status
 */
async function updateStatus(req, res) {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    
    const appointment = await AppointmentModel.updateStatus(appointmentId, status, notes, req.user.id);
    res.json({ appointment });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get today's appointments for doctor
 * GET /api/appointments/today/:doctorId
 */
async function getTodayForDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    const appointments = await AppointmentModel.getTodayForDoctor(doctorId);
    res.json({ appointments });
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== WAITING LIST ==========

/**
 * Get waiting list
 * GET /api/appointments/waiting-list
 */
async function getWaitingList(req, res) {
  try {
    const { doctor_id } = req.query;
    const waitingList = await AppointmentModel.getWaitingList(req.clinic_id, doctor_id);
    res.json({ waitingList });
  } catch (error) {
    console.error('Get waiting list error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Add to waiting list
 * POST /api/appointments/waiting-list
 */
async function addToWaitingList(req, res) {
  try {
    const { patient_id, doctor_id, reason } = req.body;
    
    if (!patient_id || !doctor_id) {
      return res.status(400).json({ error: 'Patient and doctor are required' });
    }
    
    const appointment = await AppointmentModel.addToWaitingList({
      clinic_id: req.clinic_id,
      patient_id,
      doctor_id,
      reason,
      added_by: req.user.id
    });
    
    res.status(201).json({ appointment });
  } catch (error) {
    console.error('Add to waiting list error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== APPOINTMENT TYPES ==========

/**
 * Get appointment types
 * GET /api/appointments/types
 */
async function getAppointmentTypes(req, res) {
  try {
    const types = await AppointmentTypeModel.getByClinic(req.clinic_id);
    res.json({ types });
  } catch (error) {
    console.error('Get appointment types error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Create appointment type
 * POST /api/appointments/types
 */
async function createAppointmentType(req, res) {
  try {
    const type = await AppointmentTypeModel.create({
      ...req.body,
      clinic_id: req.clinic_id
    });
    res.status(201).json({ type });
  } catch (error) {
    console.error('Create appointment type error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== CALENDAR VIEW ==========

/**
 * Get calendar view
 * GET /api/appointments/calendar
 */
async function getCalendar(req, res) {
  try {
    const { doctor_id, date_from, date_to } = req.query;
    
    const appointments = await AppointmentModel.getByClinic(req.clinic_id, {
      doctor_id,
      date_from,
      date_to,
      limit: 500,
      offset: 0
    });
    
    // Group by date
    const calendar = {};
    for (const apt of appointments) {
      const date = apt.appointment_date;
      if (!calendar[date]) calendar[date] = [];
      calendar[date].push(apt);
    }
    
    res.json({ calendar });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createSchedule,
  getSchedules,
  getAvailableSlots,
  createAppointment,
  getAppointments,
  getAppointment,
  updateStatus,
  getTodayForDoctor,
  getWaitingList,
  addToWaitingList,
  getAppointmentTypes,
  createAppointmentType,
  getCalendar
};
