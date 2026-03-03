import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Role {
  id: number;
  clinic_id: number;
  name: string;
  description: string;
  created_at: string;
}

const RoleList: React.FC = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roles');
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || t('roles.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err: any) {
      setError(err.response?.data?.message || t('roles.error'));
    }
  };

  if (loading) return <div>{t('roles.loading')}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>{t('roles.title')}</h2>
      {roles.length === 0 ? (
        <p>{t('roles.no_roles')}</p>
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
            {roles.map((role) => (
              <tr key={role.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{role.name}</td>
                <td style={{ padding: '8px' }}>{role.description}</td>
                <td style={{ padding: '8px' }}>
                  <button style={{ marginRight: '8px' }}>{t('roles.edit_button')}</button>
                  <button onClick={() => handleDelete(role.id)}>{t('roles.delete_button')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RoleList;
