const db = require('../utils/db');

class RadiologyExamModel {
  /**
   * Create a new radiology exam
   */
  static async create(data) {
    const {
      clinic_id,
      patient_id,
      visit_id = null,
      exam_type,
      scheduled_date,
      scheduled_time,
      requested_by,
      priority = 'normal',
      clinical_indication,
      notes
    } = data;

    try {
      const result = await db.query(
        `INSERT INTO radiology_exams 
          (clinic_id, patient_id, visit_id, exam_type, scheduled_date, scheduled_time, 
           requested_by, priority, clinical_indication, notes, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', NOW())
         RETURNING *`,
        [clinic_id, patient_id, visit_id, exam_type, scheduled_date, scheduled_time,
         requested_by, priority, clinical_indication, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create radiology exam: ${error.message}`);
    }
  }

  /**
   * Get exam by ID
   */
  static async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM radiology_exams WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get radiology exam: ${error.message}`);
    }
  }

  /**
   * Get exams by patient
   */
  static async getByPatient(patientId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    try {
      const result = await db.query(
        `SELECT * FROM radiology_exams 
         WHERE patient_id = $1 
         ORDER BY scheduled_date DESC, scheduled_time DESC 
         LIMIT $2 OFFSET $3`,
        [patientId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get radiology exams: ${error.message}`);
    }
  }

  /**
   * Get exams by clinic with filters
   */
  static async getByClinic(clinicId, filters = {}) {
    const { 
      status = null, 
      exam_type = null, 
      priority = null,
      date_from = null,
      date_to = null,
      limit = 50, 
      offset = 0 
    } = filters;

    let query = 'SELECT * FROM radiology_exams WHERE clinic_id = $1';
    const params = [clinicId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (exam_type) {
      query += ` AND exam_type = $${paramIndex}`;
      params.push(exam_type);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY scheduled_date DESC, scheduled_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get radiology exams: ${error.message}`);
    }
  }

  /**
   * Update exam status
   */
  static async updateStatus(id, status, updatedBy) {
    try {
      const result = await db.query(
        `UPDATE radiology_exams 
         SET status = $2, updated_by = $3, updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id, status, updatedBy]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update radiology exam status: ${error.message}`);
    }
  }

  /**
   * Update exam with report
   */
  static async updateReport(id, data, radiologistId) {
    const { findings, impression, technique, comparison, recommendation } = data;
    
    try {
      const result = await db.query(
        `UPDATE radiology_exams 
         SET findings = $2, impression = $3, technique = $4, 
             comparison = $5, recommendation = $6,
             radiologist_id = $7, status = 'completed', 
             report_completed_at = NOW(), updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id, findings, impression, technique, comparison, recommendation, radiologistId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update radiology report: ${error.message}`);
    }
  }

  /**
   * Cancel exam
   */
  static async cancel(id, reason, cancelledBy) {
    try {
      const result = await db.query(
        `UPDATE radiology_exams 
         SET status = 'cancelled', cancellation_reason = $2, 
             cancelled_by = $3, cancelled_at = NOW(), updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id, reason, cancelledBy]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to cancel radiology exam: ${error.message}`);
    }
  }

  /**
   * Get exam statistics
   */
  static async getStats(clinicId, dateFrom = null, dateTo = null) {
    let query = `
      SELECT 
        status,
        exam_type,
        priority,
        COUNT(*) as count
      FROM radiology_exams 
      WHERE clinic_id = $1
    `;
    const params = [clinicId];
    let paramIndex = 2;

    if (dateFrom) {
      query += ` AND scheduled_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND scheduled_date <= $${paramIndex}`;
      params.push(dateTo);
    }

    query += ' GROUP BY status, exam_type, priority';

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get radiology stats: ${error.message}`);
    }
  }
}

class RadiologyImageModel {
  /**
   * Upload image for exam
   */
  static async create(data) {
    const { exam_id, file_name, file_path, file_size, mime_type, image_type, uploaded_by, sequence_number } = data;

    try {
      const result = await db.query(
        `INSERT INTO radiology_images 
          (exam_id, file_name, file_path, file_size, mime_type, image_type, uploaded_by, sequence_number, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [exam_id, file_name, file_path, file_size, mime_type, image_type, uploaded_by, sequence_number]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to upload radiology image: ${error.message}`);
    }
  }

  /**
   * Get images by exam
   */
  static async getByExam(examId) {
    try {
      const result = await db.query(
        'SELECT * FROM radiology_images WHERE exam_id = $1 ORDER BY sequence_number ASC',
        [examId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get radiology images: ${error.message}`);
    }
  }

  /**
   * Delete image
   */
  static async delete(id) {
    try {
      await db.query('DELETE FROM radiology_images WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete radiology image: ${error.message}`);
    }
  }
}

module.exports = {
  RadiologyExamModel,
  RadiologyImageModel
};
