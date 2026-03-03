const PatientModel = require('../models/patient');
const { PatientInsuranceModel, PatientAllergyModel, PatientDiseaseModel, PatientEmergencyContactModel, PatientDocumentModel, PatientVisitModel } = require('../models/patientRelated');
const { PrescriptionModel, LabRequestModel, RadiologyRequestModel, SurgeryModel, VitalModel, ClinicalNoteModel, SignatureModel } = require('../models/emrRelated');
const AuditService = require('../services/auditService');

/**
 * Create a new patient
 * POST /api/patients
 */
async function createPatient(req, res) {
  try {
    const {
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
      notes
    } = req.body;

    // Validate required fields
    if (!national_id || !first_name || !last_name || !date_of_birth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if national ID already exists in clinic
    const existing = await PatientModel.getByNationalId(national_id, req.clinic_id);
    if (existing) {
      return res.status(409).json({ error: 'Patient with this national ID already exists' });
    }

    // Generate patient number if not provided
    const finalPatientNumber = patient_number || await PatientModel.generatePatientNumber(req.clinic_id);

    // Create patient
    const newPatient = await PatientModel.create({
      clinic_id: req.clinic_id,
      patient_number: finalPatientNumber,
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
      created_by: req.user.id,
      notes
    });

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'patient',
      'create',
      null,
      null,
      { patient_id: newPatient.id, ...newPatient },
      req.ip,
      req.clinic_id
    );

    res.status(201).json({
      message: 'Patient created successfully',
      patient: newPatient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Search patients with advanced filters
 * GET /api/patients/search
 */
async function searchPatients(req, res) {
  try {
    const {
      q = null,
      first_name = null,
      last_name = null,
      national_id = null,
      phone = null,
      email = null,
      blood_group = null,
      status = 'active',
      limit = 50,
      offset = 0
    } = req.query;

    // Search patients
    const patients = await PatientModel.search(req.clinic_id, {
      q,
      first_name,
      last_name,
      national_id,
      phone,
      email,
      blood_group,
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    // Count total
    const total = await PatientModel.count(req.clinic_id, { status, q });

    // Log search
    await AuditService.logAction(
      req.user.id,
      'patient',
      'search',
      null,
      null,
      { query: q, filters: { status, blood_group }, result_count: patients.length },
      req.ip,
      req.clinic_id
    );

    res.json({
      total,
      limit,
      offset,
      count: patients.length,
      patients
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all patients
 * GET /api/patients
 */
async function getPatients(req, res) {
  try {
    const { limit = 50, offset = 0, status = 'active' } = req.query;

    const patients = await PatientModel.getByClinic(req.clinic_id, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      status
    });

    const total = await PatientModel.count(req.clinic_id, { status });

    res.json({
      total,
      limit,
      offset,
      patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get specific patient with all related data
 * GET /api/patients/:patientId
 */
async function getPatient(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await PatientModel.getById(patientId);

    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get complete patient profile
    const completePatient = await PatientModel.getComplete(patientId);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'patient',
      'view',
      patientId,
      null,
      { patient_number: patient.patient_number },
      req.ip,
      req.clinic_id
    );

    res.json(completePatient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update patient
 * PUT /api/patients/:patientId
 */
async function updatePatient(req, res) {
  try {
    const { patientId } = req.params;
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
    } = req.body;

    // Get existing patient
    const existingPatient = await PatientModel.getById(patientId);
    if (!existingPatient || existingPatient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update patient
    const updatedPatient = await PatientModel.update(patientId, {
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
    }, req.user.id);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'patient',
      'update',
      patientId,
      existingPatient,
      updatedPatient,
      req.ip,
      req.clinic_id
    );

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Archive patient (soft delete)
 * DELETE /api/patients/:patientId
 */
async function archivePatient(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientModel.archive(patientId, req.user.id);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'patient',
      'archive',
      patientId,
      patient,
      null,
      req.ip,
      req.clinic_id
    );

    res.json({ message: 'Patient archived successfully' });
  } catch (error) {
    console.error('Archive patient error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ INSURANCE ENDPOINTS ============

/**
 * Add insurance to patient
 * POST /api/patients/:patientId/insurance
 */
async function addInsurance(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const insurance = await PatientInsuranceModel.create({
      patient_id: patientId,
      ...req.body
    });

    res.status(201).json({ insurance });
  } catch (error) {
    console.error('Add insurance error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient insurance records
 * GET /api/patients/:patientId/insurance
 */
async function getInsurance(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const insurance = await PatientInsuranceModel.getByPatientId(patientId);
    res.json({ insurance });
  } catch (error) {
    console.error('Get insurance error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update insurance record
 * PUT /api/patients/:patientId/insurance/:insuranceId
 */
async function updateInsurance(req, res) {
  try {
    const { patientId, insuranceId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const insurance = await PatientInsuranceModel.update(insuranceId, req.body);
    res.json({ insurance });
  } catch (error) {
    console.error('Update insurance error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ ALLERGY ENDPOINTS ============

/**
 * Add allergy to patient
 * POST /api/patients/:patientId/allergies
 */
async function addAllergy(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const allergy = await PatientAllergyModel.create({
      patient_id: patientId,
      ...req.body
    });

    res.status(201).json({ allergy });
  } catch (error) {
    console.error('Add allergy error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient allergies
 * GET /api/patients/:patientId/allergies
 */
async function getAllergies(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const allergies = await PatientAllergyModel.getByPatientId(patientId);
    res.json({ allergies });
  } catch (error) {
    console.error('Get allergies error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update allergy
 * PUT /api/patients/:patientId/allergies/:allergyId
 */
async function updateAllergy(req, res) {
  try {
    const { patientId, allergyId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const allergy = await PatientAllergyModel.update(allergyId, req.body);
    res.json({ allergy });
  } catch (error) {
    console.error('Update allergy error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete allergy
 * DELETE /api/patients/:patientId/allergies/:allergyId
 */
async function deleteAllergy(req, res) {
  try {
    const { patientId, allergyId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientAllergyModel.delete(allergyId);
    res.json({ message: 'Allergy deleted' });
  } catch (error) {
    console.error('Delete allergy error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ DISEASE ENDPOINTS ============

/**
 * Add chronic disease to patient
 * POST /api/patients/:patientId/diseases
 */
async function addDisease(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const disease = await PatientDiseaseModel.create({
      patient_id: patientId,
      ...req.body
    });

    res.status(201).json({ disease });
  } catch (error) {
    console.error('Add disease error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient diseases
 * GET /api/patients/:patientId/diseases
 */
async function getDiseases(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const diseases = await PatientDiseaseModel.getByPatientId(patientId);
    res.json({ diseases });
  } catch (error) {
    console.error('Get diseases error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update disease
 * PUT /api/patients/:patientId/diseases/:diseaseId
 */
async function updateDisease(req, res) {
  try {
    const { patientId, diseaseId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const disease = await PatientDiseaseModel.update(diseaseId, req.body);
    res.json({ disease });
  } catch (error) {
    console.error('Update disease error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete disease
 * DELETE /api/patients/:patientId/diseases/:diseaseId
 */
async function deleteDisease(req, res) {
  try {
    const { patientId, diseaseId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientDiseaseModel.delete(diseaseId);
    res.json({ message: 'Disease deleted' });
  } catch (error) {
    console.error('Delete disease error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ EMERGENCY CONTACT ENDPOINTS ============

/**
 * Add emergency contact to patient
 * POST /api/patients/:patientId/emergency-contacts
 */
async function addEmergencyContact(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const contact = await PatientEmergencyContactModel.create({
      patient_id: patientId,
      ...req.body
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient emergency contacts
 * GET /api/patients/:patientId/emergency-contacts
 */
async function getEmergencyContacts(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const contacts = await PatientEmergencyContactModel.getByPatientId(patientId);
    res.json({ contacts });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update emergency contact
 * PUT /api/patients/:patientId/emergency-contacts/:contactId
 */
async function updateEmergencyContact(req, res) {
  try {
    const { patientId, contactId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const contact = await PatientEmergencyContactModel.update(contactId, req.body);
    res.json({ contact });
  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete emergency contact
 * DELETE /api/patients/:patientId/emergency-contacts/:contactId
 */
async function deleteEmergencyContact(req, res) {
  try {
    const { patientId, contactId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientEmergencyContactModel.delete(contactId);
    res.json({ message: 'Emergency contact deleted' });
  } catch (error) {
    console.error('Delete emergency contact error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ DOCUMENT ENDPOINTS ============

/**
 * Upload patient document
 * POST /api/patients/:patientId/documents
 */
async function uploadDocument(req, res) {
  try {
    const { patientId } = req.params;
    const { document_type, document_date, expiry_date, notes } = req.body;

    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await PatientDocumentModel.create({
      patient_id: patientId,
      document_type,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user.id,
      document_date,
      expiry_date,
      notes
    });

    res.status(201).json({ document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient documents
 * GET /api/patients/:patientId/documents
 */
async function getDocuments(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const documents = await PatientDocumentModel.getByPatientId(patientId);
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete patient document
 * DELETE /api/patients/:patientId/documents/:documentId
 */
async function deleteDocument(req, res) {
  try {
    const { patientId, documentId } = req.params;
    const patient = await PatientModel.getById(patientId);
    if (!patient || patient.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientDocumentModel.delete(documentId);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ---------- EMR Endpoint implementations ----------

async function addPrescription(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const prescription = await PrescriptionModel.create(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'prescription', null, prescription);
    res.status(201).json({ prescription });
  } catch (err) {
    console.error('addPrescription error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getPrescriptions(req, res) {
  const { patientId } = req.params;
  try {
    const list = await PrescriptionModel.getByPatient(patientId);
    res.json({ prescriptions: list });
  } catch (err) {
    console.error('getPrescriptions error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updatePrescription(req, res) {
  const { id, patientId } = req.params;
  const userId = req.user.id;
  try {
    const updated = await PrescriptionModel.update(id, req.body, userId);
    await AuditService.logAction(userId, patientId, 'update', 'prescription', null, updated);
    res.json({ prescription: updated });
  } catch (err) {
    console.error('updatePrescription error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deactivatePrescription(req, res) {
  const { id, patientId } = req.params;
  const userId = req.user.id;
  try {
    const deact = await PrescriptionModel.deactivate(id, userId);
    await AuditService.logAction(userId, patientId, 'delete', 'prescription', null, deact);
    res.json({ prescription: deact });
  } catch (err) {
    console.error('deactivatePrescription error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addLabRequest(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const lab = await LabRequestModel.create(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'lab_request', null, lab);
    res.status(201).json({ labRequest: lab });
  } catch (err) {
    console.error('addLabRequest error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getLabRequests(req, res) {
  const { patientId } = req.params;
  try {
    const list = await LabRequestModel.getByPatient(patientId);
    res.json({ labRequests: list });
  } catch (err) {
    console.error('getLabRequests error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateLabStatus(req, res) {
  const { id, patientId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  try {
    const updated = await LabRequestModel.updateStatus(id, status, userId);
    await AuditService.logAction(userId, patientId, 'update', 'lab_request', null, updated);
    res.json({ labRequest: updated });
  } catch (err) {
    console.error('updateLabStatus error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addLabResults(req, res) {
  const { id, patientId } = req.params;
  const { results, result_date } = req.body;
  const userId = req.user.id;
  try {
    const updated = await LabRequestModel.addResults(id, results, result_date, userId);
    await AuditService.logAction(userId, patientId, 'update', 'lab_request', null, updated);
    res.json({ labRequest: updated });
  } catch (err) {
    console.error('addLabResults error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addRadiologyRequest(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const rad = await RadiologyRequestModel.create(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'radiology_request', null, rad);
    res.status(201).json({ radiologyRequest: rad });
  } catch (err) {
    console.error('addRadiologyRequest error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getRadiologyRequests(req, res) {
  const { patientId } = req.params;
  try {
    const list = await RadiologyRequestModel.getByPatient(patientId);
    res.json({ radiologyRequests: list });
  } catch (err) {
    console.error('getRadiologyRequests error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateRadiologyStatus(req, res) {
  const { id, patientId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  try {
    const updated = await RadiologyRequestModel.updateStatus(id, status, userId);
    await AuditService.logAction(userId, patientId, 'update', 'radiology_request', null, updated);
    res.json({ radiologyRequest: updated });
  } catch (err) {
    console.error('updateRadiologyStatus error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addRadiologyReport(req, res) {
  const { id, patientId } = req.params;
  const { report, report_date } = req.body;
  const userId = req.user.id;
  try {
    const updated = await RadiologyRequestModel.addReport(id, report, report_date, userId);
    await AuditService.logAction(userId, patientId, 'update', 'radiology_request', null, updated);
    res.json({ radiologyRequest: updated });
  } catch (err) {
    console.error('addRadiologyReport error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addSurgery(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const surg = await SurgeryModel.create(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'surgery', null, surg);
    res.status(201).json({ surgery: surg });
  } catch (err) {
    console.error('addSurgery error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getSurgeries(req, res) {
  const { patientId } = req.params;
  try {
    const list = await SurgeryModel.getByPatient(patientId);
    res.json({ surgeries: list });
  } catch (err) {
    console.error('getSurgeries error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function recordVitals(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const vit = await VitalModel.record(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'vital', null, vit);
    res.status(201).json({ vital: vit });
  } catch (err) {
    console.error('recordVitals error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getVitals(req, res) {
  const { patientId } = req.params;
  try {
    const list = await VitalModel.getByPatient(patientId);
    res.json({ vitals: list });
  } catch (err) {
    console.error('getVitals error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addClinicalNote(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  try {
    const note = await ClinicalNoteModel.create(patientId, req.body, userId);
    await AuditService.logAction(userId, patientId, 'create', 'clinical_note', null, note);
    res.status(201).json({ note });
  } catch (err) {
    console.error('addClinicalNote error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getClinicalNotes(req, res) {
  const { patientId } = req.params;
  try {
    const list = await ClinicalNoteModel.getByPatient(patientId);
    res.json({ notes: list });
  } catch (err) {
    console.error('getClinicalNotes error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addSignature(req, res) {
  const { patientId } = req.params;
  const userId = req.user.id;
  const { action, signature_data } = req.body;
  try {
    const sig = await SignatureModel.sign(patientId, userId, action, signature_data);
    await AuditService.logAction(userId, patientId, 'create', 'signature', null, sig);
    res.status(201).json({ signature: sig });
  } catch (err) {
    console.error('addSignature error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getSignatures(req, res) {
  const { patientId } = req.params;
  try {
    const list = await SignatureModel.getByPatient(patientId);
    res.json({ signatures: list });
  } catch (err) {
    console.error('getSignatures error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  createPatient,
  searchPatients,
  getPatients,
  getPatient,
  updatePatient,
  archivePatient,
  addInsurance,
  getInsurance,
  updateInsurance,
  addAllergy,
  getAllergies,
  updateAllergy,
  deleteAllergy,
  addDisease,
  getDiseases,
  updateDisease,
  deleteDisease,
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  uploadDocument,
  getDocuments,
  deleteDocument,
  addPrescription,
  getPrescriptions,
  updatePrescription,
  deactivatePrescription,
  addLabRequest,
  getLabRequests,
  updateLabStatus,
  addLabResults,
  addRadiologyRequest,
  getRadiologyRequests,
  updateRadiologyStatus,
  addRadiologyReport,
  addSurgery,
  getSurgeries,
  recordVitals,
  getVitals,
  addClinicalNote,
  getClinicalNotes,
  addSignature,
  getSignatures
};
