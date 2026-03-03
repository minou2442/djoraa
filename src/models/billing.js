const db = require('../utils/db');

// Service Pricing Model
const ServicePricingModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM service_pricing WHERE clinic_id = $1 AND active = true ORDER BY category, name`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT * FROM service_pricing WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO service_pricing (clinic_id, name, name_ar, category, price, insurance_price, duration_minutes, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.clinic_id, data.name, data.name_ar, data.category, data.price, data.insurance_price, data.duration_minutes, true]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await db.query(
      `UPDATE service_pricing SET name = $1, name_ar = $2, category = $3, price = $4, insurance_price = $5, duration_minutes = $6
       WHERE id = $7 RETURNING *`,
      [data.name, data.name_ar, data.category, data.price, data.insurance_price, data.duration_minutes, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query(`UPDATE service_pricing SET active = false WHERE id = $1`, [id]);
  }
};

// Invoice Model
const InvoiceModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT i.*, 
             p.first_name || ' ' || p.last_name as patient_name,
             p.patient_number,
             u.username as created_by_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.status) {
      query += ` AND i.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    if (filters.date_from) {
      query += ` AND i.invoice_date >= $${params.length + 1}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND i.invoice_date <= $${params.length + 1}`;
      params.push(filters.date_to);
    }
    if (filters.patient_id) {
      query += ` AND i.patient_id = $${params.length + 1}`;
      params.push(filters.patient_id);
    }
    
    query += ` ORDER BY i.invoice_date DESC, i.id DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT i.*, 
              p.first_name || ' ' || p.last_name as patient_name,
              p.patient_number,
              p.phone as patient_phone,
              u.username as created_by_name
       FROM invoices i
       LEFT JOIN patients p ON i.patient_id = p.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Generate invoice number
      const countResult = await client.query(`SELECT COUNT(*) FROM invoices WHERE clinic_id = $1`, [data.clinic_id]);
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(5, '0')}`;
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const discount = data.discount || 0;
      const taxableAmount = subtotal - discount;
      const tax = data.tax || 0;
      const total = taxableAmount + tax;
      
      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (clinic_id, invoice_number, patient_id, invoice_type, subtotal, discount, tax, total, status, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [data.clinic_id, invoiceNumber, data.patient_id, data.invoice_type, subtotal, discount, tax, total, 'draft', data.notes, data.created_by]
      );
      const invoice = invoiceResult.rows[0];
      
      // Create invoice items
      for (const item of data.items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, service_name, service_name_ar, quantity, unit_price, total_price, reference_id, reference_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [invoice.id, item.service_name, item.service_name_ar, item.quantity, item.unit_price, item.quantity * item.unit_price, item.reference_id, item.reference_type]
        );
      }
      
      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status, data = {}) {
    const result = await db.query(
      `UPDATE invoices SET status = $1, status_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, data.status_notes || null, id]
    );
    return result.rows[0];
  },

  async cancel(id, reason) {
    const result = await db.query(
      `UPDATE invoices SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [reason, id]
    );
    return result.rows[0];
  },

  async getItems(invoiceId) {
    const result = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1`,
      [invoiceId]
    );
    return result.rows;
  }
};

// Payment Model
const PaymentModel = {
  async findByInvoice(invoiceId) {
    const result = await db.query(
      `SELECT p.*, u.username as received_by_name
       FROM payments p
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [invoiceId]
    );
    return result.rows;
  },

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Create payment
      const result = await client.query(
        `INSERT INTO payments (clinic_id, invoice_id, patient_id, amount, payment_method, reference_number, received_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [data.clinic_id, data.invoice_id, data.patient_id, data.amount, data.payment_method, data.reference_number, data.received_by, data.notes]
      );
      
      // Update invoice paid amount
      await client.query(
        `UPDATE invoices SET paid_amount = paid_amount + $1, 
         status = CASE WHEN (paid_amount + $1) >= total THEN 'paid' ELSE 'partial' END
         WHERE id = $2`,
        [data.amount, data.invoice_id]
      );
      
      // Update cash register if applicable
      if (data.cash_register_id) {
        await client.query(
          `UPDATE cash_registers SET current_balance = current_balance + $1 WHERE id = $2`,
          [data.amount, data.cash_register_id]
        );
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Get payment info
      const payment = await client.query(`SELECT * FROM payments WHERE id = $1`, [id]);
      
      if (payment.rows[0]) {
        // Reverse invoice paid amount
        await client.query(
          `UPDATE invoices SET paid_amount = paid_amount - $1,
           status = CASE WHEN (paid_amount - $1) <= 0 THEN 'unpaid' ELSE 'partial' END
           WHERE id = $2`,
          [payment.rows[0].amount, payment.rows[0].invoice_id]
        );
        
        // Delete payment
        await client.query(`DELETE FROM payments WHERE id = $1`, [id]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

// Insurance Claim Model
const InsuranceClaimModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT ic.*, 
             p.first_name || ' ' || p.last_name as patient_name,
             p.insurance_provider,
             i.policy_number
      FROM insurance_claims ic
      LEFT JOIN patients p ON ic.patient_id = p.id
      LEFT JOIN patient_insurance i ON p.id = i.patient_id AND i.is_active = true
      WHERE ic.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.status) {
      query += ` AND ic.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY ic.claim_date DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO insurance_claims (clinic_id, patient_id, invoice_id, claim_number, claim_amount, approved_amount, status, submitted_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.clinic_id, data.patient_id, data.invoice_id, data.claim_number, data.claim_amount, 0, 'submitted', data.submitted_date, data.notes]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, approvedAmount, notes) {
    const result = await db.query(
      `UPDATE insurance_claims SET status = $1, approved_amount = $2, processed_date = NOW(), notes = $3 WHERE id = $4 RETURNING *`,
      [status, approvedAmount || 0, notes, id]
    );
    return result.rows[0];
  }
};

