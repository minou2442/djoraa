const db = require('../db');

class PrescriptionModel {
  static async create(patientId, data, createdBy) {
    const {
      visit_id = null,
      medication,
      dosage,
      frequency,
      route,
      start_date,
      end_date,
      prescribing_doctor_id = null,
      notes,
    } = data;

    const query = `
      INSERT INTO patient_prescriptions
        (patient_id, visit_id, medication, dosage, frequency, route, start_date, end_date,
         prescribing_doctor_id, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;
    const params = [patientId, visit_id, medication, dosage, frequency, route, start_date, end_date,
      prescribing_doctor_id, notes, createdBy];
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_prescriptions WHERE patient_id=$1 ORDER BY created_at DESC',
      [patientId]
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await db.query('SELECT * FROM patient_prescriptions WHERE id=$1', [id]);
    return rows[0];
  }

  static async update(id, data, updatedBy) {
    const fields = [];
    const params = [];
    let idx = 1;
    for (const key of Object.keys(data)) {
      fields.push(`${key}=$${idx}`);
      params.push(data[key]);
      idx++;
    }
    params.push(updatedBy);
    const q = `UPDATE patient_prescriptions SET ${fields.join(',')}, updated_by=$${idx}, updated_at=NOW() WHERE id=$${idx+1} RETURNING *`;
    params.push(id);
    const { rows } = await db.query(q, params);
    return rows[0];
  }

  static async deactivate(id, updatedBy) {
    const { rows } = await db.query(
      'UPDATE patient_prescriptions SET is_active=false, updated_by=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [updatedBy, id]
    );
    return rows[0];
  }
}

class LabRequestModel {
  static async create(patientId, data, createdBy) {
    const {
      visit_id = null,
      test_name,
      priority = 'normal',
      requested_by = null,
      notes
    } = data;
    const query = `
      INSERT INTO patient_lab_requests
        (patient_id, visit_id, test_name, priority, requested_by, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `;
    const params = [patientId, visit_id, test_name, priority, requested_by, notes, createdBy];
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_lab_requests WHERE patient_id=$1 ORDER BY requested_at DESC',
      [patientId]
    );
    return rows;
  }

  static async updateStatus(id, status, updatedBy) {
    const { rows } = await db.query(
      'UPDATE patient_lab_requests SET status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, updatedBy, id]
    );
    return rows[0];
  }

  static async addResults(id, results, resultDate, updatedBy) {
    const { rows } = await db.query(
      'UPDATE patient_lab_requests SET results=$1, result_date=$2, status=$3, updated_by=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [results, resultDate, 'completed', updatedBy, id]
    );
    return rows[0];
  }
}

class RadiologyRequestModel {
  static async create(patientId, data, createdBy) {
    const {
      visit_id = null,
      exam_type,
      priority = 'normal',
      requested_by = null,
      notes
    } = data;
    const query = `
      INSERT INTO patient_radiology_requests
        (patient_id, visit_id, exam_type, priority, requested_by, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `;
    const params = [patientId, visit_id, exam_type, priority, requested_by, notes, createdBy];
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_radiology_requests WHERE patient_id=$1 ORDER BY requested_at DESC',
      [patientId]
    );
    return rows;
  }

  static async updateStatus(id, status, updatedBy) {
    const { rows } = await db.query(
      'UPDATE patient_radiology_requests SET status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, updatedBy, id]
    );
    return rows[0];
  }

  static async addReport(id, report, reportDate, updatedBy) {
    const { rows } = await db.query(
      'UPDATE patient_radiology_requests SET report=$1, report_date=$2, status=$3, updated_by=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [report, reportDate, 'completed', updatedBy, id]
    );
    return rows[0];
  }
}

class SurgeryModel {
  static async create(patientId, data, createdBy) {
    const {
      visit_id = null,
      surgery_type,
      description,
      surgeon_id = null,
      surgery_date,
      outcome,
      notes
    } = data;
    const query = `
      INSERT INTO patient_surgeries
        (patient_id, visit_id, surgery_type, description, surgeon_id, surgery_date, outcome, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `;
    const params = [patientId, visit_id, surgery_type, description, surgeon_id, surgery_date, outcome, notes, createdBy];
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_surgeries WHERE patient_id=$1 ORDER BY surgery_date DESC',
      [patientId]
    );
    return rows;
  }
}

class VitalModel {
  static async record(patientId, data, recordedBy) {
    const {
      visit_id = null,
      taken_at = new Date(),
      blood_pressure,
      heart_rate,
      respiratory_rate,
      temperature,
      oxygen_saturation,
      weight,
      height,
      notes
    } = data;
    const query = `
      INSERT INTO patient_vitals
        (patient_id, visit_id, taken_at, blood_pressure, heart_rate, respiratory_rate, temperature, oxygen_saturation, weight, height, notes, recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `;
    const params = [patientId, visit_id, taken_at, blood_pressure, heart_rate, respiratory_rate, temperature, oxygen_saturation, weight, height, notes, recordedBy];
    const { rows } = await db.query(query, params);
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_vitals WHERE patient_id=$1 ORDER BY taken_at DESC',
      [patientId]
    );
    return rows;
  }
}

class ClinicalNoteModel {
  static async create(patientId, data, authorId) {
    const { visit_id = null, note_type, content } = data;
    const { rows } = await db.query(
      `INSERT INTO patient_clinical_notes (patient_id, visit_id, note_type, content, author_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [patientId, visit_id, note_type, content, authorId]
    );
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_clinical_notes WHERE patient_id=$1 ORDER BY created_at DESC',
      [patientId]
    );
    return rows;
  }
}

class SignatureModel {
  static async sign(patientId, userId, action, signatureData) {
    const { rows } = await db.query(
      `INSERT INTO patient_signatures (patient_id, user_id, action, signature_data)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [patientId, userId, action, signatureData]
    );
    return rows[0];
  }

  static async getByPatient(patientId) {
    const { rows } = await db.query(
      'SELECT * FROM patient_signatures WHERE patient_id=$1 ORDER BY signed_at DESC',
      [patientId]
    );
    return rows;
  }
}

module.exports = {
  PrescriptionModel,
  LabRequestModel,
  RadiologyRequestModel,
  SurgeryModel,
  VitalModel,
  ClinicalNoteModel,
  SignatureModel
};
