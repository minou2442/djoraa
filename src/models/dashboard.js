const db = require('../utils/db');

const DashboardModel = {
  // Get admin dashboard data
  getAdminDashboard: async (clinicId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's stats
    const todayStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND DATE(created_at) = $2) as new_patients_today,
        (SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND DATE(appointment_date) = $2) as appointments_today,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE clinic_id = $1 AND DATE(paid_at) = $2) as revenue_today,
        (SELECT COUNT(*) FROM users WHERE clinic_id = $1 AND is_active = true) as active_users
    `, [clinicId, today]);

    // Monthly stats
    const monthStart = today.substring(0, 7) + '-01';
    const monthStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND created_at >= $2) as new_patients_month,
        (SELECT COUNT(*) FROM visits WHERE clinic_id = $1 AND visit_date >= $2) as consultations_month,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE clinic_id = $1 AND paid_at >= $2) as revenue_month,
        (SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND appointment_date >= $2) as appointments_month
    `, [clinicId, monthStart]);

    // Queue status
    const queueStatus = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_today
      FROM queue_entries 
      WHERE clinic_id = $1 AND DATE(created_at) = $2
    `, [clinicId, today]);

    // Active doctors
    const activeDoctors = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.specialty,
        (SELECT COUNT(*) FROM queue_entries qe WHERE qe.doctor_id = u.id AND qe.status = 'waiting') as queue_count
      FROM users u
      WHERE u.clinic_id = $1 AND u.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'specialist'))
        AND u.is_active = true
      ORDER BY queue_count DESC
      LIMIT 5
    `, [clinicId]);

    // Low stock alerts
    const lowStock = await db.query(`
      SELECT id, name, current_stock, min_stock
      FROM inventory_items
      WHERE clinic_id = $1 AND current_stock <= min_stock
      ORDER BY current_stock ASC
      LIMIT 5
    `, [clinicId]);

    // Recent activity
    const recentActivity = await db.query(`
      SELECT 'appointment' as type, id, appointment_date as timestamp, 'new_appointment' as action
      FROM appointments WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'
      UNION ALL
      SELECT 'invoice', id, created_at, 'created'
      FROM invoices WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'
      ORDER BY timestamp DESC
      LIMIT 10
    `, [clinicId]);

    return {
      today: todayStats.rows[0],
      month: monthStats.rows[0],
      queue: queueStatus.rows[0],
      active_doctors: activeDoctors.rows,
      low_stock: lowStock.rows,
      recent_activity: recentActivity.rows
    };
  },

  // Get doctor dashboard data
  getDoctorDashboard: async (clinicId, doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's appointments
    const todayAppointments = await db.query(`
      SELECT a.id, a.appointment_date, a.status, a.type,
        p.first_name, p.last_name, p.phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.clinic_id = $1 AND a.doctor_id = $2 
        AND DATE(a.appointment_date) = $3
      ORDER BY a.appointment_date ASC
    `, [clinicId, doctorId, today]);

    // Waiting queue
    const waitingQueue = await db.query(`
      SELECT q.id, q.priority, q.created_at,
        p.first_name, p.last_name, p.phone,
        EXTRACT(EPOCH FROM (NOW() - q.created_at))/60 as wait_minutes
      FROM queue_entries q
      JOIN patients p ON q.patient_id = p.id
      WHERE q.clinic_id = $1 AND q.doctor_id = $2 AND q.status = 'waiting'
      ORDER BY q.priority DESC, q.created_at ASC
    `, [clinicId, doctorId]);

    // Current session (if any)
    const currentSession = await db.query(`
      SELECT q.id, q.started_at,
        p.first_name, p.last_name, p.id as patient_id,
        EXTRACT(EPOCH FROM (NOW() - q.started_at))/60 as session_minutes
      FROM queue_entries q
      JOIN patients p ON q.patient_id = p.id
      WHERE q.clinic_id = $1 AND q.doctor_id = $2 AND q.status = 'in_progress'
      ORDER BY q.started_at DESC
      LIMIT 1
    `, [clinicId, doctorId]);

    // Pending lab requests
    const pendingLab = await db.query(`
      SELECT l.id, l.test_type, l.status, l.created_at,
        p.first_name, p.last_name
      FROM laboratory l
      JOIN patients p ON l.patient_id = p.id
      WHERE l.clinic_id = $1 AND l.ordered_by = $2 AND l.status IN ('pending', 'in_progress')
      ORDER BY l.created_at ASC
      LIMIT 5
    `, [clinicId, doctorId]);

    // Pending radiology
    const pendingRadio = await db.query(`
      SELECT r.id, r.test_type, r.status, r.created_at,
        p.first_name, p.last_name
      FROM radiology r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.clinic_id = $1 AND r.ordered_by = $2 AND r.status IN ('pending', 'in_progress')
      ORDER BY r.created_at ASC
      LIMIT 5
    `, [clinicId, doctorId]);

    // Today's completed visits
    const completedToday = await db.query(`
      SELECT COUNT(*) as count
      FROM visits
      WHERE clinic_id = $1 AND doctor_id = $2 AND DATE(visit_date) = $3
    `, [clinicId, doctorId, today]);

    // Monthly stats
    const monthStart = today.substring(0, 7) + '-01';
    const monthStats = await db.query(`
      SELECT 
        COUNT(*) as consultations_month,
        COALESCE(SUM(total), 0) as revenue_month
      FROM visits v
      LEFT JOIN invoices i ON v.id = i.visit_id
      WHERE v.clinic_id = $1 AND v.doctor_id = $2 AND v.visit_date >= $3
    `, [clinicId, doctorId, monthStart]);

    return {
      today_appointments: todayAppointments.rows,
      waiting_queue: waitingQueue.rows,
      current_session: currentSession.rows[0] || null,
      pending_lab: pendingLab.rows,
      pending_radiology: pendingRadio.rows,
      completed_today: parseInt(completedToday.rows[0].count),
      month: monthStats.rows[0]
    };
  },

  // Get receptionist dashboard data
  getReceptionDashboard: async (clinicId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's appointments
    const todayAppointments = await db.query(`
      SELECT a.id, a.appointment_date, a.status, a.type, a.priority,
        p.first_name, p.last_name, p.phone,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.doctor_id = u.id
      WHERE a.clinic_id = $1 AND DATE(a.appointment_date) = $2
      ORDER BY a.appointment_date ASC
    `, [clinicId, today]);

    // Waiting queue
    const waitingQueue = await db.query(`
      SELECT q.id, q.priority, q.created_at, q.status,
        p.first_name, p.last_name, p.phone,
        u.first_name as doctor_name,
        EXTRACT(EPOCH FROM (NOW() - q.created_at))/60 as wait_minutes
      FROM queue_entries q
      JOIN patients p ON q.patient_id = p.id
      LEFT JOIN users u ON q.doctor_id = u.id
      WHERE q.clinic_id = $1 AND DATE(q.created_at) = $2
      ORDER BY q.priority DESC, q.created_at ASC
    `, [clinicId, today]);

    // Pending payments
    const pendingPayments = await db.query(`
      SELECT i.id, i.invoice_number, i.total, i.paid_amount, 
        (i.total - i.paid_amount) as balance,
        p.first_name, p.last_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.clinic_id = $1 AND i.status IN ('unpaid', 'partial')
      ORDER BY balance DESC
      LIMIT 5
    `, [clinicId]);

    // Insurance pending
    const insurancePending = await db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total - paid_amount), 0) as total_pending
      FROM invoices
      WHERE clinic_id = $1 AND insurance_claim = true AND status != 'paid'
    `, [clinicId]);

    // Quick stats
    const quickStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND DATE(appointment_date) = $2 AND status = 'confirmed') as confirmed_today,
        (SELECT COUNT(*) FROM queue_entries WHERE clinic_id = $1 AND DATE(created_at) = $2 AND status = 'waiting') as waiting_now,
        (SELECT COUNT(*) FROM invoices WHERE clinic_id = $1 AND DATE(created_at) = $2) as invoices_today,
        (SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND DATE(created_at) = $2) as patients_registered_today
    `, [clinicId, today]);

    return {
      today_appointments: todayAppointments.rows,
      waiting_queue: waitingQueue.rows,
      pending_payments: pendingPayments.rows,
      insurance_pending: insurancePending.rows[0],
      quick_stats: quickStats.rows[0]
    };
  },

  // Get laboratory technician dashboard
  getLabDashboard: async (clinicId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Pending tests
    const pendingTests = await db.query(`
      SELECT l.id, l.test_type, l.status, l.priority, l.created_at,
        p.first_name, p.last_name, p.id as patient_id,
        u.first_name as doctor_name
      FROM laboratory l
      JOIN patients p ON l.patient_id = p.id
      JOIN users u ON l.ordered_by = u.id
      WHERE l.clinic_id = $1 AND l.status IN ('pending', 'in_progress')
      ORDER BY l.priority DESC, l.created_at ASC
    `, [clinicId]);

    // Completed today
    const completedToday = await db.query(`
      SELECT COUNT(*) as count
      FROM laboratory
      WHERE clinic_id = $1 AND DATE(completed_at) = $2
    `, [clinicId, today]);

    // Abnormal results
    const abnormalResults = await db.query(`
      SELECT l.id, l.test_type, l.result, l.created_at,
        p.first_name, p.last_name
      FROM laboratory l
      JOIN patients p ON l.patient_id = p.id
      WHERE l.clinic_id = $1 AND l.status = 'completed' 
        AND l.result LIKE '%abnormal%' OR l.result LIKE '%high%' OR l.result LIKE '%low%'
      ORDER BY l.completed_at DESC
      LIMIT 5
    `, [clinicId]);

    // Stats
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = $2) as completed_today
      FROM laboratory
      WHERE clinic_id = $1
    `, [clinicId, today]);

    return {
      pending_tests: pendingTests.rows,
      completed_today: parseInt(completedToday.rows[0].count),
      abnormal_results: abnormalResults.rows,
      stats: stats.rows[0]
    };
  },

  // Get radiology dashboard
  getRadiologyDashboard: async (clinicId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Pending exams
    const pendingExams = await db.query(`
      SELECT r.id, r.test_type, r.status, r.priority, r.created_at,
        p.first_name, p.last_name, p.id as patient_id,
        u.first_name as doctor_name
      FROM radiology r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.ordered_by = u.id
      WHERE r.clinic_id = $1 AND r.status IN ('pending', 'in_progress')
      ORDER BY r.priority DESC, r.created_at ASC
    `, [clinicId]);

    // Completed today
    const completedToday = await db.query(`
      SELECT COUNT(*) as count
      FROM radiology
      WHERE clinic_id = $1 AND DATE(completed_at) = $2
    `, [clinicId, today]);

    // Urgent exams
    const urgentExams = await db.query(`
      SELECT r.id, r.test_type, r.status, r.findings, r.created_at,
        p.first_name, p.last_name
      FROM radiology r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.clinic_id = $1 AND r.priority = 'urgent' AND r.status != 'completed'
      ORDER BY r.created_at ASC
      LIMIT 5
    `, [clinicId]);

    // Stats
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = $2) as completed_today
      FROM radiology
      WHERE clinic_id = $1
    `, [clinicId, today]);

    return {
      pending_exams: pendingExams.rows,
      completed_today: parseInt(completedToday.rows[0].count),
      urgent_exams: urgentExams.rows,
      stats: stats.rows[0]
    };
  },

  // Get accountant dashboard
  getAccountantDashboard: async (clinicId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's revenue
    const todayRevenue = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        method,
        COUNT(*) as count
      FROM payments
      WHERE clinic_id = $1 AND DATE(paid_at) = $2
      GROUP BY method
    `, [clinicId, today]);

    // Monthly revenue
    const monthStart = today.substring(0, 7) + '-01';
    const monthRevenue = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE clinic_id = $1 AND paid_at >= $2
    `, [clinicId, monthStart]);

    // Outstanding invoices
    const outstanding = await db.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total - paid_amount), 0) as total_outstanding
      FROM invoices
      WHERE clinic_id = $1 AND status != 'paid'
    `, [clinicId]);

    // Recent invoices
    const recentInvoices = await db.query(`
      SELECT i.id, i.invoice_number, i.total, i.paid_amount, i.status, i.created_at,
        p.first_name, p.last_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.clinic_id = $1
      ORDER BY i.created_at DESC
      LIMIT 10
    `, [clinicId]);

    // Expenses today
    const expensesToday = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE clinic_id = $1 AND DATE(expense_date) = $2
    `, [clinicId, today]);

    // Insurance claims
    const insuranceClaims = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COALESCE(SUM(claim_amount) FILTER (WHERE status = 'pending'), 0) as pending_amount
      FROM insurance_claims
      WHERE clinic_id = $1
    `, [clinicId]);

    return {
      today_revenue: todayRevenue.rows,
      month_revenue: parseFloat(monthRevenue.rows[0].total),
      outstanding: outstanding.rows[0],
      recent_invoices: recentInvoices.rows,
      expenses_today: parseFloat(expensesToday.rows[0].total),
      insurance_claims: insuranceClaims.rows[0]
    };
  },

  // Get quick actions based on role
  getQuickActions: (role) => {
    const actions = {
      admin: [
        { id: 'add_clinic', label: 'Add Clinic', icon: '🏥', permission: 'create_clinic' },
        { id: 'add_user', label: 'Add User', icon: '👤', permission: 'create_user' },
        { id: 'manage_roles', label: 'Manage Roles', icon: '🔑', permission: 'manage_roles' },
        { id: 'view_reports', label: 'View Reports', icon: '📊', permission: 'view_reports' },
        { id: 'security_logs', label: 'Security Logs', icon: '🔐', permission: 'view_audit' },
        { id: 'backup', label: 'Backup Now', icon: '💾', permission: 'backup_db' }
      ],
      doctor: [
        { id: 'start_session', label: 'Start Session', icon: '🟢', permission: 'manage_queue' },
        { id: 'end_session', label: 'End Session', icon: '🔴', permission: 'manage_queue' },
        { id: 'view_queue', label: 'View Queue', icon: '🪑', permission: 'view_queue' },
        { id: 'new_consultation', label: 'New Consultation', icon: '📝', permission: 'create_visit' },
        { id: 'new_prescription', label: 'New Prescription', icon: '💊', permission: 'create_prescription' },
        { id: 'request_lab', label: 'Request Lab', icon: '🧪', permission: 'request_lab' },
        { id: 'request_radiology', label: 'Request Radiology', icon: '🩻', permission: 'request_radiology' },
        { id: 'print_last', label: 'Print Last Doc', icon: '🖨️', permission: 'print_document' }
      ],
      receptionist: [
        { id: 'register_patient', label: 'Register Patient', icon: '➕', permission: 'create_patient' },
        { id: 'new_appointment', label: 'New Appointment', icon: '📅', permission: 'create_appointment' },
        { id: 'add_to_queue', label: 'Add to Queue', icon: '🪑', permission: 'manage_queue' },
        { id: 'create_invoice', label: 'Create Invoice', icon: '📄', permission: 'create_invoice' },
        { id: 'receive_payment', label: 'Receive Payment', icon: '💵', permission: 'create_payment' },
        { id: 'print_receipt', label: 'Print Receipt', icon: '🧾', permission: 'print_document' }
      ],
      lab_technician: [
        { id: 'pending_lab', label: 'Pending Tests', icon: '📥', permission: 'view_lab' },
        { id: 'enter_results', label: 'Enter Results', icon: '🧪', permission: 'update_lab' },
        { id: 'validate_result', label: 'Validate Result', icon: '✔️', permission: 'validate_lab' },
        { id: 'print_report', label: 'Print Report', icon: '🖨️', permission: 'print_document' }
      ],
      radiologist: [
        { id: 'pending_exams', label: 'Pending Exams', icon: '📥', permission: 'view_radiology' },
        { id: 'upload_images', label: 'Upload Images', icon: '🖼️', permission: 'update_radiology' },
        { id: 'write_report', label: 'Write Report', icon: '📝', permission: 'update_radiology' },
        { id: 'validate_report', label: 'Validate Report', icon: '✔️', permission: 'validate_radiology' },
        { id: 'print_report', label: 'Print Report', icon: '🖨️', permission: 'print_document' }
      ],
      accountant: [
        { id: 'view_invoices', label: 'View Invoices', icon: '📄', permission: 'view_invoices' },
        { id: 'record_payment', label: 'Record Payment', icon: '💳', permission: 'create_payment' },
        { id: 'financial_report', label: 'Financial Report', icon: '📊', permission: 'view_reports' },
        { id: 'insurance_claims', label: 'Insurance Claims', icon: '🏥', permission: 'view_invoices' },
        { id: 'export_data', label: 'Export Data', icon: '📤', permission: 'export_data' }
      ]
    };

    return actions[role] || [];
  },

  // Get pinned shortcuts for user
  getPinnedShortcuts: async (userId) => {
    const result = await db.query(
      `SELECT pinned_items FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0]?.pinned_items || [];
  },

  // Save pinned shortcuts
  savePinnedShortcuts: async (userId, pinnedItems) => {
    await db.query(
      `INSERT INTO user_preferences (user_id, pinned_items, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET pinned_items = $2, updated_at = NOW()`,
      [userId, JSON.stringify(pinnedItems)]
    );
  }
};

module.exports = DashboardModel;
