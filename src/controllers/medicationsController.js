const {
  MedicationModel,
  TherapeuticClassModel,
  ControlledSubstanceModel,
  InteractionChecker,
  PrescriptionTemplateModel
} = require('../models/medications');
const { logAction } = require('../utils/auditService');

// Medications
const getMedications = async (req, res) => {
  try {
    const medications = await MedicationModel.findAll(req.clinicId, req.query);
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
};

const getMedication = async (req, res) => {
  try {
    const medication = await MedicationModel.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    res.json(medication);
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
};

const createMedication = async (req, res) => {
  try {
    const medication = await MedicationModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'medication', medication.id, medication);
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
};

const updateMedication = async (req, res) => {
  try {
    const medication = await MedicationModel.update(req.params.id, req.body);
    await logAction(req, 'UPDATE', 'medication', medication.id, medication);
    res.json(medication);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
};

const archiveMedication = async (req, res) => {
  try {
    const medication = await MedicationModel.archive(req.params.id);
    await logAction(req, 'UPDATE', 'medication', medication.id, { archived: true });
    res.json(medication);
  } catch (error) {
    console.error('Error archiving medication:', error);
    res.status(500).json({ error: 'Failed to archive medication' });
  }
};

const searchMedications = async (req, res) => {
  try {
    const { q } = req.query;
    const medications = await MedicationModel.search(req.clinicId, q);
    res.json(medications);
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({ error: 'Failed to search medications' });
  }
};

// Therapeutic Classes
const getTherapeuticClasses = async (req, res) => {
  try {
    const classes = await TherapeuticClassModel.findAll(req.clinicId);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch therapeutic classes' });
  }
};

const createTherapeuticClass = async (req, res) => {
  try {
    const classe = await TherapeuticClassModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    res.status(201).json(classe);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create therapeutic class' });
  }
};

// Controlled Substances
const getControlledSubstances = async (req, res) => {
  try {
    const substances = await ControlledSubstanceModel.findAll();
    res.json(substances);
  } catch (error) {
    console.error('Error fetching substances:', error);
    res.status(500).json({ error: 'Failed to fetch controlled substances' });
  }
};

const createControlledSubstance = async (req, res) => {
  try {
    const substance = await ControlledSubstanceModel.create(req.body);
    res.status(201).json(substance);
  } catch (error) {
    console.error('Error creating substance:', error);
    res.status(500).json({ error: 'Failed to create controlled substance' });
  }
};

// Drug Interactions
const checkInteractions = async (req, res) => {
  try {
    const { medication_ids } = req.body;
    const interactions = await InteractionChecker.checkInteractions(medication_ids);
    res.json(interactions);
  } catch (error) {
    console.error('Error checking interactions:', error);
    res.status(500).json({ error: 'Failed to check interactions' });
  }
};

const addInteraction = async (req, res) => {
  try {
    const interaction = await InteractionChecker.addInteraction(req.body);
    await logAction(req, 'CREATE', 'drug_interaction', interaction.id, interaction);
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({ error: 'Failed to add interaction' });
  }
};

// Prescription Templates
const getPrescriptionTemplates = async (req, res) => {
  try {
    const templates = await PrescriptionTemplateModel.findAll(req.clinicId);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

const getPrescriptionTemplate = async (req, res) => {
  try {
    const template = await PrescriptionTemplateModel.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

const createPrescriptionTemplate = async (req, res) => {
  try {
    const template = await PrescriptionTemplateModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'prescription_template', template.id, template);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Import medications via CSV
const importMedications = async (req, res) => {
  try {
    const { medications } = req.body;
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const med of medications) {
      try {
        await MedicationModel.create({
          ...med,
          clinic_id: req.clinicId
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ medication: med.commercial_name, error: err.message });
      }
    }
    
    await logAction(req, 'BULK_CREATE', 'medications', null, { imported: results.success, failed: results.failed });
    res.json(results);
  } catch (error) {
    console.error('Error importing medications:', error);
    res.status(500).json({ error: 'Failed to import medications' });
  }
};

module.exports = {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  archiveMedication,
  searchMedications,
  getTherapeuticClasses,
  createTherapeuticClass,
  getControlledSubstances,
  createControlledSubstance,
  checkInteractions,
  addInteraction,
  getPrescriptionTemplates,
  getPrescriptionTemplate,
  createPrescriptionTemplate,
  importMedications
};