// Expense Model
const ExpenseModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT e.*, u.username as created_by_name, c.name as category_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.category_id) {
      query += ` AND e.category_id = $${params.length + 1}`;
      params.push(filters.category_id);
    }
    if (filters.date_from) {
      query += ` AND e.expense_date >= $${params.length + 1}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ` AND e.expense_date <= $${params.length + 1}`;
      params.push(filters.date_to);
    }
    
    query += ` ORDER BY e.expense_date DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO expenses (clinic_id, category_id, description, amount, expense_date, receipt_number, paid_to, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.clinic_id, data.category_id, data.description, data.amount, data.expense_date, data.receipt_number, data.paid_to, data.notes, data.created_by]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query(`DELETE FROM expenses WHERE id = $1`, [id]);
  },

  async getTotalByCategory(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT c.name, SUM(e.amount) as total
       FROM expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.clinic_id = $1 AND e.expense_date BETWEEN $2 AND $3
       GROUP BY c.id, c.name
       ORDER BY total DESC`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

// Cash Register Model
const CashRegisterModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT cr.*, u.username as assigned_to_name
       FROM cash_registers cr
       LEFT JOIN users u ON cr.assigned_to = u.id
       WHERE cr.clinic_id = $1
       ORDER BY cr.id`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT cr.*, u.username as assigned_to_name
       FROM cash_registers cr
       LEFT JOIN users u ON cr.assigned_to = u.id
       WHERE cr.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO cash_registers (clinic_id, name, initial_balance, current_balance, status, assigned_to)
       VALUES ($1, $2, $3, $3, $4, $5) RETURNING *`,
      [data.clinic_id, data.name, data.initial_balance || 0, 'open', data.assigned_to]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, closingBalance) {
    const result = await db.query(
      `UPDATE cash_registers SET status = $1, closing_balance = $2, closed_at = NOW() WHERE id = $3 RETURNING *`,
      [status, closingBalance, id]
    );
    return result.rows[0];
  },

  async getTransactions(registerId, date) {
    const result = await db.query(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.cash_register_id = $1 AND DATE(p.payment_date) = $2
       ORDER BY p.payment_date DESC`,
      [registerId, date]
    );
    return result.rows;
  }
};

// Doctor Commission Model
const DoctorCommissionModel = {
  async calculateMonthly(doctorId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Get all completed invoices for this doctor in the month
    const result = await db.query(
      `SELECT i.*, ii.service_name, ii.total_price
       FROM invoices i
       JOIN invoice_items ii ON i.id = ii.invoice_id
       WHERE ii.reference_type = 'consultation' 
       AND i.status = 'paid'
       AND i.invoice_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    
    // Group by service and calculate commission
    const services = {};
    let totalAmount = 0;
    
    for (const row of result.rows) {
      const serviceName = row.service_name;
      if (!services[serviceName]) {
        services[serviceName] = { count: 0, total: 0 };
      }
      services[serviceName].count++;
      services[serviceName].total += parseFloat(row.total_price);
      totalAmount += parseFloat(row.total_price);
    }
    
    // Get doctor's commission rate
    const doctorResult = await db.query(
      `SELECT commission_rate FROM users WHERE id = $1`,
      [doctorId]
    );
    
    const commissionRate = doctorResult.rows[0]?.commission_rate || 0.1;
    const commissionAmount = totalAmount * commissionRate;
    
    return {
      doctor_id: doctorId,
      month,
      year,
      total_consultations: result.rows.length,
      total_amount: totalAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      services
    };
  },

  async createPayout(data) {
    const result = await db.query(
      `INSERT INTO doctor_commissions (doctor_id, period_month, period_year, total_amount, commission_amount, status, processed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.doctor_id, data.period_month, data.period_year, data.total_amount, data.commission_amount, 'paid', data.processed_by, data.notes]
    );
    return result.rows[0];
  },

  async findByDoctor(doctorId) {
    const result = await db.query(
      `SELECT * FROM doctor_commissions WHERE doctor_id = $1 ORDER BY period_year DESC, period_month DESC`,
      [doctorId]
    );
    return result.rows;
  }
};

module.exports = {
  ServicePricingModel,
  InvoiceModel,
  PaymentModel,
  InsuranceClaimModel,
  ExpenseModel,
  CashRegisterModel,
  DoctorCommissionModel
};
