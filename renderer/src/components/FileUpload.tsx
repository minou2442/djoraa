import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface FileUploadProps {
  clinicId: number;
  userId: number;
  onUploadSuccess?: (file: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ clinicId, userId, onUploadSuccess }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t('common.error'));
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clinic_id', clinicId.toString());
      formData.append('user_id', userId.toString());

      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setFile(null);
      onUploadSuccess?.(data);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '20px' }}>
      <h3>{t('common.upload', 'Upload File')}</h3>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '10px' }}>{t('common.success')}</div>}
      <form onSubmit={handleUpload}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf,.txt"
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </div>
        {file && <p>{t('common.selected_file', 'Selected')}: {file.name}</p>}
        <button type="submit" disabled={loading || !file}>
          {loading ? t('common.loading') : t('common.upload', 'Upload')}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
