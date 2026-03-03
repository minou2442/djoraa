import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface PDFViewerProps {
  template: string; // Template name (e.g., 'prescription', 'invoice')
  data: Record<string, any>;
  filename?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ template, data, filename }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const { data: pdfBuffer } = await api.post(
        '/files/generate-pdf',
        {
          template,
          data,
          filename: filename || `${template}_${Date.now()}.pdf`
        },
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(pdfBuffer);
      setPdfUrl(url);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || `document_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '20px' }}>
      <h3>{t('common.generate_pdf', 'Generate PDF')}</h3>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <button onClick={handleGeneratePDF} disabled={loading} style={{ marginBottom: '12px' }}>
        {loading ? t('common.loading') : t('common.generate_pdf', 'Generate PDF')}
      </button>

      {pdfUrl && (
        <div>
          <button onClick={handleDownload} style={{ marginBottom: '12px', color: 'blue' }}>
            {t('common.download')}
          </button>
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
            title="PDF Viewer"
          />
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
