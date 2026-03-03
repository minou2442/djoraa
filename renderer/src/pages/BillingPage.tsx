import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  insurance_provider?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  patient_number: string;
  invoice_type: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  status: string;
  invoice_date: string;
  notes: string;
}

interface InvoiceItem {
  id: number;
  service_name: string;
  service_name_ar: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  reference_number: string;
  payment_date: string;
  received_by_name: string;
}

interface Service {
  id: number;
  name: string;
  name_ar: string;
  category: string;
  price: number;
  insurance_price: number;
}

interface Expense {
  id: number;
  category_name: string;
  description: string;
  amount: number;
  expense_date: string;
}

const BillingPage: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'invoices' | 'services' | 'expenses' | 'reports'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    invoice_type: 'consultation',
    items: [] as any[],
    discount: 0,
    tax: 0,
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'cash',
    reference_number: ''
  });
  const [expenseData, setExpenseData] = useState({
    category_id: '',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  });

  const statusColors: { [key: string]: string } = {
    unpaid: '#e74c3c',
    partial: '#f39c12',
    paid: '#27ae60',
    cancelled: '#95a5a6'
  };

  const paymentMethods = [
    { value: 'cash', label: t('billing.cash') },
    { value: 'card', label: t('billing.card') },
    { value: 'transfer', label: t('billing.transfer') },
    { value: 'cheque', label: t('billing.cheque') },
    { value: 'insurance', label: t('billing.insurance') }
  ];

  useEffect(() => {
    loadInvoices();
    loadServices();
    loadExpenses();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await api.get('/billing/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get('/users/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/billing/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await api.get('/billing/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadInvoiceDetails = async (invoice: Invoice) => {
    try {
      const [itemsRes, paymentsRes] = await Promise.all([
        api.get(`/billing/invoices/${invoice.id}`),
        api.get(`/billing/invoices/${invoice.id}/payments`)
      ]);
      setSelectedInvoice(invoice);
      setInvoiceItems(itemsRes.data.items || []);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error loading invoice details:', error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/billing/invoices', formData);
      setShowInvoiceModal(false);
      setFormData({
        patient_id: '',
        invoice_type: 'consultation',
        items: [],
        discount: 0,
        tax: 0,
        notes: ''
      });
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post('/billing/payments', {
        ...paymentData,
        invoice_id: selectedInvoice.id,
        patient_id: selectedInvoice.patient_id
      });
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, payment_method: 'cash', reference_number: '' });
      loadInvoiceDetails(selectedInvoice);
      loadInvoices();
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/billing/expenses', expenseData);
      setShowExpenseModal(false);
      setExpenseData({
        category_id: '',
        description: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0]
      });
      loadExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const addServiceToInvoice = (service: Service) => {
    const existing = formData.items.find((item: any) => item.service_id === service.id);
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map((item: any) =>
          item.service_id === service.id
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
            : item
        )
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            service_id: service.id,
            service_name: service.name,
            service_name_ar: service.name_ar,
            quantity: 1,
            unit_price: service.price,
            total_price: service.price
          }
        ]
      });
    }
  };

  const calculateInvoiceTotal = () => {
    const subtotal = formData.items.reduce((sum: number, item: any) => sum + item.total_price, 0);
    return {
      subtotal,
      total: subtotal - formData.discount + formData.tax
    };
  };

  const renderInvoicesView = () => (
    <div className="invoices-view">
      <div className="view-header">
        <h3>{t('billing.invoices')}</h3>
        <button
          className="btn-primary"
          onClick={() => {
            setFormData({
              patient_id: '',
              invoice_type: 'consultation',
              items: [],
              discount: 0,
              tax: 0,
              notes: ''
            });
            loadPatients();
            setShowInvoiceModal(true);
          }}
        >
          + {t('billing.newInvoice')}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>{t('billing.invoiceNumber')}</th>
            <th>{t('billing.patient')}</th>
            <th>{t('billing.date')}</th>
            <th>{t('billing.type')}</th>
            <th>{t('billing.total')}</th>
            <th>{t('billing.paid')}</th>
            <th>{t('billing.status')}</th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.patient_name}</td>
              <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
              <td>{t(`billing.types.${invoice.invoice_type}`)}</td>
              <td>{invoice.total.toFixed(2)}</td>
              <td>{invoice.paid_amount.toFixed(2)}</td>
              <td>
                <span className="status-badge" style={{ backgroundColor: statusColors[invoice.status] }}>
                  {t(`billing.statuses.${invoice.status}`)}
                </span>
              </td>
              <td>
                <button className="btn-link" onClick={() => loadInvoiceDetails(invoice)}>
                  {t('common.view')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('billing.invoiceDetails')} - {selectedInvoice.invoice_number}</h2>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="invoice-info">
                <div className="info-row">
                  <span>{t('billing.patient')}:</span>
                  <strong>{selectedInvoice.patient_name}</strong>
                </div>
                <div className="info-row">
                  <span>{t('billing.date')}:</span>
                  <strong>{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</strong>
                </div>
                <div className="info-row">
                  <span>{t('billing.status')}:</span>
                  <span className="status-badge" style={{ backgroundColor: statusColors[selectedInvoice.status] }}>
                    {t(`billing.statuses.${selectedInvoice.status}`)}
                  </span>
                </div>
              </div>

              <h4>{t('billing.items')}</h4>
              <table className="data-table-sm">
                <thead>
                  <tr>
                    <th>{t('billing.service')}</th>
                    <th>{t('billing.quantity')}</th>
                    <th>{t('billing.unitPrice')}</th>
                    <th>{t('billing.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.service_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price.toFixed(2)}</td>
                      <td>{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>{t('billing.subtotal')}</td>
                    <td>{selectedInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {selectedInvoice.discount > 0 && (
                    <tr>
                      <td colSpan={3}>{t('billing.discount')}</td>
                      <td>-{selectedInvoice.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  {selectedInvoice.tax > 0 && (
                    <tr>
                      <td colSpan={3}>{t('billing.tax')}</td>
                      <td>{selectedInvoice.tax.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan={3}>{t('billing.total')}</td>
                    <td>{selectedInvoice.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{t('billing.paid')}</td>
                    <td>{selectedInvoice.paid_amount.toFixed(2)}</td>
                  </tr>
                  <tr className="balance-row">
                    <td colSpan={3}>{t('billing.balance')}</td>
                    <td>{(selectedInvoice.total - selectedInvoice.paid_amount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <h4>{t('billing.payments')}</h4>
              {payments.length > 0 ? (
                <table className="data-table-sm">
                  <thead>
                    <tr>
                      <th>{t('billing.date')}</th>
                      <th>{t('billing.amount')}</th>
                      <th>{t('billing.method')}</th>
                      <th>{t('billing.reference')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.payment_date).toLocaleString()}</td>
                        <td>{payment.amount.toFixed(2)}</td>
                        <td>{t(`billing.${payment.payment_method}`)}</td>
                        <td>{payment.reference_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t('billing.noPayments')}</p>
              )}

              {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                <button
                  className="btn-primary mt-3"
                  onClick={() => {
                    setPaymentData({
                      amount: selectedInvoice.total - selectedInvoice.paid_amount,
                      payment_method: 'cash',
                      reference_number: ''
                    });
                    setShowPaymentModal(true);
                  }}
                >
                  {t('billing.addPayment')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderServicesView = () => (
    <div className="services-view">
      <div className="view-header">
        <h3>{t('billing.servicePricing')}</h3>
        <button className="btn-primary">{t('billing.addService')}</button>
      </div>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-category">{service.category}</div>
            <div className="service-name">{service.name}</div>
            <div className="service-price">
              <span className="price">{service.price.toFixed(2)}</span>
              <span className="currency">DZD</span>
            </div>
            {service.insurance_price && (
              <div className="service-insurance">
                Insurance: {service.insurance_price.toFixed(2)} DZD
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderExpensesView = () => (
    <div className="expenses-view">
      <div className="view-header">
        <h3>{t('billing.expenses')}</h3>
        <button
          className="btn-primary"
          onClick={() => setShowExpenseModal(true)}
        >
          + {t('billing.addExpense')}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>{t('billing.date')}</th>
            <th>{t('billing.category')}</th>
            <th>{t('billing.description')}</th>
            <th>{t('billing.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
              <td>{expense.category_name}</td>
              <td>{expense.description}</td>
              <td>{expense.amount.toFixed(2)} DZD</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const totals = calculateInvoiceTotal();

  return (
    <div className="page-container billing-page">
      <div className="page-header">
        <h1>{t('nav.billing')}</h1>
      </div>

      <div className="billing-tabs">
        <button className={view === 'invoices' ? 'active' : ''} onClick={() => setView('invoices')}>
          {t('billing.invoices')}
        </button>
        <button className={view === 'services' ? 'active' : ''} onClick={() => setView('services')}>
          {t('billing.services')}
        </button>
        <button className={view === 'expenses' ? 'active' : ''} onClick={() => setView('expenses')}>
          {t('billing.expenses')}
        </button>
      </div>

      {view === 'invoices' && renderInvoicesView()}
      {view === 'services' && renderServicesView()}
      {view === 'expenses' && renderExpensesView()}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('billing.newInvoice')}</h2>
              <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="modal-form">
              <div className="form-group">
                <label>{t('billing.patient')}</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patient_number} - {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('billing.type')}</label>
                <select
                  value={formData.invoice_type}
                  onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value })}
                >
                  <option value="consultation">{t('billing.types.consultation')}</option>
                  <option value="radiology">{t('billing.types.radiology')}</option>
                  <option value="laboratory">{t('billing.types.laboratory')}</option>
                  <option value="procedure">{t('billing.types.procedure')}</option>
                  <option value="other">{t('billing.types.other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('billing.services')}</label>
                <div className="service-selector">
                  {services.map(service => (
                    <button
                      type="button"
                      key={service.id}
                      className="service-btn"
                      onClick={() => addServiceToInvoice(service)}
                    >
                      + {service.name} ({service.price})
                    </button>
                  ))}
                </div>
              </div>

              {formData.items.length > 0 && (
                <div className="invoice-items">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('billing.service')}</th>
                        <th>{t('billing.quantity')}</th>
                        <th>{t('billing.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td>{item.service_name}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value);
                                setFormData({
                                  ...formData,
                                  items: formData.items.map((i: any, idx: number) =>
                                    idx === index
                                      ? { ...i, quantity: qty, total_price: qty * i.unit_price }
                                      : i
                                  )
                                });
                              }}
                              style={{ width: '60px' }}
                            />
                          </td>
                          <td>{item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>{t('billing.discount')}</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>{t('billing.tax')}</label>
                  <input
                    type="number"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="invoice-total">
                <span>{t('billing.total')}: {totals.total.toFixed(2)} DZD</span>
              </div>

              <div className="form-group">
                <label>{t('billing.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('billing.addPayment')}</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePayment} className="modal-form">
              <div className="form-group">
                <label>{t('billing.amount')}</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('billing.method')}</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('billing.reference')}</label>
                <input
                  type="text"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('billing.addExpense')}</h2>
              <button className="close-btn" onClick={() => setShowExpenseModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateExpense} className="modal-form">
              <div className="form-group">
                <label>{t('billing.category')}</label>
                <input
                  type="text"
                  value={expenseData.category_id}
                  onChange={(e) => setExpenseData({ ...expenseData, category_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('billing.description')}</label>
                <textarea
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('billing.amount')}</label>
                  <input
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('billing.date')}</label>
                  <input
                    type="date"
                    value={expenseData.expense_date}
                    onChange={(e) => setExpenseData({ ...expenseData, expense_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .billing-page { padding: 20px; }
        .billing-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #ddd; }
        .billing-tabs button {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
        }
        .billing-tabs button.active { border-bottom-color: #0066cc; color: #0066cc; }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .service-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
        .service-category { font-size: 12px; color: #666; text-transform: uppercase; }
        .service-name { font-weight: bold; margin: 8px 0; }
        .service-price { font-size: 24px; color: #0066cc; }
        .service-price .currency { font-size: 12px; color: #666; }
        .service-insurance { font-size: 12px; color: #27ae60; margin-top: 5px; }
        .service-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .service-btn { padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; }
        .invoice-items { margin: 15px 0; }
        .invoice-items table { width: 100%; border-collapse: collapse; }
        .invoice-items th, .invoice-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .invoice-total { text-align: right; font-size: 20px; font-weight: bold; margin: 15px 0; }
        .modal-lg { max-width: 700px; }
        .modal-body { padding: 20px; }
        .invoice-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .data-table-sm { width: 100%; border-collapse: collapse; }
        .data-table-sm th, .data-table-sm td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; }
        .balance-row { font-weight: bold; color: #e74c3c; }
        .mt-3 { margin-top: 15px; }
      `}</style>
    </div>
  );
};

export default BillingPage;
