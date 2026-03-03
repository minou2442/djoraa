import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './DocumentUpload.css';

interface DocumentUploadProps {
  patientId: string;
  onClose: () => void;
  onUploaded: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ patientId, onClose, onUploaded }) => {
  const { t } = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const allowedTypes = [
    'Lab Result',
    'Radiology',
    'Prescription',
    'ID Proof',
    'Insurance Card',
    'Other'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const validate = (): boolean => {
    if (!file) {
      setError(t('file_required'));
      return false;
    }
    if (!documentType) {
      setError(t('document_type_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append('file', file!);
    formData.append('document_type', documentType);
    if (documentDate) formData.append('document_date', documentDate);

    try {
      setUploading(true);
      await axios.post(`/api/patients/${patientId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_upload_document'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('upload_document')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="document-upload-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="file">{t('select_file')} *</label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleFileChange}
                accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="document_type">{t('document_type')} *</label>
              <select
                id="document_type"
                name="document_type"
                value={documentType}
                onChange={e => setDocumentType(e.target.value)}
                required
              >
                <option value="">{t('select_type')}</option>
                {allowedTypes.map(type => (
                  <option key={type} value={type}>{t(type.toLowerCase().replace(' ', '_')) || type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="document_date">{t('document_date')}</label>
              <input
                type="date"
                id="document_date"
                name="document_date"
                value={documentDate}
                onChange={e => setDocumentDate(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" type="submit" disabled={uploading}>
              {uploading ? t('uploading') + '...' : t('upload')}
            </button>
            <button className="btn-secondary" type="button" onClick={onClose}>{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUpload;
