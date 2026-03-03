const db = require('../utils/db');

class PatientInsuranceModel {
  static async create(data) {
    const { patient_id, insurance_provider, policy_number, group_number, policy_holder_name, policy_holder_relationship, coverage_type, copay, deductible, policy_start_date, policy_expiry_date, notes } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_insurance (patient_id, insurance_provider, policy_number, group_number, policy_holder_name, policy_holder_relationship, coverage_type, copay, deductible, policy_start_date, policy_expiry_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [patient_id, insurance_provider, policy_number, group_number, policy_holder_name, policy_holder_relationship, coverage_type, copay, deductible, policy_start_date, policy_expiry_date, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create insurance: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_insurance WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get insurance: ${error.message}`);
    }
  }

  static async getByPatientId(patientId) {
    try {
      const result = await db.query('SELECT * FROM patient_insurance WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get insurance records: ${error.message}`);
    }
  }

  static async update(id, data) {
    const { insurance_provider, policy_number, policy_expiry_date, is_active, notes } = data;
    try {
      const result = await db.query(
        `UPDATE patient_insurance SET insurance_provider = COALESCE($2, insurance_provider), policy_number = COALESCE($3, policy_number), policy_expiry_date = COALESCE($4, policy_expiry_date), is_active = COALESCE($5, is_active), notes = COALESCE($6, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, insurance_provider, policy_number, policy_expiry_date, is_active, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update insurance: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM patient_insurance WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete insurance: ${error.message}`);
    }
  }
}

class PatientAllergyModel {
  static async create(data) {
    const { patient_id, allergy_name, allergy_type, severity, reaction_description, notes } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_allergies (patient_id, allergy_name, allergy_type, severity, reaction_description, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [patient_id, allergy_name, allergy_type, severity, reaction_description, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create allergy: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_allergies WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get allergy: ${error.message}`);
    }
  }

  static async getByPatientId(patientId) {
    try {
      const result = await db.query('SELECT * FROM patient_allergies WHERE patient_id = $1 ORDER BY severity DESC, created_at DESC', [patientId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  static async update(id, data) {
    const { allergy_name, allergy_type, severity, reaction_description, notes } = data;
    try {
      const result = await db.query(
        `UPDATE patient_allergies SET allergy_name = COALESCE($2, allergy_name), allergy_type = COALESCE($3, allergy_type), severity = COALESCE($4, severity), reaction_description = COALESCE($5, reaction_description), notes = COALESCE($6, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, allergy_name, allergy_type, severity, reaction_description, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update allergy: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM patient_allergies WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete allergy: ${error.message}`);
    }
  }
}

class PatientDiseaseModel {
  static async create(data) {
    const { patient_id, disease_name, icd10_code, diagnosis_date, status, current_medication, notes } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_chronic_diseases (patient_id, disease_name, icd10_code, diagnosis_date, status, current_medication, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [patient_id, disease_name, icd10_code, diagnosis_date, status, current_medication, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create disease record: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_chronic_diseases WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get disease: ${error.message}`);
    }
  }

  static async getByPatientId(patientId) {
    try {
      const result = await db.query('SELECT * FROM patient_chronic_diseases WHERE patient_id = $1 ORDER BY diagnosis_date DESC', [patientId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get diseases: ${error.message}`);
    }
  }

  static async update(id, data) {
    const { disease_name, icd10_code, status, current_medication, notes } = data;
    try {
      const result = await db.query(
        `UPDATE patient_chronic_diseases SET disease_name = COALESCE($2, disease_name), icd10_code = COALESCE($3, icd10_code), status = COALESCE($4, status), current_medication = COALESCE($5, current_medication), notes = COALESCE($6, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, disease_name, icd10_code, status, current_medication, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update disease: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM patient_chronic_diseases WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete disease: ${error.message}`);
    }
  }
}

class PatientEmergencyContactModel {
  static async create(data) {
    const { patient_id, contact_name, relationship, phone, secondary_phone, email, address, priority } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_emergency_contacts (patient_id, contact_name, relationship, phone, secondary_phone, email, address, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [patient_id, contact_name, relationship, phone, secondary_phone, email, address, priority]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create emergency contact: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_emergency_contacts WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get emergency contact: ${error.message}`);
    }
  }

  static async getByPatientId(patientId) {
    try {
      const result = await db.query('SELECT * FROM patient_emergency_contacts WHERE patient_id = $1 ORDER BY priority ASC', [patientId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get emergency contacts: ${error.message}`);
    }
  }

  static async update(id, data) {
    const { contact_name, relationship, phone, secondary_phone, email, address, priority } = data;
    try {
      const result = await db.query(
        `UPDATE patient_emergency_contacts SET contact_name = COALESCE($2, contact_name), relationship = COALESCE($3, relationship), phone = COALESCE($4, phone), secondary_phone = COALESCE($5, secondary_phone), email = COALESCE($6, email), address = COALESCE($7, address), priority = COALESCE($8, priority), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, contact_name, relationship, phone, secondary_phone, email, address, priority]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update emergency contact: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM patient_emergency_contacts WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete emergency contact: ${error.message}`);
    }
  }
}

class PatientDocumentModel {
  static async create(data) {
    const { patient_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, document_date, expiry_date, notes } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_documents (patient_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, document_date, expiry_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [patient_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, document_date, expiry_date, notes]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_documents WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  static async getByPatientId(patientId) {
    try {
      const result = await db.query('SELECT * FROM patient_documents WHERE patient_id = $1 ORDER BY uploaded_at DESC', [patientId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM patient_documents WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}

class PatientVisitModel {
  static async create(data) {
    const { patient_id, clinic_id, doctor_id, visit_date, visit_type, chief_complaint, diagnosis, treatment, prescription, notes, vitals, created_by } = data;

    try {
      const result = await db.query(
        `INSERT INTO patient_visits (patient_id, clinic_id, doctor_id, visit_date, visit_type, chief_complaint, diagnosis, treatment, prescription, notes, vitals, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [patient_id, clinic_id, doctor_id, visit_date, visit_type, chief_complaint, diagnosis, treatment, prescription, notes, vitals ? JSON.stringify(vitals) : null, created_by]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create visit: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM patient_visits WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get visit: ${error.message}`);
    }
  }

  static async getByPatientId(patientId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    try {
      const result = await db.query(
        'SELECT * FROM patient_visits WHERE patient_id = $1 ORDER BY visit_date DESC LIMIT $2 OFFSET $3',
        [patientId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get visits: ${error.message}`);
    }
  }

  static async update(id, data) {
    const { diagnosis, treatment, prescription, notes, vitals } = data;
    try {
      const result = await db.query(
        `UPDATE patient_visits SET diagnosis = COALESCE($2, diagnosis), treatment = COALESCE($3, treatment), prescription = COALESCE($4, prescription), notes = COALESCE($5, notes), vitals = COALESCE($6, vitals), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, diagnosis, treatment, prescription, notes, vitals ? JSON.stringify(vitals) : null]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update visit: ${error.message}`);
    }
  }
}

module.exports = {
  PatientInsuranceModel,
  PatientAllergyModel,
  PatientDiseaseModel,
  PatientEmergencyContactModel,
  PatientDocumentModel,
  PatientVisitModel
};
