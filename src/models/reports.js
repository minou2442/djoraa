const db = require('../utils/db');

// Medical Statistics
const MedicalReportsModel = {
  // Disease Frequency Report
  async getDiseaseFrequency(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        diagnosis as disease_name,
        COUNT(*) as frequency
       FROM patient_visits pv
       JOIN patients p ON pv.patient_id = p.id
       WHERE p.clinic_id = $1 
         AND pv.visit_date BETWEEN $2 AND $3
         AND pv.diagnosis IS NOT NULL
       GROUP BY diagnosis
       ORDER BY frequency DESC
       LIMIT 20`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Lab Volume Report
  async getLabVolume(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
       FROM lab_requests
       WHERE clinic_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Radiology Volume Report
  async getRadiologyVolume(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_exams,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        exam_type
       FROM radiology_exams
       WHERE clinic_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at), exam_type
       ORDER BY date`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Patient Demographics
  async getPatientDemographics(clinicId) {
    const genderResult = await db.query(
      `SELECT gender, COUNT(*) as count
       FROM patients 
       WHERE clinic_id = $1 AND status = 'active'
       GROUP BY gender`,
      [clinicId]
    );

    const ageResult = await db.query(
      `SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM age(date_of_birth)) < 18 THEN '0-17'
          WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 31 AND 45 THEN '31-45'
          WHEN EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END as age_group,
        COUNT(*) as count
       FROM patients
       WHERE clinic_id = $1 AND status = 'active' AND date_of_birth IS NOT NULL
       GROUP BY age_group
       ORDER BY age_group`,
      [clinicId]
    );

    const cityResult = await db.query(
      `SELECT city, COUNT(*) as count
       FROM patients
       WHERE clinic_id = $1 AND status = 'active' AND city IS NOT NULL
       GROUP BY city
       ORDER BY count DESC
       LIMIT 10`,
      [clinicId]
    );

    return {
      by_gender: genderResult.rows,
      by_age: ageResult.rows,
      by_city: cityResult.rows
    };
  },

  // Appointment Statistics
  async getAppointmentStats(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        DATE(appointment_date) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show
       FROM appointments
       WHERE clinic_id = $1 AND appointment_date BETWEEN $2 AND $3
       GROUP BY DATE(appointment_date)
       ORDER BY date`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

// Financial Statistics
const FinancialReportsModel = {
  // Daily Revenue
  async getDailyRevenue(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        DATE(payment_date) as date,
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count,
        payment_method
       FROM payments
       WHERE clinic_id = $1 AND payment_date BETWEEN $2 AND $3
       GROUP BY DATE(payment_date), payment_method
       ORDER BY date`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Monthly Revenue
  async getMonthlyRevenue(clinicId, year) {
    const result = await db.query(
      `SELECT 
        TO_CHAR(payment_date, 'YYYY-MM') as month,
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count
       FROM payments
       WHERE clinic_id = $1 AND EXTRACT(YEAR FROM payment_date) = $2
       GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
       ORDER BY month`,
      [clinicId, year]
    );
    return result.rows;
  },

  // Doctor Productivity
  async getDoctorProductivity(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        u.username as doctor_name,
        COUNT(DISTINCT pv.id) as consultations,
        COUNT(DISTINCT lr.id) as lab_requests,
        COUNT(DISTINCT re.id) as radiology_exams,
        COUNT(DISTINCT a.id) as appointments
       FROM users u
       LEFT JOIN patient_visits pv ON pv.doctor_id = u.id AND pv.visit_date BETWEEN $2 AND $3
       LEFT JOIN lab_requests lr ON lr.requested_by = u.id AND lr.created_at BETWEEN $2 AND $3
       LEFT JOIN radiology_exams re ON re.requested_by = u.id AND re.created_at BETWEEN $2 AND $3
       LEFT JOIN appointments a ON a.doctor_id = u.id AND a.appointment_date BETWEEN $2 AND $3
       WHERE u.clinic_id = $1 AND u.role = 'doctor'
       GROUP BY u.id, u.username
       ORDER BY consultations DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Insurance Claims Report
  async getInsuranceClaimsReport(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        p.insurance_provider,
        COUNT(*) as total_claims,
        SUM(claim_amount) as total_claimed,
        SUM(approved_amount) as total_approved,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
       FROM insurance_claims ic
       JOIN patients p ON ic.patient_id = p.id
       WHERE ic.clinic_id = $1 AND ic.submitted_date BETWEEN $2 AND $3
       GROUP BY p.insurance_provider
       ORDER BY total_claimed DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Revenue by Service Type
  async getRevenueByService(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        ii.service_name,
        SUM(ii.total_price) as total,
        SUM(ii.quantity) as quantity
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.clinic_id = $1 AND i.invoice_date BETWEEN $2 AND $3 AND i.status = 'paid'
       GROUP BY ii.service_name
       ORDER BY total DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  // Outstanding Invoices
  async getOutstandingInvoices(clinicId) {
    const result = await db.query(
      `SELECT 
        i.invoice_number,
        p.first_name || ' ' || p.last_name as patient_name,
        i.total,
        i.paid_amount,
        (i.total - i.paid_amount) as balance,
        i.invoice_date,
        i.status
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       WHERE i.clinic_id = $1 AND i.status IN ('unpaid', 'partial')
       ORDER BY balance DESC`,
      [clinicId]
    );
    return result.rows;
  },

  // Expense Summary
  async getExpenseSummary(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        ec.name as category,
        SUM(e.amount) as total,
        COUNT(*) as count
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.clinic_id = $1 AND e.expense_date BETWEEN $2 AND $3
       GROUP BY ec.id, ec.name
       ORDER BY total DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

// Export functions
const ExportModel = {
  async getFullPatientExport(clinicId) {
    const result = await db.query(
      `SELECT 
        patient_number,
        national_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        city,
        country,
        blood_group,
        status,
        created_at
       FROM patients
       WHERE clinic_id = $1
       ORDER BY created_at DESC`,
      [clinicId]
    );
    return result.rows;
  },

  async getFullInvoiceExport(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        i.invoice_number,
        i.invoice_date,
        p.patient_number,
        p.first_name || ' ' || p.last_name as patient_name,
        i.invoice_type,
        i.subtotal,
        i.discount,
        i.tax,
        i.total,
        i.paid_amount,
        (i.total - i.paid_amount) as balance,
        i.status
       FROM invoices i
       LEFT JOIN patients p ON i.patient_id = p.id
       WHERE i.clinic_id = $1 AND i.invoice_date BETWEEN $2 AND $3
       ORDER BY i.invoice_date DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  },

  async getFullPaymentExport(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        p.payment_date,
        i.invoice_number,
        p.amount,
        p.payment_method,
        p.reference_number,
        p.patient_id
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.clinic_id = $1 AND p.payment_date BETWEEN $2 AND $3
       ORDER BY p.payment_date DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

module.exports = {
  MedicalReportsModel,
  FinancialReportsModel,
  ExportModel
};
