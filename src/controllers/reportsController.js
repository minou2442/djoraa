const {
  MedicalReportsModel,
  FinancialReportsModel,
  ExportModel
} = require('../models/reports');
const db = require('../utils/db');

// Medical Reports
const getDiseaseFrequency = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await MedicalReportsModel.getDiseaseFrequency(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching disease frequency:', error);
    res.status(500).json({ error: 'Failed to fetch disease frequency' });
  }
};

const getLabVolume = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await MedicalReportsModel.getLabVolume(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching lab volume:', error);
    res.status(500).json({ error: 'Failed to fetch lab volume' });
  }
};

const getRadiologyVolume = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await MedicalReportsModel.getRadiologyVolume(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching radiology volume:', error);
    res.status(500).json({ error: 'Failed to fetch radiology volume' });
  }
};

const getPatientDemographics = async (req, res) => {
  try {
    const data = await MedicalReportsModel.getPatientDemographics(req.clinicId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
};

const getAppointmentStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await MedicalReportsModel.getAppointmentStats(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Failed to fetch appointment stats' });
  }
};

// Financial Reports
const getDailyRevenue = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await FinancialReportsModel.getDailyRevenue(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    res.status(500).json({ error: 'Failed to fetch daily revenue' });
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const data = await FinancialReportsModel.getMonthlyRevenue(req.clinicId, year);
    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
};

const getDoctorProductivity = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await FinancialReportsModel.getDoctorProductivity(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching doctor productivity:', error);
    res.status(500).json({ error: 'Failed to fetch doctor productivity' });
  }
};

const getInsuranceClaimsReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await FinancialReportsModel.getInsuranceClaimsReport(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claims' });
  }
};

const getRevenueByService = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await FinancialReportsModel.getRevenueByService(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue by service:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by service' });
  }
};

const getOutstandingInvoices = async (req, res) => {
  try {
    const data = await FinancialReportsModel.getOutstandingInvoices(req.clinicId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching outstanding invoices:', error);
    res.status(500).json({ error: 'Failed to fetch outstanding invoices' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await FinancialReportsModel.getExpenseSummary(req.clinicId, date_from, date_to);
    res.json(data);
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

// Export Functions
const exportPatients = async (req, res) => {
  try {
    const data = await ExportModel.getFullPatientExport(req.clinicId);
    
    // Convert to CSV
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
      res.send(csv);
    } else {
      res.json({ message: 'No data to export' });
    }
  } catch (error) {
    console.error('Error exporting patients:', error);
    res.status(500).json({ error: 'Failed to export patients' });
  }
};

const exportInvoices = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await ExportModel.getFullInvoiceExport(req.clinicId, date_from, date_to);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
      res.send(csv);
    } else {
      res.json({ message: 'No data to export' });
    }
  } catch (error) {
    console.error('Error exporting invoices:', error);
    res.status(500).json({ error: 'Failed to export invoices' });
  }
};

const exportPayments = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await ExportModel.getFullPaymentExport(req.clinicId, date_from, date_to);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      res.send(csv);
    } else {
      res.json({ message: 'No data to export' });
    }
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ error: 'Failed to export payments' });
  }
};

// PDF Export (simplified - would need pdfkit or similar for full implementation)
const exportPDF = async (req, res) => {
  try {
    const { report_type, date_from, date_to, format } = req.query;
    
    // For now, return JSON data that can be rendered as PDF on frontend
    let data;
    switch (report_type) {
      case 'disease_frequency':
        data = await MedicalReportsModel.getDiseaseFrequency(req.clinicId, date_from, date_to);
        break;
      case 'revenue':
        data = await FinancialReportsModel.getDailyRevenue(req.clinicId, date_from, date_to);
        break;
      case 'productivity':
        data = await FinancialReportsModel.getDoctorProductivity(req.clinicId, date_from, date_to);
        break;
      default:
        data = { error: 'Unknown report type' };
    }
    
    res.json({ 
      report_type, 
      date_from, 
      date_to, 
      data,
      note: 'PDF generation would be implemented with pdfkit or similar library'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    
    // Today's stats
    const todayAppointments = await db.query(
      `SELECT COUNT(*) as count FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
      [req.clinicId, today]
    );
    
    const todayPatients = await db.query(
      `SELECT COUNT(*) as count FROM patient_visits WHERE clinic_id = $1 AND DATE(visit_date) = $2`,
      [req.clinicId, today]
    );
    
    const todayRevenue = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE clinic_id = $1 AND DATE(payment_date) = $2`,
      [req.clinicId, today]
    );
    
    // Month stats
    const monthPatients = await db.query(
      `SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1 AND created_at >= $2`,
      [req.clinicId, firstDayOfMonth.toISOString()]
    );
    
    const monthRevenue = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE clinic_id = $1 AND payment_date >= $2`,
      [req.clinicId, firstDayOfMonth.toISOString()]
    );
    
    // Pending items
    const pendingLabs = await db.query(
      `SELECT COUNT(*) as count FROM lab_requests WHERE clinic_id = $1 AND status = 'pending'`,
      [req.clinicId]
    );
    
    const pendingRadiology = await db.query(
      `SELECT COUNT(*) as count FROM radiology_exams WHERE clinic_id = $1 AND status = 'pending'`,
      [req.clinicId]
    );
    
    const outstandingInvoices = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total - paid_amount), 0) as amount 
       FROM invoices WHERE clinic_id = $1 AND status IN ('unpaid', 'partial')`,
      [req.clinicId]
    );
    
    res.json({
      today: {
        appointments: parseInt(todayAppointments.rows[0].count),
        patients: parseInt(todayPatients.rows[0].count),
        revenue: parseFloat(todayRevenue.rows[0].total)
      },
      this_month: {
        new_patients: parseInt(monthPatients.rows[0].count),
        revenue: parseFloat(monthRevenue.rows[0].total)
      },
      pending: {
        labs: parseInt(pendingLabs.rows[0].count),
        radiology: parseInt(pendingRadiology.rows[0].count)
      },
      outstanding: {
        invoices: parseInt(outstandingInvoices.rows[0].count),
        amount: parseFloat(outstandingInvoices.rows[0].amount)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

const db = require('../utils/db');

module.exports = {
  // Medical Reports
  getDiseaseFrequency,
  getLabVolume,
  getRadiologyVolume,
  getPatientDemographics,
  getAppointmentStats,
  // Financial Reports
  getDailyRevenue,
  getMonthlyRevenue,
  getDoctorProductivity,
  getInsuranceClaimsReport,
  getRevenueByService,
  getOutstandingInvoices,
  getExpenseSummary,
  // Export
  exportPatients,
  exportInvoices,
  exportPayments,
  exportPDF,
  // Dashboard
  getDashboardSummary
};
