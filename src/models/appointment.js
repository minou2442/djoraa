const db = require('../utils/db');

class DoctorScheduleModel {
  /**
   * Create doctor schedule
   */
  static async create(data) {
    const { clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes = 30, max_patients, active = true } = data;
    try {
      const result = await db.query(
        `INSERT INTO doctor_schedules 
          (clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients, active]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }
  }

  /**
   * Get schedules by doctor
   */
  static async getByDoctor(doctorId, activeOnly = true) {
    let query = 'SELECT * FROM doctor_schedules WHERE doctor_id = $1';
    if (activeOnly) query += ' AND active = true';
    query += ' ORDER BY day_of_week, start_time';
    try {
      const result = await db.query(query, [doctorId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get schedules: ${error.message}`);
    }
  }

  /**
   * Get available slots for doctor on a specific date
   */
  static async getAvailableSlots(doctorId, date) {
    try {
      // Get doctor's schedule for this day
      const dayOfWeek = new Date(date).getDay();
      const schedules = await db.query(
        `SELECT * FROM doctor_schedules 
         WHERE doctor_id = $1 AND day_of_week = $2 AND active = true`,
        [doctorId, dayOfWeek]
      );

      if (schedules.rows.length === 0) return [];

      // Get existing appointments for this doctor on this date
      const dateStr = date.split('T')[0];
      const appointments = await db.query(
        `SELECT appointment_time FROM appointments 
         WHERE doctor_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled', 'no_show')`,
        [doctorId, dateStr]
      );

      const bookedTimes = appointments.rows.map(a => a.appointment_time);

      // Generate available slots
      const availableSlots = [];
      for (const schedule of schedules.rows) {
        const startTime = schedule.start_time;
        const endTime = schedule.end_time;
        const duration = schedule.slot_duration_minutes;

        let currentTime = startTime;
        while (currentTime < endTime) {
          // Check if slot is in the past
          const slotDateTime = new Date(`${dateStr}T${currentTime}`);
          if (slotDateTime > new Date()) {
            if (!bookedTimes.includes(currentTime)) {
              availableSlots.push({
                time: currentTime,
                schedule_id: schedule.id,
                duration
              });
            }
          }
          // Add duration to get next slot time
          const [hours, minutes] = currentTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + duration;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }
      }

      return availableSlots;
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }
}

class AppointmentModel {
  /**
   * Create appointment
   */
  static async create(data) {
    const { clinic_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, duration_minutes = 30, reason, notes, booked_by } = data;
    try {
      const result = await db.query(
        `INSERT INTO appointments 
          (clinic_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, duration_minutes, reason, notes, status, booked_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10, NOW())
         RETURNING *`,
        [clinic_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, duration_minutes, reason, notes, booked_by]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Get by ID
   */
  static async getById(id) {
    try {
      const result = await db.query(
        `SELECT a.*, 
          p.first_name as patient_first_name, p.last_name as patient_last_name,
          u.username as doctor_name
         FROM appointments a
         LEFT JOIN patients p ON a.patient_id = p.id
         LEFT JOIN users u ON a.doctor_id = u.id
         WHERE a.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get appointment: ${error.message}`);
    }
  }

  /**
   * Get by clinic with filters
   */
  static async getByClinic(clinicId, filters = {}) {
    const { doctor_id = null, patient_id = null, status = null, date_from = null, date_to = null, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM appointments WHERE clinic_id = $1';
    const params = [clinicId];
    let paramIndex = 2;

    if (doctor_id) {
      query += ` AND doctor_id = $${paramIndex}`;
      params.push(doctor_id);
      paramIndex++;
    }
    if (patient_id) {
      query += ` AND patient_id = $${paramIndex}`;
      params.push(patient_id);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (date_from) {
      query += ` AND appointment_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND appointment_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY appointment_date DESC, appointment_time ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  /**
   * Get by patient
   */
  static async getByPatient(patientId, limit = 50) {
    try {
      const result = await db.query(
        `SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC, appointment_time DESC LIMIT $2`,
        [patientId, limit]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  /**
   * Update status
   */
  static async updateStatus(id, status, notes = null, updatedBy) {
    try {
      const result = await db.query(
        `UPDATE appointments SET status = $2, status_notes = $3, updated_by = $4, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status, notes, updatedBy]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Get today's appointments for doctor
   */
  static async getTodayForDoctor(doctorId) {
    const today = new Date().toISOString().split('T')[0];
    try {
      const result = await db.query(
        `SELECT * FROM appointments 
         WHERE doctor_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled', 'completed')
         ORDER BY appointment_time ASC`,
        [doctorId, today]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
  }

  /**
   * Get waiting list
   */
  static async getWaitingList(clinicId, doctorId = null) {
    let query = `SELECT * FROM appointments 
                 WHERE clinic_id = $1 AND status = 'waiting'`;
    const params = [clinicId];
    
    if (doctorId) {
      query += ` AND doctor_id = $2`;
      params.push(doctorId);
    }
    
    query += ` ORDER BY waitlist_priority ASC, appointment_time ASC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get waiting list: ${error.message}`);
    }
  }

  /**
   * Add to waiting list
   */
  static async addToWaitingList(data) {
    const { clinic_id, patient_id, doctor_id, reason, added_by } = data;
    try {
      // Get position
      const countResult = await db.query(
        `SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND status = 'waiting'`,
        [clinic_id]
      );
      const position = parseInt(countResult.rows[0].count) + 1;

      const result = await db.query(
        `INSERT INTO appointments (clinic_id, patient_id, doctor_id, reason, status, waitlist_priority, booked_by, created_at)
         VALUES ($1, $2, $3, $4, 'waiting', $5, $6, NOW())
         RETURNING *`,
        [clinic_id, patient_id, doctor_id, reason, position, added_by]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to add to waiting list: ${error.message}`);
    }
  }
}

class AppointmentTypeModel {
  /**
   * Get all appointment types
   */
  static async getByClinic(clinicId) {
    try {
      const result = await db.query(
        'SELECT * FROM appointment_types WHERE clinic_id = $1 OR clinic_id IS NULL ORDER BY name',
        [clinicId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get appointment types: ${error.message}`);
    }
  }

  /**
   * Create appointment type
   */
  static async create(data) {
    const { clinic_id, name, name_ar, duration_minutes, color, active = true } = data;
    try {
      const result = await db.query(
        `INSERT INTO appointment_types (clinic_id, name, name_ar, duration_minutes, color, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [clinic_id, name, name_ar, duration_minutes, color, active]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create appointment type: ${error.message}`);
    }
  }
}

module.exports = {
  DoctorScheduleModel,
  AppointmentModel,
  AppointmentTypeModel
};
