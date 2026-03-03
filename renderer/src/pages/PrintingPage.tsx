import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface PrintTemplate {
  id: number;
  name: string;
  type: string;
  is_default: boolean;
}

const PrintingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [selectedTemplate, setSelectedTemplate] = useState<string>('prescription');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print options
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [patientId, setPatientId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [labId, setLabId] = useState('');
  const [radiologyId, setRadiologyId] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const printTemplates = [
    { id: 'patient_list', name: t('printing.patientList', 'Liste des patients'), icon: '👥' },
    { id: 'medical_file', name: t('printing.medicalFile', 'Dossier médical'), icon: '📋' },
    { id: 'consultation', name: t('printing.consultation', 'Rapport consultation'), icon: '🩺' },
    { id: 'prescription', name: t('printing.prescription', 'Ordonnance'), icon: '💊' },
    { id: 'invoice', name: t('printing.invoice', 'Facture'), icon: '📄' },
    { id: 'receipt', name: t('printing.receipt', 'Reçu'), icon: '🧾' },
    { id: 'lab_report', name: t('printing.labReport', 'Rapport laboratoire'), icon: '🔬' },
    { id: 'radiology_report', name: t('printing.radiologyReport', 'Rapport radiologie'), icon: '☢️' },
    { id: 'statistical', name: t('printing.statistical', 'Rapport statistique'), icon: '📊' },
  ];

  const handlePrint = async () => {
    setLoading(true);
    setMessage(null);

    try {
      let endpoint = '';
      let filename = 'document.pdf';

      switch (selectedTemplate) {
        case 'patient_list':
          endpoint = `/api/printing/patients?date_from=${dateFrom}&date_to=${dateTo}`;
          filename = 'patient_list.pdf';
          break;
        case 'medical_file':
          endpoint = `/api/printing/medical-file/${patientId}`;
          filename = `medical_file_${patientId}.pdf`;
          break;
        case 'consultation':
          endpoint = `/api/printing/consultation/${visitId}`;
          filename = `consultation_${visitId}.pdf`;
          break;
        case 'prescription':
          endpoint = `/api/printing/prescription/${visitId}`;
          filename = `ordonnance_${visitId}.pdf`;
          break;
        case 'invoice':
          endpoint = `/api/printing/invoice/${invoiceId}`;
          filename = `invoice_${invoiceId}.pdf`;
          break;
        case 'receipt':
          endpoint = `/api/printing/receipt/${paymentId}`;
          filename = `receipt_${paymentId}.pdf`;
          break;
        case 'lab_report':
          endpoint = `/api/printing/laboratory/${labId}`;
          filename = `lab_report_${labId}.pdf`;
          break;
        case 'radiology_report':
          endpoint = `/api/printing/radiology/${radiologyId}`;
          filename = `radiology_${radiologyId}.pdf`;
          break;
        case 'statistical':
          endpoint = `/api/printing/statistical?date_from=${dateFrom}&date_to=${dateTo}`;
          filename = 'statistical_report.pdf';
          break;
        default:
          throw new Error('Invalid template');
      }

      const response = await api.get(endpoint, { responseType: 'blob' });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: t('printing.success', 'Document generated successfully') });
    } catch (error: any) {
      console.error('Print error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || t('printing.error', 'Failed to generate document') 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedTemplate) {
      case 'patient_list':
      case 'statistical':
        return (
          <div className="form-grid">
            <div className="form-group">
              <label>{t('reports.dateFrom', 'Date de début')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('reports.dateTo', 'Date de fin')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        );

      case 'medical_file':
        return (
          <div className="form-group">
            <label>{t('patients.id', 'ID Patient')} *</label>
            <input
              type="number"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder={t('printing.enterPatientId', 'Entrez ID patient')}
            />
          </div>
        );

      case 'consultation':
      case 'prescription':
        return (
          <div className="form-group">
            <label>{t('printing.visitId', 'ID Visite')} *</label>
            <input
              type="number"
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              placeholder={t('printing.enterVisitId', 'Entrez ID visite')}
            />
          </div>
        );

      case 'invoice':
        return (
          <div className="form-group">
            <label>{t('billing.invoiceNumber', 'N° Facture')} *</label>
            <input
              type="number"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder={t('printing.enterInvoiceId', 'Entrez ID facture')}
            />
          </div>
        );

      case 'receipt':
        return (
          <div className="form-group">
            <label>{t('printing.paymentId', 'ID Paiement')} *</label>
            <input
              type="number"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder={t('printing.enterPaymentId', 'Entrez ID paiement')}
            />
          </div>
        );

      case 'lab_report':
        return (
          <div className="form-group">
            <label>{t('printing.labId', 'ID Laboratoire')} *</label>
            <input
              type="number"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              placeholder={t('printing.enterLabId', 'Entrez ID laboratoire')}
            />
          </div>
        );

      case 'radiology_report':
        return (
          <div className="form-group">
            <label>{t('printing.radiologyId', 'ID Radiologie')} *</label>
            <input
              type="number"
              value={radiologyId}
              onChange={(e) => setRadiologyId(e.target.value)}
              placeholder={t('printing.enterRadiologyId', 'Entrez ID radiologie')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="page-header">
        <h1>{t('printing.title', 'Impression')}</h1>
      </div>

      <div className="printing-container">
        <div className="template-selection">
          <h2>{t('printing.selectDocument', 'Sélectionner document')}</h2>
          <div className="template-grid">
            {printTemplates.map(template => (
              <button
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <span className="template-icon">{template.icon}</span>
                <span className="template-name">{template.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="print-options">
          <h2>{t('printing.options', 'Options')}</h2>
          <div className="form-section">
            {renderForm()}
            
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button 
              className="btn btn-primary btn-block"
              onClick={handlePrint}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">{t('common.loading', 'Chargement...')}</span>
              ) : (
                <>🖨️ {t('printing.generate', 'Générer PDF')}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .printing-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .template-selection, .print-options {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .template-selection h2, .print-options h2 {
          margin-bottom: 15px;
          color: #2c5282;
          font-size: 16px;
        }
        
        .template-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .template-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .template-card:hover {
          border-color: #2c5282;
          background: #f7fafc;
        }
        
        .template-card.selected {
          border-color: #2c5282;
          background: #ebf8ff;
        }
        
        .template-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .template-name {
          font-size: 12px;
          text-align: center;
          color: #4a5568;
        }
        
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
        }
        
        .form-group input, .form-group select {
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          font-size: 14px;
        }
        
        .btn-block {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .message {
          padding: 10px;
          border-radius: 5px;
          font-size: 13px;
        }
        
        .message.success {
          background: #c6f6d5;
          color: #22543d;
        }
        
        .message.error {
          background: #fed7d7;
          color: #c53030;
        }
        
        @media (max-width: 768px) {
          .printing-container {
            grid-template-columns: 1fr;
          }
          
          .template-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintingPage;
