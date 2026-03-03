const express = require('express');
const router = express.Router();
const medicationsController = require('../controllers/medicationsController');
const { requireRole } = require('../middleware/roles');

// Medications
router.get('/medications', medicationsController.getMedications);
router.get('/medications/search', medicationsController.searchMedications);
router.get('/medications/:id', medicationsController.getMedication);
router.post('/medications', requireRole('admin', 'doctor'), medicationsController.createMedication);
router.put('/medications/:id', requireRole('admin', 'doctor'), medicationsController.updateMedication);
router.delete('/medications/:id', requireRole('admin'), medicationsController.archiveMedication);
router.post('/import', requireRole('admin'), medicationsController.importMedications);

// Therapeutic Classes
router.get('/classes', medicationsController.getTherapeuticClasses);
router.post('/classes', requireRole('admin'), medicationsController.createTherapeuticClass);

// Controlled Substances
router.get('/controlled', medicationsController.getControlledSubstances);
router.post('/controlled', requireRole('admin'), medicationsController.createControlledSubstance);

// Drug Interactions
router.post('/interactions/check', medicationsController.checkInteractions);
router.post('/interactions', requireRole('admin'), medicationsController.addInteraction);

// Prescription Templates
router.get('/templates', medicationsController.getPrescriptionTemplates);
router.get('/templates/:id', medicationsController.getPrescriptionTemplate);
router.post('/templates', requireRole('admin', 'doctor'), medicationsController.createPrescriptionTemplate);

module.exports = router;
