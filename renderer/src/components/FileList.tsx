import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface File {
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface FileListProps {
  clinicId: number;
  refresh?: boolean;
  onRefreshComplete?: () => void;
}

const FileList: React.FC<FileListProps> = ({ clinicId, refresh, onRefreshComplete }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/files/list');
      setFiles(data.files || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
      onRefreshComplete?.();
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refresh]);

  const handleDownload = async (filename: string) => {
    try {
      const { data } = await api.get(`/files/download/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(t('common.error'));
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(t('common.confirm_delete', 'Are you sure?'))) return;
    try {
      await api.delete(`/files/${filename}`);
      setFiles(files.filter(f => f.filename !== filename));
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <div style={{ padding: '16px' }}>
      <h3>{t('common.files', 'Files')}</h3>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {files.length === 0 ? (
        <p>{t('common.no_files', 'No files')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.filename')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.size')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.type')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.uploaded', 'Uploaded')}</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{file.filename}</td>
                <td style={{ padding: '8px' }}>{(file.size / 1024).toFixed(2)} KB</td>
                <td style={{ padding: '8px' }}>{file.mimetype}</td>
                <td style={{ padding: '8px' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => handleDownload(file.filename)} style={{ marginRight: '8px' }}>
                    {t('common.download')}
                  </button>
                  <button onClick={() => handleDelete(file.filename)} style={{ color: 'red' }}>
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FileList;
