const { LabTestTypeModel, LabRequestModel, LabSampleModel, LabResultModel, LabValidationModel } = require('../models/laboratory');

// ========== TEST TYPES ==========

/**
 * Create test type
 * POST /api/lab/test-types
 */
async function createTestType(req, res) {
  try {
    const testType = await LabTestTypeModel.create({
      ...req.body,
      clinic_id: req.clinic_id
    });
    res.status(201).json({ testType });
  } catch (error) {
    console.error('Create test type error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get test types
 * GET /api/lab/test-types
 */
async function getTestTypes(req, res) {
  try {
    const { category, active } = req.query;
    let testTypes;
    
    if (category) {
      testTypes = await LabTestTypeModel.getByCategory(req.clinic_id, category);
    } else {
      testTypes = await LabTestTypeModel.getByClinic(req.clinic_id, active !== 'false');
    }
    
    res.json({ testTypes });
  } catch (error) {
    console.error('Get test types error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== LAB REQUESTS ==========

/**
 * Create lab request
 * POST /api/lab/requests
 */
async function createRequest(req, res) {
  try {
    const { patient_id, visit_id, tests, priority, clinical_diagnosis, notes } = req.body;
    
    if (!patient_id || !tests || tests.length === 0) {
      return res.status(400).json({ error: 'Patient ID and at least one test are required' });
    }
    
    const request = await LabRequestModel.create({
      clinic_id: req.clinic_id,
      patient_id,
      visit_id,
      tests,
      priority,
      clinical_diagnosis,
      notes,
      requested_by: req.user.id
    });
    
    res.status(201).json({ request });
  } catch (error) {
    console.error('Create lab request error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get lab requests
 * GET /api/lab/requests
 */
async function getRequests(req, res) {
  try {
    const { status, priority, date_from, date_to, limit, offset } = req.query;
    
    const requests = await LabRequestModel.getByClinic(req.clinic_id, {
      status,
      priority,
      date_from,
      date_to,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    
    res.json({ requests });
  } catch (error) {
    console.error('Get lab requests error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get lab request by ID
 * GET /api/lab/requests/:requestId
 */
async function getRequest(req, res) {
  try {
    const { requestId } = req.params;
    const request = await LabRequestModel.getById(requestId);
    
    if (!request || request.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Get samples
    const samples = await LabSampleModel.getByRequest(requestId);
    
    // Get results for each sample
    for (const sample of samples) {
      sample.results = await LabResultModel.getBySample(sample.id);
    }
    
    res.json({ request, samples });
  } catch (error) {
    console.error('Get lab request error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get patient lab requests
 * GET /api/lab/patients/:patientId/requests
 */
async function getPatientRequests(req, res) {
  try {
    const { patientId } = req.params;
    const requests = await LabRequestModel.getByPatient(patientId);
    res.json({ requests });
  } catch (error) {
    console.error('Get patient lab requests error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== SAMPLES ==========

/**
 * Register sample
 * POST /api/lab/requests/:requestId/samples
 */
async function registerSample(req, res) {
  try {
    const { requestId } = req.params;
    const { sample_type, barcode, collected_at } = req.body;
    
    const request = await LabRequestModel.getById(requestId);
    if (!request || request.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const sample = await LabSampleModel.register({
      request_id: requestId,
      sample_type,
      barcode,
      collected_by: req.user.id,
      collected_at
    });
    
    res.status(201).json({ sample });
  } catch (error) {
    console.error('Register sample error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get samples by request
 * GET /api/lab/requests/:requestId/samples
 */
async function getSamples(req, res) {
  try {
    const { requestId } = req.params;
    const samples = await LabSampleModel.getByRequest(requestId);
    
    // Get results for each sample
    for (const sample of samples) {
      sample.results = await LabResultModel.getBySample(sample.id);
    }
    
    res.json({ samples });
  } catch (error) {
    console.error('Get samples error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== RESULTS ==========

/**
 * Add result
 * POST /api/lab/samples/:sampleId/results
 */
async function addResult(req, res) {
  try {
    const { sampleId } = req.params;
    const { test_type_id, value, result_text } = req.body;
    
    if (!test_type_id || !value) {
      return res.status(400).json({ error: 'Test type and value are required' });
    }
    
    const result = await LabResultModel.addResult({
      sample_id: sampleId,
      test_type_id,
      value,
      result_text,
      entered_by: req.user.id
    });
    
    res.status(201).json({ result });
  } catch (error) {
    console.error('Add result error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get results by sample
 * GET /api/lab/samples/:sampleId/results
 */
async function getResults(req, res) {
  try {
    const { sampleId } = req.params;
    const results = await LabResultModel.getBySample(sampleId);
    res.json({ results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Validate result
 * POST /api/lab/results/:resultId/validate
 */
async function validateResult(req, res) {
  try {
    const { resultId } = req.params;
    const { signature } = req.body;
    
    const result = await LabResultModel.validate(resultId, req.user.id, signature);
    res.json({ result });
  } catch (error) {
    console.error('Validate result error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== VALIDATION ==========

/**
 * Validate request (supervisor approval)
 * POST /api/lab/requests/:requestId/validate
 */
async function validateRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { notes, signature } = req.body;
    
    const request = await LabRequestModel.getById(requestId);
    if (!request || request.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const validated = await LabValidationModel.validateRequest(requestId, req.user.id, notes, signature);
    res.json({ request: validated });
  } catch (error) {
    console.error('Validate request error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reject request
 * POST /api/lab/requests/:requestId/reject
 */
async function rejectRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    const rejected = await LabValidationModel.rejectRequest(requestId, req.user.id, reason);
    res.json({ request: rejected });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ========== STATISTICS ==========

/**
 * Get statistics
 * GET /api/lab/stats
 */
async function getStats(req, res) {
  try {
    const { date_from, date_to } = req.query;
    const stats = await LabRequestModel.getStats(req.clinic_id, date_from, date_to);
    res.json({ stats });
  } catch (error) {
    console.error('Get lab stats error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Generate PDF report
 * GET /api/lab/requests/:requestId/pdf
 */
async function generatePDF(req, res) {
  try {
    const { requestId } = req.params;
    const pdfService = require('../utils/pdfService');
    
    const request = await LabRequestModel.getById(requestId);
    if (!request || request.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const samples = await LabSampleModel.getByRequest(requestId);
    for (const sample of samples) {
      sample.results = await LabResultModel.getBySample(sample.id);
    }
    
    const template = 'lab_report';
    const data = {
      ...request,
      samples,
      generatedAt: new Date().toISOString()
    };
    
    const pdfBuffer = await pdfService.generatePDFBuffer(template, data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lab_report_${requestId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate lab PDF error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createTestType,
  getTestTypes,
  createRequest,
  getRequests,
  getRequest,
  getPatientRequests,
  registerSample,
  getSamples,
  addResult,
  getResults,
  validateResult,
  validateRequest,
  rejectRequest,
  getStats,
  generatePDF
};
