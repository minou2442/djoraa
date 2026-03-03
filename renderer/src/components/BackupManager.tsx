import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
  clinicId: number;
}

interface BackupManagerProps {
  userRole?: string; // 'superadmin' | 'clinic_admin'
}

const BackupManager: React.FC<BackupManagerProps> = ({ userRole = 'clinic_admin' }) => {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/files/backups');
      setBackups(data.backups || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/files/backup');
      setSuccess(t('common.backup_created', 'Backup created successfully'));
      fetchBackups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(t('common.confirm_delete', 'Are you sure?'))) return;
    try {
      await api.delete(`/files/backups/${filename}`);
      setBackups(backups.filter(b => b.filename !== filename));
      setSuccess(t('common.backup_deleted', 'Backup deleted'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(t('common.confirm_restore', 'Restore database from this backup? This cannot be undone.'))) {
      return;
    }
    try {
      setLoading(true);
      await api.post('/files/restore', { filename });
      setSuccess(t('common.backup_restored', 'Backup restored successfully'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const isSuperadmin = userRole === 'superadmin';

  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', marginBottom: '20px' }}>
      <h3>{t('common.database_backups', 'Database Backups')}</h3>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

      <div style={{ marginBottom: '16px' }}>
        <button onClick={handleCreateBackup} disabled={loading}>
          {loading ? t('common.loading') : t('common.create_backup', 'Create Backup')}
        </button>
      </div>

      {backups.length === 0 ? (
        <p>{t('common.no_backups', 'No backups available')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.filename')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.size')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.created', 'Created')}</th>
              {isSuperadmin && <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.clinic_id')}</th>}
              <th style={{ textAlign: 'center', padding: '8px' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{backup.filename}</td>
                <td style={{ padding: '8px' }}>{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                <td style={{ padding: '8px' }}>{new Date(backup.createdAt).toLocaleString()}</td>
                {isSuperadmin && <td style={{ padding: '8px' }}>{backup.clinicId}</td>}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {isSuperadmin && (
                    <button
                      onClick={() => handleRestoreBackup(backup.filename)}
                      disabled={loading}
                      style={{ marginRight: '8px', color: 'orange' }}
                    >
                      {t('common.restore', 'Restore')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBackup(backup.filename)}
                    style={{ color: 'red' }}
                  >
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

export default BackupManager;
