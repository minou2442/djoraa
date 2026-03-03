import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface DashboardSummary {
  today: { appointments: number; patients: number; revenue: number };
  this_month: { new_patients: number; revenue: number };
  pending: { labs: number; radiology: number };
  outstanding: { invoices: number; amount: number };
}

interface DiseaseFrequency {
  disease_name: string;
  frequency: number;
}

interface RevenueData {
  date: string;
  total_revenue: number;
  transaction_count: number;
}

interface DoctorProductivity {
  doctor_name: string;
  consultations: number;
  lab_requests: number;
  radiology_exams: number;
  appointments: number;
}

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'dashboard' | 'medical' | 'financial' | 'export'>('dashboard');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [diseaseData, setDiseaseData] = useState<DiseaseFrequency[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productivityData, setProductivityData] = useState<DoctorProductivity[]>([]);
  const [labVolume, setLabVolume] = useState<any[]>([]);
  const [radiologyVolume, setRadiologyVolume] = useState<any[]>([]);
  const [demographics, setDemographics] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadMedicalReports = async () => {
    try {
      const [diseaseRes, labRes, radiologyRes, demoRes, apptRes] = await Promise.all([
        api.get(`/reports/medical/disease-frequency?date_from=${dateFrom}&date_to=${dateTo}`),
        api.get(`/reports/medical/lab-volume?date_from=${dateFrom}&date_to=${dateTo}`),
        api.get(`/reports/medical/radiology-volume?date_from=${dateFrom}&date_to=${dateTo}`),
        api.get('/reports/medical/demographics'),
        api.get(`/reports/medical/appointments?date_from=${dateFrom}&date_to=${dateTo}`)
      ]);
      setDiseaseData(diseaseRes.data);
      setLabVolume(labRes.data);
      setRadiologyVolume(radiologyRes.data);
      setDemographics(demoRes.data);
    } catch (error) {
      console.error('Error loading medical reports:', error);
    }
  };

  const loadFinancialReports = async () => {
    try {
      const [revenueRes, productivityRes] = await Promise.all([
        api.get(`/reports/financial/daily-revenue?date_from=${dateFrom}&date_to=${dateTo}`),
        api.get(`/reports/financial/doctor-productivity?date_from=${dateFrom}&date_to=${dateTo}`)
      ]);
      setRevenueData(revenueRes.data);
      setProductivityData(productivityRes.data);
    } catch (error) {
      console.error('Error loading financial reports:', error);
    }
  };

  const handleViewChange = (newView: string) => {
    setView(newView as any);
    if (newView === 'medical') loadMedicalReports();
    if (newView === 'financial') loadFinancialReports();
  };

  const exportToCSV = async (type: string) => {
    try {
      let url = '';
      switch (type) {
        case 'patients':
          url = '/reports/export/patients';
          break;
        case 'invoices':
          url = `/reports/export/invoices?date_from=${dateFrom}&date_to=${dateTo}`;
          break;
        case 'payments':
          url = `/reports/export/payments?date_from=${dateFrom}&date_to=${dateTo}`;
          break;
      }
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${type}_${dateFrom}_${dateTo}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  };

  const renderDashboard = () => (
    <div className="dashboard-view">
      {summary && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon today-appts">📅</div>
              <div className="card-content">
                <div className="card-value">{summary.today.appointments}</div>
                <div className="card-label">{t('reports.todayAppointments')}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon today-patients">👥</div>
              <div className="card-content">
                <div className="card-value">{summary.today.patients}</div>
                <div className="card-label">{t('reports.todayPatients')}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon today-revenue">💰</div>
              <div className="card-content">
                <div className="card-value">{formatCurrency(summary.today.revenue)}</div>
                <div className="card-label">{t('reports.todayRevenue')}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon month-patients">📈</div>
              <div className="card-content">
                <div className="card-value">{summary.this_month.new_patients}</div>
                <div className="card-label">{t('reports.monthPatients')}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon month-revenue">💵</div>
              <div className="card-content">
                <div className="card-value">{formatCurrency(summary.this_month.revenue)}</div>
                <div className="card-label">{t('reports.monthRevenue')}</div>
              </div>
            </div>
            <div className="summary-card warning">
              <div className="card-icon pending">⏳</div>
              <div className="card-content">
                <div className="card-value">{summary.pending.labs + summary.pending.radiology}</div>
                <div className="card-label">{t('reports.pendingItems')}</div>
              </div>
            </div>
            <div className="summary-card alert">
              <div className="card-icon outstanding">⚠️</div>
              <div className="card-content">
                <div className="card-value">{summary.outstanding.invoices}</div>
                <div className="card-label">{t('reports.outstandingInvoices')}</div>
                <div className="card-sub">{formatCurrency(summary.outstanding.amount)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMedicalReports = () => (
    <div className="medical-reports">
      <div className="report-section">
        <h3>{t('reports.diseaseFrequency')}</h3>
        {diseaseData.length > 0 ? (
          <div className="chart-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('reports.disease')}</th>
                  <th>{t('reports.frequency')}</th>
                </tr>
              </thead>
              <tbody>
                {diseaseData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.disease_name}</td>
                    <td>
                      <div className="bar-cell">
                        <div className="bar" style={{ width: `${(item.frequency / diseaseData[0].frequency) * 100}%` }}></div>
                        <span>{item.frequency}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('reports.noData')}</p>
        )}
      </div>

      <div className="report-section">
        <h3>{t('reports.labVolume')}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{labVolume.reduce((sum, r) => sum + parseInt(r.total_requests), 0)}</div>
            <div className="stat-label">{t('reports.total')}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{labVolume.reduce((sum, r) => sum + parseInt(r.completed), 0)}</div>
            <div className="stat-label">{t('reports.completed')}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{labVolume.reduce((sum, r) => sum + parseInt(r.pending), 0)}</div>
            <div className="stat-label">{t('reports.pending')}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>{t('reports.radiologyVolume')}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{radiologyVolume.length}</div>
            <div className="stat-label">{t('reports.totalExams')}</div>
          </div>
        </div>
      </div>

      {demographics && (
        <div className="report-section">
          <h3>{t('reports.demographics')}</h3>
          <div className="demographics-grid">
            <div className="demo-card">
              <h4>{t('reports.byGender')}</h4>
              {demographics.by_gender?.map((g: any) => (
                <div key={g.gender} className="demo-row">
                  <span>{g.gender || 'N/A'}</span>
                  <span>{g.count}</span>
                </div>
              ))}
            </div>
            <div className="demo-card">
              <h4>{t('reports.byAge')}</h4>
              {demographics.by_age?.map((a: any) => (
                <div key={a.age_group} className="demo-row">
                  <span>{a.age_group}</span>
                  <span>{a.count}</span>
                </div>
              ))}
            </div>
            <div className="demo-card">
              <h4>{t('reports.byCity')}</h4>
              {demographics.by_city?.slice(0, 5).map((c: any) => (
                <div key={c.city} className="demo-row">
                  <span>{c.city || 'N/A'}</span>
                  <span>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFinancialReports = () => {
    const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.total_revenue), 0);
    const totalTransactions = revenueData.reduce((sum, r) => sum + Number(r.transaction_count), 0);

    return (
      <div className="financial-reports">
        <div className="report-section">
          <h3>{t('reports.revenue')}</h3>
          <div className="stats-grid">
            <div className="stat-card large">
              <div className="stat-value">{formatCurrency(totalRevenue)}</div>
              <div className="stat-label">{t('reports.totalRevenue')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalTransactions}</div>
              <div className="stat-label">{t('reports.transactions')}</div>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>{t('reports.dailyRevenue')}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('reports.date')}</th>
                <th>{t('reports.revenue')}</th>
                <th>{t('reports.transactions')}</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  <td>{formatCurrency(Number(row.total_revenue))}</td>
                  <td>{row.transaction_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-section">
          <h3>{t('reports.doctorProductivity')}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('reports.doctor')}</th>
                <th>{t('reports.consultations')}</th>
                <th>{t('reports.labRequests')}</th>
                <th>{t('reports.radiologyExams')}</th>
                <th>{t('reports.appointments')}</th>
              </tr>
            </thead>
            <tbody>
              {productivityData.map((doc, idx) => (
                <tr key={idx}>
                  <td>{doc.doctor_name}</td>
                  <td>{doc.consultations}</td>
                  <td>{doc.lab_requests}</td>
                  <td>{doc.radiology_exams}</td>
                  <td>{doc.appointments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExport = () => (
    <div className="export-view">
      <div className="date-range">
        <div className="form-group">
          <label>{t('reports.dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('reports.dateTo')}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="export-options">
        <div className="export-card" onClick={() => exportToCSV('patients')}>
          <div className="export-icon">👥</div>
          <div className="export-info">
            <h4>{t('reports.exportPatients')}</h4>
            <p>{t('reports.exportPatientsDesc')}</p>
          </div>
          <button className="btn-export">CSV</button>
        </div>

        <div className="export-card" onClick={() => exportToCSV('invoices')}>
          <div className="export-icon">📄</div>
          <div className="export-info">
            <h4>{t('reports.exportInvoices')}</h4>
            <p>{t('reports.exportInvoicesDesc')}</p>
          </div>
          <button className="btn-export">CSV</button>
        </div>

        <div className="export-card" onClick={() => exportToCSV('payments')}>
          <div className="export-icon">💳</div>
          <div className="export-info">
            <h4>{t('reports.exportPayments')}</h4>
            <p>{t('reports.exportPaymentsDesc')}</p>
          </div>
          <button className="btn-export">CSV</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container reports-page">
      <div className="page-header">
        <h1>{t('nav.reports')}</h1>
      </div>

      <div className="reports-tabs">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
          {t('reports.dashboard')}
        </button>
        <button className={view === 'medical' ? 'active' : ''} onClick={() => handleViewChange('medical')}>
          {t('reports.medical')}
        </button>
        <button className={view === 'financial' ? 'active' : ''} onClick={() => handleViewChange('financial')}>
          {t('reports.financial')}
        </button>
        <button className={view === 'export' ? 'active' : ''} onClick={() => setView('export')}>
          {t('reports.export')}
        </button>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'medical' && renderMedicalReports()}
      {view === 'financial' && renderFinancialReports()}
      {view === 'export' && renderExport()}

      <style>{`
        .reports-page { padding: 20px; }
        .reports-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #ddd; }
        .reports-tabs button {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
        }
        .reports-tabs button.active { border-bottom-color: #0066cc; color: #0066cc; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-card {
          background: white; padding: 20px; border-radius: 12px; border: 1px solid #ddd;
          display: flex; align-items: center; gap: 15px;
        }
        .summary-card.warning { border-left: 4px solid #f39c12; }
        .summary-card.alert { border-left: 4px solid #e74c3c; }
        .card-icon { font-size: 32px; }
        .card-value { font-size: 28px; font-weight: bold; color: #2c3e50; }
        .card-label { font-size: 14px; color: #7f8c8d; }
        .card-sub { font-size: 12px; color: #e74c3c; }
        .report-section { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .report-section h3 { margin-bottom: 15px; color: #2c3e50; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: #d5f4e6; }
        .stat-card.warning { background: #fef5e7; }
        .stat-card.large { grid-column: span 2; }
        .stat-value { font-size: 32px; font-weight: bold; color: #2c3e50; }
        .stat-label { font-size: 14px; color: #7f8c8d; }
        .bar-cell { display: flex; align-items: center; gap: 10px; }
        .bar { height: 20px; background: #3498db; border-radius: 4px; min-width: 20px; }
        .demographics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .demo-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .demo-card h4 { margin-bottom: 10px; color: #2c3e50; }
        .demo-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .export-options { display: grid; gap: 15px; }
        .export-card {
          background: white; padding: 20px; border-radius: 12px; border: 1px solid #ddd;
          display: flex; align-items: center; gap: 15px; cursor: pointer; transition: all 0.2s;
        }
        .export-card:hover { border-color: #0066cc; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .export-icon { font-size: 40px; }
        .export-info { flex: 1; }
        .export-info h4 { margin: 0 0 5px 0; }
        .export-info p { margin: 0; color: #7f8c8d; font-size: 14px; }
        .btn-export { padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 6px; }
        .date-range { display: flex; gap: 20px; margin-bottom: 20px; }
        .date-range .form-group { flex: 1; }
        .date-range input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
      `}</style>
    </div>
  );
};

export default ReportsPage;
