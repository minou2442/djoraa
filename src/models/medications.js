const db = require('../utils/db');

// Medication Model
const MedicationModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT m.*, 
             tc.name as therapeutic_class_name,
             mcs.name as controlled_substance_name
      FROM medications m
      LEFT JOIN therapeutic_classes tc ON m.therapeutic_class_id = tc.id
      LEFT JOIN medication_controlled_substances mcs ON m.controlled_substance_id = mcs.id
      WHERE (m.clinic_id = $1 OR m.clinic_id IS NULL)
    `;
    const params = [clinicId];
    
    if (filters.search) {
      query += ` AND (m.commercial_name ILIKE $${params.length + 1} OR m.generic_name ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
    }
    if (filters.therapeutic_class_id) {
      query += ` AND m.therapeutic_class_id = $${params.length + 1}`;
      params.push(filters.therapeutic_class_id);
    }
    if (filters.requires_prescription !== undefined) {
      query += ` AND m.requires_prescription = $${params.length + 1}`;
      params.push(filters.requires_prescription);
    }
    if (filters.controlled !== undefined) {
      query += ` AND m.controlled_substance_id IS NOT NULL`;
    }
    if (filters.active !== undefined) {
      query += ` AND m.active = $${params.length + 1}`;
      params.push(filters.active);
    }
    
    query += ` ORDER BY m.commercial_name`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT m.*, 
              tc.name as therapeutic_class_name,
              mcs.name as controlled_substance_name
       FROM medications m
       LEFT JOIN therapeutic_classes tc ON m.therapeutic_class_id = tc.id
       LEFT JOIN medication_controlled_substances mcs ON m.controlled_substance_id = mcs.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO medications (
        clinic_id, commercial_name, generic_name, therapeutic_class_id,
        dosage_forms, strengths, algerian_market, requires_prescription,
        controlled_substance_id, contraindications, side_effects,
        pregnancy_category, interactions, instructions, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        data.clinic_id, data.commercial_name, data.generic_name, data.therapeutic_class_id,
        JSON.stringify(data.dosage_forms), JSON.stringify(data.strengths), data.algerian_market,
        data.requires_prescription, data.controlled_substance_id, data.contraindications,
        data.side_effects, data.pregnancy_category, data.interactions, data.instructions, true
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await db.query(
      `UPDATE medications SET 
        commercial_name = $1, generic_name = $2, therapeutic_class_id = $3,
        dosage_forms = $4, strengths = $5, algerian_market = $6,
        requires_prescription = $7, controlled_substance_id = $8,
        contraindications = $9, side_effects = $10, pregnancy_category = $11,
        interactions = $12, instructions = $13, active = $14
       WHERE id = $15 RETURNING *`,
      [
        data.commercial_name, data.generic_name, data.therapeutic_class_id,
        JSON.stringify(data.dosage_forms), JSON.stringify(data.strengths), data.algerian_market,
        data.requires_prescription, data.controlled_substance_id,
        data.contraindications, data.side_effects, data.pregnancy_category,
        data.interactions, data.instructions, data.active, id
      ]
    );
    return result.rows[0];
  },

  async archive(id) {
    const result = await db.query(
      `UPDATE medications SET active = false, archived_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async search(clinicId, query) {
    const result = await db.query(
      `SELECT id, commercial_name, generic_name, dosage_forms, strengths, requires_prescription
       FROM medications 
       WHERE (clinic_id = $1 OR clinic_id IS NULL)
         AND active = true
         AND (commercial_name ILIKE $2 OR generic_name ILIKE $2)
       ORDER BY commercial_name
       LIMIT 20`,
      [clinicId, `%${query}%`]
    );
    return result.rows;
  }
};

// Therapeutic Class Model
const TherapeuticClassModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM therapeutic_classes WHERE clinic_id = $1 OR clinic_id IS NULL ORDER BY name`,
      [clinicId]
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO therapeutic_classes (clinic_id, name, name_ar, code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.clinic_id, data.name, data.name_ar, data.code]
    );
    return result.rows[0];
  }
};

// Controlled Substance Model
const ControlledSubstanceModel = {
  async findAll() {
    const result = await db.query(`SELECT * FROM medication_controlled_substances ORDER BY name`);
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO medication_controlled_substances (name, code, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.code, data.description]
    );
    return result.rows[0];
  }
};

// Drug Interaction Checker
const InteractionChecker = {
  async checkInteractions(medicationIds) {
    if (!medicationIds || medicationIds.length < 2) return [];
    
    const result = await db.query(
      `SELECT * FROM medication_interactions 
       WHERE medication1_id = ANY($1) OR medication2_id = ANY($1)`,
      [medicationIds]
    );
    return result.rows;
  },

  async addInteraction(data) {
    const result = await db.query(
      `INSERT INTO medication_interactions (medication1_id, medication2_id, severity, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.medication1_id, data.medication2_id, data.severity, data.description]
    );
    return result.rows[0];
  }
};

// Prescription Templates
const PrescriptionTemplateModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM prescription_templates WHERE clinic_id = $1 ORDER BY name`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT pt.*, 
              json_agg(json_build_object('medication_id', ptm.medication_id, 'dosage', ptm.dosage, 'frequency', ptm.frequency, 'duration', ptm.duration)) as medications
       FROM prescription_templates pt
       LEFT JOIN prescription_template_medications ptm ON pt.id = ptm.template_id
       WHERE pt.id = $1
       GROUP BY pt.id`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const templateResult = await client.query(
        `INSERT INTO prescription_templates (clinic_id, name, name_ar, description, diagnosis)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.clinic_id, data.name, data.name_ar, data.description, data.diagnosis]
      );
      const template = templateResult.rows[0];
      
      for (const med of data.medications) {
        await client.query(
          `INSERT INTO prescription_template_medications (template_id, medication_id, dosage, frequency, duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [template.id, med.medication_id, med.dosage, med.frequency, med.duration]
        );
      }
      
      await client.query('COMMIT');
      return template;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = {
  MedicationModel,
  TherapeuticClassModel,
  ControlledSubstanceModel,
  InteractionChecker,
  PrescriptionTemplateModel
};
