const clinicModel = require('../models/clinic');

async function createClinic(req, res) {
  try {
    const { name, address, phone, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Clinic name is required' });
    }
    
    const clinic = await clinicModel.createClinic({ name, address, phone, email });
    res.status(201).json(clinic);
  } catch (err) {
    console.error('Create clinic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getClinic(req, res) {
  try {
    const { clinicId } = req.params;
    const clinic = await clinicModel.getClinicById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    // Get stats
    const stats = await clinicModel.getClinicStats(clinicId);
    
    res.json({ ...clinic, stats });
  } catch (err) {
    console.error('Get clinic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listClinics(req, res) {
  try {
    const { active } = req.query;
    
    let clinics;
    if (active === 'true') {
      clinics = await clinicModel.getActiveClinics();
    } else {
      clinics = await clinicModel.getAllClinics();
    }
    
    res.json(clinics);
  } catch (err) {
    console.error('List clinics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateClinic(req, res) {
  try {
    const { clinicId } = req.params;
    const { name, address, phone, email, active } = req.body;
    
    const clinic = await clinicModel.updateClinic(clinicId, { 
      name, address, phone, email, active 
    });
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json(clinic);
  } catch (err) {
    console.error('Update clinic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteClinic(req, res) {
  try {
    const { clinicId } = req.params;
    
    const result = await clinicModel.deleteClinic(clinicId);
    
    if (!result.clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json({ 
      message: result.softDeleted 
        ? 'Clinic deactivated (has existing users)' 
        : 'Clinic deleted',
      clinic: result.clinic
    });
  } catch (err) {
    console.error('Delete clinic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getClinicStats(req, res) {
  try {
    const { clinicId } = req.params;
    
    // Only allow superadmin or clinic_admin of that clinic
    if (req.user.role !== 'superadmin' && req.user.clinic_id !== parseInt(clinicId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = await clinicModel.getClinicStats(clinicId);
    res.json(stats);
  } catch (err) {
    console.error('Get clinic stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createClinic,
  getClinic,
  listClinics,
  updateClinic,
  deleteClinic,
  getClinicStats
};
