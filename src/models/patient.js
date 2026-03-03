const db = require('../utils/db');
const AuditService = require('../services/auditService');

class PatientModel {
  /**
   * Create a new patient
   * @param {Object} data - Patient data
   * @returns {Promise<Object>} Created patient
   */
  static async create(data) {
    const {
      clinic_id,
      patient_number,
      national_id,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      city,
      postal_code,
      country,
      blood_group,
      marital_status,
      occupation,
      created_by,
      notes
    } = data;

    try {
      const result = await db.query(
        `INSERT INTO patients (
          clinic_id, patient_number, national_id, first_name, middle_name, last_name,
          date_of_birth, gender, phone, email, address, city, postal_code, country,
          blood_group, marital_status, occupation, created_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          clinic_id, patient_number, national_id, first_name, middle_name, last_name,
          date_of_birth, gender, phone, email, address, city, postal_code, country,
          blood_group, marital_status, occupation, created_by, notes
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }
  }

  /**
   * Get patient by ID
   * @param {string} patientId - Patient UUID
   * @returns {Promise<Object>} Patient data
   */
  static async getById(patientId) {
    try {
      const result = await db.query(
        'SELECT * FROM patients WHERE id = $1',
        [patientId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  /**
   * Get patient by national ID
   * @param {string} nationalId - National ID
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<Object>} Patient data
   */
  static async getByNationalId(nationalId, clinicId) {
    try {
      const result = await db.query(
        'SELECT * FROM patients WHERE national_id = $1 AND clinic_id = $2',
        [nationalId, clinicId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  /**
   * Get patient by patient number
   * @param {string} patientNumber - Patient number
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<Object>} Patient data
   */
  static async getByPatientNumber(patientNumber, clinicId) {
    try {
      const result = await db.query(
        'SELECT * FROM patients WHERE patient_number = $1 AND clinic_id = $2',
        [patientNumber, clinicId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  /**
   * Search patients with advanced filters
   * @param {number} clinicId - Clinic ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Patients matching filters
   */
  static async search(clinicId, filters = {}) {
    const {
      q = null, // general search query
      first_name = null,
      last_name = null,
      national_id = null,
      phone = null,
      email = null,
      blood_group = null,
      status = 'active',
      limit = 50,
      offset = 0
    } = filters;

    let query = 'SELECT * FROM patients WHERE clinic_id = $1';
    const params = [clinicId];

    // Status filter
    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    // General query search (name, patient number, national ID)
    if (q) {
      query += ` AND (
        patient_number ILIKE $${params.length + 1} OR
        national_id ILIKE $${params.length + 1} OR
        first_name ILIKE $${params.length + 1} OR
        last_name ILIKE $${params.length + 1} OR
        CONCAT(first_name, ' ', last_name) ILIKE $${params.length + 1}
      )`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Specific field filters
    if (first_name) {
      query += ` AND first_name ILIKE $${params.length + 1}`;
      params.push(`%${first_name}%`);
    }

    if (last_name) {
      query += ` AND last_name ILIKE $${params.length + 1}`;
      params.push(`%${last_name}%`);
    }

    if (national_id) {
      query += ` AND national_id = $${params.length + 1}`;
      params.push(national_id);
    }

    if (phone) {
      query += ` AND phone ILIKE $${params.length + 1}`;
      params.push(`%${phone}%`);
    }

    if (email) {
      query += ` AND email ILIKE $${params.length + 1}`;
      params.push(`%${email}%`);
    }

    if (blood_group) {
      query += ` AND blood_group = $${params.length + 1}`;
      params.push(blood_group);
    }

    // Pagination
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to search patients: ${error.message}`);
    }
  }

