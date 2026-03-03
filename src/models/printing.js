const db = require('../utils/db');

// Clinic settings helper
const getClinicSettings = async (clinicId) => {
  const result = await db.query(
    'SELECT name, address, phone, email, logo, stamp, signature FROM clinics WHERE id = $1',
    [clinicId]
  );
  return result.rows[0] || {};
};

const PrintModel = {
  // Get print templates
  findTemplates: async (clinicId) => {
    const result = await db.query(
      `SELECT * FROM print_templates WHERE clinic_id = $1 OR clinic_id IS NULL ORDER BY is_default DESC, name`,
      [clinicId]
    );
    return result.rows;
  },

  // Generate patient list
  generatePatientList: async (clinicId, options = {}) => {
    const { date_from, date_to, include_inactive } = options;
    let query = `
      SELECT 
        p.id, p.first_name, p.last_name, p.date_of_birth, p.gender,
        p.national_id, p.phone, p.address, p.city,
        p.blood_type, p.created_at,
        COALESCE(
          (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id),
          p.created_at
        ) as last_visit
      FROM patients p
      WHERE p.clinic_id = $1
    `;
    const params = [clinicId];

    if (!include_inactive) {
      query += ` AND p.is_active = true`;
    }
    if (date_from) {
      params.push(date_from);
      query += ` AND p.created_at >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      query += ` AND p.created_at <= $${params.length}`;
    }

    query += ` ORDER BY p.last_name, p.first_name`;

    const result = await db.query(query, params);
    const clinic = await getClinicSettings(clinicId);
    
    return {
      title: 'Liste des Patients / قائمة المرضى',
      clinic,
      patients: result.rows,
      generated_at: new Date(),
      options
    };
  },

  // Generate full medical file
  generateMedicalFile: async (clinicId, patientId) => {
    const patientQuery = `
      SELECT 
        p.*,
        c.name as clinic_name,
        (SELECT json_agg(json_build_object(
          'id', a.id,
          'name', a.name,
          'severity', a.severity,
          'reaction', a.reaction,
          'created_at', a.created_at
        )) FROM allergies a WHERE a.patient_id = p.id) as allergies,
        (SELECT json_agg(json_build_object(
          'id', d.id,
          'name', d.name,
          'notes', d.notes,
          'created_at', d.created_at
        )) FROM diseases d WHERE d.patient_id = p.id) as diseases,
        (SELECT json_agg(json_build_object(
          'id', v.id,
          'visit_date', v.visit_date,
          'chief_complaint', v.chief_complaint,
          'diagnosis', v.diagnosis,
          'treatment', v.treatment,
          'doctor_name', u.first_name || ' ' || u.last_name
        )) FROM visits v 
        JOIN users u ON v.doctor_id = u.id
        WHERE v.patient_id = p.id
        ORDER BY v.visit_date DESC
        LIMIT 50) as visits,
        (SELECT json_agg(json_build_object(
          'id', r.id,
          'test_type', r.test_type,
          'result', r.result,
          'notes', r.notes,
          'created_at', r.created_at
        )) FROM radiology r WHERE r.patient_id = p.id ORDER BY r.created_at DESC) as radiology,
        (SELECT json_agg(json_build_object(
          'id', l.id,
          'test_name', l.test_name,
          'result', l.result,
          'status', l.status,
          'created_at', l.created_at
        )) FROM laboratory l WHERE l.patient_id = p.id ORDER BY l.created_at DESC) as laboratory
      FROM patients p
      LEFT JOIN clinics c ON p.clinic_id = c.id
      WHERE p.id = $1 AND p.clinic_id = $2
    `;

    const result = await db.query(patientQuery, [patientId, clinicId]);
    const patient = result.rows[0];

    if (!patient) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Dossier Médical Complet / الملف الطبي الكامل',
      clinic,
      patient,
      generated_at: new Date()
    };
  },

  // Generate consultation report
  generateConsultationReport: async (clinicId, visitId) => {
    const query = `
      SELECT 
        v.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        p.national_id as patient_national_id,
        p.phone as patient_phone,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        u.specialty as doctor_specialty
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN users u ON v.doctor_id = u.id
      WHERE v.id = $1 AND v.clinic_id = $2
    `;

    const result = await db.query(query, [visitId, clinicId]);
    const visit = result.rows[0];

    if (!visit) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Rapport de Consultation / تقرير الاستشارة',
      clinic,
      visit,
      generated_at: new Date()
    };
  },

  // Generate prescription (Ordonnance)
  generatePrescription: async (clinicId, visitId) => {
    const query = `
      SELECT 
        v.id as visit_id,
        v.visit_date,
        v.notes as medical_notes,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.weight as patient_weight,
        p.height as patient_height,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        u.specialty as doctor_specialty,
        u.license_number,
        (SELECT json_agg(json_build_object(
          'id', m.id,
          'name', m.name,
          'dosage', pr.dosage,
          'frequency', pr.frequency,
          'duration', pr.duration,
          'instructions', pr.instructions,
          'quantity', pr.quantity
        )) 
        FROM prescriptions pr
        JOIN medications m ON pr.medication_id = m.id
        WHERE pr.visit_id = v.id) as prescriptions
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN users u ON v.doctor_id = u.id
      WHERE v.id = $1 AND v.clinic_id = $2
    `;

    const result = await db.query(query, [visitId, clinicId]);
    const prescription = result.rows[0];

    if (!prescription) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Ordonnance / وصفة طبية',
      clinic,
      prescription,
      generated_at: new Date()
    };
  },

  // Generate radiology report
  generateRadiologyReport: async (clinicId, radiologyId) => {
    const query = `
      SELECT 
        r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.national_id as patient_national_id,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        rt.name as radiology_type_name
      FROM radiology r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.ordered_by = u.id
      JOIN radiology_types rt ON r.test_type = rt.id
      WHERE r.id = $1 AND r.clinic_id = $2
    `;

    const result = await db.query(query, [radiologyId, clinicId]);
    const report = result.rows[0];

    if (!report) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Rapport Radiologique / تقرير الأشعة',
      clinic,
      report,
      generated_at: new Date()
    };
  },

  // Generate lab report
  generateLabReport: async (clinicId, labId) => {
    const query = `
      SELECT 
        l.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.national_id as patient_national_id,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        lt.name as test_type_name
      FROM laboratory l
      JOIN patients p ON l.patient_id = p.id
      JOIN users u ON l.ordered_by = u.id
      JOIN lab_test_types lt ON l.test_type = lt.id
      WHERE l.id = $1 AND l.clinic_id = $2
    `;

    const result = await db.query(query, [labId, clinicId]);
    const report = result.rows[0];

    if (!report) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Compte Rendu Laboratoire / تقرير المختبر',
      clinic,
      report,
      generated_at: new Date()
    };
  },

  // Generate invoice
  generateInvoice: async (clinicId, invoiceId) => {
    const query = `
      SELECT 
        i.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.national_id as patient_national_id,
        p.phone as patient_phone,
        (SELECT json_agg(json_build_object(
          'id', ii.id,
          'description', ii.description,
          'quantity', ii.quantity,
          'unit_price', ii.unit_price,
          'subtotal', ii.subtotal
        )) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items,
        (SELECT json_agg(json_build_object(
          'id', pm.id,
          'amount', pm.amount,
          'method', pm.method,
          'reference', pm.reference,
          'paid_at', pm.created_at
        )) FROM payments pm WHERE pm.invoice_id = i.id) as payments
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.id = $1 AND i.clinic_id = $2
    `;

    const result = await db.query(query, [invoiceId, clinicId]);
    const invoice = result.rows[0];

    if (!invoice) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Facture / فاتورة',
      clinic,
      invoice,
      generated_at: new Date()
    };
  },

  // Generate receipt
  generateReceipt: async (clinicId, paymentId) => {
    const query = `
      SELECT 
        pm.*,
        pm.amount as paid_amount,
        i.invoice_number,
        i.total as invoice_total,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as received_by_first_name,
        u.last_name as received_by_last_name
      FROM payments pm
      JOIN invoices i ON pm.invoice_id = i.id
      JOIN patients p ON i.patient_id = p.id
      JOIN users u ON pm.created_by = u.id
      WHERE pm.id = $1 AND pm.clinic_id = $2
    `;

    const result = await db.query(query, [paymentId, clinicId]);
    const receipt = result.rows[0];

    if (!receipt) return null;

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Reçu / إيصال',
      clinic,
      receipt,
      generated_at: new Date()
    };
  },

  // Generate statistical report
  generateStatisticalReport: async (clinicId, options = {}) => {
    const { date_from, date_to } = options;
    const params = [clinicId];
    
    let dateFilter = '';
    if (date_from) {
      params.push(date_from);
      dateFilter += ` AND created_at >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      dateFilter += ` AND created_at <= $${params.length}`;
    }

    // Get statistics
    const stats = {
      total_patients: 0,
      new_patients: 0,
      total_visits: 0,
      total_invoices: 0,
      total_revenue: 0,
      lab_tests: 0,
      radiology_tests: 0,
      appointments: 0
    };

    // Total patients
    const patientsResult = await db.query(
      `SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1`,
      [clinicId]
    );
    stats.total_patients = parseInt(patientsResult.rows[0].count);

    // New patients in period
    const newPatientsResult = await db.query(
      `SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.new_patients = parseInt(newPatientsResult.rows[0].count);

    // Total visits
    const visitsResult = await db.query(
      `SELECT COUNT(*) as count FROM visits WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.total_visits = parseInt(visitsResult.rows[0].count);

    // Total invoices and revenue
    const invoicesResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.total_invoices = parseInt(invoicesResult.rows[0].count);
    stats.total_revenue = parseFloat(invoicesResult.rows[0].total);

    // Lab tests
    const labResult = await db.query(
      `SELECT COUNT(*) as count FROM laboratory WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.lab_tests = parseInt(labResult.rows[0].count);

    // Radiology tests
    const radioResult = await db.query(
      `SELECT COUNT(*) as count FROM radiology WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.radiology_tests = parseInt(radioResult.rows[0].count);

    // Appointments
    const apptResult = await db.query(
      `SELECT COUNT(*) as count FROM appointments WHERE clinic_id = $1 ${dateFilter}`,
      params
    );
    stats.appointments = parseInt(apptResult.rows[0].count);

    const clinic = await getClinicSettings(clinicId);

    return {
      title: 'Rapport Statistique / تقرير إحصائي',
      clinic,
      stats,
      period: { date_from, date_to },
      generated_at: new Date()
    };
  },

  // Generate QR code verification data
  generateQRData: async (clinicId, docType, docId) => {
    const data = {
      type: docType,
      id: docId,
      clinic_id: clinicId,
      verified_at: new Date().toISOString(),
      url: `${process.env.CLIENT_URL || 'https://djoraa.dz'}/verify/${docType}/${docId}`
    };
    return JSON.stringify(data);
  }
};

module.exports = PrintModel;
