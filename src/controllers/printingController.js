const PrintModel = require('../models/printing');
const { generatePDF } = require('../utils/pdfService');
const { logAction } = require('../utils/auditService');

// Get available print templates
const getTemplates = async (req, res) => {
  try {
    const templates = await PrintModel.findTemplates(req.clinicId);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Generate and print patient list
const printPatientList = async (req, res) => {
  try {
    const { date_from, date_to, include_inactive } = req.query;
    const data = await PrintModel.generatePatientList(req.clinicId, {
      date_from,
      date_to,
      include_include_inactive: include_inactive === 'true'
    });

    const pdfBuffer = await generatePDF('patient_list', data);
    await logAction(req, 'PRINT', 'patient_list', null, { date_from, date_to });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=patient_list.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing patient list:', error);
    res.status(500).json({ error: 'Failed to generate patient list' });
  }
};

// Generate and print full medical file
const printMedicalFile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const data = await PrintModel.generateMedicalFile(req.clinicId, patientId);

    if (!data) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const pdfBuffer = await generatePDF('medical_file', data);
    await logAction(req, 'PRINT', 'medical_file', patientId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=medical_file_${patientId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing medical file:', error);
    res.status(500).json({ error: 'Failed to generate medical file' });
  }
};

// Generate and print consultation report
const printConsultation = async (req, res) => {
  try {
    const { visitId } = req.params;
    const data = await PrintModel.generateConsultationReport(req.clinicId, visitId);

    if (!data) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const pdfBuffer = await generatePDF('consultation', data);
    await logAction(req, 'PRINT', 'consultation', visitId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=consultation_${visitId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing consultation:', error);
    res.status(500).json({ error: 'Failed to generate consultation report' });
  }
};

// Generate and print prescription (Ordonnance)
const printPrescription = async (req, res) => {
  try {
    const { visitId } = req.params;
    const data = await PrintModel.generatePrescription(req.clinicId, visitId);

    if (!data) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const pdfBuffer = await generatePDF('prescription', data);
    await logAction(req, 'PRINT', 'prescription', visitId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ordonnance_${visitId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing prescription:', error);
    res.status(500).json({ error: 'Failed to generate prescription' });
  }
};

// Generate and print radiology report
const printRadiologyReport = async (req, res) => {
  try {
    const { radiologyId } = req.params;
    const data = await PrintModel.generateRadiologyReport(req.clinicId, radiologyId);

    if (!data) {
      return res.status(404).json({ error: 'Radiology report not found' });
    }

    const pdfBuffer = await generatePDF('radiology', data);
    await logAction(req, 'PRINT', 'radiology', radiologyId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=radiology_${radiologyId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing radiology report:', error);
    res.status(500).json({ error: 'Failed to generate radiology report' });
  }
};

// Generate and print laboratory report
const printLabReport = async (req, res) => {
  try {
    const { labId } = req.params;
    const data = await PrintModel.generateLabReport(req.clinicId, labId);

    if (!data) {
      return res.status(404).json({ error: 'Laboratory report not found' });
    }

    const pdfBuffer = await generatePDF('laboratory', data);
    await logAction(req, 'PRINT', 'laboratory', labId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lab_${labId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing lab report:', error);
    res.status(500).json({ error: 'Failed to generate laboratory report' });
  }
};

// Generate and print invoice
const printInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const data = await PrintModel.generateInvoice(req.clinicId, invoiceId);

    if (!data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = await generatePDF('invoice', data);
    await logAction(req, 'PRINT', 'invoice', invoiceId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};

// Generate and print receipt
const printReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const data = await PrintModel.generateReceipt(req.clinicId, paymentId);

    if (!data) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const pdfBuffer = await generatePDF('receipt', data);
    await logAction(req, 'PRINT', 'receipt', paymentId, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${paymentId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
};

// Generate and print statistical report
const printStatisticalReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await PrintModel.generateStatisticalReport(req.clinicId, {
      date_from,
      date_to
    });

    const pdfBuffer = await generatePDF('statistical', data);
    await logAction(req, 'PRINT', 'statistical_report', null, { date_from, date_to });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=statistical_report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing statistical report:', error);
    res.status(500).json({ error: 'Failed to generate statistical report' });
  }
};

// Get QR verification data
const getQRData = async (req, res) => {
  try {
    const { docType, docId } = req.params;
    const qrData = await PrintModel.generateQRData(req.clinicId, docType, docId);
    res.json({ qr_data: qrData });
  } catch (error) {
    console.error('Error generating QR data:', error);
    res.status(500).json({ error: 'Failed to generate QR data' });
  }
};

module.exports = {
  getTemplates,
  printPatientList,
  printMedicalFile,
  printConsultation,
  printPrescription,
  printRadiologyReport,
  printLabReport,
  printInvoice,
  printReceipt,
  printStatisticalReport,
  getQRData
};