  /**
   * Count patients (with filters)
   * @param {number} clinicId - Clinic ID
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Total count
   */
  static async count(clinicId, filters = {}) {
    const { status = 'active', q = null } = filters;

    let query = 'SELECT COUNT(*) FROM patients WHERE clinic_id = $1';
    const params = [clinicId];

    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (q) {
      query += ` AND (
        patient_number ILIKE $${params.length + 1} OR
        national_id ILIKE $${params.length + 1} OR
        first_name ILIKE $${params.length + 1} OR
        last_name ILIKE $${params.length + 1}
      )`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    try {
      const result = await db.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new Error(`Failed to count patients: ${error.message}`);
    }
  }

  /**
   * Update patient
   * @param {string} patientId - Patient UUID
   * @param {Object} data - Updated data
   * @param {number} updatedBy - User ID
   * @returns {Promise<Object>} Updated patient
   */
  static async update(patientId, data, updatedBy) {
    const {
      first_name,
      middle_name,
      last_name,
      phone,
      email,
      address,
      city,
      postal_code,
      country,
      blood_group,
      marital_status,
      occupation,
      notes,
      status
    } = data;

    try {
      const result = await db.query(
        `UPDATE patients SET
          first_name = COALESCE($2, first_name),
          middle_name = COALESCE($3, middle_name),
          last_name = COALESCE($4, last_name),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email),
          address = COALESCE($7, address),
          city = COALESCE($8, city),
          postal_code = COALESCE($9, postal_code),
          country = COALESCE($10, country),
          blood_group = COALESCE($11, blood_group),
          marital_status = COALESCE($12, marital_status),
          occupation = COALESCE($13, occupation),
          notes = COALESCE($14, notes),
          status = COALESCE($15, status),
          updated_by = $16,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *`,
        [
          patientId, first_name, middle_name, last_name, phone, email,
          address, city, postal_code, country, blood_group, marital_status,
          occupation, notes, status, updatedBy
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  /**
   * Archive patient (soft delete)
   * @param {string} patientId - Patient UUID
   * @param {number} updatedBy - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async archive(patientId, updatedBy) {
    try {
      await db.query(
        `UPDATE patients SET status = 'archived', archived_at = CURRENT_TIMESTAMP, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [patientId, updatedBy]
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to archive patient: ${error.message}`);
    }
  }

  /**
   * Get patient with all related data
   * @param {string} patientId - Patient UUID
   * @returns {Promise<Object>} Complete patient profile
   */
  static async getComplete(patientId) {
    try {
      const patient = await this.getById(patientId);
      if (!patient) return null;

      // Get all related data in parallel
      const [insurance, allergies, diseases, contacts, documents, visits] = await Promise.all([
        PatientInsuranceModel.getByPatientId(patientId),
        PatientAllergyModel.getByPatientId(patientId),
        PatientDiseaseModel.getByPatientId(patientId),
        PatientEmergencyContactModel.getByPatientId(patientId),
        PatientDocumentModel.getByPatientId(patientId),
        PatientVisitModel.getByPatientId(patientId, { limit: 10 })
      ]);

      return {
        ...patient,
        insurance,
        allergies,
        diseases,
        emergency_contacts: contacts,
        documents,
        recent_visits: visits
      };
    } catch (error) {
      throw new Error(`Failed to get complete patient: ${error.message}`);
    }
  }

  /**
   * Get patients by clinic with pagination
   * @param {number} clinicId - Clinic ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Patients
   */
  static async getByClinic(clinicId, options = {}) {
    const { limit = 50, offset = 0, status = 'active' } = options;

    try {
      const query = status === 'all'
        ? `SELECT * FROM patients WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
        : `SELECT * FROM patients WHERE clinic_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`;

      const params = status === 'all'
        ? [clinicId, limit, offset]
        : [clinicId, status, limit, offset];

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get patients: ${error.message}`);
    }
  }

  /**
   * Generate next patient number
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<string>} Next patient number
   */
  static async generatePatientNumber(clinicId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) FROM patients WHERE clinic_id = $1',
        [clinicId]
      );

      const count = parseInt(result.rows[0].count, 10) + 1;
      const timestamp = Date.now();
      return `PAT-${clinicId}-${timestamp}-${String(count).padStart(5, '0')}`;
    } catch (error) {
      throw new Error(`Failed to generate patient number: ${error.message}`);
    }
  }
}

module.exports = PatientModel;
