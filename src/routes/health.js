const express = require('express');
const router = express.Router();
const healthService = require('../utils/healthService');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

/**
 * GET /api/health
 * Public health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthService.getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'warning' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to perform health check',
      error: error.message 
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check (requires authentication)
 */
router.get('/detailed', verifyToken, async (req, res) => {
  try {
    const health = await healthService.getSystemHealth();
    
    // Add clinic-specific health if user belongs to a clinic
    if (req.user.clinic_id) {
      health.clinic = await healthService.getClinicHealth(req.user.clinic_id);
    }
    
    res.json(health);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to perform detailed health check',
      error: error.message 
    });
  }
});

/**
 * GET /api/health/database
 * Database-specific health check
 */
router.get('/database', verifyToken, async (req, res) => {
  try {
    const dbHealth = await healthService.checkDatabase();
    res.json(dbHealth);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check database health',
      error: error.message 
    });
  }
});

/**
 * GET /api/health/clinic/:clinicId
 * Clinic-specific health (requires superadmin or clinic_admin)
 */
router.get('/clinic/:clinicId', verifyToken, requireRole('superadmin', 'clinic_admin'), async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Only superadmin can view other clinics
    if (req.user.role !== 'superadmin' && req.user.clinic_id !== parseInt(clinicId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const clinicHealth = await healthService.getClinicHealth(clinicId);
    res.json(clinicHealth);
  } catch (error) {
    console.error('Clinic health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check clinic health',
      error: error.message 
    });
  }
});

module.exports = router;
