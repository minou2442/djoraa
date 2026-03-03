const db = require('../utils/db');

class LabTestTypeModel {
  /**
   * Create a lab test type
   */
  static async create(data) {
    const { clinic_id, test_name, test_category, unit, reference_min, reference_max, price, active = true } = data;
    try {
      const result = await db.query(
        `INSERT INTO lab_test_types 
          (clinic_id, test_name, test_category, unit, reference_min, reference_max, price, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [clinic_id, test_name, test_category, unit, reference_min, reference_max, price, active]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create test type: ${error.message}`);
    }
  }

  /**
   * Get all test types for clinic
   */
  static async getByClinic(clinicId, activeOnly = true) {
    let query = 'SELECT * FROM lab_test_types WHERE clinic_id = $1';
    if (activeOnly) query += ' AND active = true';
    query += ' ORDER BY test_category, test_name';
    
    try {
      const result = await db.query(query, [clinicId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get test types: ${error.message}`);
    }
  }

  /**
   * Get test types by category
   */
  static async getByCategory(clinicId, category) {
    try {
      const result = await db.query(
        'SELECT * FROM lab_test_types WHERE clinic_id = $1 AND test_category = $2 AND active = true ORDER BY test_name',
        [clinicId, category]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get test types: ${error.message}`);
    }
  }
}

class LabRequestModel {
  /**
   * Create a new lab request
   */
  static async create(data) {
    const {
      clinic_id, patient_id, visit_id = null, requested_by,
      tests = [], priority = 'normal', clinical_diagnosis, notes
    } = data;

    try {
      // Generate unique lab number
      const labNumber = await this.generateLabNumber(clinic_id);

      const result = await db.query(
        `INSERT INTO lab_requests 
          (clinic_id, patient_id, visit_id, lab_number, requested_by, priority, clinical_diagnosis, notes, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
         RETURNING *`,
        [clinic_id, patient_id, visit_id, labNumber, requested_by, priority, clinical_diagnosis, notes]
      );
      
      const labRequest = result.rows[0];

      // Add tests to the request
      if (tests.length > 0) {
        for (const testTypeId of tests) {
          await db.query(
            `INSERT INTO lab_request_tests (request_id, test_type_id) VALUES ($1, $2)`,
            [labRequest.id, testTypeId]
          );
        }
      }

      return labRequest;
    } catch (error) {
      throw new Error(`Failed to create lab request: ${error.message}`);
    }
  }

