const db = require('../utils/db');

const SearchModel = {
  // Main search function - searches across all entities
  search: async (clinicId, userId, role, query, options = {}) => {
    const { limit = 20, entity_type, date_from, date_to } = options;
    
    // Build parameterized query based on permissions
    const results = [];
    
    // Patients search (allowed for admin, doctor, receptionist)
    if (['superadmin', 'clinic_admin', 'doctor', 'receptionist'].includes(role)) {
      let patientQuery = `
        SELECT 
          'patient' as entity_type,
          p.id as entity_id,
          p.last_name || ' ' || p.first_name as title,
          COALESCE(p.national_id, '') || ' | ' || COALESCE(p.phone, '') as subtitle,
          'active' as status,
          1.0 as relevance_score
        FROM patients p
        WHERE p.clinic_id = $1
          AND (p.last_name ILIKE $2 OR p.first_name ILIKE $2 OR p.national_id ILIKE $2 OR p.phone ILIKE $2)
      `;
      
      if (role === 'doctor' && options.doctor_id) {
        patientQuery += ` AND EXISTS (
          SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.doctor_id = $4
        )`;
      }
      
      patientQuery += ` ORDER BY relevance_score DESC LIMIT $3`;
      
      const patientParams = [clinicId, `%${query}%`, limit];
      if (role === 'doctor' && options.doctor_id) {
        patientParams.push(options.doctor_id);
      }
      
      const patientResults = await db.query(patientQuery, patientParams);
      results.push(...patientResults.rows);
    }

    // Appointments search
    if (['superadmin', 'clinic_admin', 'doctor', 'receptionist'].includes(role)) {
      let apptQuery = `
        SELECT 
          'appointment' as entity_type,
          a.id as entity_id,
          'RDV #' || a.id || ' - ' || TO_CHAR(a.appointment_date, 'DD/MM/YYYY HH24:MI') as title,
          p.last_name || ' ' || p.first_name as subtitle,
          a.status,
          0.8 as relevance_score
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.clinic_id = $1
          AND CAST(a.id AS TEXT) LIKE $2
      `;
      
      if (date_from) {
        apptQuery += ` AND a.appointment_date >= $3`;
      }
      if (date_to) {
        apptQuery += date_from ? ` AND a.appointment_date <= $4` : ` AND a.appointment_date <= $3`;
      }
      
      apptQuery += ` ORDER BY a.appointment_date DESC LIMIT $${date_to ? (date_from ? 5 : 4) : 3}`;
      
      const apptParams = [clinicId, `%${query}%`];
      if (date_from) apptParams.push(date_from);
      if (date_to) apptParams.push(date_to);
      apptParams.push(limit);
      
      const apptResults = await db.query(apptQuery, apptParams);
      results.push(...apptResults.rows);
    }

    // Invoices search (allowed for admin, accountant, receptionist)
    if (['superadmin', 'clinic_admin', 'accountant', 'receptionist'].includes(role)) {
      let invoiceQuery = `
        SELECT 
          'invoice' as entity_type,
          i.id as entity_id,
          'Facture #' || i.invoice_number as title,
          p.last_name || ' ' || p.first_name || ' - ' || i.total || ' DA' as subtitle,
          i.status,
          0.7 as relevance_score
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.clinic_id = $1
          AND (i.invoice_number ILIKE $2 OR CAST(i.id AS TEXT) LIKE $2)
      `;
      
      if (options.status) {
        invoiceQuery += ` AND i.status = $3`;
      }
      
      invoiceQuery += ` ORDER BY i.created_at DESC LIMIT $${options.status ? 4 : 3}`;
      
      const invParams = [clinicId, `%${query}%`];
      if (options.status) invParams.push(options.status);
      invParams.push(limit);
      
      const invResults = await db.query(invoiceQuery, invParams);
      results.push(...invResults.rows);
    }

    // Prescriptions/Visits search
    if (['superadmin', 'clinic_admin', 'doctor', 'pharmacist'].includes(role)) {
      let rxQuery = `
        SELECT 
          'prescription' as entity_type,
          v.id as entity_id,
          'Ordonnance #' || v.id || ' - ' || TO_CHAR(v.visit_date, 'DD/MM/YYYY') as title,
          p.last_name || ' ' || p.first_name as subtitle,
          'completed' as status,
          0.6 as relevance_score
        FROM visits v
        JOIN patients p ON v.patient_id = p.id
        WHERE v.clinic_id = $1
          AND CAST(v.id AS TEXT) LIKE $2
      `;
      
      if (date_from) {
        rxQuery += ` AND v.visit_date >= $3`;
      }
      if (date_to) {
        rxQuery += date_from ? ` AND v.visit_date <= $4` : ` AND v.visit_date <= $3`;
      }
      
      rxQuery += ` ORDER BY v.visit_date DESC LIMIT $${date_to ? (date_from ? 5 : 4) : 3}`;
      
      const rxParams = [clinicId, `%${query}%`];
      if (date_from) rxParams.push(date_from);
      if (date_to) rxParams.push(date_to);
      rxParams.push(limit);
      
      const rxResults = await db.query(rxQuery, rxParams);
      results.push(...rxResults.rows);
    }

    // Laboratory results search
    if (['superadmin', 'clinic_admin', 'doctor', 'lab_technician'].includes(role)) {
      let labQuery = `
        SELECT 
          'laboratory' as entity_type,
          l.id as entity_id,
          'Lab #' || l.id || ' - ' || COALESCE(lt.name, 'Test') as title,
          p.last_name || ' ' || p.first_name || ' - ' || l.status as subtitle,
          l.status,
          0.5 as relevance_score
        FROM laboratory l
        JOIN patients p ON l.patient_id = p.id
        LEFT JOIN lab_test_types lt ON l.test_type = lt.id
        WHERE l.clinic_id = $1
          AND CAST(l.id AS TEXT) LIKE $2
      `;
      
      if (options.status) {
        labQuery += ` AND l.status = $3`;
      }
      
      labQuery += ` ORDER BY l.created_at DESC LIMIT $${options.status ? 4 : 3}`;
      
      const labParams = [clinicId, `%${query}%`];
      if (options.status) labParams.push(options.status);
      labParams.push(limit);
      
      const labResults = await db.query(labQuery, labParams);
      results.push(...labResults.rows);
    }

    // Radiology search
    if (['superadmin', 'clinic_admin', 'doctor', 'radiologist'].includes(role)) {
      let radioQuery = `
        SELECT 
          'radiology' as entity_type,
          r.id as entity_id,
          'Radio #' || r.id || ' - ' || COALESCE(rt.name, 'Exam') as title,
          p.last_name || ' ' || p.first_name || ' - ' || r.status as subtitle,
          r.status,
          0.5 as relevance_score
        FROM radiology r
        JOIN patients p ON r.patient_id = p.id
        LEFT JOIN radiology_types rt ON r.test_type = rt.id
        WHERE r.clinic_id = $1
          AND CAST(r.id AS TEXT) LIKE $2
      `;
      
      if (options.status) {
        radioQuery += ` AND r.status = $3`;
      }
      
      radioQuery += ` ORDER BY r.created_at DESC LIMIT $${options.status ? 4 : 3}`;
      
      const radioParams = [clinicId, `%${query}%`];
      if (options.status) radioParams.push(options.status);
      radioParams.push(limit);
      
      const radioResults = await db.query(radioQuery, radioParams);
      results.push(...radioResults.rows);
    }

    // Inventory/Stock search
    if (['superadmin', 'clinic_admin', 'pharmacist'].includes(role)) {
      let invQuery = `
        SELECT 
          'inventory' as entity_type,
          i.id as entity_id,
          i.name || ' (' || i.code || ')' as title,
          COALESCE(ic.name, 'Uncategorized') || ' - Stock: ' || i.current_stock as subtitle,
          CASE WHEN i.current_stock <= i.min_stock THEN 'low_stock' ELSE 'in_stock' END as status,
          0.4 as relevance_score
        FROM inventory_items i
        LEFT JOIN inventory_categories ic ON i.category_id = ic.id
        WHERE i.clinic_id = $1
          AND (i.name ILIKE $2 OR i.code ILIKE $2 OR i.barcode ILIKE $2)
      `;
      
      invQuery += ` ORDER BY relevance_score DESC LIMIT $3`;
      
      const invResults = await db.query(invQuery, [clinicId, `%${query}%`, limit]);
      results.push(...invResults.rows);
    }

    // Users/Employees search
    if (['superadmin', 'clinic_admin', 'hr'].includes(role)) {
      let userQuery = `
        SELECT 
          'employee' as entity_type,
          u.id as entity_id,
          u.last_name || ' ' || u.first_name as title,
          u.email || ' - ' || COALESCE(r.name, 'No Role') as subtitle,
          CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END as status,
          0.3 as relevance_score
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.clinic_id = $1
          AND (u.last_name ILIKE $2 OR u.first_name ILIKE $2 OR u.email ILIKE $2)
      `;
      
      userQuery += ` ORDER BY relevance_score DESC LIMIT $3`;
      
      const userResults = await db.query(userQuery, [clinicId, `%${query}%`, limit]);
      results.push(...userResults.rows);
    }

    // Filter by entity type if specified
    let filteredResults = results;
    if (entity_type) {
      filteredResults = results.filter(r => r.entity_type === entity_type);
    }

    // Sort by relevance and limit
    filteredResults.sort((a, b) => b.relevance_score - a.relevance_score);
    return filteredResults.slice(0, limit);
  },

  // Save search to history
  saveSearchHistory: async (userId, clinicId, searchTerm, entityType, resultCount, ipAddress) => {
    const result = await db.query(
      `INSERT INTO search_history (user_id, clinic_id, search_term, entity_type, result_count, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, clinicId, searchTerm, entityType, resultCount, ipAddress]
    );
    return result.rows[0];
  },

  // Get user search history
  getSearchHistory: async (userId, limit = 10) => {
    const result = await db.query(
      `SELECT search_term, entity_type, result_count, created_at
       FROM search_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Clear user search history
  clearSearchHistory: async (userId) => {
    await db.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
  },

  // Get frequent searches for user
  getFrequentSearches: async (userId, limit = 5) => {
    const result = await db.query(
      `SELECT search_term, COUNT(*) as frequency
       FROM search_history
       WHERE user_id = $1
       GROUP BY search_term
       ORDER BY frequency DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Autocomplete suggestions
  getSuggestions: async (clinicId, role, query, limit = 5) => {
    const suggestions = [];
    
    // Patient suggestions
    if (['superadmin', 'clinic_admin', 'doctor', 'receptionist'].includes(role)) {
      const result = await db.query(
        `SELECT 'patient' as type, id, last_name || ' ' || first_name as name
         FROM patients
         WHERE clinic_id = $1 AND (last_name ILIKE $2 OR first_name ILIKE $2 OR national_id ILIKE $2)
         ORDER BY last_name, first_name
         LIMIT $3`,
        [clinicId, `${query}%`, limit]
      );
      suggestions.push(...result.rows);
    }
    
    return suggestions.slice(0, limit);
  },

  // Get quick preview data for an entity
  getPreview: async (clinicId, entityType, entityId, role) => {
    switch (entityType) {
      case 'patient':
        // Verify permission
        if (!['superadmin', 'clinic_admin', 'doctor', 'receptionist'].includes(role)) {
          return null;
        }
        const patient = await db.query(
          `SELECT p.id, p.first_name, p.last_name, p.date_of_birth, p.gender, 
                  p.national_id, p.phone, p.blood_type, p.created_at,
                  (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id) as last_visit
           FROM patients p
           WHERE p.id = $1 AND p.clinic_id = $2`,
          [entityId, clinicId]
        );
        return patient.rows[0] || null;

      case 'invoice':
        if (!['superadmin', 'clinic_admin', 'accountant', 'receptionist'].includes(role)) {
          return null;
        }
        const invoice = await db.query(
          `SELECT i.id, i.invoice_number, i.total, i.paid_amount, i.status, i.created_at,
                  p.first_name, p.last_name
           FROM invoices i
           JOIN patients p ON i.patient_id = p.id
           WHERE i.id = $1 AND i.clinic_id = $2`,
          [entityId, clinicId]
        );
        return invoice.rows[0] || null;

      case 'appointment':
        if (!['superadmin', 'clinic_admin', 'doctor', 'receptionist'].includes(role)) {
          return null;
        }
        const appt = await db.query(
          `SELECT a.id, a.appointment_date, a.status, a.notes,
                  p.first_name, p.last_name,
                  u.first_name as doctor_first_name, u.last_name as doctor_last_name
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users u ON a.doctor_id = u.id
           WHERE a.id = $1 AND a.clinic_id = $2`,
          [entityId, clinicId]
        );
        return appt.rows[0] || null;

      case 'laboratory':
        if (!['superadmin', 'clinic_admin', 'doctor', 'lab_technician'].includes(role)) {
          return null;
        }
        const lab = await db.query(
          `SELECT l.id, l.test_type, l.status, l.result, l.created_at,
                  p.first_name, p.last_name
           FROM laboratory l
           JOIN patients p ON l.patient_id = p.id
           WHERE l.id = $1 AND l.clinic_id = $2`,
          [entityId, clinicId]
        );
        return lab.rows[0] || null;

      case 'radiology':
        if (!['superadmin', 'clinic_admin', 'doctor', 'radiologist'].includes(role)) {
          return null;
        }
        const radio = await db.query(
          `SELECT r.id, r.test_type, r.status, r.findings, r.created_at,
                  p.first_name, p.last_name
           FROM radiology r
           JOIN patients p ON r.patient_id = p.id
           WHERE r.id = $1 AND r.clinic_id = $2`,
          [entityId, clinicId]
        );
        return radio.rows[0] || null;

      case 'inventory':
        if (!['superadmin', 'clinic_admin', 'pharmacist'].includes(role)) {
          return null;
        }
        const item = await db.query(
          `SELECT i.id, i.name, i.code, i.current_stock, i.min_stock, i.expiry_date, i.location
           FROM inventory_items i
           WHERE i.id = $1 AND i.clinic_id = $2`,
          [entityId, clinicId]
        );
        return item.rows[0] || null;

      case 'employee':
        if (!['superadmin', 'clinic_admin', 'hr'].includes(role)) {
          return null;
        }
        const user = await db.query(
          `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active,
                  r.name as role_name
           FROM users u
           LEFT JOIN roles r ON u.role_id = r.id
           WHERE u.id = $1 AND u.clinic_id = $2`,
          [entityId, clinicId]
        );
        return user.rows[0] || null;

      default:
        return null;
    }
  }
};

module.exports = SearchModel;
