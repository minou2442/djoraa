const db = require('../utils/db');

// Queue Entry Model
const QueueEntryModel = {
  async findActive(clinicId, filters = {}) {
    let query = `
      SELECT qe.*, 
             p.first_name, p.last_name, p.patient_number, p.phone,
             u.username as doctor_name,
             r.name as room_name
      FROM queue_entries qe
      LEFT JOIN patients p ON qe.patient_id = p.id
      LEFT JOIN users u ON qe.doctor_id = u.id
      LEFT JOIN rooms r ON qe.room_id = r.id
      WHERE qe.clinic_id = $1 AND qe.status IN ('waiting', 'in_progress')
    `;
    const params = [clinicId];
    
    if (filters.doctor_id) {
      query += ` AND qe.doctor_id = $${params.length + 1}`;
      params.push(filters.doctor_id);
    }
    if (filters.room_id) {
      query += ` AND qe.room_id = $${params.length + 1}`;
      params.push(filters.room_id);
    }
    if (filters.service_type) {
      query += ` AND qe.service_type = $${params.length + 1}`;
      params.push(filters.service_type);
    }
    
    query += ` ORDER BY 
        CASE qe.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'vip' THEN 2 
          ELSE 3 
        END,
        qe.queue_number ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT qe.*, 
              p.first_name, p.last_name, p.patient_number, p.phone,
              u.username as doctor_name,
              r.name as room_name
       FROM queue_entries qe
       LEFT JOIN patients p ON qe.patient_id = p.id
       LEFT JOIN users u ON qe.doctor_id = u.id
       LEFT JOIN rooms r ON qe.room_id = r.id
       WHERE qe.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    // Get next queue number for the service type
    const countResult = await db.query(
      `SELECT COUNT(*) FROM queue_entries 
       WHERE clinic_id = $1 AND service_type = $2 AND DATE(created_at) = CURRENT_DATE`,
      [data.clinic_id, data.service_type]
    );
    const queueNumber = `${data.service_type.substring(0, 3).toUpperCase()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;
    
    // Calculate estimated wait time
    const waitResult = await db.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 15) as avg_minutes
       FROM queue_entries 
       WHERE clinic_id = $1 AND service_type = $2 AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [data.clinic_id, data.service_type]
    );
    const avgConsultationTime = parseFloat(waitResult.rows[0].avg_minutes) || 15;
    
    // Count current waiting
    const waitingResult = await db.query(
      `SELECT COUNT(*) FROM queue_entries 
       WHERE clinic_id = $1 AND service_type = $2 AND status = 'waiting'`,
      [data.clinic_id, data.service_type]
    );
    const waitingCount = parseInt(waitingResult.rows[0].count);
    const estimatedWait = waitingCount * avgConsultationTime;
    
    const result = await db.query(
      `INSERT INTO queue_entries (clinic_id, patient_id, queue_number, service_type, priority, doctor_id, room_id, reason, estimated_wait_minutes, status, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [data.clinic_id, data.patient_id, queueNumber, data.service_type, data.priority || 'normal', data.doctor_id, data.room_id, data.reason, estimatedWait, 'waiting', data.added_by]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, data = {}) {
    let query = `UPDATE queue_entries SET status = $1, updated_at = NOW()`;
    const params = [status, id];
    
    if (status === 'in_progress' && !data.started_at) {
      query += `, started_at = NOW()`;
    }
    if (status === 'completed' && !data.completed_at) {
      query += `, completed_at = NOW()`;
    }
    if (data.notes) {
      query += `, notes = $${params.length + 1}`;
      params.push(data.notes);
    }
    
    query += ` WHERE id = $2 RETURNING *`;
    
    const result = await db.query(query, params);
    return result.rows[0];
  },

  async reorder(id, newPosition, priority) {
    const entry = await this.findById(id);
    if (!entry) return null;
    
    await db.query(
      `UPDATE queue_entries SET priority = $1, updated_at = NOW() WHERE id = $2`,
      [priority, id]
    );
    
    return entry;
  },

  async getHistory(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT qe.*, 
              p.first_name, p.last_name, p.patient_number,
              u.username as doctor_name,
              r.name as room_name
       FROM queue_entries qe
       LEFT JOIN patients p ON qe.patient_id = p.id
       LEFT JOIN users u ON qe.doctor_id = u.id
       LEFT JOIN rooms r ON qe.room_id = r.id
       WHERE qe.clinic_id = $1 AND DATE(qe.created_at) BETWEEN $2 AND $3
       ORDER BY qe.created_at DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  async getNextInQueue(clinicId, doctorId) {
    const result = await db.query(
      `SELECT qe.*, p.first_name, p.last_name, p.patient_number, p.phone
       FROM queue_entries qe
       LEFT JOIN patients p ON qe.patient_id = p.id
       WHERE qe.clinic_id = $1 AND qe.doctor_id = $2 AND qe.status = 'waiting'
       ORDER BY CASE qe.priority WHEN 'urgent' THEN 1 WHEN 'vip' THEN 2 ELSE 3 END, qe.queue_number ASC
       LIMIT 1`,
      [clinicId, doctorId]
    );
    return result.rows[0];
  },

  async getStats(clinicId, date) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'vip' THEN 1 END) as vip
       FROM queue_entries
       WHERE clinic_id = $1 AND DATE(created_at) = $2`,
      [clinicId, date]
    );
    return result.rows[0];
  }
};

// Room Model
const RoomModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT r.*, u.username as doctor_name
       FROM rooms r
       LEFT JOIN users u ON r.doctor_id = u.id
       WHERE r.clinic_id = $1
       ORDER BY r.name`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT r.*, u.username as doctor_name
       FROM rooms r
       LEFT JOIN users u ON r.doctor_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO rooms (clinic_id, name, name_ar, doctor_id, room_type, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.clinic_id, data.name, data.name_ar, data.doctor_id, data.room_type || 'consultation', 'available']
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE rooms SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
};

// Session Statistics Model
const SessionStatsModel = {
  async getDoctorStats(clinicId, doctorId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration_minutes,
        MIN(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as min_duration,
        MAX(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as max_duration
       FROM queue_entries
       WHERE clinic_id = $1 AND doctor_id = $2 AND started_at BETWEEN $3 AND $4`,
      [clinicId, doctorId, dateFrom, dateTo]
    );
    return result.rows[0];
  },

  async getWaitingTimeStats(clinicId, date) {
    const result = await db.query(
      `SELECT 
        service_type,
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (started_at - created_at))/60) as avg_wait_minutes,
        MIN(EXTRACT(EPOCH FROM (started_at - created_at))/60) as min_wait,
        MAX(EXTRACT(EPOCH FROM (started_at - created_at))/60) as max_wait
       FROM queue_entries
       WHERE clinic_id = $1 AND DATE(created_at) = $2 AND started_at IS NOT NULL
       GROUP BY service_type`,
      [clinicId, date]
    );
    return result.rows;
  },

  async getPeakHours(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as patients_count,
        service_type
       FROM queue_entries
       WHERE clinic_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY EXTRACT(HOUR FROM created_at), service_type
       ORDER BY hour`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

module.exports = {
  QueueEntryModel,
  RoomModel,
  SessionStatsModel
};
