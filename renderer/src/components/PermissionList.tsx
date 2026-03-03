import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Permission {
  id: number;
  clinic_id: number;
  name: string;
  description: string;
  created_at: string;
}

const PermissionList: React.FC = () => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/permissions');
      setPermissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('permissions.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (permissionId: number) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/permissions/${permissionId}`);
      setPermissions(permissions.filter(p => p.id !== permissionId));
    } catch (err: any) {
      setError(err.response?.data?.message || t('permissions.error'));
    }
  };

  if (loading) return <div>{t('permissions.loading')}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>{t('permissions.title')}</h2>
      {permissions.length === 0 ? (
        <p>{t('permissions.no_permissions')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.name')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.description')}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{perm.name}</td>
                <td style={{ padding: '8px' }}>{perm.description}</td>
                <td style={{ padding: '8px' }}>
                  <button style={{ marginRight: '8px' }}>{t('permissions.edit_button')}</button>
                  <button onClick={() => handleDelete(perm.id)}>{t('permissions.delete_button')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PermissionList;
