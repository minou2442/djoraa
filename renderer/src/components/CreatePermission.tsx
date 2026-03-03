import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface CreatePermissionProps {
  onPermissionCreated?: () => void;
}

const CreatePermission: React.FC<CreatePermissionProps> = ({ onPermissionCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('permissions.error'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post('/permissions', { name, description });
      setSuccess(true);
      setName('');
      setDescription('');
      onPermissionCreated?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('permissions.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #ddd' }}>
      <h3>{t('permissions.create_new')}</h3>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '10px' }}>{t('permissions.created_success')}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>
            {t('permissions.permission_name')} *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. create, read, delete, print"
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label>
            {t('permissions.description')}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('permissions.description')}
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('permissions.create_button')}
        </button>
      </form>
    </div>
  );
};

export default CreatePermission;