  /**
   * Generate unique lab number
   */
  static async generateLabNumber(clinicId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const countResult = await db.query(
      'SELECT COUNT(*) FROM lab_requests WHERE clinic_id = $1 AND created_at >= CURRENT_DATE',
      [clinicId]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    return `LAB-${clinicId}-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  /**
   * Get lab request by ID
   */
  static async getById(id) {
    try {
      const result = await db.query(
        `SELECT lr.*, 
          (SELECT json_agg(json_build_object('id', lt.id, 'test_name', lt.test_name, 'unit', lt.unit, 'reference_min', lt.reference_min, 'reference_max', lt.reference_max))
           FROM lab_request_tests lrt
           JOIN lab_test_types lt ON lrt.test_type_id = lt.id
           WHERE lrt.request_id = lr.id) as tests
         FROM lab_requests lr WHERE lr.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get lab request: ${error.message}`);
    }
  }

  /**
   * Get requests by patient
   */
  static async getByPatient(patientId, limit = 50) {
    try {
      const result = await db.query(
        `SELECT * FROM lab_requests WHERE patient_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [patientId, limit]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get lab requests: ${error.message}`);
    }
  }

  /**
   * Get requests by clinic with filters
   */
  static async getByClinic(clinicId, filters = {}) {
    const { status = null, priority = null, date_from = null, date_to = null, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM lab_requests WHERE clinic_id = $1';
    const params = [clinicId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    if (date_from) {
      query += ` AND DATE(created_at) >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND DATE(created_at) <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get lab requests: ${error.message}`);
    }
  }

  /**
   * Update request status
   */
  static async updateStatus(id, status, userId, notes = null) {
    try {
      const result = await db.query(
        `UPDATE lab_requests SET status = $2, updated_by = $3, status_notes = $4, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status, userId, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  static async getStats(clinicId, dateFrom = null, dateTo = null) {
    let query = `
      SELECT status, priority, COUNT(*) as count
      FROM lab_requests WHERE clinic_id = $1
    `;
    const params = [clinicId];
    
    if (dateFrom) {
      query += ` AND created_at >= $2`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += params.length === 2 ? ` AND created_at <= $${params.length + 1}` : ` AND created_at <= $2`;
      params.push(dateTo);
    }
    
    query += ' GROUP BY status, priority';

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

class LabSampleModel {
  /**
   * Register sample
   */
  static async register(data) {
    const { request_id, sample_type, collected_by, collected_at, barcode } = data;
    
    try {
      // Generate barcode if not provided
      const finalBarcode = barcode || `SMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await db.query(
        `INSERT INTO lab_samples (request_id, sample_type, barcode, collected_by, collected_at, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'collected', NOW())
         RETURNING *`,
        [request_id, sample_type, finalBarcode, collected_by, collected_at || new Date()]
      );
      
      // Update request status
      await LabRequestModel.updateStatus(request_id, 'sample_collected', collected_by);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to register sample: ${error.message}`);
    }
  }

  /**
   * Get samples by request
   */
  static async getByRequest(requestId) {
    try {
      const result = await db.query(
        'SELECT * FROM lab_samples WHERE request_id = $1 ORDER BY created_at',
        [requestId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get samples: ${error.message}`);
    }
  }

  /**
   * Update sample status
   */
  static async updateStatus(id, status, userId) {
    try {
      const result = await db.query(
        `UPDATE lab_samples SET status = $2, updated_by = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status, userId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update sample: ${error.message}`);
    }
  }
}

class LabResultModel {
  /**
   * Add result for a test
   */
  static async addResult(data) {
    const { sample_id, test_type_id, value, result_text, is_abnormal = false, abnormal_flag = 'normal', entered_by } = data;
    
    try {
      // Get reference values from test type
      const testType = await db.query('SELECT * FROM lab_test_types WHERE id = $1', [test_type_id]);
      
      // Auto-flag abnormal values if not specified
      let finalAbnormalFlag = abnormal_flag;
      if (testType.rows[0] && value) {
        const refMin = parseFloat(testType.rows[0].reference_min);
        const refMax = parseFloat(testType.rows[0].reference_max);
        const numValue = parseFloat(value);
        
        if (!isNaN(refMin) && !isNaN(refMax) && !isNaN(numValue)) {
          finalAbnormalFlag = (numValue < refMin || numValue > refMax) ? 'high_low' : 'normal';
        }
      }

      const result = await db.query(
        `INSERT INTO lab_results (sample_id, test_type_id, value, result_text, is_abnormal, abnormal_flag, entered_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [sample_id, test_type_id, value, result_text, is_abnormal || finalAbnormalFlag !== 'normal', finalAbnormalFlag, entered_by]
      );
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to add result: ${error.message}`);
    }
  }

  /**
   * Get results by sample
   */
  static async getBySample(sampleId) {
    try {
      const result = await db.query(
        `SELECT lr.*, lt.test_name, lt.unit, lt.reference_min, lt.reference_max
         FROM lab_results lr
         JOIN lab_test_types lt ON lr.test_type_id = lt.id
         WHERE lr.sample_id = $1`,
        [sampleId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get results: ${error.message}`);
    }
  }

  /**
   * Validate result
   */
  static async validate(id, validatedBy, signature = null) {
    try {
      const result = await db.query(
        `UPDATE lab_results SET validated = true, validated_by = $2, validated_at = NOW(), signature = $3 WHERE id = $1 RETURNING *`,
        [id, validatedBy, signature]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to validate result: ${error.message}`);
    }
  }

  /**
   * Upload machine result file
   */
  static async uploadMachineResult(sampleId, fileName, filePath, uploadedBy) {
    try {
      const result = await db.query(
        `INSERT INTO lab_machine_results (sample_id, file_name, file_path, uploaded_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [sampleId, fileName, filePath, uploadedBy]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to upload machine result: ${error.message}`);
    }
  }
}

class LabValidationModel {
  /**
   * Complete validation (supervisor approval)
   */
  static async validateRequest(requestId, validatedBy, notes, signature) {
    try {
      const result = await db.query(
        `UPDATE lab_requests 
         SET status = 'validated', validated_by = $2, validated_at = NOW(), validation_notes = $3, final_signature = $4, updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [requestId, validatedBy, notes, signature]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to validate request: ${error.message}`);
    }
  }

  /**
   * Reject request
   */
  static async rejectRequest(requestId, rejectedBy, reason) {
    try {
      const result = await db.query(
        `UPDATE lab_requests 
         SET status = 'rejected', rejected_by = $2, rejection_reason = $3, updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [requestId, rejectedBy, reason]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }
  }
}

module.exports = {
  LabTestTypeModel,
  LabRequestModel,
  LabSampleModel,
  LabResultModel,
  LabValidationModel
};
