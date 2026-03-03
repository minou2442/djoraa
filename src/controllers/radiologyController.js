const { RadiologyExamModel, RadiologyImageModel } = require('../models/radiology');

/**
 * Create a new radiology exam
 * POST /api/radiology/exams
 */
async function createExam(req, res) {
  try {
    const exam = await RadiologyExamModel.create({
      ...req.body,
      clinic_id: req.clinic_id,
      requested_by: req.user.id
    });

    res.status(201).json({ exam });
  } catch (error) {
    console.error('Create radiology exam error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get exams with filters
 * GET /api/radiology/exams
 */
async function getExams(req, res) {
  try {
    const { status, exam_type, priority, date_from, date_to, limit, offset } = req.query;

    const exams = await RadiologyExamModel.getByClinic(req.clinic_id, {
      status,
      exam_type,
      priority,
      date_from,
      date_to,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({ exams });
  } catch (error) {
    console.error('Get radiology exams error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get exam by ID
 * GET /api/radiology/exams/:examId
 */
async function getExam(req, res) {
  try {
    const { examId } = req.params;
    const exam = await RadiologyExamModel.getById(examId);

    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get images
    const images = await RadiologyImageModel.getByExam(examId);

    res.json({ exam, images });
  } catch (error) {
    console.error('Get radiology exam error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get exams by patient
 * GET /api/radiology/patients/:patientId/exams
 */
async function getPatientExams(req, res) {
  try {
    const { patientId } = req.params;
    const { limit, offset } = req.query;

    const exams = await RadiologyExamModel.getByPatient(patientId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({ exams });
  } catch (error) {
    console.error('Get patient radiology exams error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update exam status
 * PUT /api/radiology/exams/:examId/status
 */
async function updateStatus(req, res) {
  try {
    const { examId } = req.params;
    const { status } = req.body;

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const updated = await RadiologyExamModel.updateStatus(examId, status, req.user.id);
    res.json({ exam: updated });
  } catch (error) {
    console.error('Update exam status error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Submit radiology report
 * PUT /api/radiology/exams/:examId/report
 */
async function submitReport(req, res) {
  try {
    const { examId } = req.params;
    const { findings, impression, technique, comparison, recommendation } = req.body;

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const updated = await RadiologyExamModel.updateReport(examId, {
      findings,
      impression,
      technique,
      comparison,
      recommendation
    }, req.user.id);

    res.json({ exam: updated });
  } catch (error) {
    console.error('Submit radiology report error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Cancel exam
 * POST /api/radiology/exams/:examId/cancel
 */
async function cancelExam(req, res) {
  try {
    const { examId } = req.params;
    const { reason } = req.body;

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const updated = await RadiologyExamModel.cancel(examId, reason, req.user.id);
    res.json({ exam: updated });
  } catch (error) {
    console.error('Cancel radiology exam error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Upload image for exam
 * POST /api/radiology/exams/:examId/images
 */
async function uploadImage(req, res) {
  try {
    const { examId } = req.params;
    const { file_name, file_path, file_size, mime_type, image_type, sequence_number } = req.body;

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const image = await RadiologyImageModel.create({
      exam_id: examId,
      file_name,
      file_path,
      file_size,
      mime_type,
      image_type,
      uploaded_by: req.user.id,
      sequence_number
    });

    // Update exam status to 'in_progress' if first image
    const images = await RadiologyImageModel.getByExam(examId);
    if (images.length === 1) {
      await RadiologyExamModel.updateStatus(examId, 'in_progress', req.user.id);
    }

    res.status(201).json({ image });
  } catch (error) {
    console.error('Upload radiology image error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete image
 * DELETE /api/radiology/exams/:examId/images/:imageId
 */
async function deleteImage(req, res) {
  try {
    const { examId, imageId } = req.params;

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await RadiologyImageModel.delete(imageId);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete radiology image error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get exam statistics
 * GET /api/radiology/stats
 */
async function getStats(req, res) {
  try {
    const { date_from, date_to } = req.query;

    const stats = await RadiologyExamModel.getStats(req.clinic_id, date_from, date_to);
    res.json({ stats });
  } catch (error) {
    console.error('Get radiology stats error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Generate PDF report
 * GET /api/radiology/exams/:examId/pdf
 */
async function generatePDF(req, res) {
  try {
    const { examId } = req.params;
    const pdfService = require('../utils/pdfService');

    const exam = await RadiologyExamModel.getById(examId);
    if (!exam || exam.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const images = await RadiologyImageModel.getByExam(examId);

    const template = 'radiology_report';
    const data = {
      ...exam,
      images,
      generatedAt: new Date().toISOString(),
      radiologistName: req.user.username
    };

    const pdfBuffer = await pdfService.generatePDFBuffer(template, data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=radiology_report_${examId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate radiology PDF error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createExam,
  getExams,
  getExam,
  getPatientExams,
  updateStatus,
  submitReport,
  cancelExam,
  uploadImage,
  deleteImage,
  getStats,
  generatePDF
};
