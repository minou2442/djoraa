const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { requirePermission } = require('../middleware/roles');

// Service Pricing Routes
router.get('/services', billingController.getServices);
router.post('/services', requirePermission('billing_manage'), billingController.createService);
router.put('/services/:id', requirePermission('billing_manage'), billingController.updateService);
router.delete('/services/:id', requirePermission('billing_manage'), billingController.deleteService);

// Invoice Routes
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.post('/invoices', requirePermission('billing_create'), billingController.createInvoice);
router.put('/invoices/:id/status', requirePermission('billing_manage'), billingController.updateInvoiceStatus);
router.post('/invoices/:id/cancel', requirePermission('billing_manage'), billingController.cancelInvoice);

// Payment Routes
router.get('/invoices/:invoiceId/payments', billingController.getPayments);
router.post('/payments', requirePermission('billing_create'), billingController.createPayment);
router.delete('/payments/:id', requirePermission('billing_manage'), billingController.deletePayment);

// Insurance Claims Routes
router.get('/insurance-claims', billingController.getInsuranceClaims);
router.post('/insurance-claims', requirePermission('billing_create'), billingController.createInsuranceClaim);
router.put('/insurance-claims/:id', requirePermission('billing_manage'), billingController.updateInsuranceClaim);

// Expense Routes
router.get('/expenses', billingController.getExpenses);
router.post('/expenses', requirePermission('expenses_manage'), billingController.createExpense);
router.delete('/expenses/:id', requirePermission('expenses_manage'), billingController.deleteExpense);
router.get('/expenses/summary', billingController.getExpenseSummary);

// Cash Register Routes
router.get('/cash-registers', billingController.getCashRegisters);
router.post('/cash-registers', requirePermission('cash_register_manage'), billingController.createCashRegister);
router.post('/cash-registers/:id/open', requirePermission('cash_register_manage'), billingController.openCashRegister);
router.post('/cash-registers/:id/close', requirePermission('cash_register_manage'), billingController.closeCashRegister);
router.get('/cash-registers/:id/transactions', billingController.getCashRegisterTransactions);

// Doctor Commission Routes
router.get('/commissions/calculate', billingController.calculateCommission);
router.post('/commissions/payout', requirePermission('commissions_manage'), billingController.createCommissionPayout);
router.get('/commissions/doctor/:doctorId', billingController.getDoctorCommissions);

// Financial Summary
router.get('/summary', billingController.getFinancialSummary);

module.exports = router;
