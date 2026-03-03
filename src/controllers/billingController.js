const {
  ServicePricingModel,
  InvoiceModel,
  PaymentModel,
  InsuranceClaimModel,
  ExpenseModel,
  CashRegisterModel,
  DoctorCommissionModel
} = require('../models/billing');
const { logAction } = require('../utils/auditService');
const db = require('../utils/db');

// Service Pricing
const getServices = async (req, res) => {
  try {
    const services = await ServicePricingModel.findAll(req.clinicId);
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

const createService = async (req, res) => {
  try {
    const service = await ServicePricingModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'service_pricing', service.id, service);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await ServicePricingModel.update(req.params.id, req.body);
    await logAction(req, 'UPDATE', 'service_pricing', service.id, service);
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

const deleteService = async (req, res) => {
  try {
    await ServicePricingModel.delete(req.params.id);
    await logAction(req, 'DELETE', 'service_pricing', req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

// Invoices
const getInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceModel.findAll(req.clinicId, req.query);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const items = await InvoiceModel.getItems(req.params.id);
    res.json({ ...invoice, items });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoice = await InvoiceModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      created_by: req.userId
    });
    await logAction(req, 'CREATE', 'invoice', invoice.id, invoice);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, status_notes } = req.body;
    const invoice = await InvoiceModel.updateStatus(req.params.id, status, { status_notes });
    await logAction(req, 'UPDATE', 'invoice', invoice.id, { status });
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
};

const cancelInvoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await InvoiceModel.cancel(req.params.id, reason);
    await logAction(req, 'UPDATE', 'invoice', invoice.id, { status: 'cancelled' });
    res.json(invoice);
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
};

// Payments
const getPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.findByInvoice(req.params.invoiceId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

const createPayment = async (req, res) => {
  try {
    const payment = await PaymentModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      received_by: req.userId
    });
    await logAction(req, 'CREATE', 'payment', payment.id, payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

const deletePayment = async (req, res) => {
  try {
    await PaymentModel.delete(req.params.id);
    await logAction(req, 'DELETE', 'payment', req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

// Insurance Claims
const getInsuranceClaims = async (req, res) => {
  try {
    const claims = await InsuranceClaimModel.findAll(req.clinicId, req.query);
    res.json(claims);
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claims' });
  }
};

const createInsuranceClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaimModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'insurance_claim', claim.id, claim);
    res.status(201).json(claim);
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    res.status(500).json({ error: 'Failed to create insurance claim' });
  }
};

const updateInsuranceClaim = async (req, res) => {
  try {
    const { status, approved_amount, notes } = req.body;
    const claim = await InsuranceClaimModel.updateStatus(req.params.id, status, approved_amount, notes);
    await logAction(req, 'UPDATE', 'insurance_claim', claim.id, claim);
    res.json(claim);
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    res.status(500).json({ error: 'Failed to update insurance claim' });
  }
};

// Expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseModel.findAll(req.clinicId, req.query);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await ExpenseModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      created_by: req.userId
    });
    await logAction(req, 'CREATE', 'expense', expense.id, expense);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await ExpenseModel.delete(req.params.id);
    await logAction(req, 'DELETE', 'expense', req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const summary = await ExpenseModel.getTotalByCategory(req.clinicId, date_from, date_to);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

// Cash Registers
const getCashRegisters = async (req, res) => {
  try {
    const registers = await CashRegisterModel.findAll(req.clinicId);
    res.json(registers);
  } catch (error) {
    console.error('Error fetching cash registers:', error);
    res.status(500).json({ error: 'Failed to fetch cash registers' });
  }
};

const createCashRegister = async (req, res) => {
  try {
    const register = await CashRegisterModel.create(req.body);
    await logAction(req, 'CREATE', 'cash_register', register.id, register);
    res.status(201).json(register);
  } catch (error) {
    console.error('Error creating cash register:', error);
    res.status(500).json({ error: 'Failed to create cash register' });
  }
};

const openCashRegister = async (req, res) => {
  try {
    const register = await CashRegisterModel.updateStatus(req.params.id, 'open', null);
    res.json(register);
  } catch (error) {
    console.error('Error opening cash register:', error);
    res.status(500).json({ error: 'Failed to open cash register' });
  }
};

const closeCashRegister = async (req, res) => {
  try {
    const { closing_balance } = req.body;
    const register = await CashRegisterModel.updateStatus(req.params.id, 'closed', closing_balance);
    await logAction(req, 'UPDATE', 'cash_register', register.id, { status: 'closed', closing_balance });
    res.json(register);
  } catch (error) {
    console.error('Error closing cash register:', error);
    res.status(500).json({ error: 'Failed to close cash register' });
  }
};

const getCashRegisterTransactions = async (req, res) => {
  try {
    const { date } = req.query;
    const transactions = await CashRegisterModel.getTransactions(req.params.id, date);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Doctor Commissions
const calculateCommission = async (req, res) => {
  try {
    const { doctor_id, month, year } = req.query;
    const calculation = await DoctorCommissionModel.calculateMonthly(doctor_id, parseInt(month), parseInt(year));
    res.json(calculation);
  } catch (error) {
    console.error('Error calculating commission:', error);
    res.status(500).json({ error: 'Failed to calculate commission' });
  }
};

const createCommissionPayout = async (req, res) => {
  try {
    const payout = await DoctorCommissionModel.createPayout({
      ...req.body,
      processed_by: req.userId
    });
    await logAction(req, 'CREATE', 'doctor_commission', payout.id, payout);
    res.status(201).json(payout);
  } catch (error) {
    console.error('Error creating commission payout:', error);
    res.status(500).json({ error: 'Failed to create commission payout' });
  }
};

const getDoctorCommissions = async (req, res) => {
  try {
    const commissions = await DoctorCommissionModel.findByDoctor(req.params.doctorId);
    res.json(commissions);
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
};

// Financial Summary
const getFinancialSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    // Get invoice totals
    const invoiceResult = await db.query(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(total) as total_amount,
        SUM(paid_amount) as paid_amount,
        SUM(total - paid_amount) as outstanding_amount
       FROM invoices 
       WHERE clinic_id = $1 AND invoice_date BETWEEN $2 AND $3`,
      [req.clinicId, date_from, date_to]
    );
    
    // Get payment totals
    const paymentResult = await db.query(
      `SELECT SUM(amount) as total_payments
       FROM payments
       WHERE clinic_id = $1 AND payment_date BETWEEN $2 AND $3`,
      [req.clinicId, date_from, date_to]
    );
    
    // Get expense totals
    const expenseResult = await db.query(
      `SELECT SUM(amount) as total_expenses
       FROM expenses
       WHERE clinic_id = $1 AND expense_date BETWEEN $2 AND $3`,
      [req.clinicId, date_from, date_to]
    );
    
    res.json({
      invoices: invoiceResult.rows[0],
      payments: paymentResult.rows[0],
      expenses: expenseResult.rows[0],
      net_income: (parseFloat(paymentResult.rows[0].total_payments || 0) - parseFloat(expenseResult.rows[0].total_expenses || 0))
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
};

module.exports = {
  // Service Pricing
  getServices,
  createService,
  updateService,
  deleteService,
  // Invoices
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoiceStatus,
  cancelInvoice,
  // Payments
  getPayments,
  createPayment,
  deletePayment,
  // Insurance Claims
  getInsuranceClaims,
  createInsuranceClaim,
  updateInsuranceClaim,
  // Expenses
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseSummary,
  // Cash Registers
  getCashRegisters,
  createCashRegister,
  openCashRegister,
  closeCashRegister,
  getCashRegisterTransactions,
  // Doctor Commissions
  calculateCommission,
  createCommissionPayout,
  getDoctorCommissions,
  // Summary
  getFinancialSummary
};
